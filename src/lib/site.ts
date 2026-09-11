/**
 * 站点级常量：页脚、隐私政策、服务条款等共用，避免多处重复硬编码。
 *
 * ⚠ Fork 提示：下面带「占位符」注释的常量需要在部署前替换成你自己的信息，
 * 尤其是经营主体与联系邮箱 —— 它们会出现在页脚与法律条款页。
 */

/** 联系邮箱：用于「联系我们」mailto 链接与法律条款页 */
export const CONTACT_EMAIL = 'contact@example.com';

/** ICP 备案号：页脚展示并链至工信部备案查询。中国大陆境内网站需自行备案后填入。 */
export const ICP_NUMBER = '';

/** 政策生效日期（YYYY-MM-DD），更新条款时同步修改 */
export const POLICY_EFFECTIVE_DATE = '2026-09-09';

/** GitHub 开源仓库地址（右上角入口 + 关于我们页共用） */
export const GITHUB_URL = 'https://github.com/qingling-777/ZGo-API-doctor';

/**
 * 项目方运营的线上实例（托管版）。
 * 不想自己部署的话可以直接用这个；它是本仓库代码的部署产物，
 * 源码与线上版本一致（AGPL-3.0 §13 要求网络服务提供者向用户提供源码）。
 * ⚠ Fork 后请把此项改掉或置空，不要让你的分支引流到项目方的实例。
 */
export const HOSTED_URL = 'https://myzgo.cn';

/** 是否在页脚展示线上实例入口。Fork 后建议置为 false。 */
export const SHOW_HOSTED_LINK = true;

/**
 * 经营主体全称（营业执照登记名称）。
 * 备案主体、收款主体与本站运营主体三者一致，用于页脚公示、
 * 服务条款与退款政策中的缔约方声明。
 *
 * ⚠ 占位符：请替换为你自己的经营主体（或个人运营者名称）。
 */
export const BUSINESS_ENTITY = '示例科技有限公司';

/**
 * 客服邮箱。与 CONTACT_EMAIL 为同一邮箱，单独命名是为了在
 * 「问题反馈」「安全报告」等场景中语义更明确。
 */
export const SUPPORT_EMAIL = CONTACT_EMAIL;
