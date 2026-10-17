import { analyzeMaterial } from '@/lib/risk-analysis';
import { buildEnterpriseProfile, type MaterialAnalysisRecord } from '@/lib/enterprise-analysis';
import { companyProfiles, detectCompanyFromFileName } from '@/lib/company-profiles';

const RECORDS = 'zhixian-cn-records-v1';
const WORKFLOW = 'zhixian-cn-workflow-v1';
const FILE_DB = 'zhixian-original-files-v1';
const FILE_STORE = 'files';
const TEXT_STORE = 'texts';
const memoryFiles = new Map<string, Blob>();

type Analysis = ReturnType<typeof analyzeMaterial>;
type StoredRecord = MaterialAnalysisRecord & {
  channel: string;
  source_institution: string;
  permission_scope: string;
  confidentiality: string;
  file_size: number;
  parser_status: string;
  extracted_characters: number;
  created_at: string;
  analysis: Analysis;
  _text: string;
  material_kind?: '演示材料' | '用户上传材料';
};
type TaskRecord = { id: string; risk_domain: string; topic: string; question: string; requested_materials: string; owner: string; due_date: string; status: string; created_at: string };
type ReviewRecord = { evidence_id: string; risk_domain: string; decision: string; note: string; reviewer: string; updated_at: string };
type AuditRecord = { id: string; action: string; target_type: string; details: string; operator: string; created_at: string };
type ReductionEvidence = { id: string; name: string; size: number; created_at: string };
type ReductionAction = { id: string; risk_domain: string; risk: string; company_action: string; institution_action: string; transfer: string; review_cycle: string; owner: string; due_date: string; status: string; evidence_files: ReductionEvidence[]; updated_at: string };
type WorkflowRecord = { tasks: TaskRecord[]; reviews: ReviewRecord[]; reductions: ReductionAction[]; audit: AuditRecord[] };

const now = () => new Date().toISOString();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json;charset=utf-8' } });
const load = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } };
const save = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const demoText = '云从科技是一家人工智能科创企业，持续投入算法模型研发并服务智慧金融和智慧治理场景。公司披露研发投入较大，仍处于商业化拓展阶段，存在持续亏损、经营现金流下降和融资续航压力。部分训练数据来自客户委托与第三方授权，数据授权链、访问日志和安全审计材料仍需进一步核验。公司建立知识产权管理和开源管理制度，但核心代码权属链、开源软件清单及自由实施分析尚未完整提供。公开资料显示公司被列入美国实体清单，外部限制可能影响算力、供应链、研发和客户交付。';

function initialRecords(): StoredRecord[] {
  const existing = load<StoredRecord[]>(RECORDS, []);
  if (existing.length) {
    const migrated = existing.map((record) => {
      const detectedCompany = record.id === 'demo-yuncong' ? '' : detectCompanyFromFileName(record.file_name);
      const analysis = record.id === 'demo-yuncong'
        ? analyzeMaterial({ text: record._text || demoText, channel: 'D', parserStatus: '正文提取完成', company: '云从科技' })
        : { ...record.analysis, evidenceBoundary: record.analysis.evidenceBoundary.replaceAll('Agent', '系统') };
      return {
        ...record,
        company: detectedCompany || record.company,
        material_kind: record.id === 'demo-yuncong' ? '演示材料' as const : '用户上传材料' as const,
        period: record.period === '公开材料演示' ? '公开披露口径' : record.period,
        file_name: record.file_name === '云从科技_公开披露演示材料.txt' ? '云从科技_公开披露摘要.txt' : record.file_name,
        analysis,
      };
    });
    if (JSON.stringify(migrated) !== JSON.stringify(existing)) save(RECORDS, migrated);
    return migrated;
  }
  const analysis = analyzeMaterial({ text: demoText, channel: 'D', parserStatus: '正文提取完成', company: '云从科技' });
  const record: StoredRecord = {
    id: 'demo-yuncong', company: '云从科技', channel: 'D', period: '公开披露口径', source_institution: '企业公开披露摘要',
    permission_scope: '项目组可见', confidentiality: '公开', file_name: '云从科技_公开披露摘要.txt', file_size: new Blob([demoText]).size,
    parser_status: '正文提取完成', extracted_characters: analysis.extractedCharacters, review_status: '尚未开始复核', created_at: now(), analysis, _text: demoText, material_kind: '演示材料',
  };
  save(RECORDS, [record]);
  return [record];
}

function workflowState() { return load<Record<string, WorkflowRecord>>(WORKFLOW, {}); }
function workflowFor(id: string): WorkflowRecord {
  const stored = workflowState()[id];
  return stored ? { ...stored, reductions: stored.reductions || [] } : { tasks: [], reviews: [], reductions: [], audit: [] };
}
function saveWorkflow(id: string, value: WorkflowRecord) { const all = workflowState(); all[id] = value; save(WORKFLOW, all); }
function records() {
  return initialRecords().sort((left, right) => {
    const leftDemo = left.material_kind === '演示材料' || left.id === 'demo-yuncong';
    const rightDemo = right.material_kind === '演示材料' || right.id === 'demo-yuncong';
    if (leftDemo !== rightDemo) return leftDemo ? 1 : -1;
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}
function setRecords(value: StoredRecord[]) { save(RECORDS, value); }
function updateReviewStatus(id: string, status: string) { setRecords(records().map((record) => record.id === id ? { ...record, review_status: status } : record)); }

function openFileDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(FILE_DB, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(FILE_STORE)) request.result.createObjectStore(FILE_STORE);
      if (!request.result.objectStoreNames.contains(TEXT_STORE)) request.result.createObjectStore(TEXT_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function persistExtractedText(id: string, text: string) {
  try {
    const db = await openFileDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(TEXT_STORE, 'readwrite');
      transaction.objectStore(TEXT_STORE).put(text, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch { /* 解析结果仍保留在当前分析记录中 */ }
}

async function readExtractedText(id: string) {
  try {
    const db = await openFileDb();
    const result = await new Promise<string | null>((resolve, reject) => {
      const request = db.transaction(TEXT_STORE, 'readonly').objectStore(TEXT_STORE).get(id);
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  } catch { return null; }
}

async function persistOriginalFile(id: string, file: Blob) {
  memoryFiles.set(id, file);
  try {
    const db = await openFileDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(FILE_STORE, 'readwrite');
      transaction.objectStore(FILE_STORE).put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch { /* 当前会话仍保留内存副本 */ }
}

async function readOriginalFile(id: string) {
  if (memoryFiles.has(id)) return memoryFiles.get(id) || null;
  try {
    const db = await openFileDb();
    const result = await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction(FILE_STORE, 'readonly').objectStore(FILE_STORE).get(id);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (result) memoryFiles.set(id, result);
    return result;
  } catch { return null; }
}

async function deleteOriginalFile(id: string) {
  memoryFiles.delete(id);
  try {
    const db = await openFileDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE, TEXT_STORE], 'readwrite');
      transaction.objectStore(FILE_STORE).delete(id);
      transaction.objectStore(TEXT_STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch { /* 已清理内存副本 */ }
}

async function hash(value: string) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(buffer)].map((item) => item.toString(16).padStart(2, '0')).join('');
}

async function session(request: Request): Promise<Response> {
  if (request.method === 'GET') return localStorage.getItem('zhixian-session') === '1'
    ? json({ session: { displayName: '专家评委', organization: '评审组', role: '超级管理员', companyScope: '' } })
    : json({ session: null }, 401);
  if (request.method === 'DELETE') { localStorage.removeItem('zhixian-session'); return json({ ok: true }); }
  const body = await request.json() as { account?: string; accessCode?: string };
  const valid = String(body.account || '').trim() === 'expert-judge'
    && await hash(String(body.accessCode || '').trim()) === '41c593a871962b46d191e4587788d7c3f64639a8bd91b847fc7ada4d5964da71';
  if (!valid) return json({ error: '专家账号或访问码不正确。' }, 401);
  localStorage.setItem('zhixian-session', '1');
  return json({ ok: true, role: '超级管理员' });
}

async function uploads(request: Request, url: URL): Promise<Response> {
  const all = records();
  const fileId = url.searchParams.get('fileId');
  if (request.method === 'GET' && fileId) {
    const record = all.find((item) => item.id === fileId);
    if (!record) return json({ error: '材料不存在' }, 404);
    const original = await readOriginalFile(fileId);
    if (original) return new Response(original, { headers: { 'content-type': original.type || 'application/octet-stream' } });
    return new Response(record._text || record.analysis.evidenceBoundary, { headers: { 'content-type': 'text/plain;charset=utf-8', 'x-zhixian-original': 'text-fallback' } });
  }
  if (request.method === 'GET') return json({ records: all.map(({ _text, ...record }) => record) });
  if (request.method === 'POST') {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return json({ error: '请选择文件' }, 400);
    const id = crypto.randomUUID();
    const text = String(form.get('extractedText') || '');
    const channel = String(form.get('channel') || 'A');
    const company = String(form.get('company') || '待确认').trim();
    const period = String(form.get('period') || '').trim();
    const sourceInstitution = String(form.get('sourceInstitution') || '').trim();
    if (!company || company === '待确认' || !period || !sourceInstitution) return json({ error: '请完整填写企业主体、材料期间和来源机构。' }, 400);
    const detectedCompany = detectCompanyFromFileName(file.name);
    if (detectedCompany && detectedCompany !== company) return json({ error: `文件名识别为“${detectedCompany}”，不能归入“${company}”。` }, 409);
    const analysis = analyzeMaterial({ text, channel, parserStatus: String(form.get('parserStatus') || '已接收'), company });
    const record: StoredRecord = {
      id, company, channel, period, source_institution: sourceInstitution,
      permission_scope: String(form.get('permissionScope') || ''), confidentiality: String(form.get('confidentiality') || ''), file_name: file.name,
      file_size: file.size, parser_status: String(form.get('parserStatus') || ''), extracted_characters: analysis.extractedCharacters,
      review_status: '尚未开始复核', created_at: now(), analysis, _text: text.slice(0, 20_000), material_kind: '用户上传材料',
    };
    await persistOriginalFile(id, file);
    await persistExtractedText(id, text);
    setRecords([record, ...all].slice(0, 30));
    const { _text, ...safeRecord } = record;
    return json({ record: safeRecord });
  }
  if (request.method === 'PATCH') {
    const body = await request.json() as { id?: string; extractedText?: string; parserStatus?: string };
    const record = all.find((item) => item.id === body.id);
    if (!record) return json({ error: '材料不存在' }, 404);
    const storedText = body.extractedText === undefined ? await readExtractedText(record.id) : null;
    const text = String(body.extractedText ?? storedText ?? record._text ?? '');
    const parserStatus = String(body.parserStatus || record.parser_status);
    const analysis = analyzeMaterial({ text, channel: record.channel, parserStatus, company: record.company });
    const next: StoredRecord = { ...record, parser_status: parserStatus, extracted_characters: analysis.extractedCharacters, analysis, _text: text.slice(0, 20_000), review_status: '尚未开始复核' };
    await persistExtractedText(record.id, text);
    setRecords(all.map((item) => item.id === next.id ? next : item));
    const { _text, ...safeRecord } = next;
    return json({ record: safeRecord });
  }
  if (request.method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (id) {
      setRecords(all.filter((item) => item.id !== id));
      const workflow = workflowState();
      delete workflow[id];
      save(WORKFLOW, workflow);
      await deleteOriginalFile(id);
    }
    return json({ ok: true });
  }
  return json({ error: '不支持的操作' }, 405);
}

function reviewGate(record: StoredRecord, workflow: WorkflowRecord) {
  const requiredEvidence = [...new Set(record.analysis.findings.flatMap((finding) =>
    (finding.evidenceItems || []).filter((item) => item.status === '实际事件' || item.status === '风险暴露').map((item) => item.id)))];
  const resolvedReviews = new Set(workflow.reviews.filter((item) => item.decision !== '转入尽调').map((item) => item.evidence_id));
  const pendingEvidence = requiredEvidence.filter((id) => !resolvedReviews.has(id));
  const openTasks = workflow.tasks.filter((task) => task.status !== '已完成');
  const tasksNotGenerated = record.analysis.questions.length > 0 && workflow.tasks.length === 0;
  const activeRisks = record.analysis.findings.filter((finding) => finding.status === '实际事件' || finding.status === '风险暴露');
  const reductionsNotGenerated = activeRisks.length > 0 && workflow.reductions.length === 0;
  const openReductions = workflow.reductions.filter((item) => item.status !== '已完成').length;
  return { requiredEvidence: requiredEvidence.length, reviewedEvidence: requiredEvidence.length - pendingEvidence.length, pendingEvidence, openTasks: openTasks.length, tasksNotGenerated, openReductions, reductionsNotGenerated, canApprove: !pendingEvidence.length && !openTasks.length && !tasksNotGenerated && !openReductions && !reductionsNotGenerated };
}

async function workflow(request: Request, url: URL): Promise<Response> {
  if (request.method === 'GET') {
    const id = url.searchParams.get('uploadId') || '';
    const record = records().find((item) => item.id === id);
    const data = workflowFor(id);
    const gate = record ? reviewGate(record, data) : null;
    if (record?.review_status === '复核通过' && gate && !gate.canApprove) updateReviewStatus(id, '复核中');
    return json({ ...data, gate });
  }
  const body = await request.json() as Record<string, string>;
  const id = String(body.uploadId || '');
  const record = records().find((item) => item.id === id);
  if (!record) return json({ error: '材料不存在' }, 404);
  const data = workflowFor(id);
  const stamp = now();
  if (body.action === 'generateTasks') {
    data.tasks = (record.analysis.questions || []).map((question, index) => {
      const taskId = `task-${id}-${index}`;
      return data.tasks.find((task) => task.id === taskId) || {
        id: taskId, risk_domain: question.riskDomain, topic: question.topic, question: question.question,
        requested_materials: JSON.stringify(question.materials || []), owner: '待分配', due_date: '', status: '待发起', created_at: stamp,
      };
    });
  }
  if (body.action === 'generateReductions') {
    const profile = buildEnterpriseProfile(record.company, [record]);
    data.reductions = profile.reductions.map((item) => {
      const existing = data.reductions.find((action) => action.risk_domain === item.riskDomain);
      return existing || { id: `reduction-${id}-${item.riskDomain}`, risk_domain: item.riskDomain, risk: item.risk, company_action: item.companyAction, institution_action: item.institutionAction, transfer: item.transfer, review_cycle: item.reviewCycle, owner: '待分配', due_date: '', status: '未启动', evidence_files: [], updated_at: stamp };
    });
  }
  if (body.action === 'saveReduction') {
    data.reductions = data.reductions.map((item) => item.id === body.reductionId ? { ...item, company_action: body.companyAction, institution_action: body.institutionAction, transfer: body.transfer, review_cycle: body.reviewCycle, owner: body.owner, due_date: body.dueDate, status: body.status, updated_at: stamp } : item);
  }
  if (body.action === 'submitReduction') data.reductions = data.reductions.map((item) => item.id === body.reductionId ? { ...item, status: '待复核', updated_at: stamp } : item);
  if (body.action === 'completeReduction') {
    const target = data.reductions.find((item) => item.id === body.reductionId);
    if (!target?.evidence_files.length) return json({ error: '请先上传执行证明，再确认行动完成。' }, 409);
    data.reductions = data.reductions.map((item) => item.id === body.reductionId ? { ...item, status: '已完成', updated_at: stamp } : item);
  }
  if (body.action === 'updateTask') data.tasks = data.tasks.map((task) => task.id === body.taskId ? { ...task, status: body.status, owner: body.owner, due_date: body.dueDate } : task);
  if (body.action === 'reviewEvidence') {
    const item: ReviewRecord = { evidence_id: body.evidenceId, risk_domain: body.riskDomain, decision: body.decision, note: '', reviewer: '专家评委', updated_at: stamp };
    data.reviews = [item, ...data.reviews.filter((review) => review.evidence_id !== body.evidenceId)];
    updateReviewStatus(id, '复核中');
  }
  if (body.action === 'submitReview') updateReviewStatus(id, '复核中');
  if (body.action === 'completeReview' && body.decision === '复核通过') {
    const gate = reviewGate(record, data);
    if (!gate.canApprove) return json({ error: `暂不能通过：尚有${gate.pendingEvidence.length}处关键证据未完成复核、${gate.openTasks}项任务未完成、${gate.openReductions}项减量行动未完成${gate.tasksNotGenerated ? '，且尽调任务尚未生成' : ''}${gate.reductionsNotGenerated ? '，且减量行动尚未生成' : ''}。`, gate }, 409);
    updateReviewStatus(id, '复核通过');
  } else if (body.action === 'completeReview') updateReviewStatus(id, String(body.decision || '已退回处理'));

  const labels: Record<string, string> = { generateTasks: '生成尽调任务', updateTask: '更新尽调任务', reviewEvidence: '复核证据', generateReductions: '生成减量行动', saveReduction: '更新减量行动', submitReduction: '提交行动复核', completeReduction: '确认行动完成', submitReview: '提交复核', completeReview: '完成复核' };
  data.audit = [{ id: crypto.randomUUID(), action: labels[body.action] || body.action, target_type: '材料分析记录', details: body.decision || body.status || record.file_name, operator: '专家评委', created_at: stamp }, ...data.audit].slice(0, 50);
  saveWorkflow(id, data);
  return json({ ...data, gate: reviewGate(record, data) });
}

async function reductionEvidence(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({ error: '不支持的操作' }, 405);
  const form = await request.formData();
  const uploadId = String(form.get('uploadId') || '');
  const reductionId = String(form.get('reductionId') || '');
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) return json({ error: '请选择执行证明文件。' }, 400);
  if (file.size > 20 * 1024 * 1024) return json({ error: '单个执行证明不能超过20MB。' }, 413);
  const record = records().find((item) => item.id === uploadId);
  if (!record) return json({ error: '材料不存在' }, 404);
  const data = workflowFor(uploadId);
  const action = data.reductions.find((item) => item.id === reductionId);
  if (!action) return json({ error: '减量行动不存在' }, 404);
  const stamp = now();
  const evidence = { id: `reduction-file-${crypto.randomUUID()}`, name: file.name, size: file.size, created_at: stamp };
  await persistOriginalFile(evidence.id, file);
  data.reductions = data.reductions.map((item) => item.id === reductionId ? { ...item, evidence_files: [...item.evidence_files, evidence], status: item.status === '未启动' ? '进行中' : item.status, updated_at: stamp } : item);
  data.audit = [{ id: crypto.randomUUID(), action: '上传行动证明', target_type: '减量行动', details: `${action.risk_domain}｜${file.name}`, operator: '专家评委', created_at: stamp }, ...data.audit].slice(0, 50);
  saveWorkflow(uploadId, data);
  return json({ ...data, gate: reviewGate(record, data) });
}

async function report(url: URL): Promise<Response> {
  const record = records().find((item) => item.id === url.searchParams.get('uploadId'));
  if (!record) return json({ error: '材料不存在' }, 404);
  const workflow = workflowFor(record.id);
  const profile = buildEnterpriseProfile(record.company, [record]);
  const gate = reviewGate(record, workflow);
  const evidenceCount = record.analysis.findings.reduce((sum, finding) => sum + (finding.evidenceItems?.length || 0), 0);
  const lines = [
    `# ${record.company}风险识别与治理报告`, '',
    `- 材料：${record.file_name}`, `- 期间：${record.period}`, `- 来源：${record.source_institution}`, `- 复核状态：${record.review_status}`, '',
    '## 一、处理概况', '', record.analysis.summary, '',
    `系统已整理${record.extracted_characters.toLocaleString('zh-CN')}个字符、${evidenceCount}处证据、${workflow.tasks.length}项尽调任务；已完成人工复核${workflow.reviews.length}处。`, '',
    '## 二、R1—R5风险识别', '',
    ...record.analysis.findings.flatMap((finding) => [
      `### ${finding.riskDomain} ${finding.title}｜${finding.status}`, '', finding.conclusion || '',
      ...(finding.evidenceItems || []).flatMap((item) => [`- ${item.page ? `第${item.page}页` : '未标页'}｜${item.evidenceNature}｜${item.excerpt}`, `  - 人工处理：${workflow.reviews.find((review) => review.evidence_id === item.id)?.decision || '尚未处理'}`]),
      `- 建议核验材料：${(finding.missingEvidence || []).join('；') || '无'}`, '',
    ]),
    '## 三、风险传导与阻断', '',
    ...profile.transmissions.flatMap((item) => [`- **${item.title}**：${item.path.join(' → ')}`, `  - 关键阻断：${item.blocker}`]), '',
    '## 四、尽调任务', '',
    ...(workflow.tasks.length ? workflow.tasks.map((task) => `- [${task.status === '已完成' ? 'x' : ' '}] ${task.risk_domain}｜${task.topic}｜${task.status}｜责任人：${task.owner}｜${task.question}`) : ['- 尚未生成尽调任务。']), '',
    '## 五、经营价值执行路径', '',
    '- **增收支持**：围绕订单、交付、验收与回款补齐证据，降低项目延期和客户流失对收入实现的影响。',
    `- **降本提效**：已自动完成${record.extracted_characters.toLocaleString('zh-CN')}个字符整理和${evidenceCount}处证据定位，减少重复翻阅与人工归类。`,
    `- **减损控制**：已识别${record.analysis.findings.filter((item) => item.status === '实际事件' || item.status === '风险暴露').length}个事件或暴露风险域，并匹配阻断措施和复查周期。`, '',
    '## 六、风险减量行动', '',
    ...(workflow.reductions.length ? workflow.reductions.flatMap((item) => [`### ${item.risk_domain} ${item.risk}｜${item.status}`, `- 企业整改：${item.company_action}`, `- 机构动作：${item.institution_action}`, `- 风险转移：${item.transfer || '无'}`, `- 责任人：${item.owner || '待分配'}`, `- 完成期限：${item.due_date || '待确定'}`, `- 复查要求：${item.review_cycle}`, `- 执行证明：${item.evidence_files.map((file) => file.name).join('；') || '尚未上传'}`, '']) : profile.reductions.flatMap((item) => [`### ${item.riskDomain} ${item.risk}｜尚未生成行动台账`, `- 企业整改建议：${item.companyAction}`, `- 机构动作建议：${item.institutionAction}`, `- 复查建议：${item.reviewCycle}`, ''])),
    '## 七、复核关闭条件', '',
    `- 关键证据复核：${gate.reviewedEvidence}/${gate.requiredEvidence}`, `- 未完成任务：${gate.openTasks}`, `- 未完成减量行动：${gate.openReductions}`, `- 当前是否允许通过：${gate.canApprove ? '是' : '否'}`, '',
    '## 八、审计记录', '',
    ...(workflow.audit.length ? workflow.audit.map((item) => `- ${new Date(item.created_at).toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })}｜${item.action}｜${item.details}｜${item.operator}`) : ['- 暂无审计记录。']), '',
    '## 九、证据边界', '', record.analysis.evidenceBoundary,
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/markdown;charset=utf-8', 'content-disposition': 'attachment; filename="risk-governance-report.md"' } });
}

export function installLocalApi() {
  const nativeFetch = window.fetch.bind(window);
  const localFetch: typeof window.fetch = async (input, init) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return nativeFetch(input, init);
    const request = new Request(url, init);
    if (url.pathname === '/api/session') return session(request);
    if (url.pathname === '/api/uploads') return uploads(request, url);
    if (url.pathname === '/api/overview') {
      const allRecords = records();
      const allWorkflow = workflowState();
      const domainSummary = ['R1', 'R2', 'R3', 'R4', 'R5'].map((riskDomain) => {
        const findings = allRecords.flatMap((record) => record.analysis.findings.filter((finding) => finding.riskDomain === riskDomain));
        return {
          riskDomain,
          evidenceCount: findings.reduce((sum, finding) => sum + (finding.evidenceItems?.length || finding.evidence.length || 0), 0),
          activeCount: findings.filter((finding) => finding.status === '实际事件' || finding.status === '风险暴露').length,
        };
      });
      const workflowItems = Object.values(allWorkflow);
      const tasks = workflowItems.flatMap((item) => item.tasks);
      const reductions = workflowItems.flatMap((item) => item.reductions || []);
      const audits = workflowItems.flatMap((item) => item.audit);
      const reviews = workflowItems.flatMap((item) => item.reviews);
      return json({
        materialCount: allRecords.length,
        companyCount: new Set(allRecords.map((item) => item.company)).size,
        evidenceCount: domainSummary.reduce((sum, item) => sum + item.evidenceCount, 0),
        activeRiskCount: domainSummary.reduce((sum, item) => sum + item.activeCount, 0),
        openTaskCount: tasks.filter((item) => item.status !== '已完成').length + reductions.filter((item) => item.status !== '已完成').length,
        completedTaskCount: tasks.filter((item) => item.status === '已完成').length + reductions.filter((item) => item.status === '已完成').length,
        reviewCount: reviews.length,
        auditCount: audits.length,
        approvedCount: allRecords.filter((item) => item.review_status === '复核通过').length,
        domains: domainSummary,
      });
    }
    if (url.pathname === '/api/workflow') return workflow(request, url);
    if (url.pathname === '/api/reduction-evidence') return reductionEvidence(request);
    if (url.pathname === '/api/enterprise') {
      const company = url.searchParams.get('company') || companyProfiles[0].company;
      return json({ companies: companyProfiles.map((item) => ({ company: item.company, lifecycle: item.lifecycle })), profile: buildEnterpriseProfile(company, records().filter((record) => record.company === company)) });
    }
    if (url.pathname === '/api/ai-analysis') return request.method === 'GET' ? json({ configured: false, model: '', latest: null }) : json({ error: '当前版本使用规则库与人工复核，不调用外部模型服务。' }, 503);
    if (url.pathname === '/api/reports') return report(url);
    return json({ error: '接口不存在' }, 404);
  };
  window.fetch = localFetch;
}
