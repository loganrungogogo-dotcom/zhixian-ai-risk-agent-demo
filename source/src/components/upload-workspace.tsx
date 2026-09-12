'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { strFromU8, unzipSync } from 'fflate';

const companies = ['科大讯飞', '商汤集团', '云从科技', '第四范式', '创新奇智', '医渡科技', '百融云创', '寒武纪', '地平线', '黑芝麻智能', '速腾聚创', '优必选'];

const uploadChannels = [
  { code: 'A', title: '企业公开披露', detail: '年报、招股书、公告、监管与司法材料', accepts: '.pdf,.docx,.txt,.md,.html' },
  { code: 'B', title: '财务与经营数据', detail: '财务报表、订单、客户、应收与现金流', accepts: '.xlsx,.xls,.csv,.json' },
  { code: 'C', title: '技术与产品验证', detail: '测试报告、认证、技术路线与资源依赖', accepts: '.pdf,.docx,.xlsx,.png,.jpg,.jpeg' },
  { code: 'R2', title: '数据安全与合规', detail: '数据清单、授权、备案、安全评估与审计', accepts: '.pdf,.docx,.xlsx,.csv,.json' },
  { code: 'R3', title: '知识产权与科技伦理', detail: '权属、开源、版权许可、伦理审查与复核', accepts: '.pdf,.docx,.xlsx,.csv,.json' },
  { code: 'D', title: '第二层尽调与整改', detail: '合同、验收、回款、替代方案与整改证据', accepts: '.pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg' },
];

type UploadRecord = {
  id: string;
  company: string;
  channel: string;
  period: string;
  source_institution: string;
  permission_scope: string;
  confidentiality: string;
  file_name: string;
  file_size: number;
  parser_status: string;
  extracted_characters: number;
  review_status: string;
  created_at: string;
  analysis: {
    summary: string;
    version?: string;
    materialRelevance?: string;
    findings: Array<{
      riskDomain: string; title: string; status: string; conclusion?: string; matchedKeywords: string[]; evidence: string[]; boundary: string;
      evidenceItems?: Array<{ id: string; page: number | null; excerpt: string; evidenceNature: string; ruleBasis: string; verificationNeeded: string }>;
      missingEvidence?: string[];
      policyIds?: string[];
    }>;
    questions: Array<{ id: string; riskDomain: string; topic: string; question: string; materials?: string[] }>;
    policies?: Array<{ id: string; title: string; authority: string; url: string }>;
    evidenceBoundary: string;
  };
};

function decodeXml(value: string) {
  const doc = new DOMParser().parseFromString(`<root>${value}</root>`, 'text/xml');
  return doc.documentElement.textContent || '';
}

function extractDocx(data: Uint8Array) {
  const archive = unzipSync(data);
  const document = archive['word/document.xml'];
  if (!document) return '';
  return decodeXml(
    strFromU8(document)
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  );
}

function extractXlsx(data: Uint8Array) {
  const archive = unzipSync(data);
  const shared = archive['xl/sharedStrings.xml']
    ? Array.from(new DOMParser().parseFromString(strFromU8(archive['xl/sharedStrings.xml']), 'text/xml').querySelectorAll('si'))
        .map((node) => node.textContent || '')
    : [];
  const sheetNames = Object.keys(archive).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort();
  const rows: string[] = [];
  for (const name of sheetNames.slice(0, 20)) {
    const doc = new DOMParser().parseFromString(strFromU8(archive[name]), 'text/xml');
    for (const cell of Array.from(doc.querySelectorAll('c'))) {
      const raw = cell.querySelector('v')?.textContent || cell.querySelector('is')?.textContent || '';
      rows.push(cell.getAttribute('t') === 's' ? shared[Number(raw)] || '' : raw);
    }
  }
  return rows.join(' ');
}

async function extractFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (['txt', 'md', 'csv', 'json', 'html', 'htm'].includes(extension)) {
    return { text: await file.text(), status: '正文提取完成' };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === 'pdf') {
    const { extractPdfText } = await import('@/lib/pdf-client');
    return { text: await extractPdfText(bytes), status: 'PDF正文提取完成' };
  }
  if (extension === 'docx') return { text: extractDocx(bytes), status: 'Word正文提取完成' };
  if (extension === 'xlsx') return { text: extractXlsx(bytes), status: 'Excel单元格提取完成' };
  if (['png', 'jpg', 'jpeg'].includes(extension)) return { text: '', status: '图片已入库／OCR待处理' };
  if (extension === 'xls' || extension === 'doc') return { text: '', status: '旧版Office格式已入库／请转为XLSX或DOCX' };
  return { text: '', status: '文件已入库／正文待人工提取' };
}

async function readApiResult(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const message = (await response.text()).trim();
  if (response.status === 413) {
    throw new Error('上传内容超过服务端限制，请确认单个文件不超过20MB。');
  }
  throw new Error(message || '上传服务暂时不可用，请稍后重试。');
}

function formatSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

async function downloadLocal(url: string, fileName: string, open = false) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('文件生成失败。');
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = open ? '' : fileName;
  if (open) link.target = '_blank';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

function ruleLabel(value: string) {
  return value.replace('内部筛查规则', '风险识别规则');
}

export default function UploadWorkspace({ role, companyScope }: { role: string; companyScope: string }) {
  const [channel, setChannel] = useState<(typeof uploadChannels)[number] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [company, setCompany] = useState(companyScope || '科大讯飞');
  const [period, setPeriod] = useState('2025年度');
  const [sourceInstitution, setSourceInstitution] = useState('');
  const [permissionScope, setPermissionScope] = useState('项目组可见');
  const [confidentiality, setConfidentiality] = useState('内部');
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    fetch('/api/uploads')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setRecords(((data.records || []) as UploadRecord[]).filter((item) => item.analysis.version === '2.0' && item.analysis.materialRelevance !== '不相关' && (!companyScope || item.company === companyScope))))
      .catch(() => undefined);
  }, [companyScope]);

  const latest = records[0];
  const selectedTotal = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  function publishRecord(record: UploadRecord) {
    window.dispatchEvent(new CustomEvent('risk-record-updated', { detail: record }));
  }

  function chooseFiles(selectedChannel: (typeof uploadChannels)[number], selected: FileList | null) {
    if (!selected?.length) return;
    setChannel(selectedChannel);
    setFiles(Array.from(selected).slice(0, 10));
    setError('');
    setProgress('');
    dialogRef.current?.showModal();
  }

  async function submitUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!channel || !files.length || !sourceInstitution.trim()) return;
    setBusy(true);
    setError('');
    const uploaded: UploadRecord[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgress(`正在解析并上传 ${index + 1}/${files.length}：${file.name}`);
        if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name}超过20MB限制。`);
        const extracted = await extractFile(file);
        const form = new FormData();
        form.append('file', file);
        form.append('company', company);
        form.append('channel', channel.code);
        form.append('period', period);
        form.append('sourceInstitution', sourceInstitution.trim());
        form.append('permissionScope', permissionScope);
        form.append('confidentiality', confidentiality);
        form.append('parserStatus', extracted.status);
        form.append('extractedText', extracted.text.slice(0, 120_000));
        const response = await fetch('/api/uploads', { method: 'POST', body: form });
        const data = await readApiResult(response);
        if (!response.ok) throw new Error(data.error || '上传失败');
        uploaded.unshift(data.record);
        publishRecord(data.record);
      }
      setRecords((current) => [...uploaded, ...current].slice(0, 20));
      setProgress(`已完成${uploaded.length}份材料入库和初筛。`);
      setFiles([]);
      dialogRef.current?.close();
      document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '材料处理失败。');
    } finally {
      setBusy(false);
    }
  }

  async function reanalyzeLatest() {
    if (!latest) return;
    setBusy(true);
    setError('');
    setProgress(`正在重新分析：${latest.file_name}`);
    try {
      let response = await fetch('/api/uploads', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: latest.id, parserStatus: latest.parser_status }),
      });
      let data = await readApiResult(response).catch((apiError) => ({ error: apiError instanceof Error ? apiError.message : '重新分析失败' }));
      if (response.status === 409) {
        const fileResponse = await fetch(`/api/uploads?fileId=${encodeURIComponent(latest.id)}`);
        if (!fileResponse.ok) throw new Error('无法读取原始文件。');
        const blob = await fileResponse.blob();
        const file = new File([blob], latest.file_name, { type: blob.type || 'application/octet-stream' });
        const extracted = await extractFile(file);
        response = await fetch('/api/uploads', {
          method: 'PATCH', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: latest.id, extractedText: extracted.text.slice(0, 120_000), parserStatus: extracted.status }),
        });
        data = await readApiResult(response);
      }
      if (!response.ok) throw new Error(data.error || '重新分析失败');
      setRecords((current) => current.map((record) => record.id === latest.id ? data.record : record));
      publishRecord(data.record);
      setProgress('分析完成，已更新证据和待补材料。');
    } catch (reanalyzeError) {
      setError(reanalyzeError instanceof Error ? reanalyzeError.message : '重新分析失败。');
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord(record: UploadRecord) {
    if (!window.confirm(`确认删除“${record.file_name}”及其分析、任务和复核记录？此操作无法撤销。`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/uploads?id=${encodeURIComponent(record.id)}`, { method: 'DELETE' });
      const data = await readApiResult(response);
      if (!response.ok) throw new Error(data.error || '删除失败');
      const nextRecords = records.filter((item) => item.id !== record.id);
      setRecords(nextRecords);
      if (nextRecords[0]) publishRecord(nextRecords[0]);
      else window.dispatchEvent(new CustomEvent('risk-record-updated'));
      setProgress('材料及关联记录已删除。');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel upload-panel" id="upload">
      <div className="section-title">
        <div>
          <p className="eyebrow">统一资料中心</p>
          <h2>上传材料，让Agent建立可追溯证据链</h2>
        </div>
        <span>单文件≤20MB · 每批最多10份 · 原件与分析结果分别留存</span>
      </div>
      <div className="upload-grid">
        {uploadChannels.map((item) => (
          <label className="upload-card" key={item.code}>
            <input type="file" accept={item.accepts} multiple onChange={(event) => chooseFiles(item, event.target.files)} />
            <span className="channel-code">{item.code}</span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <span className="upload-link">选择或批量上传 →</span>
          </label>
        ))}
      </div>
      <div className="upload-rule">
        <span>支持：</span>PDF、DOCX、XLSX、CSV、JSON、TXT、图片；图片和旧版Office文件入库后标记为待OCR或待转换。
      </div>

      <section className="analysis-results" id="analysis-results" aria-live="polite">
        <div className="analysis-head">
          <div>
            <p className="eyebrow">最近一次材料分析</p>
            <h3>{latest ? `${latest.company} · ${latest.file_name}` : '尚未上传材料'}</h3>
          </div>
          {latest && <div className="analysis-head-actions"><span className="review-status">{latest.review_status}</span><button type="button" disabled={busy} onClick={reanalyzeLatest}>{busy ? '处理中…' : '重新分析'}</button></div>}
        </div>
        {progress && <p className="progress-note">{progress}</p>}
        {latest ? (
          <>
            <div className="analysis-meta">
              <span>{latest.period}</span><span>{latest.source_institution}</span><span>{latest.confidentiality}</span><span>{formatSize(latest.file_size)}</span>
            </div>
            <p className="analysis-summary">{latest.analysis.summary}</p>
            <div className="finding-grid">
              {latest.analysis.findings.map((finding) => (
                <article key={`${latest.id}-${finding.riskDomain}`}>
                  <div><strong>{finding.riskDomain} · {finding.title}</strong><span>{finding.status}</span></div>
                  <p>{finding.conclusion || finding.evidence[0] || finding.boundary}</p>
                  <small>{finding.evidenceItems?.length ? `已定位${finding.evidenceItems.length}处证据` : finding.matchedKeywords.length ? `命中：${finding.matchedKeywords.join('、')}` : '未提取关键词，需补充材料'}</small>
                  {!!finding.evidenceItems?.length && <details><summary>查看证据位置与判断依据</summary>{finding.evidenceItems.slice(0, 3).map((item) => <div className="evidence-preview" key={item.id}><b>{item.page ? `第${item.page}页` : '未标页'} · {item.evidenceNature}</b><p>{item.excerpt}</p><em>依据：{ruleLabel(item.ruleBasis)}</em></div>)}</details>}
                  {!!finding.missingEvidence?.length && <div className="gap-preview"><b>仍需补充</b>{finding.missingEvidence.map((item) => <span key={item}>{item}</span>)}</div>}
                </article>
              ))}
            </div>
            {!!latest.analysis.questions.length && (
              <div className="question-block">
                <strong>Agent建议的下一步核验</strong>
                {latest.analysis.questions.slice(0, 3).map((question) => <p key={question.id}><span>{question.riskDomain}</span>{question.question}</p>)}
              </div>
            )}
            {!!latest.analysis.policies?.length && <div className="policy-preview"><strong>已匹配规则依据</strong>{latest.analysis.policies.slice(0, 4).map((policy) => <a href={policy.url} target="_blank" rel="noreferrer" key={policy.id}>{policy.title}<small>{policy.authority}</small></a>)}</div>}
            <p className="analysis-boundary">证据边界：{latest.analysis.evidenceBoundary}</p>
          </>
        ) : <p className="empty-analysis">选择上方任一材料入口，填写归属信息后即可上传并生成初筛结果。</p>}
      </section>

      <section className="material-directory" id="materials">
        <div className="section-title compact"><div><p className="eyebrow">已入库材料</p><h2>材料目录</h2></div><span>{records.length}份</span></div>
        <div className="material-list">
          {records.length ? records.map((record) => <article key={record.id}>
            <div className="material-main"><strong>{record.company} · {record.file_name}</strong><span>{record.period} · {record.source_institution} · {formatSize(record.file_size)}</span></div>
            <span className="review-status">{record.review_status}</span>
            <div className="material-actions">
              <button type="button" onClick={() => void downloadLocal(`/api/uploads?fileId=${encodeURIComponent(record.id)}`, record.file_name, true)}>查看原件</button>
              <button type="button" onClick={() => void downloadLocal(`/api/reports?uploadId=${encodeURIComponent(record.id)}`, `${record.company}_风险识别报告.md`)}>导出报告</button>
              {role === '比赛专家／超级管理员' && <button type="button" disabled={busy} onClick={() => deleteRecord(record)}>删除</button>}
            </div>
          </article>) : <p className="empty-analysis">尚无材料。</p>}
        </div>
      </section>

      <dialog className="upload-dialog" ref={dialogRef} onCancel={() => !busy && dialogRef.current?.close()}>
        <form onSubmit={submitUpload}>
          <div className="dialog-head">
            <div><p className="eyebrow">{channel?.code} · {channel?.title}</p><h3>确认材料归属与权限</h3></div>
            <button type="button" aria-label="关闭" disabled={busy} onClick={() => dialogRef.current?.close()}>×</button>
          </div>
          <div className="selected-files">
            {files.map((file) => <span key={`${file.name}-${file.size}`}><strong>{file.name}</strong><small>{formatSize(file.size)}</small></span>)}
            <p>共{files.length}份，{formatSize(selectedTotal)}</p>
          </div>
          <div className="metadata-grid">
            <label>企业主体<select value={company} disabled={Boolean(companyScope)} onChange={(event) => setCompany(event.target.value)}>{companies.filter((item) => !companyScope || item === companyScope).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>材料期间<input required value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="如：2025年度" /></label>
            <label>来源机构<input required value={sourceInstitution} onChange={(event) => setSourceInstitution(event.target.value)} placeholder="如：企业、交易所、监管部门" /></label>
            <label>权限范围<select value={permissionScope} onChange={(event) => setPermissionScope(event.target.value)}><option>项目组可见</option><option>机构内部可见</option><option>仅上传人可见</option></select></label>
            <label>保密级别<select value={confidentiality} onChange={(event) => setConfidentiality(event.target.value)}><option>公开</option><option>内部</option><option>机密</option></select></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          {progress && busy && <p className="dialog-progress">{progress}</p>}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" disabled={busy} onClick={() => dialogRef.current?.close()}>取消</button>
            <button type="submit" className="primary-button" disabled={busy || !sourceInstitution.trim()}>{busy ? '正在处理…' : `上传并分析${files.length}份材料`}</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
