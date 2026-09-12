import { getCompanyProfile, type LifecycleStage } from '@/lib/company-profiles';
import type { Finding, RiskDomain, EvidenceStatus } from '@/lib/risk-analysis';

export type MaterialAnalysisRecord = {
  id: string;
  company: string;
  file_name: string;
  period: string;
  review_status: string;
  analysis: { findings?: Finding[]; materialRelevance?: string };
};

const rank: Record<EvidenceStatus, number> = { '需核验': 0, '潜在信号': 1, '风险暴露': 2, '实际事件': 3 };
const domainNames: Record<RiskDomain, string> = { R1: '技术与算法', R2: '数据安全与合规', R3: '知识产权与科技伦理', R4: '融资与商业化', R5: '组织生态与外部环境' };

const transmissionRules = [
  { id: 'C01', domains: ['R1', 'R5'], title: '关键技术与供应链限制', path: ['技术或关键资源依赖', '供应链限制', '研发／交付受阻', '客户项目延期', '收入与现金流承压'], blocker: '供应链映射、库存边界、替代供应商和客户交付重排' },
  { id: 'C02', domains: ['R2'], title: '数据授权与合规阻断', path: ['授权链或处理依据不足', '整改／处罚风险', '产品暂停或客户审查', '商业化受阻', '收入与融资受影响'], blocker: '补齐授权链、分类分级、供应商审查和整改复核' },
  { id: 'C03', domains: ['R3'], title: '核心知识产权权属风险', path: ['权属或许可瑕疵', '诉讼／无效／许可终止', '产品使用受限', '客户与投资机构重估', '融资条件变化'], blocker: '确权、许可补充、FTO检索、法律意见和争议安排' },
  { id: 'C04', domains: ['R1', 'R4'], title: '研发投入与成果转化', path: ['研发投入持续', '产品转化或认证不足', '现金持续消耗', '融资依赖提高', '授信与估值承压'], blocker: '研发里程碑、认证、客户验证、现金流预测和融资备选' },
  { id: 'C05', domains: ['R4'], title: '客户集中与回款波动', path: ['客户或项目集中', '延期／流失／验收滞后', '收入和现金流冲击', '研发投入受限', '竞争地位弱化'], blocker: '续约、验收、回款监测、客户分散和现金缓冲' },
  { id: 'C07', domains: ['R1', 'R2'], title: '算法治理与责任风险', path: ['模型治理证据不足', '客户验收或监管不确定', '产品整改／暂停', '交付延期与责任风险', '收入和声誉受影响'], blocker: '算法备案、安全评估、人工复核、模型日志和投诉闭环' },
];

const reductionRules: Record<RiskDomain, { risk: string; companyAction: string; institutionAction: string; transfer: string; reviewCycle: string }> = {
  R1: { risk: '技术、产品认证或关键资源依赖', companyAction: '建立关键技术清单、验证里程碑、替代路线和产品质量闭环。', institutionAction: '银行设置里程碑提款；投资跟踪技术验证；保险核验产品责任控制。', transfer: '产品责任、质量保证或供应链中断相关安排', reviewCycle: '重大版本或外部限制后立即复查，正常每季度' },
  R2: { risk: '数据授权、个人信息和算法合规', companyAction: '补齐授权链、分类分级、访问日志、第三方数据准入和整改复核。', institutionAction: '将合规证明作为准入或提款条件，整改完成后再评价风险。', transfer: '网络安全险、数据安全责任相关安排', reviewCycle: '整改完成后复查，高敏业务每半年' },
  R3: { risk: '核心知识产权权属与科技伦理', companyAction: '完成确权、许可补充、开源清单、FTO和伦理审查。', institutionAction: '投资设置交割前置条件；银行审慎接受IP增信；保险核验责任边界。', transfer: '知识产权侵权责任及合同赔偿责任安排', reviewCycle: '争议节点即时复查，正常每半年' },
  R4: { risk: '收入质量、回款和资本续航', companyAction: '建立订单—验收—回款台账、客户信用分层和滚动现金流预测。', institutionAction: '银行设置回款监管和贷后预警；投资采用里程碑拨款。', transfer: '贸易信用、履约保证或应收账款风险控制安排', reviewCycle: '重点项目按月，常规每季度' },
  R5: { risk: '供应链、外部限制和组织韧性', companyAction: '建立关键物项、二供、库存安全边界、核心人员和应急交付方案。', institutionAction: '银行监测连续经营；投资核验替代路线；保险评估供应链中断暴露。', transfer: '供应链中断、关键人员或经营中断相关安排', reviewCycle: '重大外部事件后立即，正常每季度' },
};

export function buildEnterpriseProfile(company: string, records: MaterialAnalysisRecord[]) {
  const registry = getCompanyProfile(company);
  const eligibleRecords = records.filter((record) => record.analysis.materialRelevance === '相关' || record.analysis.materialRelevance === '需核验');
  const domains = (Object.keys(domainNames) as RiskDomain[]).map((riskDomain) => {
    const sourceFindings = eligibleRecords.flatMap((record) => (record.analysis.findings || [])
      .filter((finding) => finding.riskDomain === riskDomain)
      .map((finding) => ({ ...finding, materialId: record.id, fileName: record.file_name, period: record.period, reviewStatus: record.review_status })));
    let status = sourceFindings.reduce<EvidenceStatus>((current, finding) => rank[finding.status] > rank[current] ? finding.status : current, '需核验');
    const registrySignal = registrySignalFor(riskDomain, registry?.publicIndicators || '', registry?.publicExposure || '');
    if (registrySignal && rank[status] < rank['风险暴露']) status = '风险暴露';
    const evidenceCount = sourceFindings.reduce((sum, finding) => sum + (finding.evidenceItems?.length || finding.evidence.length), 0);
    return {
      riskDomain,
      title: domainNames[riskDomain],
      status,
      evidenceCount,
      materialCount: new Set(sourceFindings.map((item) => item.materialId)).size,
      confirmedCount: sourceFindings.filter((item) => item.reviewStatus === '已人工复核').length,
      findings: sourceFindings,
      registrySignal,
      missingEvidence: [...new Set(sourceFindings.flatMap((item) => item.missingEvidence || []))].slice(0, 4),
    };
  });
  const activeDomains = domains.filter((item) => item.status !== '需核验').map((item) => item.riskDomain);
  const transmissions = transmissionRules.filter((rule) => rule.domains.some((domain) => activeDomains.includes(domain as RiskDomain))).slice(0, 4);
  const reductions = domains.filter((item) => item.status !== '需核验').map((item) => ({ riskDomain: item.riskDomain, status: item.status, ...reductionRules[item.riskDomain] }));
  const lifecycle: LifecycleStage = registry?.lifecycle || inferLifecycle(records);
  return {
    company,
    lifecycle,
    lifecycleBasis: registry ? `研究数据库公开画像（${registry.dataYear}口径），需结合新增材料人工确认。` : '根据材料中的产品、收入、客户、量产和融资线索形成候选阶段，需人工确认。',
    registry,
    materials: eligibleRecords.length,
    excludedMaterials: records.length - eligibleRecords.length,
    reviewedMaterials: eligibleRecords.filter((item) => item.review_status === '已人工复核').length,
    domains,
    transmissions,
    reductions,
    evidenceBoundary: '企业画像汇总不同材料中的证据状态，不进行综合评分；同一风险域以证据等级较高者提示，但最终状态以人工复核为准。',
  };
}

function registrySignalFor(riskDomain: RiskDomain, indicators: string, exposure: string) {
  if (riskDomain === 'R4') {
    const cashFlow = indicators.match(/经营现金流\/收入=?(-?[\d.]+)%/);
    const receivableDays = indicators.match(/应收账款周转天数=?([\d.]+)/);
    const lossRate = indicators.match(/净亏损率=?([\d.]+)%/);
    const signals: string[] = [];
    if (cashFlow && Number(cashFlow[1]) < 0) signals.push(`经营现金流／收入为${cashFlow[1]}%，需结合趋势、回款和资金安排核验`);
    if (receivableDays && Number(receivableDays[1]) > 180) signals.push(`应收账款周转天数为${receivableDays[1]}天，需结合行业可比、账龄和期后回款核验`);
    if (lossRate && Number(lossRate[1]) > 0) signals.push(`净亏损率为${lossRate[1]}%，需结合生命周期和资金续航联合判断`);
    return signals.join('；');
  }
  if (riskDomain === 'R5' && /明确风险暴露|外部限制暴露/.test(exposure)) return '公开资料显示存在外部限制暴露，需核验限制范围、替代方案及对研发、交付和回款的实际影响';
  return '';
}

function inferLifecycle(records: MaterialAnalysisRecord[]): LifecycleStage {
  const text = JSON.stringify(records.map((item) => item.analysis));
  if (/规模化|量产|上市|年报|大规模交付/.test(text)) return '规模成长期';
  if (/收入增长|市场拓展|客户扩张|订单增长/.test(text)) return '市场扩张期';
  if (/试点|验证|认证|小规模/.test(text)) return '产品验证期';
  return '研发初创期';
}
