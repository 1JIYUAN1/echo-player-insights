export const CATEGORIES = [
  {id:'stability',name:'稳定性与性能',severity:5,words:['闪退','卡顿','掉帧','发热','崩溃','黑屏','断线','掉线','延迟'],action:'先复现阻断体验的问题',owner:'客户端 / QA',hypothesis:'修复可复现的性能问题后，受影响设备玩家的有效对局完成率会提高。',metric:'有效对局完成率 = 正常结算对局数 / 已开始对局数',guardrail:'崩溃率、平均帧率、客服相关投诉量',experiment:'按设备型号和版本分层，先复现并灰度修复；严重故障直接修复，不刻意保留故障作为对照。记录发布前后同口径数据，说明版本和用户构成变化的干扰。'},
  {id:'balance',name:'匹配与公平性',severity:4,words:['匹配','外挂','碾压','平衡','氪金','数值','连败'],action:'定位匹配失衡发生的分段',owner:'系统策划 / 数据分析',hypothesis:'收窄新手分段的实力差距，可能改善新手的对局体验。',metric:'新手次日留存 = 注册后第 1 个自然日回访的新用户数 / 当日新增用户数',guardrail:'匹配等待时长 P95、分段胜率、举报率',experiment:'先检查分段与等待时长数据；只在满足样本量和风险条件时，按玩家随机分配当前规则与候选规则，固定版本和观察窗口，避免只看总胜率。'},
  {id:'onboarding',name:'新手引导',severity:3,words:['教程','引导','新手','看不懂','不知道','找不到'],action:'找到首次体验的具体卡点',owner:'产品 / UX / 策划',hypothesis:'在具体卡点提供短提示，可能提高首次核心任务完成率。',metric:'首次核心任务完成率 = 首次完成核心任务的新用户数 / 进入该任务的新用户数',guardrail:'引导跳过率、完成耗时、次日留存',experiment:'先邀请 5 位目标玩家观察任务操作；定位卡点后，对符合条件的新玩家随机展示原提示或新提示，保持奖励一致。样本量按基线和最小可检测差异另行估算。'},
  {id:'events',name:'活动与奖励',severity:3,words:['活动','奖励','签到','任务','兑换','肝','体力','限时'],action:'检查活动门槛与奖励理解',owner:'活动运营 / 数值策划',hypothesis:'降低非核心重复任务负担，可能提升活动完成率。',metric:'活动完成率 = 完成核心活动目标的玩家数 / 符合条件且进入活动的玩家数',guardrail:'奖励产出、总游戏时长、投诉率、付费体验',experiment:'先核验活动漏斗与退出节点；比较任务说明或非经济性流程改动，保持奖励价值一致。涉及经济系统和玩家公平性的调整需要策划审核。'},
  {id:'positive',name:'正向体验',severity:1,words:['好玩','喜欢','很棒','满意','良心','流畅','舒服','好看'],action:'保留并验证受欢迎的体验',owner:'用户研究 / 社区运营',hypothesis:'被主动提及的正向体验可能是后续内容传播的有效素材。',metric:'内容有效互动率 = 有效评论、收藏或分享的用户数 / 内容触达用户数',guardrail:'负向评论占比、误导性宣传反馈',experiment:'访谈确认喜爱原因后，制作两种真实体验内容，在可比较的时段与渠道测试；渠道差异必须写入复盘，不能直接宣称因果。'},
  {id:'other',name:'待人工判断',severity:2,words:[],action:'补充上下文，暂不做业务推断',owner:'用户研究 / 客服',hypothesis:'补齐场景、设备、版本或具体操作后，才能形成可验证的问题定义。',metric:'可判断反馈比例 = 补充信息后可明确归类的条数 / 请求补充信息的条数',guardrail:'玩家回复负担、重复询问次数',experiment:'人工回看原文，询问发生场景和具体操作；对否定、反讽和多问题表达逐条复核，不据此直接调整产品。'}
];
export const SAMPLES = {
  launch: ['更新后进副本就闪退，手机是安卓。','匹配连续三局碰到高段位，新手完全被碾压。','教程结束后不知道去哪里升级装备。','限时活动每天要肝两个小时，根本做不完。','这次地图很好看，探索起来很舒服。','新版本打团明显掉帧，特效一多就卡顿。','活动兑换页面找不到，奖励差点过期。','匹配队友的段位差太大，已经连败五场。','第一次进公会不知道怎么申请。','签到奖励需要连续七天，周末断了就没了。','闪退后重连回不去，还扣了对局分。','这次的战斗手感很棒，技能衔接很流畅。','教程文字太多，跳过以后看不懂装备系统。','好玩是好玩，但是每次切后台都会闪退。','更新后进副本就闪退，手机是安卓。','这个版本真是“太棒了”，呵呵。','大厅背景音乐很喜欢，希望加入歌单。','活动进度满了却领不到奖励。','玩了几天，先观望。','匹配等了三分钟才进去，进去又被碾压。'].join('\n'),
  event:['活动任务说明看不懂，不知道到底怎么算完成。','奖励展示很清楚，兑换也很方便。','每日活动太肝了，上班没空。','匹配体验变好了，今天没有连败。','完成任务以后奖励没有到账。','新的皮肤很好看，我很喜欢。','游戏没有闪退，性能也不卡顿。','活动时间太短，一天没上就赶不上。','更新后还是黑屏。','这个奖励可真“良心”，呵呵。'].join('\n')
};
export function category(id){return CATEGORIES.find(c=>c.id===id)||CATEGORIES.at(-1)}
export function classify(text){
  const hits=CATEGORIES.filter(c=>c.words.some(w=>text.includes(w)));
  const uncertain=/(不|没|无).{0,3}(闪退|卡顿|连败|好玩|喜欢|掉线)|呵呵|[“”"]/.test(text);
  if(uncertain)return {category:'other',reason:'含否定或反讽线索，需要人工复核'};
  const issues=hits.filter(c=>c.id!=='positive');
  if(issues.length>1)return {category:'other',reason:'涉及多个主题，需要选择主要问题'};
  const chosen=issues[0]||hits[0];
  return {category:chosen?.id||'other',reason:chosen?'关键词规则命中，尚未人工确认':'未命中现有规则'};
}
export function parseFeedback(raw){
  if(typeof raw!=='string'||!raw.trim())throw new Error('请先粘贴至少一条玩家反馈。');
  if(raw.length>60000)throw new Error('本次演示最多处理 60,000 个字符，请分批粘贴。');
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(lines.length>200)throw new Error('每次最多 200 行反馈，请分批处理。');
  if(lines.some(x=>x.length>2000))throw new Error('单条反馈最多 2,000 个字符，请检查换行。');
  const seen=new Set(),rows=[];
  lines.forEach((text,i)=>{const key=text.replace(/\s+/g,' ').trim();if(!seen.has(key)){seen.add(key);rows.push({id:`F${String(i+1).padStart(3,'0')}`,text,...classify(text),reviewed:false})}});
  return {rows,total:lines.length,duplicates:lines.length-rows.length};
}
export function aggregate(rows){
  return CATEGORIES.map(c=>{const evidence=rows.filter(r=>r.category===c.id);return {...c,count:evidence.length,evidence,score:Math.round(60*c.severity/5+40*evidence.length/Math.max(1,rows.length))}}).filter(c=>c.count).sort((a,b)=>b.score-a.score);
}
export function makeReport(state){
  const groups=aggregate(state.rows),focus=groups.find(g=>g.id===state.focus)||groups[0];
  return `# 回声 Echo · 玩家反馈简报\n\n来源：${state.source}\n生成时间：${new Date().toISOString()}\n模式：本地关键词规则 + 人工复核，未调用大模型\n目标：${state.goal}\n\n## 数据口径\n输入 ${state.total} 条，完全重复 ${state.duplicates} 条，去重后 ${state.rows.length} 条，已人工复核 ${state.rows.filter(r=>r.reviewed).length} 条。每条只计入一个主分类；评论条数不是玩家人数，评论占比不是流失率。\n优先级分数 = 60 × 默认严重度 / 5 + 40 × 该分类条数 / 去重后总条数。仅为可解释的演示排序，未验证业务效果；正向体验和待人工判断不作为故障优先级。\n\n## 主题与证据\n${groups.map(g=>`### ${g.name} · ${g.count} 条\n${g.evidence.map(r=>`- [${r.id}] ${r.text}（${r.reviewed?'人工已复核':r.reason}）`).join('\n')}`).join('\n\n')}\n\n## 当前行动草案\n主题：${focus?.name||'无'}\n${focus?`${focus.action}\n责任协作：${focus.owner}\n假设：${focus.hypothesis}\n核心指标：${focus.metric}\n护栏指标：${focus.guardrail}\n验证方法：${focus.experiment}`:''}\n审核状态：${state.approved?'已在此设备标记审核；未发布或创建外部任务':'草案，待人工审核'}\n\n## 限制\n示例为虚构；规则不等于语义理解；未做真实用户测试；不自动发布公告、发放奖励或修改游戏配置。需要补充真实用户访谈、独立标注测试集和运行数据后再评价产品价值。\n`;
}
