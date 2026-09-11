# 区分「平台挂了」与「你连不上」

**—— 一套 AI API 平台可用性的分层诊断方法**

> 这是一篇排错笔记，不是产品文档。
> 我们做了一个监控上百个 AI API 平台的探测服务，结果发现最难的**不是探测，是归因**：
> 一个 host 连不上，可能是平台停机、可能是 DNS 被污染、可能是 TLS 被阻断、可能是你自家出口的问题。
> 这四种情况的运维动作完全不同，但它们在 `httpx` 的异常里长得**一模一样**。
>
> 下面是把它们分开的方法，以及我们走过的三条弯路。

---

## 一、起因：一批「连接超时」

最初的探测逻辑很朴素：

```python
try:
    resp = await client.get(f"https://{host}/v1/models", timeout=8.0)
    return {"reachable": 1, "http_status": resp.status_code, ...}
except httpx.TimeoutException:
    return {"reachable": 0, "error_code": "timeout", "error_message": "连接超时"}
```

一轮扫描跑完，有一批 host 报「连接超时」，界面显示「平台不可用」。

看起来合理。但有一个细节不对劲：这批里有一批是**已知还在运营、用户天天在用**的平台。

于是手工验一次：

```bash
# 用 DoH 拿到这个域名的真实 IP，然后直连
$ curl --resolve example.ai:443:<resolved_ip> https://example.ai/v1/models -v
```

结果很反直觉：

| 检查项 | 结果 |
|---|---|
| TCP 443 建连 | ✅ 成功，150–330 ms |
| TCP 80 建连 | ✅ 成功 |
| 发出 TLS ClientHello | ❌ **立刻收到 RST** |
| 对照组（cloudflare.com / doubao.com） | ✅ TLS 正常握手 |

**TCP 通，TLS 被重置。**

这说明失败点不在网络层，也不在平台侧 —— 是**针对这个域名的连接阻断**（域名可达性被干预，TCP 层放行但 TLS 握手被打断）。

而 `httpx` 把这个 `ConnectionResetError` **吞成了空的 `ConnectTimeout`**：

```python
# httpx / httpcore 的实际行为
str(exc) == ""          # 消息是空的
exc.__cause__ is exc    # 异常链指向自己，拿不到原始 RST
```

所以那一批「连接超时」里既有真超时、也有 TLS 阻断，我们的日志把它们混成了一条。**这是整个项目最重要的一次误诊。**

---

## 二、分层诊断：把异常翻译回事实

修正的办法不是「换个库」，而是**在失败之后，用底层 socket 再验一次**。因为 `httpx` 的异常信息不够，但 socket 不会撒谎。

```python
import socket, ssl

def diag_tls_reset(host: str, ip: str | None) -> str:
    """同步诊断：TCP 能否建连、TLS 握手是否被重置。

    返回 'ok' / 'blocked' / 'tcp_fail' / 'unknown'
    """
    if not ip:
        return "unknown"

    # 第一步：只测 TCP，不做 TLS
    # 超时给足 6s —— TCP 建连本身很快（被阻断的 host 实测 150–330ms），
    # 但高并发下链路会拥塞，给 3s 会制造出假的 tcp_fail。
    # 宁可慢一点，也不要误判。
    try:
        with socket.create_connection((ip, 443), timeout=6):
            pass
    except Exception:
        return "tcp_fail"

    # 第二步：TCP 能通的前提下，试 TLS 握手
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((ip, 443), timeout=6) as sk:
            with ctx.wrap_socket(sk, server_hostname=host):
                return "ok"
    except (ssl.SSLError, ConnectionResetError, ConnectionError, OSError):
        # TCP 通、TLS 被重置 ⇒ 阻断发生在域名/TLS 层
        return "blocked"
```

这个方法的价值在于它**可证伪**：`tcp_fail` 与 `blocked` 是两个完全不同的结论，而它们都能被单独复现。

调用点是捕获 `httpx` 异常之后：

```python
except httpx.TimeoutException:
    # TLS RST 在这里表现为空 ConnectTimeout，必须做分层诊断才能区分
    diag = await loop.run_in_executor(None, diag_probe_ip, host, ip, alts, sys_ips)
    if diag == "blocked":
        error_code, diag_kind = "tls_blocked", "tls_blocked"
        error_message = "TCP 可建连但 TLS 握手被重置（疑似域名层阻断）"
    elif diag == "tcp_fail":
        error_code, diag_kind = "connection_error", "tcp_fail"
        error_message = "无法建立 TCP 连接"
    else:
        error_code, diag_kind = "timeout", "timeout"
        error_message = "连接超时"
```

### 但「拿哪个 IP 去诊断」本身是个坑

第一版直接用 pinned 表里的那个 IP。问题来了：pinned 表里的 IP 来自 DoH 筛选，**可能整条候选都是垃圾**。实测有个域名被钉在了某个与真实站点无关的地址段上，此时真实 IP 其实「TCP 可建连、只是 TLS 被重置」，但拿垃圾 IP 去诊断只会得到 `tcp_fail` —— **真挂与被阻断又一次混淆了。**

修正：诊断时允许**换候选 IP 重试**，但只用本轮已经拿到的地址，不做额外解析（否则每轮扫描时间会翻倍，实测会让单轮扫描时间翻倍以上）：

```python
def diag_probe_ip(host, ip, alt_ips=None, sys_ips=None) -> str:
    """对「这一次实际用来建连的那个 IP」做分层诊断，失败则换候选重试。

    候选来源（按可信度排序）：
      1. alt_ips：本轮 DoH 解析出的其余地址
         —— 实测某域名解析出两个 Cloudflare IP、被钉的是第二个，
            换第一个立刻确诊。
      2. sys_ips：本轮系统解析结果
         —— **这是被污染的那条链路**，只作兜底。
    """
    if not ip:
        return "unknown"

    tried = {ip}
    diag = diag_tls_reset(host, ip)
    if diag != "tcp_fail":
        return diag

    for cand in list(alt_ips or []) + list(sys_ips or []):
        if not cand or cand in tried:
            continue
        tried.add(cand)
        d = diag_tls_reset(host, cand)
        if d != "tcp_fail":
            return d
    return "tcp_fail"
```

> **注意最后一行不要过度解读**：全都连不上时返回 `tcp_fail`，但这**不能**断言「平台真挂了」—— 地址本身可能全是脏的。把这种不确定性标出来是上一层（DNS 可信度）的责任。

---

## 三、DNS 层：怎么判断自己拿到的解析结果可不可信

### 3.1 用 DoH 拿「第二意见」

系统的 UDP/53 解析可能被篡改，改用 DNS over HTTPS 可以绕开明文链路。但**只问一家 DoH 也不够** —— 被篡改的解析往往随机返回互不相同的 IP，只有**在多个独立提供商之间重合**的地址才可能是真的：

```python
def doh_resolve_blocking(name: str) -> tuple[list[str], str]:
    """向多个 DoH 提供商查询并取共识。返回 (IP 列表, 来源描述)"""
    answers = []
    for endpoint in live_endpoints():
        try:
            ips = doh_query_once(endpoint, name, "A") or doh_query_once(endpoint, name, "AAAA")
            if ips:
                answers.append((endpoint, ips))
        except Exception:
            continue
    if not answers:
        return [], ""

    # 统计每个 IP 被多少家独立提供商返回
    hits = {}
    for _ep, ips in answers:
        for ip in set(ips):
            hits[ip] = hits.get(ip, 0) + 1

    agreed = sorted(ip for ip, n in hits.items() if n >= 2)
    if agreed:
        return agreed, f"consensus({'+'.join(short_ep(ep) for ep, _ in answers)})"
    ...
```

### 3.2 无共识时，不能「按顺序取第一个」

这是第二个坑。原本的逻辑是「没有共识就退回第一个可用结果」。实测某个 DoH 提供商会**不稳定地**返回垃圾地址（同一域名轮换出若干个与真实站点无关的 IP），而它恰好排在可信提供商的**前面** —— 于是脏答案被采信、真地址被丢弃。

修正：无共识时**按「候选 IP 能不能 TCP 建连」筛选**。这个判据比 TLS 更宽松也更安全 —— 被域名阻断的站点其真实 IP 的 TCP 是通的（只有 TLS 被重置），而垃圾地址通常连 TCP 都建不起来：

```python
    # 无共识时不能「按顺序取第一个」
    for ep, ips in answers:
        reachable = [ip for ip in ips if tcp_ok(ip)]
        if reachable:
            return sorted(set(reachable)), f"tcp_verified({short_ep(ep)})"

    # 全都不通：仍返回第一条，但把来源标成 agree1 提示可信度低
    for ep, ips in answers:
        return sorted(set(ips)), f"agree1({short_ep(ep)})"
    return [], ""
```

`agree1` 这个来源标记是关键 —— 它让上游知道「这条只是单源，**不足以**当作已核实」，尤其当我们手上只有这一条地址、而它又连不上时，无法区分「平台停服」与「地址本身是脏的」。

### 3.3 筛选可用的 DoH 端点

默认配置里放了 Cloudflare / Google —— 它们海外可用，但在国内 ECS 上通常不通。不做这层筛选时，每轮扫描会为每个 host 白等两次 6s 超时，实测让单轮扫描时间直接翻三倍：

```python
def live_endpoints() -> list[str]:
    """筛选当前真正可用的 DoH 端点，结果缓存 30 分钟。"""
    cached = _live_endpoints_cache
    if cached[1] and time.time() - cached[0] < _LIVE_TTL:
        return cached[1]
    live = []
    for ep in DOH_ENDPOINTS:
        try:
            if doh_query_once(ep, "example.com", "A"):
                live.append(ep)
        except Exception:
            continue
    if not live:
        live = list(DOH_ENDPOINTS)  # 全不通时保留原列表，让解析自然失败
    _live_endpoints_cache = (time.time(), live)
    return live
```

### 3.4 解析自检金丝雀（默认关闭）

我们试过用「金丝雀域名」自检：拿一个**已知正确 IP** 的域名去查，如果解析结果不对，就说明我们这条出口的解析被污染了 —— 本轮任何 `dns_ok` 都不该被采信。

```python
def dns_canary_check() -> tuple[str, dict]:
    """解析自检：用信任 DoH 查金丝雀域名，看结果是否与已知正确答案一致。

    level ∈ {"ok", "mismatch", "unresolved", "disabled"}
    - ok         金丝雀全部命中已知 IP → 本轮 dns_ok 可信
    - mismatch   有金丝雀解析到错误 IP → 本轮任何 dns_ok 都不该被采信
    - unresolved 金丝雀根本解析不出来 → 同上，且更严重
    """
    ...
```

**但这个功能默认是关闭的，而且我们建议你也别默认开。**

原因是踩过一次很难看的坑：我们内置了 `example.com=93.184.216.34` 作为默认期望值。后来 `example.com` 自己迁到了 Cloudflare（实际解析为 `104.20.23.154` / `172.66.147.243`），硬编码的期望值过期了 —— 于是金丝雀判定「解析被污染」，**把全部 host 一次性误降级为 unknown**。

> 一个假警报，直接废掉了整个可信度标注体系。

**结论：硬编码「已知正确答案」的写法天生会过期，不适合作为默认值。** 要真正启用自检，必须填**你自己可控的域名与地址**（解析权在自己手里，不会漂）：

```bash
ZGO_DNS_CANARY="api.yourdomain.com=1.2.3.4,www.yourdomain.com=1.2.3.4"
```

代码里保留的注释就是这个意思 —— 现在默认 `_CANARY_SPEC = ""`，即关闭。

---

## 四、IP Pinning：为什么它不是解药

既然系统解析可能被污染，自然的想法是：**绕过系统解析，直接把 TCP 连接到 DoH 拿到的可信 IP。**

用 `httpcore` 自定义 backend 可以实现 —— 关键点是**不碰请求 URL**，只改 socket 的目标地址：

```python
class PinnedBackend(AnyIOBackend):
    """把 TCP 连接强制指向已解析的 IP，同时保留 URL 里的真实主机名。

    这样 TLS 握手仍然使用真实域名的 SNI 与证书校验 —— 不会出现
    「直连 IP → 证书不匹配」的问题，也不需要 verify=False。
    """

    def __init__(self, pinned: dict[str, list[str]]):
        super().__init__()
        self._pinned = pinned
        self._rr = 0

    async def connect_tcp(self, host, port, timeout=None, local_address=None, socket_options=None):
        candidates = self._pinned.get(host)
        if not candidates:
            return await super().connect_tcp(
                host, port, timeout=timeout,
                local_address=local_address, socket_options=socket_options,
            )

        # 多 A 记录时轮换起点，避免总打同一个 IP（对 CDN 更友好）
        self._rr += 1
        start = self._rr % len(candidates)
        last_exc = None
        for i in range(len(candidates)):
            target = candidates[(start + i) % len(candidates)]
            try:
                return await super().connect_tcp(
                    target, port, timeout=timeout,
                    local_address=local_address, socket_options=socket_options,
                )
            except Exception as exc:
                last_exc = exc
                continue

        # 全部 DoH IP 都连不上时，退回系统解析
        try:
            return await super().connect_tcp(
                host, port, timeout=timeout,
                local_address=local_address, socket_options=socket_options,
            )
        except Exception:
            raise last_exc if last_exc else OSError(f"no candidate ip for {host}")
```

挂到 httpx 传输层上：

```python
class PinnedTransport(httpx.AsyncHTTPTransport):
    def __init__(self, pinned: dict[str, list[str]], **kwargs):
        super().__init__(**kwargs)
        self._pool = httpcore.AsyncConnectionPool(
            ssl_context=httpx.create_ssl_context(verify=True),   # 证书校验照常
            max_connections=CONCURRENCY,
            max_keepalive_connections=CONCURRENCY,
            retries=0,
            network_backend=PinnedBackend(pinned),
        )
```

### 反直觉的结论：pinning 救不了被阻断的站点

我们原以为「钉到正确 IP 就能连上」。**不成立。**

实测：把「曾不可达」的 host 钉到信任 DoH 解析出的 IP 上，**依然连不通**。这说明这些 host 的失败**与解析无关** —— 它不是「解析被污染所以连错地方」，而是「连接这个域名本身就会被打断」。

所以 pinning 的正确定位是：

| 能做 | 不能做 |
|---|---|
| 让探测**绕过被污染的系统解析**，拿到真实 IP 去试 | 修复「域名层被阻断」——那需要在链路层解决 |
| 用来**验证**「失败是否与解析有关」 | 把 pin 错的站点救回来 |

**还有一个反向风险**：pin 错会把**本来可达的站点误判为失败**。所以我们保留了两层保护 —— 候选 IP 逐个重试，全都不通时**退回系统解析**（实测确实出现过某站点因单源解析偏差从「可达」被打成「超时」）。

> `pinning 不是解药` 这条结论本身，就是它的价值所在 —— 它把「解析问题」这个假设**证伪**了，让我们不用继续在这条路上投入。

---

## 五、归因：最后一步是决定「这锅算谁的」

有了分层诊断和 DNS 可信度，最后一步是把它们合成一个可展示的状态。这里的设计原则是 **先分清「平台挂」还是「不是平台的锅」**：

```python
def classify_status(total, last_reachable, availability, p95,
                    fail_run=None, dns_integrity="ok", faults=None):
    """判定平台状态。返回 (status, dns_status, block_reason)"""

    dns_out = {
        "unresolved": "dns_unresolved",
        "suspect":    "dns_inconsistent",
        "single":     "dns_single_source",   # 单源，不足以当作已核实
    }.get(dns_integrity, "dns_ok" if dns_integrity == "ok" else "unknown")

    if total < 2:
        return "insufficient_data", dns_out, ""

    if not last_reachable:
        # 1) 域名根本解析不出来 → 不是平台问题
        if dns_integrity == "unresolved":
            return "degraded", "dns_unresolved", "dns_unresolved"
        # 2) 解析完整性存疑 → 不能断言平台不可用
        if dns_integrity == "suspect":
            return "degraded", "dns_inconsistent", "dns_inconsistent"
        # 3) 整窗可用率 < 0.5 → 平台问题
        if availability < 0.5:
            return "unreachable", dns_out, ""
        # 4) 历史上大部分时间可达、只是当前不可达 → 降级观察
        return "degraded", dns_out, ""

    if availability >= 0.95 and (p95 or 99999) < 1200:
        return "stable", dns_out, ""
    if availability >= 0.85:
        return "good", dns_out, ""
    if availability >= 0.6:
        return "volatile", dns_out, ""
    return "unstable", dns_out, ""
```

### 一个刻意放弃的功能：细分「域名受阻」标签

我们**曾经**在界面上区分「域名受阻 / 地址不可信 / 真挂」。后来删掉了，原因值得说：

> **判定不稳定。** 同一批 host 在两轮扫描之间会在 `blocked` / `degraded` / `unreachable` 之间跳，靠的是「本轮恰好拿到哪个解析地址」这种偶发因素，而不是站点本身的客观状态。
>
> **一个会自己变来变去的标签，比一个粗糙但稳定的标签更没有价值。**

现在界面上统一显示「平台不可用」，而分层诊断的结论（`tls_blocked` / `tcp_fail` / `timeout`）**仍然逐条落库到 `diag_kind` 字段**，需要时用 SQL 离线复盘即可：

```sql
-- 复盘：被 TLS 阻断 vs 真连不上，各有多少
SELECT diag_kind, COUNT(*) FROM platform_samples
WHERE reachable = 0 AND diag_kind IS NOT NULL
GROUP BY diag_kind;
```

**先攒数据，再谈精度** —— 尤其当消费方是内部管理界面而不是终端用户时。

---

## 六、三条弯路，以及它们各自留下的一句话

| 弯路 | 症状 | 结论 |
|---|---|---|
| **把 `httpx` 的异常当事实** | `ConnectionResetError` 被吞成空 `ConnectTimeout`；一批「连接超时」里混着 TLS 阻断 | 异常信息不够时，**回到 socket 层再验一次** |
| **无共识时「取第一个」** | 某 DoH 提供商排在前面却返回垃圾，真地址被丢弃 | 用 **TCP 可达性**筛候选，而不是靠顺序；单源必须标 `agree1` |
| **硬编码金丝雀期望值** | `example.com` 迁移后，假警报把全部 host 误降级 | 硬编码「已知正确答案」天生会过期，**默认关闭**，要开就填自己可控的域名 |

再加一条不算弯路但很重要的：

| **以为 pinning 是解药** | 钉到正确 IP 依然连不通 | pinning 的价值是**证伪「解析问题」**，不是修复阻断；且 pin 错会制造新误判 |

---

## 七、可直接搬用的部分

这套方法不依赖任何专有组件，只需要 `httpx` + `httpcore` + 标准库。要复用到你自己的场景，最少需要六个函数：

| 函数 | 作用 | 规模 |
|---|---|---|
| `diag_tls_reset()` | 判断「TCP 通但 TLS 被重置」 | ~20 行 |
| `diag_probe_ip()` | 候选 IP 重试，避免拿垃圾地址做诊断 | ~15 行 |
| `doh_resolve_blocking()` | 多提供商共识 + TCP 验证 + 来源标记 | ~45 行 |
| `live_endpoints()` | DoH 端点可用性筛选 + 缓存 | ~20 行 |
| `classify_status()` | 归因逻辑，先排除「不是平台的锅」 | ~50 行 |
| `PinnedBackend` | 需要「绕过系统解析」时才用 | ~40 行 |

前五个是核心，第六个是可选的优化。

### 6.1 几条可以直接抄的工程细节

**并发与超时的取值**（都是踩出来的）：

```python
CONCURRENCY = 12        # 再高会出现假的连接失败（链路拥塞）
DIAG_TIMEOUT = 6        # 不要调小到 3 —— 那会制造假的 tcp_fail
DOH_TIMEOUT = 6
SCAN_INTERVAL = 900     # 15 分钟

# httpx 请求超时：整体 8s，建连 5s
timeout=httpx.Timeout(8.0, connect=5.0)
```

**失败判定要按「诊断列是否有值」分界，不要用「最近 N 条」**。原因是诊断是**事后补的**，早期的样本没有这个字段；用「最近 N 条」会把没有诊断的历史样本也算进去，得出错误的失败率。

**探测目标用「先 `/v1/models` 后根路径」的候选序列**，并把 HTTP 状态码翻译成人话：

```python
candidates = [f"https://{host}/v1/models", f"https://{host}"]

# 401/403 不是「挂了」，而是「站点在线，只是要鉴权」
if code in (401, 403):
    note = "需 API Key（站点在线）"
elif code == 429:
    note = "触发频率限制（站点在线）"
```

这个细节很重要：**无密钥探测时，绝大多数正常平台都会返回 401。把它当成失败是把「健康」误报成「故障」。**

**安全闸门**：即使目标是公网域名，也要强制校验，防止目录里混进内网地址；pinned 的 IP 同样要校验（DoH 结果也可能是内网）：

```python
await security.assert_url_public("https://" + host)
for ip_text in (pinned or {}).get(host, []):
    addr = ipaddress.ip_address(ip_text)
    if security._is_blocked_addr(addr):
        raise ValueError("pinned ip resolves into a blocked range")
```

---

## 八、一句话总结

> **「连不上」不是一个事实，是四个事实的合并。**
> 把它们分开的方法不复杂 —— 在失败之后回到 socket 层，分别问三个问题：
> **TCP 通不通？TLS 通不通？解析结果几家一致？**
> 三个答案组合起来，就能从 `httpx` 那句无信息的 `ConnectTimeout` 里，还原出真正发生了什么。

---

## 附录：环境变量

```bash
ZGO_PLATFORM_SCAN_CONCURRENCY=12      # 并发数
ZGO_PLATFORM_SCAN_INTERVAL=900        # 扫描间隔（秒）
ZGO_DOH_ENDPOINTS=...                 # DoH 端点，逗号分隔
ZGO_DOH_TIMEOUT=6
ZGO_DOH_CACHE_TTL=300
ZGO_DOH_DISABLE=1                     # 关闭 DoH，退回系统解析（排查用）
ZGO_DNS_CANARY=""                     # 解析自检金丝雀，默认关闭
```

*本文方法来自一个真实运行中的平台可用性监控服务。所有「实测」数据均为真实排错过程中记录，为保护具体服务方，文中以「某域名 / 某提供商」指代。*
