import { useEffect, useState } from 'react';
import UploadWorkspace from '@/components/upload-workspace';
import RiskWorkbench from '@/components/risk-workbench';
import ComplianceLibrary from '@/components/compliance-library';
import SessionBadge from '@/components/session-badge';

function Login({ onLogin }: { onLogin: () => void }) {
  const [account, setAccount] = useState('expert-judge');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ account, accessCode: code }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    onLogin();
  }
  return <main className="local-login">
    <section className="local-login-brand">
      <div className="login-logo">Z</div><h1>智险可控</h1>
      <h2>人工智能科创企业全生命周期<br />风险识别与智能治理平台</h2>
      <p>把分散材料转化为可核验的风险证据、尽调任务和治理行动，服务科技金融决策与企业持续改进。</p>
      <div className="login-value"><span>增收支持</span><span>降本提效</span><span>减损控制</span></div>
    </section>
    <section className="local-login-card">
      <p className="eyebrow">专家评审入口</p><h2>进入风险治理工作台</h2>
      <form onSubmit={submit}>
        <label htmlFor="judge-account">专家账号</label><input id="judge-account" value={account} onChange={(event) => setAccount(event.target.value)} />
        <label htmlFor="judge-code">访问码</label><input id="judge-code" type="password" value={code} onChange={(event) => setCode(event.target.value)} placeholder="请输入访问码" />
        {error && <p className="local-login-error">{error}</p>}<button>验证并进入系统 →</button>
      </form>
      <p className="local-mode">文件在当前浏览器本地解析和保存；风险结论必须经过人工复核。</p>
    </section>
  </main>;
}

function Dashboard() {
  const role = '超级管理员';
  const pages = [
    { id: 'overview', number: '01', label: '企业总览', eyebrow: '科技金融风险治理', title: '企业风险治理中心', description: '查看企业画像、生命周期和R1—R5风险概览' },
    { id: 'upload', number: '02', label: '材料接入', eyebrow: '统一资料中心', title: '材料接入与分析', description: '上传材料、查看解析结果并管理原始文件' },
    { id: 'value', number: '03', label: '经营价值', eyebrow: '可验证的业务成效', title: '增收支持 · 降本提效 · 减损控制', description: '用已完成任务和证据处理量呈现经营价值' },
    { id: 'risks', number: '04', label: '风险诊断', eyebrow: 'R1—R5分类识别', title: '企业风险诊断', description: '按风险域查看结论、依据和核验任务' },
    { id: 'transmission', number: '05', label: '传导阻断', eyebrow: '从风险到经营影响', title: '风险传导与关键阻断点', description: '识别风险传导节点并形成阻断措施' },
    { id: 'evidence', number: '06', label: '证据复核', eyebrow: '原文—判断—复核', title: '证据定位与人工复核', description: '逐项核对原文、证据性质和判断边界' },
    { id: 'tasks', number: '07', label: '尽调任务', eyebrow: '由证据驱动', title: '尽调任务管理', description: '生成、分派并关闭具体核验事项' },
    { id: 'reduction', number: '08', label: '减量行动', eyebrow: '识别—干预—复查', title: '风险减量行动台账', description: '明确企业整改、机构动作和复查周期' },
    { id: 'audit', number: '09', label: '复核审计', eyebrow: '人工决策留痕', title: '复核结论与审计记录', description: '核对关闭条件并保存全过程操作记录' },
    { id: 'library', number: '10', label: '规则资料库', eyebrow: '规则与尽调支持', title: 'R2／R3规则资料库', description: '查询规则依据、公开证据和尽调材料要求' },
  ] as const;
  type PageId = typeof pages[number]['id'];
  const getPageFromHash = (): PageId => {
    const hash = window.location.hash.replace('#', '') as PageId;
    return pages.some((page) => page.id === hash) ? hash : 'overview';
  };
  const [activePage, setActivePage] = useState<PageId>(getPageFromHash);
  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) window.history.replaceState(null, '', '#overview');
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [activePage]);
  const currentPage = pages.find((page) => page.id === activePage) || pages[0];

  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark">Z</div><div className="brand-copy"><strong>平安科创智控</strong><span>人工智能科创企业风险治理平台</span></div><div className="topbar-meta"><SessionBadge displayName="专家评委" organization="评审组" role={role} /></div></header>
    <div className="workspace">
      <aside className="sidebar"><nav aria-label="主导航">
        {pages.map((page) => <a className={activePage === page.id ? 'active' : ''} href={`#${page.id}`} key={page.id} aria-current={activePage === page.id ? 'page' : undefined}><span>{page.number}</span>{page.label}</a>)}
      </nav><div className="data-scope"><p>数据底座</p><strong>12 家企业</strong><span>R1—R5统一口径</span><span>20条R2／R3规则</span></div></aside>
      <section className="content" data-page={activePage}>
        <div className="page-heading"><div><p className="eyebrow">{currentPage.eyebrow}</p><h1>{currentPage.title}</h1><div className="company-meta"><span>{currentPage.description}</span></div></div><div className="page-indicator"><span>{currentPage.number}</span><strong>{currentPage.label}</strong></div></div>
        <section className="guardrail"><p><strong>证据边界：</strong>原文、事实、风险解释和金融决策分层表达；未取得证据时直接生成具体核验任务。</p><strong>不输出综合评分</strong></section>
        <UploadWorkspace role={role} companyScope="" /><RiskWorkbench role={role} companyScope="" /><ComplianceLibrary />
      </section>
    </div>
  </main>;
}

export default function App() {
  const [logged, setLogged] = useState(() => localStorage.getItem('zhixian-session') === '1');
  return logged ? <Dashboard /> : <Login onLogin={() => setLogged(true)} />;
}
