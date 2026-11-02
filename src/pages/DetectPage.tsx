import { useState, useRef, useCallback, useEffect } from 'react';
import { STAGES } from '../data';
import { PROTOCOLS, saveBlob, type KeyAuth, type SnippetItem } from '../lib/api';
import { discoverDirect, probeDirect, buildPreflight } from '../lib/probeDirect';
import { toReport, discoveredToOptions } from '../lib/mappers';
import { useSession } from '../lib/session';
import { ProtocolSelect } from '../components/ProtocolSelect';
import { ReportTemplatePreview } from '../components/ReportTemplatePreview';
import type { StageId, DetectionReport } from '../types';
import type { Protocol } from '../lib/api';
import {
  Link2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Search,
  ChevronRight,
  AlertCircle,
  Check,
  Zap,
  Gauge,
  FileBarChart,
  ArrowLeft,
  Download,
  Lock,
  Copy,
  X,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { composeShareUrl, copyText } from '../lib/share';
import { useI18n, pick, type Lang } from '../lib/i18n';

type Phase = 'input' | 'connecting' | 'discovered' | 'probing' | 'complete' | 'report';

interface DiscoveredOption {
  id: string;
  name: string;
  label: string;
  provider: string;
}

const PROBE_STAGES = [
  { id: 'chat', label: 'Chat 探测', labelEn: 'Chat probe', icon: Zap },
  { id: 'sse', label: 'SSE 流式探测', labelEn: 'SSE stream probe', icon: Gauge },
];

function maskKey(key: string): string {
  if (!key) return '';
  return `${key.slice(0, 3)}••••${key.slice(-4)}`;
}

export function DetectPage() {
  const { draft, clearDraft } = useSession();
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState<Phase>('input');
  const [baseUrl, setBaseUrl] = useState(draft?.base_url ?? '');
  const [apiKey, setApiKey] = useState(draft?.api_key ?? '');
  const [showKey, setShowKey] = useState(false);
  const [protocol, setProtocol] = useState<Protocol>(draft?.protocol ?? 'openai');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [discovered, setDiscovered] = useState<DiscoveredOption[]>([]);
  const [discoverMeta, setDiscoverMeta] = useState<{ latency_ms: number; status_code: number; message: string; endpoint: string; keyAuth?: KeyAuth } | null>(null);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [probeItems, setProbeItems] = useState({ chat: true, sse: true });
  const [currentStage, setCurrentStage] = useState<StageId>('idle');
  const [stageProgress, setStageProgress] = useState(0);
  const [report, setReport] = useState<DetectionReport | null>(null);
  const [urlError, setUrlError] = useState('');
  const [busy, setBusy] = useState(false);
  // 预检面板展开态
  const [showPreflight, setShowPreflight] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // —— 完成态操作：复制分享链接 / 导出报告 ——
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const estimatedRequests = selectedModels.length * (Number(probeItems.chat) + Number(probeItems.sse));

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (val: string) => {
    setBaseUrl(val);
    setUrlError(
      val && !validateUrl(val)
        ? t('请输入有效的 URL，例如 https://api.example.com', 'Enter a valid URL, e.g. https://api.example.com')
        : ''
    );
  };

  const toggleModel = (id: string) => {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const runStageSequence = useCallback((stages: StageId[], onComplete: () => void) => {
    let idx = 0;
    const durations: Record<StageId, number> = {
      idle: 0, connecting: 700, authenticating: 500, 'sending-request': 400,
      'receiving-response': 600, 'parsing-stream': 800, 'analyzing-latency': 500,
      'checking-safety': 400, complete: 0,
    };

    const runNext = () => {
      if (idx < stages.length) {
        const stage = stages[idx];
        const duration = durations[stage];
        setCurrentStage(stage);
        setStageProgress(0);
        idx++;

        if (duration === 0) {
          runNext();
          return;
        }

        const interval = setInterval(() => {
          setStageProgress((p) => Math.min(100, p + 100 / (duration / 50)));
        }, 50);

        const timer = setTimeout(() => {
          clearInterval(interval);
          setStageProgress(100);
          setTimeout(runNext, 100);
        }, duration);

        timersRef.current.push(timer);
        timersRef.current.push(interval as unknown as ReturnType<typeof setTimeout>);
      } else {
        onComplete();
      }
    };
    runNext();
  }, []);

  const handleStartDiscover = async () => {
    if (!baseUrl.trim() || !validateUrl(baseUrl)) {
      setUrlError(t('请输入有效的 URL', 'Enter a valid URL'));
      return;
    }
    if (!apiKey.trim() || apiKey.trim().length < 8) {
      setError(t('API Key 长度不足', 'API key is too short'));
      return;
    }
    if (!agreed) {
      setError(t('请先同意本次检测授权', 'Please tick the authorisation box first'));
      return;
    }
    setError('');
    setBusy(true);
    setPhase('connecting');
    clearTimers();
    runStageSequence(
      ['connecting', 'authenticating', 'sending-request', 'receiving-response'],
      async () => {
        try {
          // 先秒出模型目录（verify_key=false 不发聊天请求）；Key 校验改由「验证 Key」按钮触发
          const res = await discoverDirect(baseUrl, apiKey, protocol, false);
          if (!res.ok || !res.models || res.models.length === 0) {
            setPhase('input');
            setError(res.message || t('未能发现任何模型，请检查 Base URL 与 API Key', 'No models found — check the Base URL and API key'));
          } else {
            const opts = discoveredToOptions(res.models);
            setDiscovered(opts);
            setDiscoverMeta({ latency_ms: res.latency_ms, status_code: res.status_code ?? 0, message: res.message, endpoint: res.endpoint, keyAuth: res.key_auth });
            setSelectedModels(opts.slice(0, 4).map((o) => o.id));
            setPhase('discovered');
          }
        } catch (e) {
          setPhase('input');
          setError(e instanceof Error ? e.message : t('发现模型失败', 'Model discovery failed'));
        } finally {
          setBusy(false);
          setCurrentStage('idle');
        }
      }
    );
  };

  // 单独的「验证 Key」：发一次聊天冒烟校验 API Key，不阻塞模型列表展示
  const handleVerifyKey = async () => {
    if (!apiKey.trim()) return;
    setVerifyingKey(true);
    try {
      const res = await discoverDirect(baseUrl, apiKey, protocol, true);
      setDiscoverMeta((prev) => (prev ? { ...prev, keyAuth: res.key_auth } : prev));
    } catch (e) {
      setDiscoverMeta((prev) => (prev ? {
        ...prev,
        keyAuth: { status: 'unknown', detail: e instanceof Error ? e.message : t('校验失败', 'Verification failed') },
      } : prev));
    } finally {
      setVerifyingKey(false);
    }
  };

  const handleStartProbe = async () => {
    setPhase('probing');
    clearTimers();
    setBusy(true);
    runStageSequence(
      ['sending-request', 'receiving-response', 'parsing-stream', 'analyzing-latency', 'checking-safety'],
      async () => {
        try {
          const summary = await probeDirect({
            base_url: baseUrl,
            api_key: apiKey,
            models: selectedModels,
            chat_enabled: probeItems.chat,
            sse_enabled: probeItems.sse,
            protocol,
          });
          const rep = toReport(summary, baseUrl, maskKey(apiKey));
          rep.protocol = protocol; // 供接入模板按协议生成代码
          setCurrentStage('complete');
          setReport(rep);
          setPhase('complete');
          clearDraft();
        } catch (e) {
          setPhase('discovered');
          setError(e instanceof Error ? e.message : t('探测失败', 'Probe failed'));
        } finally {
          setBusy(false);
        }
      }
    );
  };

  const handleReset = () => {
    clearTimers();
    setBusy(false);
    setCurrentStage('idle');
    setStageProgress(0);
    setReport(null);
    setError('');
    if (discovered.length > 0) {
      setPhase('discovered');
    } else {
      setPhase('input');
      setDiscovered([]);
      setSelectedModels([]);
    }
  };

  const handleViewReport = () => {
    setPhase('report');
    window.setTimeout(() => {
      document.getElementById('diagnostic-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  /** 复制分享链接：把报告编码进 hash，复制到剪贴板 */
  const handleCopyShare = async () => {
    if (!report) return;
    const url = composeShareUrl(report);
    const ok = await copyText(url);
    showToast(
      ok ? t('分享链接已复制', 'Share link copied') : t('复制失败，请手动复制', 'Copy failed — please copy manually'),
      ok ? 'ok' : 'err'
    );
  };

  /**
   * 导出诊断报告为独立 HTML（纯前端，Blob 下载）。
   *
   * 上游版本这里调的是后端 python-docx 生成 Word —— 那属于服务端能力，
   * 本开源版只保留前端能独立完成的部分：把报告序列化成一个自包含 HTML。
   */
  const handleExportReport = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const html = buildStandaloneReportHtml(report, lang);
      const host = (() => { try { return new URL(report.baseUrl).hostname; } catch { return 'report'; } })();
      saveBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `api-doctor-${host}-report.html`);
      showToast(t('报告已导出（HTML 文档）', 'Report exported as a standalone HTML file'));
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('导出报告失败', 'Report export failed'), 'err');
    } finally {
      setExporting(false);
    }
  };

  const maskedKey = maskKey(apiKey);
  const summary = report && report.models.length > 0 ? report.models[0] : null;

  const selectedModelOptions = selectedModels
    .map((id) => discovered.find((model) => model.id === id))
    .filter((model): model is DiscoveredOption => Boolean(model));

  // 模型搜索过滤：匹配模型名或提供商
  const kw = modelSearch.trim().toLowerCase();
  const filteredModels = kw ? discovered.filter((m) => m.name.toLowerCase().includes(kw) || m.provider.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw)) : discovered;

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-medium mb-4">
            <Search size={13} />
            <span>{t('API 健康检测', 'API HEALTH CHECK')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
            {t('检测一个 API 接口', 'Check an API endpoint')}
          </h1>
          <p className="mt-3 text-ink-300 leading-relaxed max-w-2xl">
            {t(
              '先读取模型列表，不进行对话测试。发现模型后，你可以选择任意数量的模型，并选择 Chat、SSE 或两者进行低消耗探测。',
              'First it reads the model list — no chat calls. Once models are discovered, pick as many as you like and run cheap Chat and/or SSE probes against them.'
            )}
          </p>
        </div>

        {phase === 'input' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="glass-strong p-6 space-y-5">
              <div>
                <label className="label-mono block mb-3">Base URL</label>
                <div className="relative">
                  <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={PROTOCOLS.find((p) => p.id === protocol)?.baseUrlExample ?? 'https://api.example.com/v1'}
                    className={`input-field pl-11 ${urlError ? 'error' : ''}`}
                    spellCheck={false}
                  />
                </div>
                {urlError && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-error-400">
                    <AlertCircle size={13} /><span>{urlError}</span>
                  </div>
                )}
              </div>

              <ProtocolSelect value={protocol} onChange={setProtocol} disabled={busy} />

              {/* 连接方式：本开源版固定为「浏览器直连」（信任核心） */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="label-mono">{t('连接方式', 'CONNECTION')}</span>
                  <div className="inline-flex rounded-xl border border-ink-700/40 overflow-hidden text-xs">
                    <span className="px-3 py-1.5 flex items-center gap-1.5 bg-primary-500/15 text-primary-300">
                      <Lock size={12} />
                      {t('浏览器直连', 'Direct from browser')}
                    </span>
                  </div>
                </div>
                <p className="text-2xs text-ink-400 leading-relaxed">
                  {t(
                    '请求直接从本机浏览器发往你填的 Base URL，API Key 不会经过任何服务器——可在浏览器 DevTools → Network 亲自验证。若目标接口禁止跨域（CORS），见 README 的常见问题。',
                    'Requests go straight from this browser to the Base URL you enter, so your API key never touches any server — verify it yourself in DevTools → Network. If the target endpoint blocks cross-origin calls (CORS), see the FAQ in the README.'
                  )}
                </p>
              </div>

              <div>
                <label className="label-mono block mb-3">API Key</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="sk-..."
                    className={`input-field pl-11 pr-12 ${error && !urlError ? 'error' : ''}`}
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-200"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {apiKey && (
                  <p className="mt-2 text-2xs font-mono text-ink-400">{t('Key 预览', 'Key preview')}: {maskedKey}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-ink-800/30 border border-ink-700/30 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={15} className="text-success-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-ink-300 leading-relaxed">
                    {t(
                      'Key 仅用于向你提供的 Base URL 发起本次探测，不训练、不出售、不共享。检测结果保存为报告记录，但 API 配置不会写入数据库。',
                      'The key is only used to call the Base URL you supplied, for this run. It is never used for training, sold, or shared. The result is kept as a report record, but your API config is never written to any database.'
                    )}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Zap size={15} className="text-warning-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-ink-300 leading-relaxed">
                    {t(
                      '先请求一次 /v1/models，不进行对话测试。发现模型后，你自选模型和探测项目，模型和项目越多，请求次数越多，可能消耗更多供应商余额。',
                      "One /v1/models call first, with no chat traffic. After that you choose the models and probes yourself — more models and more probes means more requests, which may consume more of the provider's balance."
                    )}
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                    agreed
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-ink-800 border-ink-600 group-hover:border-ink-500'
                  }`}
                >
                  {agreed && <Check size={13} className="text-white" strokeWidth={3} />}
                </button>
                <span className="text-xs text-ink-300 leading-relaxed">
                  {t(
                    '我同意将此配置仅用于本次检测。本次将向目标 Base URL 发起 /v1/models 请求，以及确认模型后每个模型各一次 Chat、一次 SSE 探测。',
                    'I agree that this config is used only for this run: one /v1/models request to the target Base URL, then one Chat and one SSE probe per model I select.'
                  )}
                </span>
              </label>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-error-400 animate-fade-in">
                  <AlertCircle size={13} /><span>{error}</span>
                </div>
              )}

              <button
                onClick={handleStartDiscover}
                disabled={!baseUrl || !apiKey || !agreed || busy}
                className="btn-primary w-full py-3.5"
              >
                <Search size={18} />
                <span>{busy ? t('连接中...', 'Connecting…') : t('开始低成本发现', 'Discover models (cheap)')}</span>
              </button>
              {!agreed && baseUrl && apiKey && (
                <p className="text-2xs text-ink-400 text-center">
                  {t('需要勾选「本次检测授权」才能开始正式检测', 'Tick the authorisation box to start the run')}
                </p>
              )}
            </div>
          </div>
        )}

        {phase === 'connecting' && (
          <div className="glass-strong p-8 animate-fade-in text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-primary-500/10 animate-ping" />
            </div>
            <h3 className="text-lg font-semibold text-ink-50 mb-2">{t('正在读取接口能力', 'Reading endpoint capabilities')}</h3>
            <p className="text-sm text-ink-400 font-mono mb-4">
              {(() => {
                const st = STAGES.find((s) => s.id === currentStage);
                return st ? t(st.label, st.labelEn ?? st.label) : t('连接中...', 'Connecting…');
              })()} · {Math.round(stageProgress)}%
            </p>
            <div className="max-w-xs mx-auto h-1 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-100"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
          </div>
        )}

        {phase === 'discovered' && (
          <div id="model-selection-panel" className="space-y-4 animate-fade-in-up">
            <div className="glass-strong p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-success-500/15 flex items-center justify-center">
                  <Check size={18} className="text-success-400" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-50">
                    {t('接口已连接，发现', 'Connected — found')} {discovered.length} {t('个模型', 'models')}
                  </p>
                  <p className="text-xs font-mono text-ink-400 mt-0.5">
                    GET /v1/models · {discoverMeta?.status_code || 200} OK · {discoverMeta?.latency_ms ?? '-'}ms
                  </p>
                </div>
              </div>
              {discoverMeta?.endpoint && (
                <p className="text-2xs font-mono text-ink-500 truncate">→ {discoverMeta.endpoint}</p>
              )}
              {discoverMeta?.keyAuth && (
                <div className="mt-3 flex items-center gap-3">
                  <KeyAuthBadge auth={discoverMeta.keyAuth} />
                  {apiKey.trim() && discoverMeta.keyAuth.status === 'unknown' && (
                    <button
                      type="button"
                      onClick={handleVerifyKey}
                      disabled={verifyingKey}
                      className="btn-secondary text-2xs px-2.5 py-1.5 inline-flex items-center gap-1.5"
                    >
                      {verifyingKey ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                      {verifyingKey ? t('校验中…', 'Verifying…') : t('验证 Key', 'Verify key')}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start">
              <section className="glass p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-ink-50">{t('选择要检测的模型', 'Pick models to check')}</h4>
                    <p className="text-2xs text-ink-400 mt-1">{t('搜索并点击模型加入本次探测', 'Search, then click a model to add it to this run')}</p>
                  </div>
                  <span className="text-2xs font-mono text-ink-400 whitespace-nowrap">{selectedModels.length}/{discovered.length} {t('已选', 'selected')}</span>
                </div>

                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder={t('搜索模型名或提供商，如 deepseek / zai / gemini', 'Search model or provider, e.g. deepseek / zai / gemini')}
                    className="w-full bg-ink-900/50 border border-ink-700/40 rounded-lg pl-9 pr-9 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                    spellCheck={false}
                  />
                  {modelSearch && (
                    <button
                      onClick={() => setModelSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-100 transition-colors"
                      aria-label={t('清空搜索', 'Clear search')}
                      title={t('清空搜索', 'Clear search')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[31rem] overflow-y-auto pr-1">
                  {filteredModels.map((model) => {
                    const isSelected = selectedModels.includes(model.id);
                    return (
                      <button
                        key={model.id}
                        onClick={() => toggleModel(model.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary-500/10 border-primary-500/30'
                            : 'bg-ink-900/30 border-ink-700/30 hover:border-ink-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-primary-500 border-primary-500' : 'border-ink-600'
                        }`}>
                          {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-mono text-ink-100 flex-1 truncate">{model.name}</span>
                        <span className="text-2xs font-mono text-ink-400 truncate max-w-[34%]">{model.provider}</span>
                      </button>
                    );
                  })}

                  {filteredModels.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                      <Search size={20} className="text-ink-500 mb-2" />
                      <p className="text-sm text-ink-400">
                        {t('没有匹配「', 'No models match “')}{modelSearch.trim()}{t('」的模型', '”')}
                      </p>
                      <button onClick={() => setModelSearch('')} className="mt-2 text-2xs font-mono text-primary-400 hover:text-primary-300 transition-colors">
                        {t('清除搜索', 'Clear search')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-ink-700/30">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div>
                      <h5 className="text-xs font-semibold text-ink-100">{t('已选择的模型预览', 'Selected models')}</h5>
                      <p className="text-2xs text-ink-500 mt-1">{t('点击右侧移除模型', 'Click the × on the right to remove')}</p>
                    </div>
                    <span className="text-2xs font-mono text-primary-300">{selectedModels.length} {t('个', 'selected')}</span>
                  </div>
                  {selectedModelOptions.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedModelOptions.map((model) => (
                        <div key={model.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-primary-500/8 border border-primary-500/15">
                          <Check size={13} className="text-primary-300 flex-shrink-0" strokeWidth={2.5} />
                          <span className="text-xs font-mono text-ink-100 truncate flex-1">{model.name}</span>
                          <span className="text-2xs font-mono text-ink-500 truncate max-w-[28%]">{model.provider}</span>
                          <button
                            onClick={() => toggleModel(model.id)}
                            className="p-1 text-ink-500 hover:text-error-300 transition-colors flex-shrink-0"
                            aria-label={`${t('移除', 'Remove')} ${model.name}`}
                            title={`${t('移除', 'Remove')} ${model.name}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-500 py-2">{t('还没有选择模型', 'No models selected yet')}</p>
                  )}
                </div>
              </section>

              <section className="glass p-5 lg:sticky lg:top-24">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-ink-50">{t('检测设置', 'Probe settings')}</h4>
                  <p className="text-2xs text-ink-400 mt-1">{t('选择检测模式后开始受控探测', 'Choose the probes, then start a controlled run')}</p>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-ink-200 mb-2.5">{t('选择探测项目', 'Probes')}</h5>
                  <div className="space-y-2.5">
                    {PROBE_STAGES.map((item) => {
                      const enabled = probeItems[item.id as keyof typeof probeItems];
                      return (
                        <button
                          key={item.id}
                          onClick={() => setProbeItems((prev) => ({ ...prev, [item.id]: !enabled }))}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                            enabled
                              ? 'bg-accent-500/10 border-accent-500/30'
                              : 'bg-ink-900/30 border-ink-700/30'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                            enabled ? 'bg-accent-500/15' : 'bg-ink-800/50'
                          }`}>
                            <item.icon size={16} className={enabled ? 'text-accent-400' : 'text-ink-500'} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${enabled ? 'text-ink-50' : 'text-ink-400'}`}>
                              {t(item.label, item.labelEn)}
                            </p>
                            <p className="text-2xs text-ink-400 mt-0.5">
                              {enabled ? t('已开启', 'Enabled') : t('未选择', 'Off')}
                            </p>
                          </div>
                          <div className={`w-9 h-5 rounded-full transition-all relative ${enabled ? 'bg-accent-500' : 'bg-ink-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-ink-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-warning-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap size={16} className="text-warning-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-100">
                        {t('预计请求数:', 'Estimated requests:')}{' '}
                        <span className="font-mono font-bold text-warning-400">{estimatedRequests}</span> {t('次', 'reqs')}
                      </p>
                      <p className="text-2xs text-ink-400 mt-0.5 leading-relaxed">
                        {t(
                          `${selectedModels.length} 个模型 × (${Number(probeItems.chat) + Number(probeItems.sse)} 项) = ${estimatedRequests} 次请求，可能消耗供应商余额`,
                          `${selectedModels.length} model(s) × ${Number(probeItems.chat) + Number(probeItems.sse)} probe(s) = ${estimatedRequests} request(s) — may consume the provider's balance`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-error-400 animate-fade-in mt-4">
                    <AlertCircle size={13} /><span>{error}</span>
                  </div>
                )}

                {/* 预检：本次将发送的请求（Key 已脱敏）——透明度，打消偷用 Key 疑虑 */}
                <PreflightPanel
                  baseUrl={baseUrl}
                  apiKey={apiKey}
                  protocol={protocol}
                  models={selectedModels}
                  chatEnabled={probeItems.chat}
                  sseEnabled={probeItems.sse}
                  open={showPreflight}
                  onToggle={() => setShowPreflight((v) => !v)}
                />

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-5">
                  <button onClick={() => setPhase('input')} className="btn-secondary flex-1">
                    {t('返回修改', 'Back')}
                  </button>
                  <button
                    onClick={handleStartProbe}
                    disabled={selectedModels.length === 0 || (!probeItems.chat && !probeItems.sse) || busy}
                    className="btn-primary flex-1"
                  >
                    <span>{busy ? t('探测中...', 'Probing…') : t('开始受控探测', 'Start controlled probe')}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {phase === 'probing' && (
          <div className="glass-strong p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Loader2 size={20} className="text-primary-400 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-ink-50">{t('正在检测模型', 'Probing models')}</h3>
                <p className="text-xs font-mono text-ink-400 mt-0.5">
                  {(() => {
                    const st = STAGES.find((s) => s.id === currentStage);
                    return st ? t(st.label, st.labelEn ?? st.label) : t('探测中...', 'Probing…');
                  })()} · {Math.round(stageProgress)}%
                </p>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden mb-6">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-100"
                style={{ width: `${stageProgress}%` }}
              />
            </div>
            <div className="space-y-2">
              {selectedModels.map((modelId, idx) => {
                const model = discovered.find((m) => m.id === modelId);
                const isCurrent = idx === Math.min(selectedModels.length - 1, Math.floor(stageProgress / (100 / selectedModels.length)));
                const isDone = idx < Math.floor(stageProgress / (100 / selectedModels.length));
                return (
                  <div key={modelId} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isDone ? 'bg-success-500/5' : isCurrent ? 'bg-primary-500/10' : 'bg-ink-800/30'
                  }`}>
                    {isDone ? (
                      <Check size={15} className="text-success-400" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <Loader2 size={15} className="text-primary-400 animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-ink-600" />
                    )}
                    <span className="text-sm font-mono text-ink-200 flex-1">{model?.name || modelId}</span>
                    {isDone && <span className="text-2xs font-mono text-success-400">PASS</span>}
                    {isCurrent && <span className="text-2xs font-mono text-primary-400">RUNNING</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase === 'complete' && report && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="glass-strong p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-success-500/10 blur-xl" />
                <div className="relative w-20 h-20 rounded-full bg-success-500/15 border border-success-500/30 flex items-center justify-center">
                  <Check size={32} className="text-success-400" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-ink-50">{t('检测完成', 'Check complete')}</h3>
              <p className="text-sm text-ink-300 mt-2">
                {t('已完成', 'Checked')} {report.modelCount} {t('个模型的探测，查看下方诊断报告', 'model(s) — see the diagnostic report below')}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleViewReport} className="btn-primary">
                  <FileBarChart size={16} />
                  <span>{t('查看诊断报告', 'View diagnostic report')}</span>
                  <ChevronRight size={16} />
                </button>
                <button onClick={handleReset} className="btn-secondary">
                  {t('重新检测', 'Run again')}
                </button>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleCopyShare} className="btn-secondary">
                  <Share2 size={15} />
                  <span>{t('复制分享链接', 'Copy share link')}</span>
                </button>
              </div>
            </div>

            <div className="glass p-5">
              <h4 className="text-sm font-semibold text-ink-50 mb-4">{t('快速摘要', 'Quick summary')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('健康评分', 'SCORE'), value: `${report.score}/100`, color: 'text-success-400' },
                  { label: 'TTFT', value: summary ? `${summary.firstByteMs ?? '-'}ms` : '-', color: 'text-primary-400' },
                  { label: t('总耗时', 'TOTAL'), value: summary ? `${((summary.firstByteMs ?? 0) + (summary.chunks || 1) * (summary.chatLatencyMs || 0) * 0.3).toFixed(0)}ms` : '-', color: 'text-accent-400' },
                  { label: t('模型数', 'MODELS'), value: `${report.modelCount}`, color: 'text-ink-100' },
                ].map((stat) => (
                  <div key={stat.label} className="surface-3 p-3 text-center">
                    <p className="text-2xs font-mono text-ink-400 mb-1">{stat.label.toUpperCase()}</p>
                    <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'report' && report && (
          <div id="diagnostic-report" className="report-reveal">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setPhase('complete')} className="btn-ghost">
                <ArrowLeft size={14} />
                <span>{t('返回检测摘要', 'Back to summary')}</span>
              </button>
              <button className="btn-secondary" onClick={handleExportReport} disabled={exporting}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{exporting ? t('导出中…', 'Exporting…') : t('导出报告', 'Export report')}</span>
              </button>
            </div>
            <div className="report-reveal__line" />
            <div className="glass p-5 mb-4 report-reveal__intro">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-success-500/15 border border-success-500/30 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-xl bg-success-500/20 animate-ping opacity-30" />
                  <FileBarChart size={19} className="text-success-400 relative z-10" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-50">{t('诊断报告已生成', 'Diagnostic report ready')}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{t('基于本次真实探测流程的脱敏结果与证据', 'Redacted results and evidence from this actual probe run')}</p>
                </div>
              </div>
            </div>
            <div className="report-reveal__body">
              <ReportBody report={report} onReset={handleReset} />
            </div>

            {/* 报告模板预览：看完网页版，展示可导出的报告长这样 */}
            <div className="mt-12">
              <ReportTemplatePreview />
            </div>
          </div>
        )}
      </div>

      {/* 轻量 toast 反馈 */}
      {toast && (
        <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm shadow-lg backdrop-blur ${toast.tone === 'ok' ? 'bg-ink-900/90 border-success-500/30 text-ink-100' : 'bg-ink-900/90 border-error-500/30 text-ink-100'}`}>
            {toast.tone === 'ok' ? <CheckCircle2 size={16} className="text-success-400" /> : <AlertCircle size={16} className="text-error-400" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PreflightPanel({ baseUrl, apiKey, protocol, models, chatEnabled, sseEnabled, open, onToggle }: {
  baseUrl: string;
  apiKey: string;
  protocol: Protocol;
  models: string[];
  chatEnabled: boolean;
  sseEnabled: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  const reqs = buildPreflight(baseUrl, apiKey, protocol, models, chatEnabled, sseEnabled);
  return (
    <div className="mt-4 rounded-xl border border-ink-700/30 bg-ink-900/30 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink-800/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-ink-200">
          <Eye size={14} className="text-primary-400" />
          {t('预检：本次将发送', 'Preflight: this run sends')} {reqs.length}{' '}
          {t('个请求（Key 已全部脱敏）', 'request(s), all keys masked')}
        </span>
        <ChevronRight size={15} className={`text-ink-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-2xs text-success-400 leading-relaxed mb-1">
            {t(
              '以下请求都将直接从你的浏览器发往目标 Base URL，不会经过任何中间服务器。',
              'Every request below goes straight from your browser to the target Base URL — no intermediate server.'
            )}
          </p>
          {reqs.map((req, i) => (
            <div key={i} className="rounded-lg border border-ink-700/30 bg-ink-950/40 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-2xs font-mono px-1.5 py-0.5 rounded ${req.method === 'GET' ? 'bg-success-500/10 text-success-400' : 'bg-accent-500/10 text-accent-400'}`}>{req.method}</span>
                <span className="text-2xs font-mono text-ink-300">{req.kind}</span>
              </div>
              <p className="text-2xs font-mono text-ink-400 break-all mb-1.5">{req.url}</p>
              <details className="text-2xs">
                <summary className="cursor-pointer text-ink-500 hover:text-ink-300 select-none">
                  {t('请求头', 'Headers')}{req.body ? t(' + 请求体', ' + body') : ''}
                </summary>
                <pre className="mt-1.5 bg-ink-950/70 border border-ink-700/40 rounded p-2 text-ink-300 overflow-x-auto whitespace-pre-wrap break-all">
{Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\n') + (req.body ? `\n\n${req.body}` : '')}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeyAuthBadge({ auth }: { auth: KeyAuth }) {
  const { t } = useI18n();
  const conf =
    auth.status === 'valid'
      ? { label: t('API Key 有效', 'API key valid'), tone: 'text-success-400', chip: 'bg-success-500/10 border-success-500/20', dot: 'bg-success-400' }
      : auth.status === 'invalid'
      ? { label: t('API Key 无效', 'API key invalid'), tone: 'text-error-400', chip: 'bg-error-500/10 border-error-500/20', dot: 'bg-error-400' }
      : auth.status === 'reachable'
      ? { label: t('API Key 可用（待确认）', 'API key works (unconfirmed)'), tone: 'text-warning-400', chip: 'bg-warning-500/10 border-warning-500/20', dot: 'bg-warning-400' }
      : { label: t('未校验 API Key', 'API key not verified'), tone: 'text-ink-400', chip: 'bg-ink-800/30 border-ink-700/30', dot: 'bg-ink-500' };
  return (
    <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 ${conf.chip}`}>
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${conf.dot}`} />
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${conf.tone}`}>{conf.label}</p>
        {auth.detail && <p className="text-2xs text-ink-400 mt-0.5 break-all">{auth.detail}</p>}
        {auth.status_code && (
          <p className="text-2xs font-mono text-ink-500 mt-0.5">{t('聊天冒烟 HTTP', 'Chat smoke test HTTP')} {auth.status_code}</p>
        )}
      </div>
    </div>
  );
}

function ReportBody({ report, onReset }: { report: DetectionReport; onReset: () => void }) {
  const { t, lang } = useI18n();
  const statusCard = (item: { model: string; status: string; grade: string }) => {
    const conf =
      item.status === 'healthy'
        ? { label: t('健康', 'HEALTHY'), color: 'text-success-400', bg: 'bg-success-500/10', border: 'border-success-500/20' }
        : item.status === 'degraded'
        ? { label: t('降级', 'DEGRADED'), color: 'text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/20' }
        : { label: t('严重', 'DOWN'), color: 'text-error-400', bg: 'bg-error-500/10', border: 'border-error-500/20' };
    return (
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded text-2xs font-mono border ${conf.bg} ${conf.border} ${conf.color}`}>{conf.label}</span>
        <span className={`text-2xs font-mono ${conf.color}`}>{item.grade}</span>
      </div>
    );
  };

  return (
    <section className="relative py-10 animate-fade-in-up" style={{ zIndex: 1 }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="glass-strong p-6 sm:p-8 mb-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center">
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${report.score >= 85 ? 'bg-success-500/10' : report.score >= 55 ? 'bg-warning-500/10' : 'bg-error-500/10'}`} />
                <div className="relative flex flex-col items-center">
                  <span className={`text-3xl font-bold ${report.score >= 85 ? 'text-success-400' : report.score >= 55 ? 'text-warning-400' : 'text-error-400'}`}>{report.score}</span>
                  <span className="text-2xs font-mono text-ink-400 mt-0.5">/ 100</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${
                    report.score >= 85 ? 'bg-success-500/10 border-success-500/20 text-success-400' : report.score >= 55 ? 'bg-warning-500/10 border-warning-500/20 text-warning-400' : 'bg-error-500/10 border-error-500/20 text-error-400'
                  }`}>
                    {report.score >= 85
                      ? t('健康', 'Healthy')
                      : report.score >= 55
                      ? t('降级', 'Degraded')
                      : t('严重', 'Down')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink-50">{t('诊断报告', 'Diagnostic report')}</h3>
                <p className="text-xs font-mono text-ink-400 mt-1">{report.endpoint}</p>
                <p className="text-2xs font-mono text-ink-400 mt-0.5">
                  Key: {report.apiKeyMasked || '—'} ·{' '}
                  {new Date(report.timestamp).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:ml-auto w-full lg:w-auto">
              <div className="surface-3 p-3 text-center">
                <p className="text-2xs font-mono text-ink-400 mb-1">HEALTHY</p>
                <p className="text-lg font-bold text-success-400">{report.healthyCount}</p>
              </div>
              <div className="surface-3 p-3 text-center">
                <p className="text-2xs font-mono text-ink-400 mb-1">DEGRADED</p>
                <p className="text-lg font-bold text-warning-400">{report.degradedCount}</p>
              </div>
              <div className="surface-3 p-3 text-center">
                <p className="text-2xs font-mono text-ink-400 mb-1">DOWN</p>
                <p className="text-lg font-bold text-error-400">{report.downCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-5 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <FileBarChart size={16} className="text-primary-400" />
            <h4 className="text-sm font-semibold text-ink-50">{t('模型探测结果', 'Per-model probe results')}</h4>
            <span className="text-2xs font-mono text-ink-400 ml-auto">{report.modelCount} models</span>
          </div>
          <div className="space-y-3">
            {report.models.map((m, idx) => (
              <div key={m.model} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-ink-800/30 border border-ink-700/30 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                <span className="text-sm font-mono text-ink-100 flex-1">{m.model}</span>
                {statusCard(m)}
                <div className="text-2xs font-mono text-ink-400">
                  Chat {m.chatLatencyMs}ms · SSE {m.firstByteMs ?? '-'}ms · {m.chunks} chunks
                </div>
              </div>
            ))}
          </div>
        </div>

        {report.baseUrl && report.models[0] && (
          <SnippetCard
            baseUrl={report.baseUrl}
            protocol={report.protocol ?? 'openai'}
            model={report.models[0].model}
            apiKeyMasked={report.apiKeyMasked}
          />
        )}

        <div className="glass p-5 sm:p-6">
          <h4 className="text-sm font-semibold text-ink-50 mb-4">{t('诊断发现', 'Findings')}</h4>
          <div className="space-y-3">
            {report.models.map((m) => {
              const issues: { level: 'critical' | 'warning' | 'info' | 'healthy'; title: string; detail: string; metric?: string }[] = [];
              if (m.status === 'down') {
                issues.push({
                  level: 'critical',
                  title: t('模型探测失败', 'Model probe failed'),
                  detail: m.errorMessage || t('对话请求失败', 'The chat request failed'),
                  metric: m.errorCode || 'down',
                });
              } else if (m.status === 'degraded') {
                issues.push({
                  level: 'warning',
                  title: t('部分通路降级', 'Partially degraded'),
                  detail: t('Chat 或 SSE 未完全通过', 'Chat and/or SSE did not fully pass'),
                  metric: m.grade,
                });
              }
              if (m.firstByteMs && m.firstByteMs > 800) {
                issues.push({
                  level: 'warning',
                  title: t('首字节延迟偏高', 'High time to first byte'),
                  detail: t(
                    `TTFT ${m.firstByteMs}ms 超过 P75 基准`,
                    `TTFT ${m.firstByteMs}ms is above the 75th percentile baseline`
                  ),
                  metric: `${m.firstByteMs}ms`,
                });
              }
              if (issues.length === 0) {
                issues.push({
                  level: 'healthy',
                  title: t('通路状态良好', 'All paths healthy'),
                  detail: t('Chat 与 SSE 均通过', 'Both Chat and SSE passed'),
                  metric: m.grade,
                });
              }
              const LEVEL_SEG = {
                critical: { c: 'text-error-400', bg: 'bg-error-500/10', b: 'border-error-500/20' },
                warning: { c: 'text-warning-400', bg: 'bg-warning-500/10', b: 'border-warning-500/20' },
                info: { c: 'text-primary-400', bg: 'bg-primary-500/10', b: 'border-primary-500/20' },
                healthy: { c: 'text-success-400', bg: 'bg-success-500/10', b: 'border-success-500/20' },
              };
              return issues.map((issue, i) => {
                const seg = LEVEL_SEG[issue.level];
                return (
                  <div key={`${m.model}-${i}`} className={`flex items-start gap-3 p-3.5 rounded-xl ${seg.bg} ${seg.b} border`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-ink-400">{m.model}</span>
                        <span className="text-sm font-semibold text-ink-50">{issue.title}</span>
                        {issue.metric && <span className="text-2xs font-mono text-ink-300 bg-ink-800/50 px-1.5 py-0.5 rounded">{issue.metric}</span>}
                      </div>
                      <p className="text-xs text-ink-300 mt-1 leading-relaxed">{issue.detail}</p>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={onReset} className="btn-secondary">
            <ArrowLeft size={14} />
            <span>{t('重新检测', 'Run again')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * 快速接入模板卡：纯前端按协议生成多语言调用示例，可复制。
 *
 * 上游版本这里请求后端 `/doctor/snippet` —— 那只是个字符串模板服务，
 * 放在浏览器里做反而更好：不联网、无延迟、也不依赖任何账号。
 */
function SnippetCard({ baseUrl, protocol, model, apiKeyMasked }: { baseUrl: string; protocol: string; model: string; apiKeyMasked: string }) {
  const [data, setData] = useState<{ snippets: SnippetItem[]; agent_configs: SnippetItem[]; note?: string } | null>(null);
  const [tab, setTab] = useState<'code' | 'agent'>('code');
  const [active, setActive] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { t, lang } = useI18n();

  useEffect(() => {
    if (!baseUrl || !model) return;
    setData(buildSnippets(baseUrl, (protocol as Protocol) || 'openai', model, apiKeyMasked, lang));
  }, [baseUrl, protocol, model, apiKeyMasked, lang]);

  const group = tab === 'agent' ? data?.agent_configs ?? [] : data?.snippets ?? [];
  const current = group.find((x) => x.id === active) ?? group[0];

  const copy = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-ink-50">{t('快速接入', 'Quick integration')}</h4>
        <span className="text-2xs font-mono text-ink-400">
          {protocol === 'openai' ? t('OpenAI 兼容', 'OpenAI-compatible') : protocol.toUpperCase()} · {model}
        </span>
      </div>
      <p className="text-2xs text-ink-400 mb-4">
        {t(
          '复制模板，替换 <API_KEY> 为你的密钥即可调用此接口。',
          'Copy a template, drop in your real key where <API_KEY> appears, and you can call this endpoint.'
        )}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setTab('code'); const f = (data?.snippets ?? [])[0]; setActive(f?.id || ''); }}
          className={`px-3 py-1.5 rounded-lg text-xs ${tab === 'code' ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30' : 'text-ink-400 border border-ink-700/40 hover:border-ink-600'}`}
        >
          {t('代码示例', 'Code')}
        </button>
        <button
          onClick={() => { setTab('agent'); const f = (data?.agent_configs ?? [])[0]; setActive(f?.id || ''); }}
          className={`px-3 py-1.5 rounded-lg text-xs ${tab === 'agent' ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30' : 'text-ink-400 border border-ink-700/40 hover:border-ink-600'}`}
        >
          {t('Agent 工具接入', 'Agent setup')}
        </button>
      </div>

      {!data && (
        <div className="flex items-center gap-2 text-xs text-ink-400 py-3">
          <Loader2 size={14} className="animate-spin text-primary-400" /> {t('正在生成接入模板…', 'Building templates…')}
        </div>
      )}

      {data && (
        <>
          {data.note && data.note.includes('⚠️') && (
            <div className="flex items-start gap-2 rounded-lg border border-warning-500/20 bg-warning-500/10 px-3 py-2 mb-3">
              <AlertCircle size={14} className="text-warning-400 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line text-2xs text-ink-300 leading-relaxed">{data.note}</div>
            </div>
          )}
          {group.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {group.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`px-2.5 py-1 rounded-md text-2xs font-mono ${active === item.id ? 'bg-ink-800 text-ink-100 border border-ink-600' : 'text-ink-400 border border-ink-700/40 hover:border-ink-600'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {current && (
            <div className="relative">
              <pre className="bg-ink-950/60 backdrop-blur-sm border border-ink-700/40 rounded-lg p-4 text-xs font-mono text-ink-200 leading-relaxed overflow-x-auto max-h-72 overflow-y-auto">
                <code>{current.code}</code>
              </pre>
              <button
                onClick={copy}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink-800/80 border border-ink-600 text-2xs text-ink-200 hover:bg-ink-700 transition-colors"
              >
                {copied ? <Check size={12} className="text-success-400" /> : <Copy size={12} />}
                {copied ? t('已复制', 'Copied') : t('复制', 'Copy')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 纯前端辅助：接入模板生成 & 独立报告导出
// （上游版本这两件事都走后端，这里改成本地实现，故无需任何服务）
// ─────────────────────────────────────────────────────────────

/** 去掉 Base URL 末尾斜杠，并判断是否已带版本段（/v1 等） */
function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}${path}`;
}

/** 生成多语言接入示例 + 常见 Agent 工具的配置片段 */
function buildSnippets(
  baseUrl: string,
  protocol: Protocol,
  model: string,
  apiKeyMasked: string,
  lang: Lang,
): { snippets: SnippetItem[]; agent_configs: SnippetItem[]; note?: string } {
  const base = baseUrl.replace(/\/+$/, '');
  const key = apiKeyMasked || '<API_KEY>';

  const perProtocol: Record<Protocol, { path: string; authHeader: string; body: string }> = {
    openai: {
      path: '/chat/completions',
      authHeader: `Authorization: Bearer ${key}`,
      body: `{"model": "${model}", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 16}`,
    },
    anthropic: {
      path: '/messages',
      authHeader: `x-api-key: ${key}\nanthropic-version: 2023-06-01`,
      body: `{"model": "${model}", "max_tokens": 16, "messages": [{"role": "user", "content": "ping"}]}`,
    },
    gemini: {
      path: `/models/${model}:generateContent`,
      authHeader: `x-goog-api-key: ${key}`,
      body: `{"contents": [{"parts": [{"text": "ping"}]}]}`,
    },
    mistral: {
      path: '/chat/completions',
      authHeader: `Authorization: Bearer ${key}`,
      body: `{"model": "${model}", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 16}`,
    },
    cohere: {
      path: '/chat',
      authHeader: `Authorization: Bearer ${key}`,
      body: `{"model": "${model}", "messages": [{"role": "user", "content": "ping"}]}`,
    },
  };

  const spec = perProtocol[protocol];
  const url = joinUrl(base, spec.path);

  const curl = `curl ${url} \\
  -H "Content-Type: application/json" \\
${spec.authHeader
    .split('\n')
    .map((h) => `  -H "${h}"`)
    .join(' \\\n')} \\
  -d '${spec.body}'`;

  const python = `from openai import OpenAI
${protocol === 'openai' ? '' : pick(lang, '# 该 SDK 走 OpenAI 兼容协议，非 OpenAI 原生端点请确认服务商支持\n', '# This SDK speaks the OpenAI-compatible protocol; for a non-native endpoint, confirm the provider supports it\n')}client = OpenAI(
    base_url="${base}",
    api_key="${key}",
)

resp = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "ping"}],
    max_tokens=16,
)
print(resp.choices[0].message.content)`;

  const node = `const res = await fetch("${url}", {
  method: "POST",
  headers: {
${spec.authHeader
    .split('\n')
    .map((h) => {
      const idx = h.indexOf(':');
      return `    "${h.slice(0, idx)}": "${h.slice(idx + 1).trim()}",`;
    })
    .join('\n')}
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${spec.body}),
});

const data = await res.json();
console.log(data);`;

  const agentConfigs: SnippetItem[] = [
    {
      id: 'openai-compatible',
      label: pick(lang, 'OpenAI 兼容客户端', 'OpenAI-compatible client'),
      code: `${pick(lang, '# 任意兼容 OpenAI 协议的工具（Continue / Cline / Roo 等）', '# Any tool that speaks the OpenAI protocol (Continue / Cline / Roo, ...)')}
OPENAI_BASE_URL=${base}
OPENAI_API_KEY=${key}
OPENAI_MODEL=${model}`,
    },
    {
      id: 'claude-code',
      label: pick(lang, 'Claude Code (Anthropic 兼容)', 'Claude Code (Anthropic-compatible)'),
      code: `export ANTHROPIC_BASE_URL=${base}
export ANTHROPIC_AUTH_TOKEN=${key}
export ANTHROPIC_MODEL=${model}`,
    },
    {
      id: 'env',
      label: pick(lang, '.env 通用', 'Generic .env'),
      code: `API_BASE_URL=${base}
API_KEY=${key}
API_MODEL=${model}`,
    },
  ];

  return {
    snippets: [
      { id: 'curl', label: 'cURL', code: curl },
      { id: 'python', label: 'Python', code: python },
      { id: 'node', label: 'Node.js', code: node },
    ],
    agent_configs: agentConfigs,
    note: pick(
      lang,
      `以上模板按 ${protocol} 协议生成，已省略无关参数；把 ${key} 换成完整密钥即可调用。`,
      `Templates above are generated for the ${protocol} protocol with irrelevant parameters omitted. Replace ${key} with your full key and you are ready to call.`
    ),
  };
}

/** 把检测报告序列化成一个自包含、可离线打开的 HTML 文档 */
function buildStandaloneReportHtml(report: DetectionReport, lang: Lang): string {
  const esc = (s: unknown): string =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
    );

  const gradeColor: Record<string, string> = { A: '#1D9E75', B: '#BA7517', F: '#E24B4A' };

  const rows = report.models
    .map((m) => {
      const color = gradeColor[m.grade] ?? '#888780';
      return `      <tr>
        <td class="mono">${esc(m.model)}</td>
        <td><span class="grade" style="color:${color};border-color:${color}">${esc(m.grade)}</span></td>
        <td>${m.chatOk ? pick(lang, '通过', 'pass') : pick(lang, '失败', 'fail')}</td>
        <td class="mono">${esc(m.chatLatencyMs ?? '-')} ms</td>
        <td>${m.sseOk ? pick(lang, '通过', 'pass') : pick(lang, '失败', 'fail')}</td>
        <td class="mono">${esc(m.firstByteMs ?? '-')} ms</td>
        <td>${esc(m.chunks ?? '-')}</td>
      </tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<title>${pick(lang, 'API 健康检测报告', 'API health check report')} — ${esc(report.baseUrl)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 48px 24px; background: #F7F6F2; color: #2C2C2A;
         font: 14px/1.65 -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
  main { max-width: 920px; margin: 0 auto; background: #fff; border: 1px solid #E3E1DA;
         border-radius: 12px; padding: 40px; }
  h1 { font-size: 22px; font-weight: 500; margin: 0 0 6px; }
  .sub { color: #5F5E5A; font-size: 13px; margin: 0 0 28px; }
  .kv { display: flex; flex-wrap: wrap; gap: 12px 32px; padding: 20px 0; border-top: 1px solid #ECEAE3;
        border-bottom: 1px solid #ECEAE3; margin-bottom: 28px; }
  .kv div { font-size: 12px; }
  .kv b { display: block; font-size: 11px; font-weight: 400; color: #888780; letter-spacing: .04em;
          text-transform: uppercase; margin-bottom: 3px; }
  .kv span { font-size: 16px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #ECEAE3; }
  th { font-size: 11px; font-weight: 400; color: #888780; letter-spacing: .04em; text-transform: uppercase; }
  .mono { font-family: ui-monospace, "SFMono-Regular", Consolas, monospace; font-size: 12px; }
  .grade { display: inline-block; min-width: 20px; text-align: center; padding: 1px 6px;
           border: 1px solid; border-radius: 6px; font-weight: 500; font-size: 12px; }
  footer { margin-top: 32px; padding-top: 18px; border-top: 1px solid #ECEAE3;
           color: #888780; font-size: 12px; }
</style>
</head>
<body>
<main>
  <h1>${pick(lang, 'API 健康检测报告', 'API health check report')}</h1>
  <p class="sub">${pick(
    lang,
    '由 ZGo API Doctor 生成 · 浏览器直连探测，API Key 未经过任何服务器',
    'Generated by ZGo API Doctor · probed directly from the browser, the API key never touched any server'
  )}</p>

  <div class="kv">
    <div><b>Base URL</b><span class="mono">${esc(report.baseUrl)}</span></div>
    <div><b>${pick(lang, '健康评分', 'Health score')}</b><span>${esc(report.score)} / 100</span></div>
    <div><b>${pick(lang, '模型数', 'Models')}</b><span>${esc(report.modelCount)}</span></div>
    <div><b>API Key</b><span class="mono">${esc(report.apiKeyMasked || '—')}</span></div>
  </div>

  <table>
    <thead>
      <tr><th>${pick(lang, '模型', 'Model')}</th><th>${pick(lang, '等级', 'Grade')}</th><th>Chat</th><th>${pick(lang, '延迟', 'Latency')}</th><th>SSE</th><th>${pick(lang, '首字节', 'First byte')}</th><th>${pick(lang, '分片', 'Chunks')}</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>

  <footer>${pick(
    lang,
    '本报告为浏览器端一次性探测结果，仅反映生成时刻的状态，不代表服务商的长期可用性。',
    'This report is a one-off probe result produced in the browser. It reflects the state at generation time only and says nothing about the provider\'s long-term availability.'
  )}</footer>
</main>
</body>
</html>`;
}
