'use client';

import { useMemo, useState } from 'react';
import dueDiligenceLibrary from '@/data/r2_r3/due-diligence-library.json';
import policyLibrary from '@/data/r2_r3/policy-library.json';
import publicEvidence from '@/data/r2_r3/public-evidence.json';

type Domain = 'R2' | 'R3';
type ResourceType = '规则依据' | '公开证据' | '尽调问题';

function includesQuery(values: unknown[], query: string) {
  if (!query) return true;
  return values.flatMap((value) => Array.isArray(value) ? value : [value]).join(' ').toLowerCase().includes(query.toLowerCase());
}

export default function ComplianceLibrary() {
  const [domain, setDomain] = useState<Domain>('R2');
  const [resourceType, setResourceType] = useState<ResourceType>('规则依据');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (resourceType === '规则依据') {
      return policyLibrary
        .filter((item) => item.riskDomains.includes(domain) && includesQuery([item.title, item.authority, item.agentUse, item.requiredEvidence], query))
        .map((item) => ({ id: item.id, title: item.title, meta: `${item.level} · ${item.authority}`, detail: item.agentUse, tags: item.requiredEvidence, url: item.url }));
    }
    if (resourceType === '公开证据') {
      return publicEvidence
        .filter((item) => item.riskDomain === domain && includesQuery([item.company, item.report, item.excerpt, item.status], query))
        .map((item) => ({ id: item.id, title: `${item.company} · ${item.report}`, meta: `第${item.page}页 · ${item.evidenceNature}`, detail: item.excerpt, tags: [item.status], boundary: item.boundary }));
    }
    return dueDiligenceLibrary
      .filter((item) => item.riskDomain === domain && includesQuery([item.topic, item.question, item.materials, item.trigger], query))
      .map((item) => ({ id: item.id, title: item.topic, meta: item.trigger, detail: item.question, tags: item.materials }));
  }, [domain, resourceType, query]);

  return (
    <section className="panel compliance-library" id="library">
      <div className="section-title compact">
        <div><p className="eyebrow">规则与尽调支持</p><h2>R2／R3资料库</h2></div>
        <span>查询规则、公开披露和所需材料</span>
      </div>
      <div className="library-toolbar">
        <div className="library-tabs" aria-label="风险域">
          {(['R2', 'R3'] as Domain[]).map((item) => <button className={domain === item ? 'active' : ''} type="button" key={item} onClick={() => setDomain(item)}>{item}</button>)}
        </div>
        <div className="library-tabs" aria-label="资料类型">
          {(['规则依据', '公开证据', '尽调问题'] as ResourceType[]).map((item) => <button className={resourceType === item ? 'active' : ''} type="button" key={item} onClick={() => setResourceType(item)}>{item}</button>)}
        </div>
        <label className="library-search"><span>检索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入规则、企业或材料名称" /></label>
      </div>
      <div className="library-results">
        {results.slice(0, 12).map((item) => (
          <article key={item.id}>
            <div><strong>{item.title}</strong><span>{item.meta}</span></div>
            <p>{item.detail}</p>
            <div className="library-tags">{item.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div>
            {'boundary' in item && item.boundary && <small>使用边界：{item.boundary}</small>}
            {'url' in item && item.url && <a href={item.url} target="_blank" rel="noreferrer">查看原文</a>}
          </article>
        ))}
        {!results.length && <p className="empty-analysis">未找到匹配资料。</p>}
      </div>
    </section>
  );
}
