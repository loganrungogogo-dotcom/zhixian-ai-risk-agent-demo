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
    keywords: ['算法', '模型', '芯片', '晶片', '算力', '性能', '效能', '准确率', '準確率', '可靠性', '测试', '測試', '认证', '認證', '技术路线', '技術路線', '研发', '研發', '流片', '良率'],
    actualPhrases: ['测试失败', '測試失敗', '认证未通过', '認證未通過', '产品召回', '產品召回', '研发失败', '研發失敗', '流片失败', '重大技术事故', '重大技術事故'],
    exposurePhrases: ['技术迭代风险', '技術迭代風險', '研发风险', '研發風險', '性能不及预期', '性能不及預期', '依赖单一技术', '依賴單一技術', '算力受限', '研发投入较大', '研發投入較大', '尚未完成认证', '尚未完成認證', '存在不确定性', '存在不確定性'],
    governancePhrases: ['建立研发体系', '建立研發體系', '通过认证', '通過認證', '质量管理体系', '質量管理體系', '可靠性测试', '可靠性測試', '持续研发', '持續研發', '技术储备', '技術儲備'],
    whyItMatters: '技术成熟度、可靠性和资源可获得性会直接影响产品验证、交付和持续经营。',
    verificationNeeded: '需结合测试原始记录、认证证书、产品故障和替代路线验证披露是否持续有效。',
    missingEvidence: ['核心产品测试与验收记录', '关键性能对标与失效记录', '芯片、算力或基础模型替代方案'],
  },
  R2: {
    title: '数据安全与合规',
    keywords: ['数据安全', '數據安全', '个人信息', '個人信息', '個人資料', '隐私', '隱私', '授权', '授權', '备案', '備案', '安全评估', '安全評估', '数据出境', '數據出境', '分类分级', '分類分級', '访问控制', '訪問控制', '脱敏', '脫敏', '加密', '日志', '日誌', '训练数据', '訓練數據'],
    actualPhrases: ['发生数据泄露', '發生數據洩露', '数据安全事件', '數據安全事件', '受到行政处罚', '受到行政處罰', '责令整改', '責令整改', '监管通报', '監管通報', '未履行备案', '未履行備案', '未经授权处理', '未經授權處理'],
    exposurePhrases: ['数据合规风险', '數據合規風險', '隐私风险', '隱私風險', '授权不完整', '授權不完整', '可能面临处罚', '可能面臨處罰', '存在泄露风险', '存在洩露風險', '数据来源不明确', '數據來源不明確', '跨境传输风险', '跨境傳輸風險'],
    governancePhrases: ['严格遵守', '嚴格遵守', '建立数据安全', '建立數據安全', '采取多项措施', '採取多項措施', '访问控制', '訪問控制', '加密存储', '加密存儲', '日志审计', '日誌審計', '通过等保', '通過等保', '保护客户隐私', '保護客戶隱私'],
    whyItMatters: '数据来源、处理合法性和控制有效性决定产品能否进入金融等高敏感场景。',
    verificationNeeded: '企业制度或自述不能替代执行证据，需核验数据清单、授权链、日志、审计和事件台账。',
    missingEvidence: ['训练与业务数据资产清单', '数据来源及授权链证明', '访问日志、合规审计与安全事件台账'],
  },
  R3: {
    title: '知识产权与科技伦理',
    keywords: ['知识产权', '知識產權', '专利', '專利', '著作权', '著作權', '版权', '版權', '开源', '開源', '商业秘密', '商業秘密', '职务成果', '職務成果', '伦理', '倫理', '侵权', '侵權', '许可', '許可', '源代码', '源代碼', '诉讼', '訴訟'],
    actualPhrases: ['被诉侵权', '被訴侵權', '判决侵权', '判決侵權', '专利被宣告无效', '專利被宣告無效', '著作权纠纷', '著作權糾紛', '许可终止', '許可終止', '商业秘密纠纷', '商業秘密糾紛'],
    exposurePhrases: ['知识产权风险', '知識產權風險', '侵权风险', '侵權風險', '权属不清', '權屬不清', '许可限制', '許可限制', '开源合规风险', '開源合規風險', '伦理风险', '倫理風險', '存在争议', '存在爭議'],
    governancePhrases: ['知识产权管理', '知識產權管理', '专利布局', '專利佈局', '商业秘密保护', '商業秘密保護', '伦理审查', '倫理審查', '开源管理', '開源管理', '签署保密协议', '簽署保密協議'],
    whyItMatters: '核心技术权属、许可范围和伦理治理会影响技术壁垒、产品销售及责任承担。',
    verificationNeeded: '需核验核心代码权属、合作研发协议、开源清单、FTO分析和伦理审查记录。',
    missingEvidence: ['核心代码与职务成果权属链', '开源软件、模型和数据集清单', '自由实施分析及科技伦理审查记录'],
  },
  R4: {
    title: '融资与商业化',
    keywords: ['融资', '融資', '收入', '订单', '訂單', '合同', '合约', '合約', '客户集中', '客戶集中', '应收账款', '應收賬款', '應收帳款', '回款', '现金流', '現金流', '亏损', '虧損', '毛利率', '续航', '續航', '盈利', '减值', '減值'],
    actualPhrases: ['已终止合同', '合同已终止', '客户终止合作', '客戶終止合作', '债务违约', '債務違約', '已逾期未偿还', '已逾期未償還', '被申请破产', '被申請破產', '被强制执行', '被強制執行'],
    exposurePhrases: ['持续亏损', '持續虧損', '未弥补亏损', '未彌補虧損', '现金流为负', '現金流為負', '应收账款逾期', '應收賬款逾期', '计提减值', '計提減值', '客户集中风险', '客戶集中風險', '回款风险', '回款風險', '流动性风险', '流動性風險', '尚未盈利', '毛利率下降', '收入下降', '应收账款增加', '應收賬款增加', '经营现金流下降', '經營現金流下降'],
    governancePhrases: ['收入增长', '收入增長', '在手订单', '在手訂單', '加强回款', '加強回款', '优化客户结构', '優化客戶結構', '现金流管理', '現金流管理'],
    whyItMatters: '订单质量、验收回款和融资续航决定技术投入能否转化为可持续现金流。',
    verificationNeeded: '需穿透核验合同、验收、回款、账龄、客户集中度和未来十二个月资金安排。',
    missingEvidence: ['订单—合同—验收—回款勾稽表', '应收账款账龄与期后回款', '未来十二个月现金流及融资安排'],
  },
  R5: {
    title: '组织生态与外部环境',
    keywords: ['供应商', '供應商', '供应链', '供應鏈', '实体清单', '實體清單', '出口管制', '制裁', '地缘政治', '地緣政治', '公司治理', '治理结构', '治理結構', '核心人员', '核心人員', '离职', '離職', '关联交易', '關聯交易', '重大诉讼', '重大訴訟', '监管处罚', '監管處罰', 'Fabless'],
    actualPhrases: ['被列入实体清单', '被列入實體清單', '已被列入实体清单', '已被列入實體清單', '受到出口管制', '受到監管處罰', '受到监管处罚', '核心人员离职', '核心人員離職', '发生重大诉讼', '發生重大訴訟', '供应中断', '供應中斷', '暂停合作', '暫停合作'],
    exposurePhrases: ['供应链稳定风险', '供應鏈穩定風險', '供应商集中', '供應商集中', '替代成本', '地缘政治风险', '地緣政治風險', '外部限制', '可能中断', '可能中斷', '存在重大不确定性', '存在重大不確定性'],
    governancePhrases: ['公司治理', '供应商管理', '供應商管理', '建立替代方案', '人才激励', '人才激勵', '内部控制', '內部控制'],
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
const negativePrefixes = ['未发生', '未發生', '不存在', '无重大', '無重大', '未受到', '未被', '没有发生', '沒有發生'];
const conditionalPrefixes = ['若', '如果', '倘若', '倘', '一旦', '可能', '或会', '或將', '假设', '假設'];
const companyAliases: Record<string, string[]> = {
  科大讯飞: ['科大讯飞', '科大訊飛'], 商汤集团: ['商汤集团', '商湯集團', '商湯'], 云从科技: ['云从科技', '雲從科技'],
  第四范式: ['第四范式', '第四範式'], 创新奇智: ['创新奇智', '創新奇智'], 医渡科技: ['医渡科技', '醫渡科技'],
  百融云创: ['百融云创', '百融雲創'], 寒武纪: ['寒武纪', '寒武紀'], 地平线: ['地平线', '地平線'],
  黑芝麻智能: ['黑芝麻智能'], 速腾聚创: ['速腾聚创', '速騰聚創'], 优必选: ['优必选', '優必選'],
};

function normalizeText(value: string) {
  return value.replace(/\u0000/g, ' ').replace(/[ \t\f\v]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function parsePages(value: string) {
  const text = normalizeText(value);
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

function hasRealizedPhrase(text: string, phrases: string[]) {
  return phrases.some((phrase) => {
    const index = text.indexOf(phrase);
    if (index < 0 || isNegated(text, phrase)) return false;
    const prefix = text.slice(Math.max(0, index - 160), index);
    return !conditionalPrefixes.some((marker) => prefix.includes(marker));
  });
}

function includesCompany(text: string, company: string) {
  return (companyAliases[company] || [company]).some((alias) => text.includes(alias));
}

function evidenceStatus(text: string, rule: DomainRule, riskDomain: RiskDomain): Pick<EvidenceItem, 'status' | 'evidenceNature'> {
  const boilerplate = riskDomain === 'R4' && /会计处理|會計處理|合同变更|合同變更|金融工具|预期信用损失|預期信用損失|会计政策|會計政策/.test(text)
    || riskDomain === 'R5' && /□适用|√不适用|□適用|√不適用|审计费用|審計費用|面临退市风险|面臨退市風險/.test(text);
  if (!boilerplate && hasRealizedPhrase(text, rule.actualPhrases)) return { status: '实际事件', evidenceNature: '已发生事实披露' };
  if (hasPhrase(text, rule.exposurePhrases)) return { status: '风险暴露', evidenceNature: '风险暴露披露' };
  if (hasPhrase(text, rule.governancePhrases) || text.includes('公司严格') || text.includes('公司建立')) return { status: '潜在信号', evidenceNature: '企业治理自述' };
  return { status: '潜在信号', evidenceNature: '主题相关披露' };
}

function excludedContext(riskDomain: RiskDomain, text: string, matchedKeywords: string[]) {
  if (riskDomain === 'R2' && matchedKeywords.length === 1 && matchedKeywords[0] === '授权') {
    const dataAuthorizationContext = /数据.{0,16}授权|授权.{0,16}数据|个人信息|隐私|训练样本|用户同意|合法来源|授权链|未经授权/.test(text);
    if (!dataAuthorizationContext) return true;
  }
  if (riskDomain === 'R2' && matchedKeywords.every((keyword) => keyword === '授权' || keyword === '授權')) {
    const dataAuthorizationContext = /数据.{0,16}授权|數據.{0,16}授權|授权.{0,16}数据|授權.{0,16}數據|个人信息|個人信息|個人資料|隐私|隱私|训练样本|訓練樣本|用户同意|用戶同意|合法来源|合法來源|授权链|授權鏈|未经授权|未經授權/.test(text);
    if (!dataAuthorizationContext) return true;
  }
  if (riskDomain === 'R3' && matchedKeywords.length === 1 && matchedKeywords[0] === '诉讼' && /诉讼服务|诉讼信息|诉讼案件|法院|庭审|法官|书记员/.test(text)) return true;
  if (riskDomain === 'R3' && matchedKeywords.every((keyword) => ['许可', '許可'].includes(keyword)) && !/知识产权|知識產權|专利|專利|著作权|著作權|版权|版權|软件|軟件|模型|数据集|數據集|开源|開源/.test(text)) return true;
  if ((riskDomain === 'R3' || riskDomain === 'R5') && /无重大诉讼|無重大訴訟|并无牵涉任何重大诉讼|並無牽涉任何重大訴訟/.test(text)) return true;
  if (riskDomain === 'R4' && /□适用\s*√不适用|□適用\s*√不適用/.test(text) && /减值|減值|亏损|虧損|逾期/.test(text)) return true;
  if (riskDomain === 'R5' && /□适用|√不适用|□適用|√不適用/.test(text) && /退市|訴訟|诉讼|处罚|處罰/.test(text)) return true;
  return false;
}

function isMeaningfulCandidate(riskDomain: RiskDomain, text: string, matchedKeywords: string[], rule: DomainRule) {
  if (hasPhrase(text, [...rule.actualPhrases, ...rule.exposurePhrases, ...rule.governancePhrases])) return true;
  if (matchedKeywords.length >= 2) return true;
  if (riskDomain === 'R2') return matchedKeywords.some((keyword) => ['数据安全', '數據安全', '个人信息', '個人信息', '個人資料', '隐私', '隱私', '数据出境', '數據出境', '训练数据', '訓練數據'].includes(keyword));
  if (riskDomain === 'R3') return matchedKeywords.some((keyword) => ['知识产权', '知識產權', '侵权', '侵權', '商业秘密', '商業秘密', '伦理', '倫理', '开源', '開源'].includes(keyword));
  return false;
}

function evidenceQuality(item: EvidenceItem) {
  const riskCues = ['风险', '風險', '下降', '减少', '減少', '亏损', '虧損', '逾期', '集中', '依赖', '依賴', '中断', '中斷', '终止', '終止', '暂停合作', '暫停合作', '处罚', '處罰', '整改', '诉讼', '訴訟', '泄露', '洩露', '限制', '不确定', '不確定'];
  return item.matchedKeywords.length * 3 + riskCues.filter((cue) => item.excerpt.includes(cue)).length * 2;
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
  return '当前材料未形成可定位证据，请上传可检索原文、OCR文本或指定原文页码。';
}

export function analyzeMaterial(input: { text: string; channel: string; parserStatus: string; company?: string }) {
  const pages = parsePages(input.text);
  const extractedCharacters = pages.reduce((sum, page) => sum + page.text.length, 0);
  const normalizedSource = pages.map((page) => page.text).join(' ');
  const relevanceSignals = ['人工智能', '算法模型', '大模型', '数据安全', '个人信息', '训练数据', '芯片', '算力', '智能驾驶', '机器人', '知识产权', '经营现金流', '应收账款', '供应链', '出口管制'];
  const relevanceHits = relevanceSignals.filter((signal) => normalizedSource.includes(signal));
  const selectedCompanyFound = Boolean(input.company && includesCompany(normalizedSource, input.company));
  const materialRelevance = selectedCompanyFound
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
        if (!isMeaningfulCandidate(riskDomain, unit, matchedKeywords, rule)) continue;
        const classification = evidenceStatus(unit, rule, riskDomain);
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
      .sort((left, right) => statusRank[right.status] - statusRank[left.status] || evidenceQuality(right) - evidenceQuality(left) || (left.page ?? 9999) - (right.page ?? 9999))
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
    relevanceBasis: materialRelevance === '相关' ? '正文包含企业主体名称。' : materialRelevance === '需核验' ? `正文命中${relevanceHits.slice(0, 4).join('、') || input.channel}等主题，需要结合文件名和封面确认企业归属。` : '正文未形成足够的人工智能科创企业或风险治理主题证据，暂不纳入企业级画像。',
    parserStatus: input.parserStatus,
    extractedCharacters,
    summary: extractedCharacters
      ? `已按页分析${extractedCharacters.toLocaleString('zh-CN')}个字符，形成${findings.length}个风险域判断：实际事件${eventCount}项、风险暴露${exposureCount}项，其余为主题线索。每项均保留原文位置、判断依据和具体后续任务。`
      : '材料已接收，但未取得可检索正文；当前只建立材料记录，并提示上传OCR文本或指定原文页码。',
    findings,
    questions,
    policies,
    evidenceBoundary: '系统负责材料提取、证据定位、规则匹配和任务建议；事实确认、风险定性以及授信、投资或保险决策必须由有权限人员完成。',
  };
}
