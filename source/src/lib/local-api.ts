import { analyzeMaterial } from '@/lib/risk-analysis';
import { buildEnterpriseProfile } from '@/lib/enterprise-analysis';
import { companyProfiles } from '@/lib/company-profiles';

const RECORDS='zhixian-cn-records-v1', WORKFLOW='zhixian-cn-workflow-v1';
const files=new Map<string,Blob>();
type AnyRecord=Record<string,any>;
const now=()=>new Date().toISOString();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=utf-8'}});
const load=<T>(key:string,fallback:T):T=>{try{return JSON.parse(localStorage.getItem(key)||'') as T}catch{return fallback}};
const save=(key:string,value:unknown)=>localStorage.setItem(key,JSON.stringify(value));
const demoText='云从科技是一家人工智能科创企业，持续投入算法模型研发并服务智慧金融和智慧治理场景。公司披露研发投入较大，仍处于商业化拓展阶段，存在持续亏损、经营现金流下降和融资续航压力。部分训练数据来自客户委托与第三方授权，数据授权链、访问日志和安全审计材料仍需进一步核验。公司建立知识产权管理和开源管理制度，但核心代码权属链、开源软件清单及自由实施分析尚未完整提供。公开资料显示公司被列入美国实体清单，外部限制可能影响算力、供应链、研发和客户交付。';

function initialRecords(){
  const existing=load<AnyRecord[]>(RECORDS,[]); if(existing.length)return existing;
  const analysis=analyzeMaterial({text:demoText,channel:'D',parserStatus:'正文提取完成',company:'云从科技'});
  const record={id:'demo-yuncong',company:'云从科技',channel:'D',period:'公开材料演示',source_institution:'企业公开披露摘要',permission_scope:'项目组可见',confidentiality:'公开',file_name:'云从科技_公开披露演示材料.txt',file_size:new Blob([demoText]).size,parser_status:'正文提取完成',extracted_characters:analysis.extractedCharacters,review_status:'待人工复核',created_at:now(),analysis,_text:demoText};
  save(RECORDS,[record]);return [record];
}
function state(){return load<Record<string,{tasks:AnyRecord[],reviews:AnyRecord[],audit:AnyRecord[]}>>(WORKFLOW,{})}
function wf(id:string){const all=state();return all[id]||{tasks:[],reviews:[],audit:[]}}
function saveWf(id:string,value:unknown){const all=state();all[id]=value as any;save(WORKFLOW,all)}
function records(){return initialRecords()}
function setRecords(value:AnyRecord[]){save(RECORDS,value)}
function updateReviewStatus(id:string,status:string){setRecords(records().map(r=>r.id===id?{...r,review_status:status}:r))}
async function hash(value:string){const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('')}

async function session(request:Request){
  if(request.method==='GET')return localStorage.getItem('zhixian-session')==='1'?json({session:{displayName:'专家评委',organization:'比赛专家评审组',role:'比赛专家／超级管理员',companyScope:''}}):json({session:null},401);
  if(request.method==='DELETE'){localStorage.removeItem('zhixian-session');return json({ok:true})}
  const body=await request.json();const valid=String(body.account||'').trim()==='expert-judge'&&await hash(String(body.accessCode||'').trim())==='41c593a871962b46d191e4587788d7c3f64639a8bd91b847fc7ada4d5964da71';
  if(!valid)return json({error:'专家账号或访问码不正确。'},401);localStorage.setItem('zhixian-session','1');return json({ok:true,role:'比赛专家／超级管理员'});
}

async function uploads(request:Request,url:URL){
  const all=records();const fileId=url.searchParams.get('fileId');
  if(request.method==='GET'&&fileId){const r=all.find(x=>x.id===fileId);if(!r)return json({error:'材料不存在'},404);return files.get(fileId)||new Response(r._text||r.analysis.evidenceBoundary,{headers:{'content-type':'text/plain;charset=utf-8'}})}
  if(request.method==='GET')return json({records:all.map(({_text,...r})=>r)});
  if(request.method==='POST'){
    const form=await request.formData();const file=form.get('file');if(!(file instanceof File))return json({error:'请选择文件'},400);
    const id=crypto.randomUUID(),text=String(form.get('extractedText')||''),channel=String(form.get('channel')||'A'),company=String(form.get('company')||'待确认');
    const analysis=analyzeMaterial({text,channel,parserStatus:String(form.get('parserStatus')||'已接收'),company});
    const record={id,company,channel,period:String(form.get('period')||''),source_institution:String(form.get('sourceInstitution')||''),permission_scope:String(form.get('permissionScope')||''),confidentiality:String(form.get('confidentiality')||''),file_name:file.name,file_size:file.size,parser_status:String(form.get('parserStatus')||''),extracted_characters:analysis.extractedCharacters,review_status:'待人工复核',created_at:now(),analysis,_text:text};
    files.set(id,file);setRecords([record,...all].slice(0,30));return json({record:{...record,_text:undefined}});
  }
  if(request.method==='PATCH'){
    const body=await request.json(),record=all.find(x=>x.id===body.id);if(!record)return json({error:'材料不存在'},404);const text=String(body.extractedText??record._text??'');const analysis=analyzeMaterial({text,channel:record.channel,parserStatus:String(body.parserStatus||record.parser_status),company:record.company});const next={...record,parser_status:String(body.parserStatus||record.parser_status),extracted_characters:analysis.extractedCharacters,analysis,_text:text,review_status:'待人工复核'};setRecords(all.map(x=>x.id===next.id?next:x));return json({record:{...next,_text:undefined}});
  }
  if(request.method==='DELETE'){
    const id=url.searchParams.get('id');setRecords(all.filter(x=>x.id!==id));const w=state();if(id)delete w[id];save(WORKFLOW,w);if(id)files.delete(id);return json({ok:true});
  }
  return json({error:'不支持的操作'},405);
}

async function workflow(request:Request,url:URL){
  if(request.method==='GET'){const id=url.searchParams.get('uploadId')||'';return json(wf(id))}
  const body=await request.json(),id=String(body.uploadId||''),record=records().find(r=>r.id===id);if(!record)return json({error:'材料不存在'},404);const data=wf(id),stamp=now();
  if(body.action==='generateTasks') data.tasks=(record.analysis.questions||[]).map((q:AnyRecord,i:number)=>({id:`task-${id}-${i}`,risk_domain:q.riskDomain,topic:q.topic,question:q.question,requested_materials:JSON.stringify(q.materials||[]),owner:'待分配',due_date:'',status:'待发起',created_at:stamp}));
  if(body.action==='updateTask')data.tasks=data.tasks.map(t=>t.id===body.taskId?{...t,status:body.status,owner:body.owner,due_date:body.dueDate}:t);
  if(body.action==='reviewEvidence'){const item={evidence_id:body.evidenceId,risk_domain:body.riskDomain,decision:body.decision,note:'',reviewer:'专家评委',updated_at:stamp};data.reviews=[item,...data.reviews.filter(x=>x.evidence_id!==body.evidenceId)];updateReviewStatus(id,'复核中')}
  if(body.action==='submitReview')updateReviewStatus(id,'复核中');
  if(body.action==='completeReview')updateReviewStatus(id,String(body.decision||'复核通过'));
  const labels:Record<string,string>={generateTasks:'生成尽调任务',updateTask:'更新尽调任务',reviewEvidence:'复核证据',submitReview:'提交复核',completeReview:'完成复核'};
  data.audit=[{id:crypto.randomUUID(),action:labels[body.action]||body.action,target_type:'材料分析记录',details:body.decision||body.status||record.file_name,operator:'专家评委',created_at:stamp},...data.audit].slice(0,50);saveWf(id,data);return json(data);
}

async function report(url:URL){const r=records().find(x=>x.id===url.searchParams.get('uploadId'));if(!r)return json({error:'材料不存在'},404);const body=[`# ${r.company}风险识别报告`,`材料：${r.file_name}`,`期间：${r.period}`,`来源：${r.source_institution}`,'',r.analysis.summary,'',...(r.analysis.findings||[]).flatMap((f:AnyRecord)=>[`## ${f.riskDomain} ${f.title}｜${f.status}`,f.conclusion||'',...(f.evidence||[]).map((x:string)=>`- ${x}`),`证据边界：${f.boundary}`,''])].join('\n');return new Response(body,{headers:{'content-type':'text/markdown;charset=utf-8','content-disposition':`attachment; filename="risk-report.md"`}})}

export function installLocalApi(){
  const native=window.fetch.bind(window);
  window.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{const raw=typeof input==='string'?input:input instanceof URL?input.href:input.url;const url=new URL(raw,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return native(input,init);const request=new Request(url,init);
    if(url.pathname==='/api/session')return session(request);
    if(url.pathname==='/api/uploads')return uploads(request,url);
    if(url.pathname==='/api/workflow')return workflow(request,url);
    if(url.pathname==='/api/enterprise'){const company=url.searchParams.get('company')||companyProfiles[0].company;const all=records().filter(r=>r.company===company);return json({companies:companyProfiles.map(x=>({company:x.company,lifecycle:x.lifecycle})),profile:buildEnterpriseProfile(company,all)});}
    if(url.pathname==='/api/ai-analysis')return request.method==='GET'?json({configured:false,model:'',latest:null}):json({error:'国内比赛演示版暂未启用真实大模型服务。'},503);
    if(url.pathname==='/api/reports')return report(url);
    return json({error:'接口不存在'},404);
  };
}
