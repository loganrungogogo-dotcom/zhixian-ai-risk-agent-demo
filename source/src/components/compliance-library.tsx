'use client';

import { useMemo, useState } from 'react';
import dueDiligenceLibrary from '@/data/r2_r3/due-diligence-library.json';
import policyLibrary from '@/data/r2_r3/policy-library.json';
import publicEvidence from '@/data/r2_r3/public-evidence.json';
import { companyProfiles } from '@/lib/company-profiles';

type Domain = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
type ResourceType = '规则依据' | '公开证据' | '尽调问题';
type ResourceResult = { id: string; title: string; meta: string; detail: string; tags: string[]; url?: string; boundary?: string };
type SupplementRule = { id: string; riskDomains: Domain[]; title: string; authority: string; level: string; agentUse: string; requiredEvidence: string[] };
type SupplementQuestion = { id: string; riskDomain: Domain; topic: string; question: string; materials: string[]; trigger: string };

const supplementalRules: SupplementRule[] = [
  { id: 'R1-POL-001', riskDomains: ['R1'], title: '中华人民共和国产品质量法', authority: '全国人民代表大会常务委员会', level: '法律', agentUse: '核验产品质量责任、检验合格证明、缺陷处置及损害责任边界。', requiredEvidence: ['产品测试报告', '质量管理记录', '缺陷与召回台账', '客户验收记录'] },
  { id: 'R1-POL-002', riskDomains: ['R1'], title: '中华人民共和国标准化法', authority: '全国人民代表大会常务委员会', level: '法律', agentUse: '核验产品适用标准、企业标准公开、认证测试及标准更新跟踪。', requiredEvidence: ['适用标准清单', '认证证书', '型式试验报告', '标准更新评估'] },
  { id: 'R1-POL-003', riskDomains: ['R1'], title: '关于完善科技成果评价机制的指导意见', authority: '国务院办公厅', level: '政策文件', agentUse: '辅助核验技术成熟度、应用验证和成果转化证据，不以专利数量代替技术有效性。', requiredEvidence: ['技术验证报告', '第三方测试', '试点验收', '迭代与失效记录'] },
  { id: 'R4-POL-001', riskDomains: ['R4'], title: '中华人民共和国公司法', authority: '全国人民代表大会常务委员会', level: '法律', agentUse: '核验资本制度、公司治理、股东责任和重大事项决策程序。', requiredEvidence: ['公司章程', '股权结构', '出资证明', '重大决策记录'] },
  { id: 'R4-POL-002', riskDomains: ['R4'], title: '企业会计准则第22号——金融工具确认和计量', authority: '财政部', level: '会计准则', agentUse: '核验应收款项减值、预期信用损失和相关会计判断的一致性。', requiredEvidence: ['应收账款账龄', '减值测算底稿', '期后回款', '客户信用政策'] },
  { id: 'R4-POL-003', riskDomains: ['R4'], title: '上市公司信息披露管理办法', authority: '中国证券监督管理委员会', level: '部门规章', agentUse: '核验重大合同、经营变化、融资及风险因素的披露口径和时间一致性。', requiredEvidence: ['定期报告', '临时公告', '重大合同台账', '融资文件'] },
  { id: 'R5-POL-001', riskDomains: ['R5'], title: '中华人民共和国出口管制法', authority: '全国人民代表大会常务委员会', level: '法律', agentUse: '核验受控物项、最终用户、最终用途、许可和供应链替代安排。', requiredEvidence: ['物项分类记录', '许可文件', '最终用户承诺', '替代供应链清单'] },
  { id: 'R5-POL-002', riskDomains: ['R5'], title: '中华人民共和国反外国制裁法', authority: '全国人民代表大会常务委员会', level: '法律', agentUse: '识别外部限制对交易主体、履约、资产和合作网络的影响。', requiredEvidence: ['交易方筛查记录', '受限主体清单', '合同制裁条款', '影响评估'] },
  { id: 'R5-POL-003', riskDomains: ['R5'], title: '企业内部控制基本规范', authority: '财政部等五部门', level: '规范性文件', agentUse: '核验治理结构、授权审批、供应商管理、重大风险监测和整改闭环。', requiredEvidence: ['内控制度', '授权矩阵', '供应商评估', '缺陷整改记录'] },
];

const supplementalQuestions: SupplementQuestion[] = [
  { id: 'R1-DD-001', riskDomain: 'R1', topic: '技术成熟度', question: '请提供核心产品最近两年的测试、认证、故障和客户验收记录，并说明关键性能指标与目标值的差距。', materials: ['测试报告', '认证证书', '故障台账', '客户验收'], trigger: '核心产品进入验证、量产或规模交付阶段' },
  { id: 'R1-DD-002', riskDomain: 'R1', topic: '研发可持续性', question: '请说明核心技术路线、研发里程碑、人员投入、失败项目及未来十二个月研发计划。', materials: ['技术路线图', '里程碑记录', '研发人员清单', '失败项目复盘'], trigger: '研发投入高或技术路线快速迭代' },
  { id: 'R1-DD-003', riskDomain: 'R1', topic: '关键资源替代', question: '请列示芯片、算力、基础模型和关键开发工具的依赖程度、切换成本及已验证替代方案。', materials: ['关键资源清单', '替代测试', '切换成本测算', '连续性预案'], trigger: '存在关键软硬件或算力依赖' },
  { id: 'R4-DD-001', riskDomain: 'R4', topic: '商业化质量', question: '请提供订单、合同、交付、验收、开票和回款的逐项勾稽表，并说明重大差异。', materials: ['订单台账', '合同', '验收单', '发票与回款凭证'], trigger: '收入增长较快或项目制收入占比较高' },
  { id: 'R4-DD-002', riskDomain: 'R4', topic: '应收与回款', question: '请提供应收账款账龄、逾期原因、期后回款、减值政策及主要客户信用状况。', materials: ['账龄表', '期后回款', '催收记录', '减值底稿'], trigger: '应收账款增长、周转放缓或计提减值' },
  { id: 'R4-DD-003', riskDomain: 'R4', topic: '资金续航', question: '请提供未来十二个月滚动现金流预测、融资计划及压力情景下的资金缺口应对方案。', materials: ['现金流预测', '融资计划', '授信协议', '压力测试'], trigger: '持续亏损、经营现金流为负或融资依赖较高' },
  { id: 'R5-DD-001', riskDomain: 'R5', topic: '供应链韧性', question: '请列示关键供应商、采购占比、库存覆盖周期、替代认证进度和切换成本。', materials: ['供应商清单', '采购占比', '库存表', '替代认证'], trigger: '关键部件或服务存在集中采购' },
  { id: 'R5-DD-002', riskDomain: 'R5', topic: '外部限制影响', question: '请说明外部清单、出口管制或地缘变化对采购、研发、销售、交付和回款的实际影响及应对记录。', materials: ['适用性分析', '影响评估', '替代方案', '整改记录'], trigger: '企业、客户或供应商涉及外部限制' },
  { id: 'R5-DD-003', riskDomain: 'R5', topic: '核心团队与治理', question: '请提供核心人员变动、激励安排、关联交易、重大争议及内部控制缺陷整改情况。', materials: ['核心人员名单', '激励计划', '关联交易台账', '整改报告'], trigger: '核心人员依赖较强或治理结构发生变化' },
];

function includesQuery(values: unknown[], query: string) {
  if (!query) return true;
  return values.flatMap((value) => Array.isArray(value) ? value : [value]).join(' ').toLowerCase().includes(query.toLowerCase());
}

export default function ComplianceLibrary() {
  const [domain, setDomain] = useState<Domain>('R1');
  const [resourceType, setResourceType] = useState<ResourceType>('规则依据');
  const [query, setQuery] = useState('');

  const results = useMemo<ResourceResult[]>(() => {
    if (resourceType === '规则依据') {
      const base = policyLibrary.filter((item) => item.riskDomains.includes(domain) && !item.level.includes('案例')).map((item) => ({ id: item.id, title: item.title, meta: `${item.level} · ${item.authority}`, detail: item.agentUse, tags: item.requiredEvidence, url: item.url }));
      const supplement = supplementalRules.filter((item) => item.riskDomains.includes(domain)).map((item) => ({ id: item.id, title: item.title, meta: `${item.level} · ${item.authority}`, detail: item.agentUse, tags: item.requiredEvidence }));
      return [...base, ...supplement].filter((item) => includesQuery([item.title, item.meta, item.detail, item.tags], query));
    }
    if (resourceType === '公开证据') {
      const base: ResourceResult[] = publicEvidence.filter((item) => item.riskDomain === domain).map((item) => ({ id: item.id, title: `${item.company} · ${item.report}`, meta: `第${item.page}页 · ${item.evidenceNature}`, detail: item.excerpt, tags: [], boundary: item.boundary }));
      const profileEvidence: ResourceResult[] = domain === 'R2' || domain === 'R3' ? [] : companyProfiles.map((item) => ({
        id: `${domain}-PROFILE-${item.company}`, title: `${item.company} · ${item.dataYear}年度公开资料底表`, meta: `${item.lifecycle} · 年度报告研究底表`,
        detail: domain === 'R4' ? item.publicIndicators : domain === 'R1' ? `${item.businessType}。${item.publicExposure}` : item.publicExposure,
        tags: item.dataGaps.slice(0, 3), boundary: '用于提示核验方向，不替代年度报告原文、测试底稿、合同台账或监管记录。',
      }));
      return [...base, ...profileEvidence].filter((item) => includesQuery([item.title, item.meta, item.detail, item.tags], query));
    }
    const base: ResourceResult[] = dueDiligenceLibrary.filter((item) => item.riskDomain === domain).map((item) => ({ id: item.id, title: item.topic, meta: item.trigger, detail: item.question, tags: item.materials }));
    const supplement: ResourceResult[] = supplementalQuestions.filter((item) => item.riskDomain === domain).map((item) => ({ id: item.id, title: item.topic, meta: item.trigger, detail: item.question, tags: item.materials }));
    return [...base, ...supplement].filter((item) => includesQuery([item.title, item.meta, item.detail, item.tags], query));
  }, [domain, resourceType, query]);

  return (
    <section className="panel compliance-library" id="library">
      <div className="section-title compact"><div><p className="eyebrow">规则与尽调支持</p><h2>R1—R5资料库</h2></div><span>查询规则、公开披露和所需材料</span></div>
      <div className="library-toolbar">
        <div className="library-tabs" aria-label="风险域">{(['R1', 'R2', 'R3', 'R4', 'R5'] as Domain[]).map((item) => <button className={domain === item ? 'active' : ''} type="button" key={item} onClick={() => setDomain(item)}>{item}</button>)}</div>
        <div className="library-tabs" aria-label="资料类型">{(['规则依据', '公开证据', '尽调问题'] as ResourceType[]).map((item) => <button className={resourceType === item ? 'active' : ''} type="button" key={item} onClick={() => setResourceType(item)}>{item}</button>)}</div>
        <label className="library-search"><span>检索</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入规则、企业或材料名称" /></label>
      </div>
      <div className="library-results">
        {results.slice(0, 12).map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.meta}</span></div><p>{item.detail}</p><div className="library-tags">{item.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div>{item.boundary && <small>使用边界：{item.boundary}</small>}{item.url && <a href={item.url} target="_blank" rel="noreferrer">查看原文</a>}</article>)}
        {!results.length && <p className="empty-analysis">未找到匹配资料。</p>}
      </div>
    </section>
  );
}
