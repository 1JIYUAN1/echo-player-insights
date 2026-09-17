import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeedback,classify,aggregate,makeReport,SAMPLES} from '../docs/engine.mjs';
import {runAgent,executeTool} from '../agent.mjs';

// 参数区：仅使用内存样例与模拟传输，无外部地址、文件读写或真实 API 费用。
const FIXTURE={key:'test-key-not-real',raw:'更新后闪退\n活动奖励没有到账\n这个版本很好玩',goal:'改善玩家体验'};
function sequence(messages){let index=0;return async()=>({ok:true,json:async()=>({choices:[{message:messages[Math.min(index++,messages.length-1)],finish_reason:'stop'}],usage:{total_tokens:20}})})}
const toolTurn={role:'assistant',content:null,tool_calls:[{id:'a',type:'function',function:{name:'summarize_feedback',arguments:'{}'}},{id:'b',type:'function',function:{name:'search_feedback',arguments:'{"category":"stability","limit":2}'}}]};
test('示例 20 条输入去重成 19 条，并保留原始行号',()=>{const r=parseFeedback(SAMPLES.launch);assert.equal(r.total,20);assert.equal(r.rows.length,19);assert.equal(r.duplicates,1);assert.ok(r.rows.some(x=>x.id==='F016'));assert.equal(aggregate(r.rows).reduce((a,g)=>a+g.count,0),19)});
test('拒绝空输入、超过行数和单条长度的输入',()=>{for(const raw of ['', ' \n ',Array(201).fill('反馈').join('\n'),'字'.repeat(2001)])assert.throws(()=>parseFeedback(raw))});
test('否定、反讽、多主题保留到人工判断',()=>{for(const text of ['没有闪退，很好玩','这个奖励真“良心”，呵呵','新手被匹配到高段位'])assert.equal(classify(text).category,'other')});
test('正负混合仍保留明确的故障主题',()=>assert.equal(classify('好玩，但是一直闪退').category,'stability'));
test('原文保留可能的 HTML，不作为执行指令',()=>{const row=parseFeedback('<img src=x onerror=alert(1)>闪退').rows[0];assert.equal(row.text,'<img src=x onerror=alert(1)>闪退');assert.equal(row.id,'F001')});
test('人工改分类后汇总与简报同步且不制造业务结果',()=>{const data=parseFeedback('没有闪退，很好玩');data.rows[0].category='positive';data.rows[0].reviewed=true;assert.equal(aggregate(data.rows)[0].id,'positive');const report=makeReport({...data,source:'测试',goal:'测试',focus:'positive',approved:false});assert.match(report,/已人工复核 1 条/);assert.match(report,/未做真实用户测试/);assert.match(report,/F001/) });
test('工具拒绝未知动作、非法类别和越界数量',()=>{const data=parseFeedback(FIXTURE.raw);for(const [name,args] of [['publish_notice',{}],['search_feedback',{limit:999}],['search_feedback',{category:'unknown'}],['summarize_feedback',{fake:true}]])assert.throws(()=>executeTool(name,args,data))});
test('检索返回匹配数和可回溯的原文',()=>{const result=executeTool('search_feedback',{query:'闪退',limit:1},parseFeedback(FIXTURE.raw));assert.equal(result.matched,1);assert.equal(result.evidence[0].id,'F001')});
test('Agent 真实工具循环的模拟传输测试',async()=>{const r=await runAgent(FIXTURE,sequence([toolTurn,{role:'assistant',content:'观察：[F001] 提到闪退。建议先复现，不能推断留存变化。'}]));assert.equal(r.calls,2);assert.equal(r.totalTokens,40);assert.match(r.report,/F001/)});
test('拒绝引用未读取的原文编号',async()=>{await assert.rejects(runAgent(FIXTURE,sequence([toolTurn,{role:'assistant',content:'根据 [F003] 判断崩溃。'}])),/未读取/) });
test('没有检索时不能把直接生成内容冒充证据分析',async()=>{await assert.rejects(runAgent(FIXTURE,sequence([{role:'assistant',content:'无依据的报告'}])),/轮次预算/) });
test('鉴权失败显式报错，不返回规则伪装的 AI 答案',async()=>{await assert.rejects(runAgent(FIXTURE,async()=>({ok:false,status:401})),/密钥/) });
test('Agent 接收并使用人工复核分类',async()=>{let inspected=false;const mock=async(url,opts)=>{const body=JSON.parse(opts.body);const result=body.messages.find(m=>m.role==='tool'&&m.tool_call_id==='a');if(result){const data=JSON.parse(result.content);assert.equal(data.reviewed,1);inspected=true;return {ok:true,json:async()=>({choices:[{message:{role:'assistant',content:'需人工判断 [F001]。'},finish_reason:'stop'}]})}}return {ok:true,json:async()=>({choices:[{message:{...toolTurn,tool_calls:[toolTurn.tool_calls[0],{id:'b',type:'function',function:{name:'search_feedback',arguments:'{}'}}]}}]})}};await runAgent({...FIXTURE,reviewed:[{id:'F001',category:'other'}]},mock);assert.ok(inspected)});
