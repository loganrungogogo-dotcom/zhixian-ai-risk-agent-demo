import dueDiligenceLibrary from '@/data/r2_r3/due-diligence-library.json';
import policyLibrary from '@/data/r2_r3/policy-library.json';

export type RiskDomain = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
export type EvidenceStatus = '实际事件' | '风险暴露' | '潜在信号' | '需核验';

export type EvidenceItem = {
  id: string;
  page: number | null;
  excerpt: string;
  matchedKeywords: string[];
  status: EvidenceStatus;
  evidenceNature: '已发生事实披露' | '风险暴露披露' | '企业治理自述' | '主题相关披露';
  ruleBasis: string;
  whyItMatters: string;
  verificationNeeded: string;
};

export type Finding = {
  riskDomain: RiskDomain;
  title: string;
  status: EvidenceStatus;
  conclusion: string;
  matchedKeywords: string[];
  evidence: string[];
  evidenceItems: EvidenceItem[];
  missingEvidence: string[];
  policyIds: string[];
  boundary: string;
};

type DomainRule = {
  title: string;
  keywords: string[];
  actualPhrases: string[];
  exposurePhrases: string[];
  governancePhrases: string[];
  whyItMatters: string;
  verificationNeeded: string;
  missingEvidence: string[];
};

const domainRules: Record<RiskDomain, DomainRule> = {
  R1: {
    title: '技术与算法',
    keywords: ['算法', '模型', '芯片', '算力', '性能', '准确率', '可靠性', '测试', '认证', '技术路线', '研发', '流片', '良率'],
    actualPhrases: ['测试失败', '认证未通过', '产品召回', '研发失败', '流片失败', '重大技术事故'],
    exposurePhrases: ['技术迭代风险', '研发风险', '性能不及预期', '依赖单一技术', '算力受限', '研发投入较大', '尚未完成认证', '存在不确定性'],
    governancePhrases: ['建立研发体系', '通过认证', '质量管理体系', '可靠性测试', '持续研发', '技术储备'],
    whyItMatters: '技术成熟度、可靠性和资源可获得性会直接影响产品验证、交付和持续经营。',
    verificationNeeded: '需结合测试原始记录、认证证书、产品故障和替代路线验证披露是否持续有效。',
    missingEvidence: ['核心产品测试与验收记录', '关键性能对标与失效记录', '芯片、算力或基础模型替代方案'],
  },
  R2: {
    title: '数据安全与合规',
    keywords: ['数据安全', '个人信息', '隐私', '授权', '备案', '安全评估', '数据出境', '分类分级', '访问控制', '脱敏', '加密', '日志', '训练数据'],
    actualPhrases: ['发生数据泄露', '数据安全事件', '行政处罚', '责令整改', '监管通报', '未履行备案', '未经授权处理'],
    exposurePhrases: ['数据合规风险', '隐私风险', '授权不完整', '可能面临处罚', '存在泄露风险', '数据来源不明确', '跨境传输风险'],
    governancePhrases: ['严格遵守', '建立数据安全', '采取多项措施', '访问控制', '加密存储', '日志审计', '通过等保', '保护客户隐私'],
    whyItMatters: '数据来源、处理合法性和控制有效性决定产品能否进入金融等高敏感场景。',
    verificationNeeded: '企业制度或自述不能替代执行证据，需核验数据清单、授权链、日志、审计和事件台账。',
    missingEvidence: ['训练与业务数据资产清单', '数据来源及授权链证明', '访问日志、合规审计与安全事件台账'],
  },
  R3: {
    title: '知识产权与科技伦理',
    keywords: ['知识产权', '专利', '著作权', '版权', '开源', '商业秘密', '职务成果', '伦理', '侵权', '许可', '源代码', '诉讼'],
    actualPhrases: ['侵权诉讼', '判决侵权', '专利无效', '著作权纠纷', '许可终止', '被诉侵权', '商业秘密纠纷'],
    exposurePhrases: ['知识产权风险', '侵权风险', '权属不清', '许可限制', '开源合规风险', '伦理风险', '存在争议'],
    governancePhrases: ['知识产权管理', '专利布局', '商业秘密保护', '伦理审查', '开源管理', '签署保密协议'],
    whyItMatters: '核心技术权属、许可范围和伦理治理会影响技术壁垒、产品销售及责任承担。',
    verificationNeeded: '需核验核心代码权属、合作研发协议、开源清单、FTO分析和伦理审查记录。',
    missingEvidence: ['核心代码与职务成果权属链', '开源软件、模型和数据集清单', '自由实施分析及科技伦理审查记录'],
  },
  R4: {
    title: '融资与商业化',
    keywords: ['融资', '收入', '订单', '合同', '客户集中', '应收账款', '回款', '现金流', '亏损', '毛利率', '续航', '盈利', '减值'],
    actualPhrases: ['合同终止', '客户流失', '无法偿还', '债务违约', '被申请破产', '被强制执行'],
    exposurePhrases: ['持续亏损', '未弥补亏损', '现金流为负', '应收账款逾期', '计提减值', '客户集中风险', '回款风险', '流动性风险', '尚未盈利', '毛利率下降', '收入下降', '应收账款增加', '经营现金流下降'],
    governancePhrases: ['收入增长', '在手订单', '加强回款', '优化客户结构', '现金流管理'],
    whyItMatters: '订单质量、验收回款和融资续航决定技术投入能否转化为可持续现金流。',
    verificationNeeded: '需穿透核验合同、验收、回款、账龄、客户集中度和未来十二个月资金安排。',
    missingEvidence: ['订单—合同—验收—回款勾稽表', '应收账款账龄与期后回款', '未来十二个月现金流及融资安排'],
  },
  R5: {
    title: '组织生态与外部环境',
    keywords: ['供应商', '供应链', '实体清单', '出口管制', '制裁', '地缘政治', '公司治理', '治理结构', '核心人员', '离职', '关联交易', '重大诉讼', '监管处罚', 'Fabless'],
    actualPhrases: ['被列入实体清单', '被列入美国实体清单', '列入美国实体清单', '已被列入实体清单', '受到出口管制', '监管处罚', '核心人员离职', '重大诉讼', '供应中断'],
    exposurePhrases: ['供应链稳定风险', '供应商集中', '替代成本', '地缘政治风险', '外部限制', '可能中断', '存在重大不确定性'],
    governancePhrases: ['公司治理', '供应商管理', '建立替代方案', '人才激励', '内部控制'],
    whyItMatters: '外部限制、关键供应商和核心团队变化可能沿技术、交付、回款和融资链条放大。',
    verificationNeeded: '需核验受限范围、供应商替代进度、库存覆盖、核心团队稳定性及实际经营影响。',
    missingEvidence: ['关键供应商与替代方案清单', '外部限制适用范围及影响评估', '核心人员、关联交易和重大争议台账'],
  },
};

const fallbackQuestions: Record<RiskDomain, Array<{ id: string; topic: string; question: string }>> = {
  R1: [
    { id: 'R1-DD-001', topic: '技术验证', question: '请提供核心产品最近两年的测试、认证、故障和客户验收记录，并说明关键性能指标与竞品或客户要求的差距。' },
    { id: 'R1-DD-002', topic: '关键资源替代', question: '请列示芯片、算力、基础模型和关键开发工具的依赖程度、切换成本及已验证替代方案。' },
  ],
  R2: [],
  R3: [],
  R4: [
    { id: 'R4-DD-001', topic: '商业化质量', question: '请提供订单、合同、交付、验收、开票和回款的逐项勾稽表，并说明重大差异。' },
    { id: 'R4-DD-002', topic: '资金续航', question: '请提供未来十二个月滚动现金流预测、融资计划及压力情景下的资金缺口应对方案。' },
  ],
  R5: [
    { id: 'R5-DD-001', topic: '供应链韧性', question: '请列示关键供应商、采购占比、库存覆盖周期、替代认证进度和切换成本。' },
    { id: 'R5-DD-002', topic: '外部限制影响', question: '请说明外部清单、出口管制或地缘变化对采购、研发、销售、交付和回款的实际影响及应对记录。' },
  ],
};

const statusRank: Record<EvidenceStatus, number> = { '需核验': 0, '潜在信号': 1, '风险暴露': 2, '实际事件': 3 };
const negativePrefixes = ['未发生', '不存在', '无重大', '未受到', '未被', '没有发生'];

function normalizeText(value: string) {
  return value.replace(/\u0000/g, ' ').replace(/[ \t\f\v]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function parsePages(value: string) {
  const text = normalizeText(value).slice(0, 120_000);
  const matches = [...text.matchAll(/\[PAGE:(\d+)]\s*/g)];
  if (!matches.length) return [{ page: null as number | null, text: text.replace(/\s+/g, ' ') }];
  return matches.map((match, index) => ({
    page: Number(match[1]),
    text: text.slice((match.index || 0) + match[0].length, matches[index + 1]?.index ?? text.length).replace(/\s+/g, ' ').trim(),
  }));
}

function splitUnits(text: string) {
  const sentences = text.split(/(?<=[。！？；])/).map((item) => item.trim()).filter((item) => item.length >= 12);
  const units: string[] = [];
  for (const sentence of sentences.length ? sentences : [text]) {
    if (sentence.length <= 520) {
      units.push(sentence);
      continue;
    }
    for (let start = 0; start < sentence.length; start += 400) units.push(sentence.slice(start, start + 520));
  }
  return units;
}

function isNegated(text: string, phrase: string) {
  const index = text.indexOf(phrase);
  if (index < 0) return false;
  const prefix = text.slice(Math.max(0, index - 14), index + phrase.length);
  return negativePrefixes.some((negative) => prefix.includes(negative));
}

function hasPhrase(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase) && !isNegated(text, phrase));
}

function evidenceStatus(text: string, rule: DomainRule): Pick<EvidenceItem, 'status' | 'evidenceNature'> {
  if (hasPhrase(text, rule.actualPhrases)) return { status: '实际事件', evidenceNature: '已发生事实披露' };
  if (hasPhrase(text, rule.exposurePhrases)) return { status: '风险暴露', evidenceNature: '风险暴露披露' };
  if (hasPhrase(text, rule.governancePhrases) || text.includes('公司严格') || text.includes('公司建立')) return { status: '潜在信号', evidenceNature: '企业治理自述' };
  return { status: '潜在信号', evidenceNature: '主题相关披露' };
}

function excludedContext(riskDomain: RiskDomain, text: string, matchedKeywords: string[]) {
  if (riskDomain === 'R2' && matchedKeywords.length === 1 && matchedKeywords[0] === '授权') {
    const dataAuthorizationContext = /数据.{0,16}授权|授权.{0,16}数据|个人信息|隐私|训练样本|用户同意|合法来源|授权链|未经授权/.test(text);
    if (!dataAuthorizationContext) return true;
  }
  if (riskDomain === 'R3' && matchedKeywords.length === 1 && matchedKeywords[0] === '诉讼' && /诉讼服务|诉讼信息|诉讼案件|法院|庭审|法官|书记员/.test(text)) return true;
  return false;
}

function compactExcerpt(value: string) {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 420 ? `${text.slice(0, 420)}…` : text;
}

function evidenceFingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36);
}

function domainPolicies(riskDomain: RiskDomain) {
  return policyLibrary.filter((item) => item.riskDomains.includes(riskDomain)).slice(0, 3);
}

function conclusionFor(status: EvidenceStatus, count: number) {
  if (status === '实际事件') return `材料中定位到${count}处已发生事实披露；事实本身可进入复核，但影响范围和责任结论仍需核验。`;
  if (status === '风险暴露') return `材料中定位到${count}处风险暴露；可用于提出尽调问题，不能直接推定损失或违约已经发生。`;
  if (status === '潜在信号') return `材料中定位到${count}处主题相关或治理披露；企业自述不等同于控制有效。`;
  return '当前材料未形成可定位证据，仅能保留“需核验”并补充第二层材料。';
}

export function analyzeMaterial(input: { text: string; channel: string; parserStatus: string; company?: string }) {
  const pages = parsePages(input.text);
  const extractedCharacters = pages.reduce((sum, page) => sum + page.text.length, 0);
  const normalizedSource = pages.map((page) => page.text).join(' ');
  const relevanceSignals = ['人工智能', '算法模型', '大模型', '数据安全', '个人信息', '训练数据', '芯片', '算力', '智能驾驶', '机器人', '知识产权', '经营现金流', '应收账款', '供应链', '出口管制'];
  const relevanceHits = relevanceSignals.filter((signal) => normalizedSource.includes(signal));
  const materialRelevance = input.company && normalizedSource.includes(input.company)
    ? '相关'
    : relevanceHits.length >= 2 || input.channel === 'R2' || input.channel === 'R3'
      ? '需核验'
      : '不相关';
  const findings: Finding[] = [];

  for (const [riskDomain, rule] of Object.entries(domainRules) as Array<[RiskDomain, DomainRule]>) {
    const policies = domainPolicies(riskDomain);
    const candidates: EvidenceItem[] = [];
    for (const page of pages) {
      for (const unit of splitUnits(page.text)) {
        if (unit.includes('目录 第一节') || (unit.match(/\.{3,}/g) || []).length >= 3) continue;
        const matchedKeywords = rule.keywords.filter((keyword) => unit.includes(keyword));
        if (!matchedKeywords.length) continue;
        if (excludedContext(riskDomain, unit, matchedKeywords)) continue;
        const classification = evidenceStatus(unit, rule);
        const excerpt = compactExcerpt(unit);
        candidates.push({
          id: `${riskDomain}-${page.page ?? 'NA'}-${evidenceFingerprint(excerpt)}`,
          page: page.page,
          excerpt,
          matchedKeywords,
          ...classification,
          ruleBasis: policies[0]?.title || `${riskDomain}风险识别规则`,
          whyItMatters: rule.whyItMatters,
          verificationNeeded: rule.verificationNeeded,
        });
      }
    }
    const evidenceItems = candidates
      .sort((left, right) => statusRank[right.status] - statusRank[left.status] || (left.page ?? 9999) - (right.page ?? 9999))
      .filter((item, index, list) => list.findIndex((other) => other.page === item.page && other.excerpt === item.excerpt) === index)
      .slice(0, 8);
    const channelMatch = input.channel === riskDomain;
    if (!evidenceItems.length && !channelMatch) continue;
    const status = evidenceItems.reduce<EvidenceStatus>((current, item) => statusRank[item.status] > statusRank[current] ? item.status : current, '需核验');
    const statusEvidenceCount = evidenceItems.filter((item) => item.status === status).length;
    const matchedKeywords = [...new Set(evidenceItems.flatMap((item) => item.matchedKeywords))];
    findings.push({
      riskDomain,
      title: rule.title,
      status,
      conclusion: conclusionFor(status, statusEvidenceCount),
      matchedKeywords,
      evidence: evidenceItems.map((item) => `${item.page ? `第${item.page}页：` : ''}${item.excerpt}`).slice(0, 3),
      evidenceItems,
      missingEvidence: rule.missingEvidence,
      policyIds: policies.map((item) => item.id),
      boundary: '材料原文、事实状态、风险解释和金融决策必须分层表达；当前输出不构成违法、违约、侵权、损失或授信结论。',
    });
  }

  if (!findings.length) {
    const riskDomain: RiskDomain = input.channel === 'R2' || input.channel === 'R3' ? input.channel : 'R1';
    const rule = domainRules[riskDomain];
    findings.push({
      riskDomain,
      title: input.channel === 'R2' || input.channel === 'R3' ? rule.title : '待分类材料',
      status: '需核验',
      conclusion: conclusionFor('需核验', 0),
      matchedKeywords: [], evidence: [], evidenceItems: [], missingEvidence: rule.missingEvidence,
      policyIds: domainPolicies(riskDomain).map((item) => item.id),
      boundary: '当前未提取到足以定位风险域的正文，请补充可检索版本、OCR结果或由人工指定证据位置。',
    });
  }

  const matchedDomains = findings.map((item) => item.riskDomain);
  const questions = matchedDomains.flatMap((riskDomain) => {
    const library = dueDiligenceLibrary
      .filter((item) => item.riskDomain === riskDomain)
      .map((item) => ({ id: item.id, riskDomain, topic: item.topic, question: item.question, materials: item.materials }));
    const fallback = fallbackQuestions[riskDomain].map((item) => ({ ...item, riskDomain, materials: domainRules[riskDomain].missingEvidence }));
    return [...library, ...fallback].slice(0, riskDomain === 'R2' || riskDomain === 'R3' ? 3 : 2);
  });
  const policies = policyLibrary
    .filter((item) => item.riskDomains.some((domain) => matchedDomains.includes(domain as RiskDomain)))
    .slice(0, 10)
    .map((item) => ({ id: item.id, title: item.title, authority: item.authority, url: item.url, boundary: item.boundary }));
  const eventCount = findings.filter((item) => item.status === '实际事件').length;
  const exposureCount = findings.filter((item) => item.status === '风险暴露').length;

  return {
    version: '2.0',
    materialRelevance,
    relevanceBasis: materialRelevance === '相关' ? '正文包含企业主体名称。' : materialRelevance === '需核验' ? `正文命中${relevanceHits.slice(0, 4).join('、') || input.channel}等主题，仍需确认企业归属。` : '正文未形成足够的人工智能科创企业或风险治理主题证据，暂不纳入企业级画像。',
    parserStatus: input.parserStatus,
    extractedCharacters,
    summary: extractedCharacters
      ? `已按页分析${extractedCharacters.toLocaleString('zh-CN')}个字符，形成${findings.length}个风险域判断：实际事件${eventCount}项、风险暴露${exposureCount}项，其余为潜在信号或需核验。每项均保留原文位置、判断依据和待补材料。`
      : '材料已接收，但未取得可检索正文；当前只建立材料记录并生成补充核验任务。',
    findings,
    questions,
    policies,
    evidenceBoundary: 'Agent负责材料提取、证据定位、规则匹配和任务建议；事实确认、风险定性以及授信、投资或保险决策必须由有权限人员完成。',
  };
}
