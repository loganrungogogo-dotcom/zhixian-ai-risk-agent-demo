'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type RiskDomain = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
type EvidenceItem = { id: string; page: number | null; excerpt: string; matchedKeywords?: string[]; status: string; evidenceNature: string; ruleBasis: string; whyItMatters?: string; verificationNeeded: string };
type Finding = { riskDomain: RiskDomain; title: string; status: string; conclusion?: string; evidence: string[]; evidenceItems?: EvidenceItem[]; missingEvidence?: string[]; policyIds?: string[]; boundary: string };
type UploadRecord = {
  id: string; company: string; channel: string; file_name: string; review_status: string; created_at: string;
  analysis: { version?: string; materialRelevance?: string; summary: string; findings: Finding[]; questions: Array<{ id: string; riskDomain: RiskDomain; topic: string; question: string; materials?: string[] }>; evidenceBoundary: string };
};
type Task = { id: string; risk_domain: RiskDomain; topic: string; question: string; requested_materials: string; owner: string; due_date: string; status: string };
type EvidenceReview = { evidence_id: string; decision: string; note: string; reviewer: string; updated_at: string };
type AuditLog = { id: string; action: string; target_type: string; details: string; operator: string; created_at: string };
type EnterpriseProfile = {
  company: string; lifecycle: string; lifecycleBasis: string; materials: number; excludedMaterials: number; reviewedMaterials: number; evidenceBoundary: string;
  registry: null | { dataYear: string; businessType: string; publicIndicators: string; publicExposure: string; dataGaps: string[] };
  domains: Array<{ riskDomain: RiskDomain; title: string; status: string; evidenceCount: number; materialCount: number; confirmedCount: number; missingEvidence: string[]; registrySignal?: string }>;
  transmissions: Array<{ id: string; title: string; path: string[]; blocker: string }>;
  reductions: Array<{ riskDomain: RiskDomain; status: string; risk: string; companyAction: string; institutionAction: string; transfer: string; reviewCycle: string }>;
};
type CompanyOption = { company: string; lifecycle: string };
type AiReview = { runId: string; analysis: { summary: string; findings: Array<{ riskDomain: RiskDomain; status: string; evidenceId: string; interpretation: string; verificationNeeded: string }>; limitations: string[] }; metadata: { model: string; elapsedMs: number; evidenceInputCount: number; rejectedCitationCount: number; status: string; reviewer?: string } };

const domains: Array<{ id: RiskDomain; title: string }> = [
  { id: 'R1', title: '技术与算法' }, { id: 'R2', title: '数据安全与合规' }, { id: 'R3', title: '知识产权与科技伦理' },
  { id: 'R4', title: '融资与商业化' }, { id: 'R5', title: '组织生态与外部环境' },
];

function dateLabel(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
}

function parsedMaterials(value: string) {
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

function ruleLabel(value: string) {
  return value.replace('内部筛查规则', '风险识别规则');
}

export default function RiskWorkbench({ role, companyScope }: { role: string; companyScope: string }) {
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [company, setCompany] = useState(companyScope || '科大讯飞');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [enterprise, setEnterprise] = useState<EnterpriseProfile | null>(null);
  const [domain, setDomain] = useState<RiskDomain>('R5');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviews, setReviews] = useState<EvidenceReview[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [view, setView] = useState<'银行授信' | '投资尽调' | '保险风控' | '科创企业'>(role === '投资人员' ? '投资尽调' : role === '保险风控人员' ? '保险风控' : role === '科创企业用户' ? '科创企业' : '银行授信');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiModel, setAiModel] = useState('');
  const [aiReview, setAiReview] = useState<AiReview | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadRecords = useCallback(async () => {
    const response = await fetch('/api/uploads');
    if (!response.ok) return;
    const data = await response.json();
    const next = ((data.records || []) as UploadRecord[]).filter((item) => item.analysis.version === '2.0' && item.analysis.materialRelevance !== '不相关');
    setRecords(next);
    setSelectedId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id || '');
  }, []);

  const loadWorkflow = useCallback(async (uploadId: string) => {
    if (!uploadId) { setTasks([]); setReviews([]); setAudit([]); return; }
    const response = await fetch(`/api/workflow?uploadId=${encodeURIComponent(uploadId)}`);
    if (!response.ok) return;
    const data = await response.json();
    setTasks(data.tasks || []); setReviews(data.reviews || []); setAudit(data.audit || []);
  }, []);

  const loadEnterprise = useCallback(async (targetCompany: string) => {
    const response = await fetch(`/api/enterprise?company=${encodeURIComponent(targetCompany)}`);
    if (!response.ok) return;
    const data = await response.json();
    setCompanies((data.companies || []).filter((item: CompanyOption) => !companyScope || item.company === companyScope));
    setEnterprise(data.profile || null);
  }, [companyScope]);

  const companyRecords = useMemo(() => records.filter((item) => item.company === company), [records, company]);
  const effectiveSelectedId = companyRecords.some((item) => item.id === selectedId) ? selectedId : companyRecords[0]?.id || '';
  const selected = companyRecords.find((item) => item.id === effectiveSelectedId);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadRecords(), 0);
    const handleUpdate = () => loadRecords();
    window.addEventListener('risk-record-updated', handleUpdate);
    return () => { window.clearTimeout(initialLoad); window.removeEventListener('risk-record-updated', handleUpdate); };
  }, [loadRecords]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadEnterprise(company), 0);
    return () => window.clearTimeout(timer);
  }, [company, records, loadEnterprise]);
  useEffect(() => {
    fetch('/api/ai-analysis').then((response) => response.ok ? response.json() : null).then((data) => {
      if (data) { setAiConfigured(Boolean(data.configured)); setAiModel(String(data.model || '')); }
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!effectiveSelectedId) { setAiReview(null); return; }
      fetch(`/api/ai-analysis?uploadId=${encodeURIComponent(effectiveSelectedId)}`).then((response) => response.ok ? response.json() : null).then((data) => setAiReview(data?.latest || null)).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [effectiveSelectedId]);
  useEffect(() => {
    const workflowLoad = window.setTimeout(() => void loadWorkflow(effectiveSelectedId), 0);
    return () => window.clearTimeout(workflowLoad);
  }, [effectiveSelectedId, loadWorkflow]);
  const findingMap = useMemo(() => new Map(selected?.analysis.findings.map((item) => [item.riskDomain, item]) || []), [selected]);
  const activeFinding = findingMap.get(domain);
  const evidenceItems = useMemo(() => {
    if (activeFinding?.evidenceItems?.length) return activeFinding.evidenceItems;
    return (activeFinding?.evidence || []).map((excerpt, index) => ({
      id: `${domain}-legacy-${index + 1}`, page: null, excerpt, status: activeFinding.status,
      evidenceNature: '材料原文片段', ruleBasis: '风险识别规则', verificationNeeded: activeFinding.boundary,
    }));
  }, [activeFinding, domain]);
  const reviewMap = useMemo(() => new Map(reviews.map((item) => [item.evidence_id, item])), [reviews]);

  async function workflow(action: string, payload: Record<string, unknown> = {}) {
    if (!selected) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, uploadId: selected.id, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '操作失败');
      setTasks(data.tasks || []); setReviews(data.reviews || []); setAudit(data.audit || []);
      await loadRecords();
      setMessage('操作已保存，并写入审计记录。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败。');
    } finally { setBusy(false); }
  }

  async function runAiReview() {
    if (!selected) return;
    setBusy(true); setMessage(''); setAiReview(null);
    try {
      const response = await fetch('/api/ai-analysis', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ uploadId: selected.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '大模型复核失败');
      setAiReview(data);
      setMessage('大模型已完成证据复核，结果仍需人工确认。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '大模型复核失败。'); }
    finally { setBusy(false); }
  }

  async function confirmAiReview() {
    if (!selected || !aiReview) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/ai-analysis', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ uploadId: selected.id, runId: aiReview.runId, decision: '已人工复核' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '确认失败');
      setAiReview({ ...aiReview, metadata: { ...aiReview.metadata, status: data.status, reviewer: data.reviewer } });
      await loadWorkflow(selected.id);
      setMessage('模型复核结果已由人工确认并写入审计记录。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '确认失败。'); }
    finally { setBusy(false); }
  }

  const enterpriseSummary = enterprise && <>
    <section className="panel enterprise-toolbar" aria-label="企业画像选择">
      <div><p className="eyebrow">企业级持续画像</p><h2>{enterprise.company}</h2><p>{enterprise.registry?.businessType || '人工智能科创企业'}</p></div>
      <label>选择企业<select value={company} disabled={Boolean(companyScope)} onChange={(event) => { setCompany(event.target.value); setSelectedId(''); setAiReview(null); }}>{companies.map((item) => <option key={item.company} value={item.company}>{item.company} · {item.lifecycle}</option>)}</select></label>
      <div className="lifecycle-card"><span>生命周期候选</span><strong>{enterprise.lifecycle}</strong><small>{enterprise.lifecycleBasis}</small></div>
      <div className="enterprise-kpis"><span>纳入画像<b>{enterprise.materials}</b></span><span>排除材料<b>{enterprise.excludedMaterials}</b></span><span>人工复核<b>{enterprise.reviewedMaterials}</b></span><span>分析方式<b>{aiConfigured ? '规则＋大模型' : '规则＋知识库'}</b></span></div>
    </section>
    <section className="panel enterprise-portrait">
      <div className="section-title compact"><div><p className="eyebrow">跨材料汇总，不做综合评分</p><h2>R1—R5企业风险画像</h2></div><span>{enterprise.evidenceBoundary}</span></div>
      <div className="portrait-grid">{enterprise.domains.map((item) => <article key={item.riskDomain}><div><b>{item.riskDomain}</b><span>{item.status}</span></div><strong>{item.title}</strong><p>{item.materialCount}份材料 · {item.evidenceCount}处证据 · {item.confirmedCount}项已复核</p><small>{item.registrySignal || (item.missingEvidence[0] ? `待补：${item.missingEvidence[0]}` : '需上传材料形成证据链')}</small></article>)}</div>
      {enterprise.registry && <div className="registry-context"><div><b>公开指标底表</b><p>{enterprise.registry.publicIndicators}</p></div><div><b>公开风险暴露</b><p>{enterprise.registry.publicExposure}</p></div></div>}
    </section>
  </>;

  if (!selected) return <div className="risk-workbench">{enterpriseSummary}<section className="panel workbench-empty"><h2>{company}尚无已上传材料</h2><p>研究数据库提供生命周期和公开画像底表；上传企业材料后，系统会建立证据、传导、减量、尽调和复核闭环。</p><a className="primary-button" href="#upload">上传该企业材料</a></section></div>;

  const eventCount = selected.analysis.findings.filter((item) => item.status === '实际事件').length;
  const exposureCount = selected.analysis.findings.filter((item) => item.status === '风险暴露').length;
  const openTasks = tasks.filter((item) => item.status !== '已完成').length;

  return (
    <div className="risk-workbench">
      {enterpriseSummary}
      <section className="panel record-toolbar" aria-label="分析记录选择">
        <div><p className="eyebrow">当前治理对象</p><h2>{selected.company}</h2><p>{selected.file_name}</p></div>
        <label>切换材料<select value={effectiveSelectedId} onChange={(event) => { setSelectedId(event.target.value); setAiReview(null); }}>{companyRecords.map((record) => <option key={record.id} value={record.id}>{record.period} · {record.file_name}</option>)}</select></label>
        <div className="record-stats"><span>实际事件<b>{eventCount}</b></span><span>风险暴露<b>{exposureCount}</b></span><span>待办任务<b>{openTasks}</b></span><span>复核状态<b>{selected.review_status}</b></span></div>
      </section>

      <section className="panel" id="transmission">
        <div className="section-title compact"><div><p className="eyebrow">从风险识别走向损失阻断</p><h2>风险传导与关键阻断点</h2></div><span>基于当前企业活跃风险域自动匹配</span></div>
        <div className="transmission-list">{enterprise?.transmissions.length ? enterprise.transmissions.map((chain) => <article key={chain.id}><div><b>{chain.id}</b><strong>{chain.title}</strong></div><div className="transmission-path">{chain.path.map((node, index) => <span key={node}>{node}{index < chain.path.length - 1 && <i>→</i>}</span>)}</div><p><b>关键阻断：</b>{chain.blocker}</p></article>) : <p className="empty-analysis">当前企业尚无足够材料匹配传导链。</p>}</div>
      </section>

      <section className="panel" id="risks">
        <div className="section-title compact"><div><p className="eyebrow">可下钻的R1—R5诊断</p><h2>风险诊断</h2></div><span>选择风险域查看证据、规则和缺口</span></div>
        <div className="risk-grid interactive">
          {domains.map((item) => {
            const finding = findingMap.get(item.id);
            return <button className={`risk-card ${domain === item.id ? 'selected' : ''}`} type="button" key={item.id} onClick={() => setDomain(item.id)}>
              <div className="risk-card-head"><span className="risk-code">{item.id}</span><span className="status">{finding?.status || '需核验'}</span></div>
              <h3>{item.title}</h3><p>{finding?.conclusion || '当前材料未形成该风险域的可定位证据。'}</p><small>{finding?.evidenceItems?.length || finding?.evidence.length || 0}处证据</small>
            </button>;
          })}
        </div>
        <div className="risk-detail">
          <div><strong>{domain} · {activeFinding?.title || domains.find((item) => item.id === domain)?.title}</strong><span>{activeFinding?.status || '需核验'}</span></div>
          <p>{activeFinding?.boundary || '证据不足时不得补全事实或自动形成金融决策。'}</p>
          <div>{(activeFinding?.missingEvidence || ['需要补充与该风险域相关的第二层验证材料']).map((item) => <span key={item}>待补：{item}</span>)}</div>
        </div>
      </section>

      <section className="panel" id="evidence">
        <div className="section-title compact"><div><p className="eyebrow">原文—判断—复核三层分离</p><h2>证据定位</h2></div><span>{domain}共{evidenceItems.length}处可定位片段</span></div>
        <div className="evidence-table">
          {evidenceItems.length ? evidenceItems.map((item) => {
            const review = reviewMap.get(item.id);
            return <article key={item.id}>
              <div className="evidence-meta"><b>{item.page ? `第${item.page}页` : '未标页'}</b><span>{item.evidenceNature}</span><span>{item.status}</span><em>{review?.decision || '待复核'}</em></div>
              <blockquote>{item.excerpt}</blockquote>
              <p><b>判断依据：</b>{ruleLabel(item.ruleBasis)}</p><p><b>仍需核验：</b>{item.verificationNeeded}</p>
              {role !== '科创企业用户' && <div className="evidence-actions">{['确认事实', '仅属企业自述', '需补充材料', '不适用'].map((decision) => <button type="button" disabled={busy} key={decision} onClick={() => workflow('reviewEvidence', { evidenceId: item.id, riskDomain: domain, decision })}>{decision}</button>)}</div>}
            </article>;
          }) : <p className="empty-analysis">当前材料没有该风险域的原文证据，请通过尽调任务补充。</p>}
        </div>
      </section>

      {aiConfigured && <section className="panel ai-review-panel" id="ai-review">
        <div className="section-title compact"><div><p className="eyebrow">规则初筛＋模型复核＋人工确认</p><h2>大模型证据复核</h2></div><div className="ai-mode"><span>{aiConfigured ? `已连接 ${aiModel}` : '模型服务未配置'}</span><button className="primary-button" type="button" disabled={busy || !aiConfigured} onClick={runAiReview}>{busy ? '处理中…' : '运行模型复核'}</button></div></div>
        {aiReview && <div className="ai-result"><div><strong>{aiReview.analysis.summary}</strong><span>{aiReview.metadata.model} · {aiReview.metadata.status} · 输入{aiReview.metadata.evidenceInputCount}处证据</span></div>{aiReview.analysis.findings.map((item) => <article key={`${item.riskDomain}-${item.evidenceId}`}><b>{item.riskDomain} · {item.status}</b><p>{item.interpretation}</p><small>证据ID：{item.evidenceId}｜待核验：{item.verificationNeeded}</small></article>)}{aiReview.metadata.status !== '已人工复核' && <button className="secondary-button" type="button" disabled={busy} onClick={confirmAiReview}>人工确认模型复核结果</button>}</div>}
        {message && <p className="workflow-message">{message}</p>}
      </section>}

      <section className="panel" id="tasks">
        <div className="section-title compact"><div><p className="eyebrow">由证据缺口驱动</p><h2>尽调任务</h2></div><button className="primary-button" type="button" disabled={busy} onClick={() => workflow('generateTasks')}>生成／补齐尽调清单</button></div>
        <div className="task-list">
          {tasks.length ? tasks.map((task) => <article key={task.id}>
            <span>{task.risk_domain}</span><div><strong>{task.topic}</strong><p>{task.question}</p><small>所需材料：{parsedMaterials(task.requested_materials).join('、') || '由负责人补充'}</small></div>
            <div className="task-control"><b>{task.owner}</b><select value={task.status} onChange={(event) => workflow('updateTask', { taskId: task.id, status: event.target.value, owner: task.owner === '待分配' ? '风险经理' : task.owner, dueDate: task.due_date })}><option>待发起</option><option>进行中</option><option>待企业补充</option><option>待复核</option><option>已完成</option></select></div>
          </article>) : <p className="empty-analysis">尚未生成任务。点击“生成／补齐尽调清单”，系统会把分析缺口转换为可跟踪事项。</p>}
        </div>
      </section>

      <section className="panel" id="views">
        <div className="section-title compact"><div><p className="eyebrow">同一证据，不同工作目标</p><h2>机构视图</h2></div><div className="view-tabs">{(['银行授信', '投资尽调', '保险风控', '科创企业'] as const).filter((item) => role === '比赛专家／超级管理员' || (role === '银行风险经理' && item === '银行授信') || (role === '投资人员' && item === '投资尽调') || (role === '保险风控人员' && item === '保险风控') || (role === '科创企业用户' && item === '科创企业')).map((item) => <button type="button" className={view === item ? 'active' : ''} onClick={() => setView(item)} key={item}>{item}</button>)}</div></div>
        <div className="institution-view">
          {view === '银行授信' && <><h3>授信审查关注</h3><p>优先使用已确认事实和持续风险暴露，不把企业治理自述直接转化为授信结论。</p><ul><li>需核验经营现金流、应收账龄和融资续航。</li><li>外部限制对研发、交付与回款的传导尚需第二层材料。</li><li>当前开放尽调任务{openTasks}项，复核状态为“{selected.review_status}”。</li></ul></>}
          {view === '投资尽调' && <><h3>投资与投后关注</h3><p>重点验证技术壁垒、商业化可复制性、关键权属和下一轮资金续航，不自动输出投资建议。</p><ul><li>将核心IP、数据授权和关键认证设置为交割前置或投后里程碑。</li><li>穿透核验订单、客户验证、研发成果转化和融资假设。</li><li>对重大外部限制、供应链替代和团队稳定性设置动态复查。</li></ul></>}
          {view === '保险风控' && <><h3>承保与风控关注</h3><p>区分可保风险、既有事件、责任边界和持续控制，不自动输出承保结论。</p><ul><li>已发生事件需核验发生时间、损失、整改和再发概率。</li><li>数据、知识产权及产品责任应结合具体场景和保单责任判断。</li><li>企业制度披露需有日志、审计或测试记录佐证。</li></ul></>}
          {view === '科创企业' && <><h3>治理整改关注</h3><p>把外部审查要求转换为企业可执行的材料补充和控制改进清单。</p><ul><li>先补齐证据链，再讨论风险是否关闭。</li><li>对R2、R3优先补充授权、执行记录和权属材料。</li><li>已完成任务应上传整改证据并提交复核。</li></ul></>}
        </div>
      </section>

      <section className="panel" id="reduction">
        <div className="section-title compact"><div><p className="eyebrow">识别—核验—干预—转移—复查</p><h2>风险减量行动台账</h2></div><span>当前企业{enterprise?.reductions.length || 0}类措施</span></div>
        <div className="reduction-list">{enterprise?.reductions.map((item) => <article key={item.riskDomain}><div><b>{item.riskDomain}</b><strong>{item.risk}</strong><span>{item.status}</span></div><dl><div><dt>企业整改</dt><dd>{item.companyAction}</dd></div><div><dt>机构动作</dt><dd>{item.institutionAction}</dd></div><div><dt>风险转移</dt><dd>{item.transfer}</dd></div><div><dt>复查周期</dt><dd>{item.reviewCycle}</dd></div></dl></article>)}</div>
      </section>

      <section className="panel" id="audit">
        <div className="section-title compact"><div><p className="eyebrow">所有人工动作留痕</p><h2>复核审计</h2></div>{role === '比赛专家／超级管理员' ? <div className="audit-actions"><button type="button" disabled={busy} onClick={() => workflow('submitReview')}>提交复核</button><button type="button" disabled={busy} onClick={() => workflow('completeReview', { decision: '待补充材料' })}>退回补充</button><button type="button" disabled={busy} onClick={() => workflow('completeReview', { decision: '复核通过' })}>复核通过</button></div> : <span>当前身份可查看审计记录，最终结论由比赛专家／超级管理员确认</span>}</div>
        {message && <p className="workflow-message">{message}</p>}
        <div className="audit-timeline">{audit.length ? audit.map((item) => <article key={item.id}><span>{dateLabel(item.created_at)}</span><div><strong>{item.action}</strong><p>{item.details}</p><small>{item.operator} · {item.target_type}</small></div></article>) : <p className="empty-analysis">尚无人工操作记录。证据复核、任务更新和复核结论都会在这里留痕。</p>}</div>
      </section>
    </div>
  );
}
