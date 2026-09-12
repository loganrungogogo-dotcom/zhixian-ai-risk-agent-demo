export type LifecycleStage = '研发初创期' | '产品验证期' | '市场扩张期' | '规模成长期';

export type CompanyProfile = {
  company: string;
  lifecycle: LifecycleStage;
  dataYear: string;
  businessType: string;
  publicIndicators: string;
  publicExposure: string;
  dataGaps: string[];
};

export const companyProfiles: CompanyProfile[] = [
  { company: '科大讯飞', lifecycle: '规模成长期', dataYear: '2025', businessType: '综合人工智能与行业应用', publicIndicators: '净亏损率0.00%；经营现金流/收入11.84%；应收账款周转天数205.61', publicExposure: '公开资料显示涉及教育、政务、医疗、金融等强监管场景，并存在外部限制暴露。', dataGaps: ['数据授权链', '算法人工复核记录', '前五大客户与供应商集中度'] },
  { company: '商汤集团', lifecycle: '规模成长期', dataYear: '2025', businessType: '计算机视觉与生成式人工智能', publicIndicators: '净亏损率35.22%；经营现金流/收入-6.01%', publicExposure: '公开资料显示涉及智慧商业、智慧城市、智能汽车和生成式AI，并存在外部限制暴露。', dataGaps: ['应收账款周转天数', '数据来源合法性证明', '客户与供应商集中度'] },
  { company: '云从科技', lifecycle: '市场扩张期', dataYear: '待补充', businessType: '人机协同操作系统与行业AI', publicIndicators: '核心财务可比指标仍待公开资料补充', publicExposure: '公开资料显示涉及智慧金融、智慧治理和出行等强监管场景，并存在外部限制暴露。', dataGaps: ['净亏损率', '经营现金流/收入', '应收账款周转天数'] },
  { company: '第四范式', lifecycle: '规模成长期', dataYear: '2025', businessType: '企业级人工智能', publicIndicators: '净亏损率0.37%；经营现金流/收入-9.54%', publicExposure: '业务覆盖金融、能源、交通、运营商等企业AI场景。', dataGaps: ['应收账款周转天数', '算法人工复核记录', '客户与供应商集中度'] },
  { company: '创新奇智', lifecycle: '市场扩张期', dataYear: '待补充', businessType: '制造业与企业AI', publicIndicators: '核心财务可比指标仍待公开资料补充', publicExposure: '业务涉及制造、金融服务等行业场景。', dataGaps: ['净亏损率', '经营现金流/收入', '应收账款周转天数'] },
  { company: '医渡科技', lifecycle: '市场扩张期', dataYear: '2026', businessType: '医疗健康数据智能', publicIndicators: '净亏损率0.00%；经营现金流/收入-2.68%', publicExposure: '业务天然涉及医疗数据和强监管医疗场景。', dataGaps: ['应收账款周转天数', '数据授权链', '算法人工复核记录'] },
  { company: '百融云创', lifecycle: '规模成长期', dataYear: '2025', businessType: '金融行业智能分析与营销', publicIndicators: '净亏损率0.00%；经营现金流/收入3.13%', publicExposure: '业务天然涉及金融数据和强监管金融场景。', dataGaps: ['应收账款周转天数', '数据授权链', '客户集中度'] },
  { company: '寒武纪', lifecycle: '规模成长期', dataYear: '2025', businessType: '人工智能芯片与智能计算', publicIndicators: '净亏损率0.00%；经营现金流/收入-7.67%；应收账款周转天数27.02', publicExposure: '业务涉及关键芯片、智能计算生态和供应链连续性。', dataGaps: ['研发投入占比', '在手订单覆盖率', '供应商集中度'] },
  { company: '地平线', lifecycle: '市场扩张期', dataYear: '2025', businessType: '智能驾驶芯片与解决方案', publicIndicators: '净亏损率278.56%；经营现金流/收入-56.04%', publicExposure: '业务涉及汽车安全、车规认证和规模量产。', dataGaps: ['应收账款周转天数', '客户集中度', '供应商集中度'] },
  { company: '黑芝麻智能', lifecycle: '市场扩张期', dataYear: '2025', businessType: '智能驾驶芯片', publicIndicators: '净亏损率173.25%；经营现金流/收入-119.83%', publicExposure: '业务涉及汽车安全、车规认证、供应链和量产验证。', dataGaps: ['应收账款周转天数', '在手订单覆盖率', '供应商集中度'] },
  { company: '速腾聚创', lifecycle: '市场扩张期', dataYear: '2025', businessType: '激光雷达与机器人感知', publicIndicators: '净亏损率7.52%；经营现金流/收入-29.98%', publicExposure: '业务涉及汽车安全、产品可靠性和规模交付。', dataGaps: ['应收账款周转天数', '客户集中度', '供应商集中度'] },
  { company: '优必选', lifecycle: '市场扩张期', dataYear: '2025', businessType: '人形机器人与智能服务机器人', publicIndicators: '净亏损率35.14%；经营现金流/收入-39.19%', publicExposure: '业务涉及教育、公共服务、工业和人形机器人安全场景。', dataGaps: ['应收账款周转天数', '产品责任记录', '客户与供应商集中度'] },
];

export function getCompanyProfile(company: string) {
  return companyProfiles.find((item) => item.company === company) || null;
}
