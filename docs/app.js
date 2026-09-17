import {CATEGORIES,SAMPLES,category,parseFeedback,aggregate,makeReport} from './engine.mjs';

// 参数区：网络端点与导出文件名集中定义；不保存输入、评论或密钥。
const PATHS={health:'/api/health',agent:'/api/agent',report:'echo-feedback-report.md'};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={...parseFeedback(SAMPLES.launch),source:'虚构示例 · 版本更新',goal:'改善新玩家体验',focus:'stability',approved:false};
let rawSnapshot=SAMPLES.launch,localAgent=false,busy=false,revision=0;
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),3600)}
const options=CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
$('app').innerHTML=`<div class="shell">
<aside class="sidebar"><div class="brand"><div class="mark">≋</div><div>回声 <span style="font-weight:400">Echo</span><small>PLAYER INSIGHTS</small></div></div><nav aria-label="主导航"><div class="navlabel">工作空间</div><a href="#overview" class="active">◫ &nbsp; 玩家洞察</a><a href="#feedback">≡ &nbsp; 反馈原文</a><a href="#action">↗ &nbsp; 行动草案</a><a href="#agent">⌘ &nbsp; 模型分析</a></nav><div class="sidefoot"><b>每个判断，都有出处。</b>先听见玩家，再决定行动。<br><br>作品集原型 · v0.1<br>当前数据仅在此页面临时使用</div></aside>
<main class="main"><header class="topbar"><div><span class="crumb">工作空间 &nbsp; / &nbsp; </span>版本反馈复盘</div><span class="badge">本地规则演示 · 无需密钥</span></header>
<div class="workspace" id="overview"><div class="heading"><div><div class="eyebrow">LISTEN. UNDERSTAND. ACT.</div><h1>把玩家的声音，变成下一步行动。</h1><p>从反馈中定位问题，用原文支撑判断，用实验验证改动。</p></div><button id="export">↓ &nbsp; 导出简报</button></div>
<section class="stats" aria-label="反馈概览" id="stats"></section>
<div class="grid"><div>
<section class="panel"><div class="panelhead"><div><div class="step">01 / COLLECT</div><h2>听见玩家</h2></div><span class="badge" id="sourcebadge">虚构示例</span></div><div class="panelbody"><div class="twofields"><div><label class="field" for="goal">本次运营目标</label><select id="goal"><option>改善新玩家体验</option><option>提高活动参与质量</option><option>排查版本体验问题</option></select></div><div><label class="field" for="sample">载入演示场景</label><select id="sample"><option value="launch">版本更新 · 虚构评论</option><option value="event">限时活动 · 虚构评论</option></select></div></div><label class="field" for="raw">玩家反馈 · 每行一条</label><textarea id="raw" spellcheck="false" placeholder="粘贴已获授权、去除个人信息的玩家评论，每行一条。最多 200 行。"></textarea><div class="row inputfoot"><small id="inputstatus">每次最多 200 行 · 自动去除完全重复项</small><button class="primary" id="analyze">分析反馈 ↗</button></div><div class="notice" id="notice">示例评论为虚构数据。当前采用关键词规则，否定、反讽与多主题表达会转入人工复核；不代表真实模型的分析效果。</div></div></section>
<section class="panel"><div class="panelhead"><div><div class="step">WORKFLOW / 可检查的处理过程</div><h2>从输入到行动</h2></div></div><div class="panelbody pipeline" id="pipeline"></div></section>
<section class="panel" id="agent"><div class="panelbody"><details id="agentdetails"><summary>接入真实模型，生成证据驱动的分析</summary><p id="agentstatus">正在检查本地 Agent 服务…</p><div id="agentcontrols" class="agentbox hidden"><label class="field" for="apikey">DeepSeek API Key（仅本次请求使用）</label><input id="apikey" type="password" class="input" placeholder="在本机填写，不要发到聊天里" autocomplete="off"><p>点击运行后，当前反馈、运营目标和密钥会通过本地服务发往 DeepSeek。请只使用可外发且已脱敏的数据；调用可能产生 API 费用。页面和服务均不持久保存密钥。</p><button class="primary" id="runagent">运行真实 Agent</button></div><div id="agentresult" class="hidden"><p id="agenttrace"></p><div id="agentoutput" class="agentoutput"></div></div></details></div></section>
</div><div>
<section class="panel"><div class="panelhead"><div><div class="step">02 / UNDERSTAND</div><h2>问题集中在哪里</h2></div><small>点击主题查看证据</small></div><div class="panelbody"><div id="topics"></div><div class="evidence" id="evidence"></div><p style="font-size:12px;margin-top:16px">排序分 = 60 × 严重度 / 5 + 40 × 评论占比。默认严重度是假设；正向和待判断主题单列，不作为故障优先级。</p></div></section>
<section class="panel" id="action"><div class="panelhead"><div><div class="step">03 / ACT</div><h2>从一个问题开始验证</h2></div><span class="badge" id="reviewbadge">待审核草案</span></div><div class="panelbody" id="proposal"></div></section>
</div></div>
<section class="panel" id="feedback"><div class="panelhead"><div><h2>回到原文，校正判断</h2><p>每条反馈只计入一个主分类。选择分类即标记为人工复核。</p></div><div class="tablecontrols"><input id="search" class="input" type="search" aria-label="搜索反馈" placeholder="搜索关键词或编号…"><select id="filter" aria-label="筛选分类"><option value="all">全部主题</option>${options}</select></div></div><div class="feedbacklist" id="feedbacklist"></div></section>
<footer class="footer"><span>Echo / 回声 · 游戏运营与 AI 产品作品集原型</span><span>评论占比 ≠ 玩家占比 ≠ 流失率 · 所有建议需人工核实</span></footer>
</div></main></div><div id="toast" class="toast hidden" role="status" aria-live="polite"></div>`;
$('raw').value=SAMPLES.launch;
function render(){
 const groups=aggregate(state.rows),uncertain=state.rows.filter(r=>r.category==='other').length,reviewed=state.rows.filter(r=>r.reviewed).length;
 if(!groups.some(g=>g.id===state.focus))state.focus=groups.find(g=>!['other','positive'].includes(g.id))?.id||groups[0]?.id;
 const focus=groups.find(g=>g.id===state.focus);
 const stats=[['有效反馈',state.rows.length,`输入 ${state.total} 条 · 去除 ${state.duplicates} 条重复`],['反馈主题',groups.length,'基于单一主分类汇总'],['待判断反馈',uncertain,'请先回看原文再做结论'],['已人工复核',reviewed,`共 ${state.rows.length} 条 · 可在下方修改分类`]];
 $('stats').innerHTML=stats.map((s,i)=>`<div class="stat ${i===0?'featured':''}"><span class="label">${s[0]}</span><span class="value">${s[1]}<span style="font-size:14px;font-weight:400;margin-left:8px">${i===1?'类':'条'}</span></span><small>${s[2]}</small></div>`).join('');
 const ordered=[...groups.filter(g=>!['other','positive'].includes(g.id)),...groups.filter(g=>['other','positive'].includes(g.id))];
 $('topics').innerHTML=ordered.map(g=>`<div class="topic ${g.id===state.focus?'selected':''}"><div class="row"><button data-focus="${g.id}">${esc(g.name)} ${g.id===state.focus?'↗':''}</button><span class="count">${g.count} 条 <small> / ${Math.round(g.count/state.rows.length*100)}%</small></span></div><div class="bar"><span style="width:${g.count/state.rows.length*100}%"></span></div><div class="row"><small>${esc(g.action)}</small><span class="score">${['other','positive'].includes(g.id)?'单列观察':`排序分 ${g.score}`}</span></div></div>`).join('');
 $('evidence').innerHTML=focus?`<small>原文证据 / ${esc(focus.name)}</small>${focus.evidence.slice(0,2).map(r=>`<p><small>${r.id}</small> &nbsp;“${esc(r.text)}”</p>`).join('')}<button id="showall" style="background:transparent;padding:0;border:0;font-size:12px">查看该主题全部 ${focus.count} 条反馈 →</button>`:'';
 $('proposal').innerHTML=focus?`<div class="proposal"><div class="tag">${esc(state.goal)} / ${esc(focus.name)}</div><h3>${esc(focus.action)}</h3><p>${esc(focus.hypothesis)}</p></div><dl class="definition"><dt>协作对象</dt><dd>${esc(focus.owner)}</dd><dt>核心指标</dt><dd>${esc(focus.metric)}</dd><dt>护栏指标</dt><dd>${esc(focus.guardrail)}</dd><dt>如何验证</dt><dd>${esc(focus.experiment)}</dd></dl><button id="approve" class="${state.approved?'':'lime'}">${state.approved?'撤销审核标记':'已阅读证据，标记草案已审核'}</button><div class="reviewline">仅更新当前页面审核状态；未发布公告、派发任务或修改游戏配置。</div>`:'<p>暂无可用反馈。</p>';
 $('reviewbadge').textContent=state.approved?'本页已标记审核':'待审核草案';
 $('pipeline').innerHTML=[['整理输入',`已读取 ${state.total} 条，去除 ${state.duplicates} 条完全重复评论。`],['规则归类',`匹配 5 个业务主题，${uncertain} 条待判断。不是大模型推理。`],['原文溯源',`每个主题保留反馈编号，${reviewed} 条已由人复核。`],['生成行动草案','根据主题选择预置实验模板；业务效果仍需验证。']].map((s,i)=>`<div class="pipe"><span class="num">${i+1}</span><div>${s[0]}<p>${s[1]}</p></div></div>`).join('');
 renderRows();
}
function renderRows(){
 const query=$('search').value.trim().toLowerCase(),filter=$('filter').value;
 const rows=state.rows.filter(r=>(filter==='all'||r.category===filter)&&(!query||`${r.id} ${r.text}`.toLowerCase().includes(query)));
 $('feedbacklist').innerHTML=rows.length?rows.map(r=>`<div class="feedbackitem"><div><small>${r.id} · ${r.reviewed?'人工已复核':esc(r.reason)}</small><p>${esc(r.text)}</p></div><select aria-label="${r.id} 人工分类" data-review="${r.id}">${CATEGORIES.map(c=>`<option value="${c.id}" ${c.id===r.category?'selected':''}>${c.name}</option>`).join('')}</select></div>`).join(''):'<div class="empty">没有符合条件的反馈。试试其他关键词或分类。</div>';
 for(const select of $('feedbacklist').querySelectorAll('[data-review]')){const row=state.rows.find(r=>r.id===select.dataset.review);const wrap=document.createElement('div');select.replaceWith(wrap);wrap.append(select);if(!row.reviewed){const confirm=document.createElement('button');confirm.textContent='确认当前分类';confirm.dataset.confirm=row.id;confirm.style.cssText='font-size:12px;padding:6px 0;border:0;background:transparent';wrap.append(confirm)}}
}
function invalidate(){state.approved=false;revision++;$('agentresult').classList.add('hidden')}
function analyze(raw,source){
 const next=parseFeedback(raw);state={...state,...next,source,approved:false};rawSnapshot=raw;invalidate();$('inputstatus').textContent=`已分析 ${next.total} 行 · 去除 ${next.duplicates} 条完全重复项`;$('notice').classList.remove('error');$('notice').textContent=source.startsWith('虚构')?'示例评论为虚构数据。当前为关键词规则演示，不代表真实模型分析效果。':'自定义评论仅在本页处理。规则可能误判，请回看原文；若使用真实模型，只提交允许外发且已脱敏的数据。';$('sourcebadge').textContent=source.startsWith('虚构')?'虚构示例':'自定义输入';$('filter').value='all';render();return {total:next.total,unique:next.rows.length,duplicates:next.duplicates};
}
$('analyze').onclick=()=>{try{analyze($('raw').value,$('raw').value===SAMPLES.launch?'虚构示例 · 版本更新':$('raw').value===SAMPLES.event?'虚构示例 · 限时活动':'用户粘贴 · 来源待核实');toast('分析完成。请回看原文并校正分类。')}catch(e){$('notice').textContent=e.message;$('notice').classList.add('error')}};
$('raw').oninput=()=>{$('inputstatus').textContent=$('raw').value===rawSnapshot?'输入与当前分析一致':'输入已修改，点击「分析反馈」更新结果';};
$('sample').onchange=()=>{$('raw').value=SAMPLES[$('sample').value];$('analyze').click();$('notice').textContent='已载入虚构示例。示例用于展示流程，不代表真实玩家数据或模型准确率。'};
$('goal').onchange=()=>{state.goal=$('goal').value;invalidate();render()};
$('search').oninput=renderRows;$('filter').onchange=renderRows;
$('topics').onclick=e=>{const button=e.target.closest('[data-focus]');if(button){state.focus=button.dataset.focus;invalidate();render()}};
$('evidence').onclick=e=>{if(e.target.id==='showall'){$('filter').value=state.focus;renderRows();$('feedback').scrollIntoView({behavior:'smooth'})}};
$('proposal').onclick=e=>{if(e.target.id==='approve'){state.approved=!state.approved;render();toast(state.approved?'已标记审核，仅在当前页面生效。':'已撤销审核标记。')}};
$('feedbacklist').onchange=e=>{const id=e.target.dataset.review,row=state.rows.find(r=>r.id===id);if(row){row.category=e.target.value;row.reviewed=true;invalidate();render();toast(`${id} 的分类已更新。`)}};
$('feedbacklist').onclick=e=>{const row=state.rows.find(r=>r.id===e.target.dataset.confirm);if(row){row.reviewed=true;invalidate();render();toast(`${row.id} 的当前分类已人工确认。`)}};
$('export').onclick=()=>{if($('raw').value!==rawSnapshot){toast('输入有未分析的修改，请先分析再导出。');return}const blob=new Blob([makeReport(state)],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=PATHS.report;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出包含原文证据、指标口径和限制的简报。')};
$('runagent').onclick=async()=>{
 if(busy||!localAgent)return;
 if($('raw').value!==rawSnapshot){toast('请先分析最新输入，再运行 Agent。');return}
 const key=$('apikey').value.trim();if(!key){toast('请在本机填写 API Key。');return}
 busy=true;$('runagent').disabled=true;$('runagent').textContent='正在调用模型与证据工具…';const currentRevision=revision;
 $('agentresult').classList.remove('hidden');$('agentoutput').textContent='正在分析，请等待。';$('agenttrace').textContent='真实模型模式 · 最多 4 轮、8 次只读工具调用';
 try{const response=await fetch(PATHS.agent,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,raw:rawSnapshot,goal:state.goal,reviewed:state.rows.filter(r=>r.reviewed).map(r=>({id:r.id,category:r.category}))}),signal:AbortSignal.timeout(150000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'请求失败');if(revision!==currentRevision){toast('分析期间数据已变化，请基于最新数据重新运行。');$('agentresult').classList.add('hidden');return}$('agentoutput').textContent=result.report;$('agenttrace').textContent=`真实模型输出 · ${result.calls} 次工具调用 · ${(result.elapsedMs/1000).toFixed(1)} 秒 · ${result.totalTokens} tokens\n${result.trace.join(' → ')}`;}catch(e){$('agentoutput').textContent=`模型分析未完成：${e.message}。当前规则分析仍可使用；没有用预置结果冒充模型输出。`}finally{$('apikey').value='';busy=false;$('runagent').disabled=false;$('runagent').textContent='运行真实 Agent'}
};
render();
if(location.protocol!=='file:'&&['127.0.0.1','localhost'].includes(location.hostname)){
 fetch(PATHS.health,{signal:AbortSignal.timeout(3000)}).then(r=>r.ok?r.json():null).then(r=>{localAgent=!!r?.agent;$('agentcontrols').classList.toggle('hidden',!localAgent);$('agentstatus').textContent=localAgent?'本地 Agent 服务可用。模型可调用统计与原文检索工具，形成有依据的分析。':'当前是静态演示。启动随项目附带的本地服务后可连接真实模型。'}).catch(()=>{$('agentstatus').textContent='当前是静态演示。启动随项目附带的本地服务后可连接真实模型。'});
}else{$('agentstatus').textContent='当前为规则演示版。项目附带独立的本地 Agent 服务，启动后可使用你自己的 API Key 体验真实模型；本页面不会向模型发送评论。'}
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 Promise.resolve(document.modelContext.registerTool({name:'analyze_player_feedback',title:'分析玩家反馈',description:'用本地规则分析一批每行一条的反馈，并更新页面；不调用大模型、不发布或保存到服务器。',inputSchema:{type:'object',properties:{feedback:{type:'string',maxLength:60000}},required:['feedback'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input.feedback!=='string')throw new Error('feedback 必须为文本');parseFeedback(input.feedback);$('raw').value=input.feedback;return analyze(input.feedback,'用户输入 · WebMCP');}},{signal:lifecycle.signal})).catch(()=>{});
}
