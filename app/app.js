'use strict';
// ---- 永続化 (IndexedDB) ----
const DB={
  open(){return this._p||(this._p=new Promise((res,rej)=>{const r=indexedDB.open('gh300',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
  async get(k){const d=await this.open();return new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  async set(k,v){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
};
const S={route:'home',Q:[],P:{hist:{},bm:{},exams:[]},E:null,ex:{n:30,min:60,ratio:'official'},rv:null,ses:null,cfg:{mode:'seq',shuffle:false,sec:'all'},msg:''};
const $app=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^\s*- /gm,'• ').replace(/\n/g,'<br>');
const L='ABCDEFGHIJ';
const DOM={1:{n:'責任ある AI の活用',ic:'🛡',w:18},2:{n:'Copilot のプランと機能',ic:'✨',w:28},3:{n:'仕組みとデータの扱い',ic:'🔒',w:13},4:{n:'プロンプトエンジニアリング',ic:'✍️',w:13},5:{n:'開発者のユースケース',ic:'🛠',w:14},6:{n:'テストでの活用',ic:'🧪',w:14}};
const KB={1:'責任ある AI と安全な利用',2:'基礎・プラン・主要機能',3:'IDE での Copilot',4:'プロンプトとコンテキスト制御',5:'仕組みとデータフロー',6:'プライバシー・公開コード・除外',7:'管理・ポリシー・ガバナンス',8:'生産性・SDLC・ユースケース',9:'テストでの活用',10:'GitHub.com（PR・レビュー・Issue）',11:'Spaces・ナレッジベース・MCP',12:'エージェント・CLI・メトリクス'};
const hasDom=()=>S.Q.some(q=>q.domain);const hasKb=()=>S.Q.some(q=>q.kb);
const save=()=>DB.set('progress',S.P);
const go=r=>{S.route=r;render()};
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$app.append(t);setTimeout(()=>t.remove(),2000)}
const lastOk=id=>{const h=S.P.hist[id];return h&&h.length?h[h.length-1]:null};
const tests=()=>[...new Set(S.Q.map(q=>q.test))].sort((a,b)=>a-b);
const stat=qs=>{let d=0,ok=0;for(const q of qs){const h=S.P.hist[q.id];if(h&&h.length){d++;if(h[h.length-1])ok++}}return{total:qs.length,done:d,rate:d?Math.round(ok/d*100):null}};
const fmt=t=>[Math.floor(t/3600),Math.floor(t%3600/60),t%60].map(x=>String(x).padStart(2,'0')).join(':');
const byId=id=>S.Q.find(q=>q.id===id);
const isOk=(q,sel)=>!!sel&&sel.length===q.answer.length&&q.answer.every(a=>sel.includes(a));
const saveE=()=>DB.set('exam',S.E);
let tick=null;
const stopTick=()=>{clearInterval(tick);tick=null};
const back=to=>`<button class="ib" onclick="go('${to}')" aria-label="戻る">‹</button>`;

// ---- 学習対象の選別 ----
function pick(){
  const sc=S.cfg.sec;let qs=sc==='all'?S.Q:String(sc).startsWith('k')?S.Q.filter(q=>q.kb===+String(sc).slice(1)):String(sc).startsWith('d')?S.Q.filter(q=>q.domain===+String(sc).slice(1)):S.Q.filter(q=>q.test===+sc);
  const m=S.cfg.mode;
  if(m==='new')qs=qs.filter(q=>!(S.P.hist[q.id]||[]).length);
  if(m==='wrong')qs=qs.filter(q=>lastOk(q.id)===false);
  if(m==='wrong3')qs=qs.filter(q=>(S.P.hist[q.id]||[]).slice(-3).includes(false));
  if(m==='bm')qs=qs.filter(q=>S.P.bm[q.id]);
  qs=[...qs];
  if(S.cfg.shuffle)for(let i=qs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[qs[i],qs[j]]=[qs[j],qs[i]]}
  return qs;
}
function start(){const qs=pick();if(!qs.length){toast('該当する問題がありません');return}
  S.ses={qs,i:0,sel:[],done:false,ok:0};go('q')}
function toggle(i){const s=S.ses,q=s.qs[s.i];if(s.done)return;
  if(q.answer.length>1){const k=s.sel.indexOf(i);k<0?s.sel.push(i):s.sel.splice(k,1)}else s.sel=[i];render()}
function submit(){const s=S.ses,q=s.qs[s.i];if(!s.sel.length)return;
  const ok=s.sel.length===q.answer.length&&q.answer.every(a=>s.sel.includes(a));
  (S.P.hist[q.id]=S.P.hist[q.id]||[]).push(ok);if(S.P.hist[q.id].length>20)S.P.hist[q.id].shift();
  if(ok)s.ok++;s.done=true;s.last=ok;save();render()}
function next(){const s=S.ses;if(s.i<s.qs.length-1){s.i++;s.sel=[];s.done=false;render()}else go('result')}
function bm(id){S.P.bm[id]?delete S.P.bm[id]:S.P.bm[id]=true;save();render()}


// ---- 模擬試験 ----
function startExam(){
  if(!S.Q.length){toast('問題データがありません');return}
  const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const N=Math.min(S.ex.n,S.Q.length);let ids;
  if(hasDom()){
    const ds=[1,2,3,4,5,6],pool={};ds.forEach(d=>pool[d]=shuf(S.Q.filter(q=>q.domain===d)));
    const w=ds.map(d=>S.ex.ratio==='official'?DOM[d].w:100/6);
    const tw=w.reduce((a,b)=>a+b,0),raw=w.map(x=>x/tw*N),cnt=raw.map(Math.floor);
    let rem=N-cnt.reduce((a,b)=>a+b,0);
    raw.map((r,i)=>[r-Math.floor(r),i]).sort((a,b)=>b[0]-a[0]).forEach(([_,i])=>{if(rem>0){cnt[i]++;rem--}});
    ids=[];ds.forEach((d,i)=>{ids.push(...pool[d].splice(0,cnt[i]).map(q=>q.id))});
    const rest=shuf(ds.flatMap(d=>pool[d]).map(q=>q.id));while(ids.length<N&&rest.length)ids.push(rest.shift());
    ids=shuf(ids);
  }else ids=shuf(S.Q).slice(0,N).map(q=>q.id);
  S.E={ids,ans:{},flag:{},i:0,left:S.ex.min*60,total:S.ex.min*60,paused:false,at:Date.now()};
  saveE();go('exam');runTick()}
function runTick(){stopTick();let c=0;tick=setInterval(()=>{if(!S.E)return stopTick();S.E.left--;c++;
  const t=document.getElementById('tm');if(t)t.textContent=fmt(S.E.left);
  if(c%5===0)saveE();if(S.E.left<=0){toast('時間切れです');finishExam(true)}},1000)}
function exAns(i){const E=S.E,q=byId(E.ids[E.i]);let sel=E.ans[E.i]||[];
  if(q.answer.length>1){sel=sel.includes(i)?sel.filter(x=>x!==i):[...sel,i]}else sel=[i];
  E.ans[E.i]=sel;saveE();render()}
function exMove(d){S.E.i=Math.max(0,Math.min(S.E.ids.length-1,S.E.i+d));saveE();render()}
function exFlag(){const E=S.E;E.flag[E.i]=!E.flag[E.i];saveE();render()}
function pauseExam(){stopTick();S.E.paused=true;S.E.pausedAt=Date.now();saveE();go('paused')}
function resumeExam(){S.E.paused=false;saveE();go('exam');runTick()}
function finishExam(force){
  const E=S.E;if(!E)return;
  const un=E.ids.length-Object.keys(E.ans).length;
  if(!force&&un>0&&!confirm(`未回答が ${un} 問あります。採点しますか？`))return;
  stopTick();let ok=0;
  E.ids.forEach((id,i)=>{const q=byId(id),sel=E.ans[i],r=isOk(q,sel);if(r)ok++;
    if(sel){(S.P.hist[id]=S.P.hist[id]||[]).push(r);if(S.P.hist[id].length>20)S.P.hist[id].shift()}});
  const rec={at:Date.now(),n:E.ids.length,ok,used:E.total-E.left,ids:E.ids,ans:E.ans};
  S.P.exams=S.P.exams||[];S.P.exams.push({at:rec.at,n:rec.n,ok,used:rec.used});
  S.rv=rec;S.E=null;DB.set('exam',null);save();go('examresult')}
function reviewQ(i){S.rv.cur=i;go('review')}
function discardExam(){if(confirm('中断中の試験を破棄しますか？')){stopTick();S.E=null;DB.set('exam',null);go('examcfg')}}

// ---- 読み込み ----
async function importFiles(files){
  let add=0;const map=new Map(S.Q.map(q=>[q.id,q]));
  for(const f of files){
    try{const j=JSON.parse(await f.text());if(!Array.isArray(j))throw 0;
      for(const q of j){if(!q||!q.id||!q.q||!Array.isArray(q.options)||!Array.isArray(q.answer))throw 0;if(!map.has(q.id))add++;map.set(q.id,q)}
    }catch(e){toast(f.name+' は問題JSONとして読めません');return}
  }
  S.Q=[...map.values()].sort((a,b)=>a.id<b.id?-1:1);await DB.set('questions',S.Q);
  toast(`${add} 問を追加（計 ${S.Q.length} 問）`);render()
}
document.getElementById('file').addEventListener('change',e=>{if(e.target.files.length)importFiles([...e.target.files]);e.target.value=''});
const pickFile=()=>document.getElementById('file').click();
async function wipe(what){
  if(what==='progress'&&confirm('学習履歴とブックマークを消去しますか？')){S.P={hist:{},bm:{},exams:[]};await save();toast('履歴を消去しました')}
  if(what==='data'&&confirm('読み込んだ問題データを削除しますか？')){S.Q=[];await DB.set('questions',[]);toast('問題データを削除しました')}
  render()}

// ---- 画面 ----
const V={
home(){
  if(!S.Q.length)return `<header><span style="width:44px"></span><h1>GH-300 学習</h1><button class="ib" onclick="go('settings')" aria-label="設定">⚙</button></header>
  <main><div class="empty"><div style="font-size:48px">📚</div><h2>問題データがありません</h2><p>問題JSONファイルを読み込むと学習を始められます。</p><div style="height:12px"></div><button class="btn" onclick="pickFile()">問題JSONを読み込む</button></div></main>`;
  const all=stat(S.Q),pct=all.total?all.done/all.total*100:0,ex=S.P.exams||[],exr=ex.length?Math.round(ex.reduce((a,e)=>a+e.ok/e.n,0)/ex.length*100):null;
  return `<header><button class="ib" onclick="go('settings')" aria-label="設定">⚙</button><h1>GH-300 学習</h1><button class="ib" onclick="go('stats')" aria-label="統計">📊</button><button class="ib" onclick="S.cfg.mode='bm';S.cfg.sec='all';go('study')" aria-label="ブックマーク">🔖</button></header>
  <main><div class="hero"><div style="flex:1"><div class="big">${all.done}<small> / ${all.total}</small></div><small>学習済みの問題</small><div class="bar"><i style="width:${pct}%"></i></div><small>${Math.round(pct)}% 完了</small></div><div style="text-align:center"><div class="ring" style="margin:0 auto">${exr==null?'--':exr+'%'}</div><small>模擬試験 平均</small></div></div>
  <div style="height:14px"></div><button class="btn" onclick="go(S.E?'paused':'examcfg')">🎯 模擬試験${S.E?'（中断中・再開）':''}</button><div style="height:10px"></div><button class="btn ghost" onclick="S.cfg.sec='all';S.cfg.mode='seq';go('study')">▶ 全問題を学習</button>
  ${hasDom()?`<div class="sec"><span>ドメイン</span><span>公式配分</span></div>${[1,2,3,4,5,6].map(d=>{const st=stat(S.Q.filter(q=>q.domain===d));return `<div class="card item" onclick="S.cfg.sec='d${d}';go('study')"><div class="num">${DOM[d].ic}</div><div class="t"><b>D${d} ${DOM[d].n}</b><small>${st.total} 問 / ${st.done} 解答済み　・　${DOM[d].w}%</small><div class="bar light"><i style="width:${st.total?st.done/st.total*100:0}%"></i></div></div>${st.rate!=null?`<div class="pct">${st.rate}%<small>正答率</small></div>`:''}<span style="color:var(--sub)">›</span></div>`}).join('')}`:''}
  ${hasKb()?`<div class="sec"><span>知識ベースの章</span><span>${Object.keys(KB).length} 章</span></div>${Object.keys(KB).map(Number).map(k=>{const st=stat(S.Q.filter(q=>q.kb===k));if(!st.total)return '';return `<div class="card item" onclick="S.cfg.sec='k${k}';go('study')"><div class="num">${k}</div><div class="t"><b>${KB[k]}</b><small>${st.total} 問 / ${st.done} 解答済み</small><div class="bar light"><i style="width:${st.done/st.total*100}%"></i></div></div>${st.rate!=null?`<div class="pct">${st.rate}%<small>正答率</small></div>`:''}<span style="color:var(--sub)">›</span></div>`}).join('')}`:''}
  <div class="sec"><span>練習テスト</span><span>${tests().length} 本</span></div>
  ${tests().map(t=>{const st=stat(S.Q.filter(q=>q.test===t));return `<div class="card item" onclick="S.cfg.sec=${t};go('study')"><div class="num">${t}</div><div class="t"><b>練習テスト ${String(t).padStart(2,'0')}</b><small>${st.total} 問 / ${st.done} 解答済み</small><div class="bar light"><i style="width:${st.total?st.done/st.total*100:0}%"></i></div></div>${st.rate!=null?`<div class="pct">${st.rate}%<small>正答率</small></div>`:''}<span style="color:var(--sub)">›</span></div>`}).join('')}
  </main>`},

study(){
  const opts=[['seq','📋','順番通り','問題番号順に出題'],['new','✨','未学習','まだ解答していない問題のみ'],['wrong','⚠️','最近不正解','直前の解答が不正解の問題'],['wrong3','🔁','直近3回で不正解','直近3回に1回以上間違えた問題'],['bm','🔖','ブックマーク','ブックマークした問題']];
  const n=pick().length;
  return `<header>${back('home')}<h1>学習${S.cfg.sec==='all'?'':String(S.cfg.sec).startsWith('k')?'（第'+String(S.cfg.sec).slice(1)+'章）':String(S.cfg.sec).startsWith('d')?'（'+DOM[String(S.cfg.sec).slice(1)].n+'）':'（テスト'+S.cfg.sec+'）'}</h1><span style="width:44px"></span></header><main>
  <div class="card"><h3>学習モード</h3>${opts.map(o=>`<div class="opt ${S.cfg.mode===o[0]?'on':''}" onclick="S.cfg.mode='${o[0]}';render()"><span>${o[1]}</span><div><b>${o[2]}</b><small>${o[3]}</small></div><span class="radio"></span></div>`).join('')}</div>
  <div class="card"><h3>出題順</h3><div class="chips"><div class="chip ${!S.cfg.shuffle?'on':''}" onclick="S.cfg.shuffle=false;render()">順番</div><div class="chip ${S.cfg.shuffle?'on':''}" onclick="S.cfg.shuffle=true;render()">ランダム</div></div></div></main>
  <div class="dock"><button class="btn" ${n?'':'disabled'} onclick="start()">▶ はじめる（${n} 問）</button></div>`},

q(){const s=S.ses,q=s.qs[s.i],multi=q.answer.length>1;
  return `<header>${back('home').replace('‹','⌂')}<h1>練習テスト ${String(q.test).padStart(2,'0')}</h1><button class="tb" onclick="go('result')">終了</button></header><main>
  <div class="timer" style="font-weight:500;color:var(--sub)"><span>${s.i+1} / ${s.qs.length}</span><span>${q.id}</span></div><div class="bar light" style="margin:8px 0 12px"><i style="width:${(s.i+1)/s.qs.length*100}%"></i></div>
  <div class="meta">${q.kb?`<span class="tag">第${q.kb}章 ${KB[q.kb]}</span>`:''}<span class="sp"></span><span onclick="bm('${q.id}')" style="font-size:22px;cursor:pointer" role="button" aria-label="ブックマーク">${S.P.bm[q.id]?'🔖':'📑'}</span></div>
  <div class="card q"><div class="md">${md(q.q)}</div></div>${multi?`<p class="hint">${q.answer.length} つ選択してください</p>`:''}
  ${q.options.map((t,i)=>{let c='';if(s.done){c=q.answer.includes(i)?(s.sel.includes(i)?'ok':'miss'):s.sel.includes(i)?'ng':''}else if(s.sel.includes(i))c='sel';
    return `<div class="ans ${c}" onclick="toggle(${i})"><span class="k">${L[i]}</span><span>${md(t)}</span></div>`}).join('')}
  ${s.done?`<div class="exp"><b>${s.last?'✅ 正解':'❌ 不正解（正解: '+q.answer.map(a=>L[a]).join(', ')+'）'}</b><br><br>${md(q.explanation)}${q.tips?`<br><br><b>ポイント</b><br>${md(q.tips)}`:''}</div>`:''}</main>
  <div class="dock">${s.done?`<button class="btn" onclick="next()">${s.i<s.qs.length-1?'次の問題へ':'結果を見る'}</button>`:`<button class="btn" ${s.sel.length?'':'disabled'} onclick="submit()">回答する</button>`}</div>`},

result(){const s=S.ses;const n=s.i+(s.done?1:0);
  return `<header><span style="width:44px"></span><h1>結果</h1><span style="width:44px"></span></header><main><div class="card" style="text-align:center"><div class="big" style="font-size:44px;font-weight:800">${n?Math.round(s.ok/n*100):0}%</div><p>${n} 問中 ${s.ok} 問正解</p></div></main>
  <div class="dock"><button class="btn" onclick="go('home')">ホームへ</button></div>`},

examcfg(){return `<header>${back('home')}<h1>模擬試験 設定</h1><span style="width:44px"></span></header><main>
  <div class="card"><h3>出題数</h3><div class="chips">${[10,20,30,60].map(n=>`<div class="chip ${S.ex.n===n?'on':''}" onclick="S.ex.n=${n};render()">${n} 問</div>`).join('')}</div></div>
  <div class="card"><h3>制限時間</h3><div class="chips">${[30,60,100].map(n=>`<div class="chip ${S.ex.min===n?'on':''}" onclick="S.ex.min=${n};render()">${n} 分</div>`).join('')}</div><small style="color:var(--sub);display:block;margin-top:10px">本試験の目安: 60 問 / 100 分 / 合格 700/1000（公式で要確認）。合格ラインは 70% で表示します。</small></div>
  ${hasDom()?`<div class="card"><h3>ドメイン比率</h3>${[['official','📐','公式配分<span class="pill">推奨</span>','D1:18% D2:28% D3:13% D4:13% D5:14% D6:14%'],['even','⚖️','均等','6 ドメイン均等']].map(o=>`<div class="opt ${S.ex.ratio===o[0]?'on':''}" onclick="S.ex.ratio='${o[0]}';render()"><span>${o[1]}</span><div><b>${o[2]}</b><small>${o[3]}</small></div><span class="radio"></span></div>`).join('')}</div>`:`<div class="card"><h3>出題範囲</h3><p style="margin:0">読み込み済み ${S.Q.length} 問からランダム出題</p></div>`}</main>
  <div class="dock"><button class="btn" onclick="startExam()">▶ 試験開始</button></div>`},

exam(){const E=S.E,q=byId(E.ids[E.i]),sel=E.ans[E.i]||[],multi=q.answer.length>1,last=E.i===E.ids.length-1;
  return `<header><button class="ib" onclick="go('examlist')" aria-label="問題一覧">▦</button><h1>模擬試験</h1><button class="ib" onclick="pauseExam()" aria-label="中断">⏸</button></header><main>
  <div class="timer"><span>⏱ <span id="tm">${fmt(E.left)}</span></span><span style="color:var(--sub)">${E.i+1} / ${E.ids.length}</span></div>
  <div class="meta"><span class="sp"></span>${q.id}<span onclick="exFlag()" style="font-size:20px;cursor:pointer" role="button" aria-label="フラグ">${E.flag[E.i]?'🚩':'⚑'}</span></div>
  <div class="card q"><div class="md">${md(q.q)}</div></div>${multi?`<p class="hint">${q.answer.length} つ選択してください</p>`:''}
  ${q.options.map((t,i)=>`<div class="ans ${sel.includes(i)?'sel':''}" onclick="exAns(${i})"><span class="k">${L[i]}</span><span>${md(t)}</span></div>`).join('')}</main>
  <div class="dock"><div class="flex"><button class="btn ghost" ${E.i?'':'disabled'} onclick="exMove(-1)">前へ</button>${last?`<button class="btn" onclick="finishExam()">採点する</button>`:`<button class="btn" onclick="exMove(1)">次へ</button>`}</div></div>`},

examlist(){const E=S.E;return `<header>${back('exam')}<h1>問題一覧</h1><button class="tb" onclick="finishExam()">採点</button></header><main>
  <div class="card"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">${E.ids.map((_,i)=>{const a=!!E.ans[i];return `<div onclick="S.E.i=${i};go('exam')" style="height:48px;border-radius:12px;display:grid;place-items:center;font-weight:700;cursor:pointer;position:relative;border:2px solid ${i===E.i?'var(--pri)':'var(--line)'};background:${a?'var(--pri)':'var(--card)'};color:${a?'#fff':'var(--ink)'}">${i+1}${E.flag[i]?'<span style="position:absolute;top:-6px;right:-4px;font-size:14px">🚩</span>':''}</div>`}).join('')}</div>
  <p class="note">回答済み ${Object.keys(E.ans).length} / ${E.ids.length}　・　🚩 フラグ ${Object.values(E.flag).filter(Boolean).length}</p></div></main>`},

paused(){const E=S.E,n=Object.keys(E.ans).length,d=new Date(E.pausedAt||Date.now());
  return `<header>${back('home')}<h1>中断中の試験</h1><span style="width:44px"></span></header><main>
  <div class="card" style="text-align:center"><div class="bar light"><i style="width:${n/E.ids.length*100}%"></i></div><b style="font-size:20px;display:block;margin-top:14px">${n} / ${E.ids.length}</b></div>
  <div class="stats"><div class="card">✅<b>${n}</b><small>回答済</small></div><div class="card">⏱<b>${Math.round((E.total-E.left)/60)}分</b><small>経過時間</small></div><div class="card">⏳<b>${Math.ceil(E.left/60)}分</b><small>残り</small></div></div>
  <p class="note">${d.getMonth()+1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')} に中断</p>
  <button class="btn" onclick="resumeExam()">▶ 試験を再開</button><div style="height:10px"></div><button class="btn ghost" onclick="discardExam()">破棄して新しい試験を開始</button></main>`},

examresult(){const r=S.rv,pct=Math.round(r.ok/r.n*100),pass=pct>=70;
  return `<header><span style="width:44px"></span><h1>試験結果</h1><span style="width:44px"></span></header><main>
  <div class="card" style="text-align:center"><div style="font-size:48px;font-weight:800;color:${pass?'var(--ok)':'var(--ng)'}">${pct}%</div><b>${pass?'合格ライン到達（70%）':'合格ライン（70%）未達'}</b><p style="color:var(--sub);margin:6px 0 0">${r.n} 問中 ${r.ok} 問正解　・　所要 ${Math.round(r.used/60)} 分</p></div>
  <div class="sec"><span>問題ごとの結果</span><span>タップで解説</span></div>
  <div class="card">${r.ids.map((id,i)=>{const ok=isOk(byId(id),r.ans[i]);return `<div class="opt" onclick="reviewQ(${i})"><span>${ok?'✅':(r.ans[i]?'❌':'➖')}</span><div><b>問 ${i+1}</b><small>${esc(byId(id).q.replace(/\*\*/g,'').slice(0,46))}…</small></div><span style="margin-left:auto;color:var(--sub)">›</span></div>`}).join('')}</div></main>
  <div class="dock"><button class="btn" onclick="go('home')">ホームへ</button></div>`},

review(){const r=S.rv,i=r.cur,q=byId(r.ids[i]),sel=r.ans[i]||[];
  return `<header>${back('examresult')}<h1>問 ${i+1} / ${r.n}</h1><span style="width:44px"></span></header><main>
  <div class="card q"><div class="md">${md(q.q)}</div></div>
  ${q.options.map((t,k)=>{const c=q.answer.includes(k)?(sel.includes(k)?'ok':'miss'):sel.includes(k)?'ng':'';return `<div class="ans ${c}"><span class="k">${L[k]}</span><span>${md(t)}</span></div>`}).join('')}
  <div class="exp"><b>${isOk(q,sel)?'✅ 正解':'❌ '+(sel.length?'不正解':'未回答')+'（正解: '+q.answer.map(a=>L[a]).join(', ')+'）'}</b><br><br>${md(q.explanation)}${q.tips?`<br><br><b>ポイント</b><br>${md(q.tips)}`:''}</div></main>
  <div class="dock"><div class="flex"><button class="btn ghost" ${i?'':'disabled'} onclick="reviewQ(${i-1})">前へ</button><button class="btn" ${i<r.n-1?'':'disabled'} onclick="reviewQ(${i+1})">次へ</button></div></div>`},

stats(){const all=stat(S.Q),ex=(S.P.exams||[]).slice(-10).reverse();
  const rows=hasDom()?[1,2,3,4,5,6].map(d=>({n:`D${d} ${DOM[d].n}`,st:stat(S.Q.filter(q=>q.domain===d))})):tests().map(t=>({n:'練習テスト '+String(t).padStart(2,'0'),st:stat(S.Q.filter(q=>q.test===t))}));
  const weak=rows.filter(r=>r.st.rate!=null).sort((a,b)=>a.st.rate-b.st.rate)[0];
  return `<header>${back('home')}<h1>統計</h1><span style="width:44px"></span></header><main>
  <div class="stats"><div class="card"><b>${all.done}</b><small>解答済み</small></div><div class="card"><b>${all.rate==null?'--':all.rate+'%'}</b><small>正答率</small></div><div class="card"><b>${(S.P.exams||[]).length}</b><small>模擬試験</small></div></div>
  <div class="sec"><span>${hasDom()?'ドメイン別':'テスト別'}の正答率</span><span>直近の解答ベース</span></div>
  <div class="card">${rows.map(r=>`<div style="margin:6px 0 14px"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${r.n}</span><b style="color:${r.st.rate==null?'var(--sub)':r.st.rate>=70?'var(--ok)':'var(--acc)'}">${r.st.rate==null?'未学習':r.st.rate+'%'}</b></div><div class="bar light"><i style="width:${r.st.rate||0}%"></i></div><small style="color:var(--sub)">${r.st.done} / ${r.st.total} 問</small></div>`).join('')}
  ${weak?`<p class="note">最も弱い分野: ${weak.n}（${weak.st.rate}%）</p>`:''}</div>
  <div class="sec"><span>模擬試験の履歴</span><span>${ex.length?'直近10回':''}</span></div>
  <div class="card">${ex.length?ex.map(e=>{const p=Math.round(e.ok/e.n*100),d=new Date(e.at);return `<div class="opt"><span>${p>=70?'✅':'❌'}</span><div><b>${p}%（${e.ok} / ${e.n}）</b><small>${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}　所要 ${Math.round(e.used/60)} 分</small></div></div>`}).join(''):'<p class="note">まだ受験していません</p>'}</div></main>`},

settings(){return `<header>${back('home')}<h1>設定</h1><span style="width:44px"></span></header><main>
  <div class="card"><h3>問題データ</h3><p style="margin:0 0 12px">${S.Q.length} 問を読み込み済み</p><button class="btn" onclick="pickFile()">問題JSONを読み込む</button><div style="height:10px"></div><button class="btn ghost" onclick="wipe('data')">問題データを削除</button></div>
  <div class="card"><h3>学習履歴</h3><button class="btn ghost" onclick="wipe('progress')">履歴とブックマークを消去</button></div>
  <div class="note">データはこの端末内にのみ保存されます</div></main>`}
};
function render(){$app.innerHTML=`<div class="screen" style="display:flex;flex-direction:column;height:100%;min-height:0">${V[S.route]()}</div>`}
(async()=>{
  try{S.Q=(await DB.get('questions'))||[];S.P=(await DB.get('progress'))||S.P;S.P.exams=S.P.exams||[];S.E=(await DB.get('exam'))||null;if(S.E&&!S.Q.length)S.E=null;navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){console.warn(e)}
  render();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
