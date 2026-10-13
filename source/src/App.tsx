import { useState } from 'react';
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
  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark">Z</div><div className="brand-copy"><strong>平安科创智控</strong><span>人工智能科创企业风险治理平台</span></div><div className="topbar-meta"><SessionBadge displayName="专家评委" organization="评审组" role={role} /></div></header>
    <div className="workspace">
      <aside className="sidebar"><nav aria-label="主导航">
        <a className="active" href="#overview"><span>01</span>企业总览</a><a href="#upload"><span>02</span>材料接入</a><a href="#value"><span>03</span>经营价值</a><a href="#risks"><span>04</span>风险诊断</a><a href="#transmission"><span>05</span>传导阻断</a><a href="#evidence"><span>06</span>证据复核</a><a href="#tasks"><span>07</span>尽调任务</a><a href="#reduction"><span>08</span>减量行动</a><a href="#audit"><span>09</span>复核审计</a><a href="#library"><span>10</span>规则资料库</a>
      </nav><div className="data-scope"><p>数据底座</p><strong>12 家企业</strong><span>R1—R5统一口径</span><span>20条R2／R3规则</span></div></aside>
      <section className="content" id="overview">
        <div className="page-heading"><div><p className="eyebrow">科技金融风险治理</p><h1>企业风险治理中心</h1><div className="company-meta"><span>材料本地处理</span><span>证据可追溯</span><span>结论人工确认</span></div></div><div className="heading-actions"><a className="secondary-button" href="#materials">材料目录</a><a className="primary-button" href="#upload">＋ 上传材料</a></div></div>
        <section className="guardrail"><span>证据边界</span><p>原文、事实、风险解释和金融决策分层表达；证据不足时保留“需核验”</p><strong>不输出综合评分</strong></section>
        <UploadWorkspace role={role} companyScope="" /><RiskWorkbench role={role} companyScope="" /><ComplianceLibrary />
      </section>
    </div>
  </main>;
}

export default function App() {
  const [logged, setLogged] = useState(() => localStorage.getItem('zhixian-session') === '1');
  return logged ? <Dashboard /> : <Login onLogin={() => setLogged(true)} />;
}
