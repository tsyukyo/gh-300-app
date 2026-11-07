'use strict';
// ================= 永続化 (IndexedDB) =================
const DB={
  open(){return this._p||(this._p=new Promise((res,rej)=>{const r=indexedDB.open('gh300',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
  async get(k){const d=await this.open();return new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  async set(k,v){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
};

// ================= 定数: ドメイン / セクション =================
const DOM={
  1:{n:'責任ある AI の活用',w:18,c:'#4c9a5c',ic:'shield',secs:[1,2]},
  2:{n:'Copilot 機能の活用',w:28,c:'#4472d6',ic:'spark',secs:[3,4,5,6]},
  3:{n:'データとアーキテクチャ',w:13,c:'#7b61cf',ic:'db',secs:[7,8]},
  4:{n:'プロンプトエンジニアリング',w:13,c:'#d08e3f',ic:'chat',secs:[9,10]},
  5:{n:'開発者生産性の向上',w:14,c:'#3f9a98',ic:'gauge',secs:[11,12]},
  6:{n:'プライバシーとセーフガード',w:14,c:'#c4554a',ic:'lock',secs:[13,14]}};
const SEC={1:'責任ある AI の原則',2:'AI 出力の検証と運用',3:'IDE での Copilot 活用',4:'GitHub Copilot CLI',5:'Agent Mode・MCP・先進機能',6:'組織ポリシーと管理',7:'データの取り扱いとフロー',8:'候補生成ライフサイクルと LLM の限界',9:'効果的なプロンプト作成',10:'プロンプトエンジニアリングの原理',11:'コード生成・リファクタリング・文書化',12:'テストとセキュリティ支援',13:'プライバシー設定とコンテンツ除外',14:'セーフガードとトラブルシュート'};
const SEC2DOM={};Object.entries(DOM).forEach(([d,v])=>v.secs.forEach(s=>SEC2DOM[s]=+d));
const KB2SEC={1:1,2:6,3:3,4:9,5:7,6:13,7:6,8:11,9:12,10:5,11:5,12:5}; // 旧データ(kbのみ)用の代替
const secOf=q=>q.sec||KB2SEC[q.kb]||0;
const domOf=q=>SEC2DOM[secOf(q)]||0;
const L='ABCDEFGHIJ';

// ================= アイコン =================
const P={
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  bars:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bm:'<path d="M6 3h12v18l-6-4-6 4z"/>',
  home:'<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  chev:'<path d="M9 5l7 7-7 7"/>',
  check:'<path d="M5 12l5 5L20 7"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  flag:'<path d="M5 21V4h12l-2 4 2 4H5"/>',
  grid:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  pause:'<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play:'<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  clock:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  db:'<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  chat:'<path d="M4 4h16v12H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  gauge:'<circle cx="12" cy="13" r="9"/><path d="M12 13l4-4M7 17h10"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><path d="M12 15v2"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>',
  warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  redo:'<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',
  retry:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  xc:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  doc:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  pb:'<path d="M8 4h8v3H8zM6 6h12v15H6zM9 12h6M9 16h6"/>',
  card:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>'
};
const ic=(n,s)=>`<svg viewBox="0 0 24 24"${s?` style="width:${s}px;height:${s}px"`:''}>${P[n]||''}</svg>`;

// ================= 状態 =================
const S={route:'home',Q:[],P:{hist:{},bm:{},exams:[],chunk:{}},E:null,ses:null,rv:null,
  cfg:{mode:'seq',shuffle:false,sec:'all',chunk:'all'},ex:{n:30,min:60,ratio:'official'},list:{tab:'all'}};
const $app=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^\s*- /gm,'• ').replace(/\n/g,'<br>');
const save=()=>DB.set('progress',S.P);
const saveE=()=>DB.set('exam',S.E);
const go=r=>{S.route=r;render()};
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$app.append(t);setTimeout(()=>t.remove(),2000)}
const fmt=t=>[Math.floor(t/3600),Math.floor(t%3600/60),t%60].map(x=>String(x).padStart(2,'0')).join(':');
const byId=id=>S.Q.find(q=>q.id===id);
const dispId=q=>'Q_'+String(q.id.split('_')[1]||'0').padStart(5,'0');
const lastOk=id=>{const h=S.P.hist[id];return h&&h.length?h[h.length-1]:null};
const isOk=(q,sel)=>!!sel&&sel.length===q.answer.length&&q.answer.every(a=>sel.includes(a));
const stat=qs=>{let d=0,ok=0;for(const q of qs){const h=S.P.hist[q.id];if(h&&h.length){d++;if(h[h.length-1])ok++}}return{total:qs.length,done:d,rate:d?Math.round(ok/d*100):null}};
const inSec=s=>S.Q.filter(q=>secOf(q)===s);
const inDom=d=>S.Q.filter(q=>domOf(q)===d);
const hasSec=()=>S.Q.some(q=>secOf(q));
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const hdr=(left,title,right)=>`<header>${left}<h1>${title}</h1>${right||'<span style="width:44px"></span>'}</header>`;
const backB=to=>`<button class="ib" onclick="go('${to}')" aria-label="戻る">${ic('back')}</button>`;
let tick=null;const stopTick=()=>{clearInterval(tick);tick=null};

// ================= 学習 =================
const MODES=[['seq','list','順番通り','セクション内の問題を順番に学習'],['new','sparkle','未学習','まだ解答していない問題のみ出題'],['wrong','warn','最近不正解','直前の解答が不正解の問題を出題'],['wrong3','redo','直近 3 回で不正解','過去3回中1回以上間違えた問題を出題'],['bm','bm','ブックマーク','ブックマークした問題を出題']];
const baseList=()=>{const sc=S.cfg.sec;let qs=sc==='all'?S.Q:String(sc).startsWith('d')?inDom(+String(sc).slice(1)):inSec(+String(sc).slice(1));return[...qs].sort((a,b)=>a.id<b.id?-1:1)};
const chunks=()=>{const b=baseList(),o=[];for(let i=0;i<b.length;i+=10)o.push(b.slice(i,i+10));return o};
const chunkKey=i=>S.cfg.sec+':'+i;
function pick(){
  let qs=baseList();
  if(S.cfg.chunk!=='all')qs=chunks()[S.cfg.chunk]||[];
  const m=S.cfg.mode;
  if(m==='new')qs=qs.filter(q=>!(S.P.hist[q.id]||[]).length);
  if(m==='wrong')qs=qs.filter(q=>lastOk(q.id)===false);
  if(m==='wrong3')qs=qs.filter(q=>(S.P.hist[q.id]||[]).slice(-3).includes(false));
  if(m==='bm')qs=qs.filter(q=>S.P.bm[q.id]);
  return S.cfg.shuffle?shuf(qs):qs}
function openStudy(sec){S.cfg.sec=sec;S.cfg.chunk='all';go('study')}
function start(){const qs=pick();if(!qs.length){toast('該当する問題がありません');return}
  S.ses={qs,i:0,sel:[],done:false,ok:0,n:0,key:S.cfg.chunk==='all'?null:chunkKey(S.cfg.chunk)};go('q')}
function toggle(i){const s=S.ses,q=s.qs[s.i];if(s.done)return;
  if(q.answer.length>1){const k=s.sel.indexOf(i);k<0?s.sel.push(i):s.sel.splice(k,1)}else s.sel=[i];render()}
function submit(){const s=S.ses,q=s.qs[s.i];if(!s.sel.length)return;
  const ok=isOk(q,s.sel);record(q.id,ok);if(ok)s.ok++;s.n++;s.done=true;s.last=ok;save();render()}
function record(id,ok){(S.P.hist[id]=S.P.hist[id]||[]).push(ok);if(S.P.hist[id].length>20)S.P.hist[id].shift()}
function next(){const s=S.ses;if(s.i<s.qs.length-1){s.i++;s.sel=[];s.done=false;render()}else endSession()}
function endSession(){const s=S.ses;if(s.key&&s.n){S.P.chunk=S.P.chunk||{};S.P.chunk[s.key]=Math.round(s.ok/s.n*100);save()}go('result')}
function bm(id){S.P.bm[id]?delete S.P.bm[id]:S.P.bm[id]=true;save();render()}

// ================= 模擬試験 =================
function makeIds(n){
  const N=Math.min(n,S.Q.length);
  if(!hasSec())return shuf(S.Q).slice(0,N).map(q=>q.id);
  const ds=[1,2,3,4,5,6],pool={};ds.forEach(d=>pool[d]=shuf(inDom(d)));
  const w=ds.map(d=>S.ex.ratio==='official'?DOM[d].w:100/6),tw=w.reduce((a,b)=>a+b,0),raw=w.map(x=>x/tw*N),cnt=raw.map(Math.floor);
  let rem=N-cnt.reduce((a,b)=>a+b,0);
  raw.map((r,i)=>[r-Math.floor(r),i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(rem>0){cnt[i]++;rem--}});
  let ids=[];ds.forEach((d,i)=>ids.push(...pool[d].splice(0,cnt[i]).map(q=>q.id)));
  const rest=shuf(ds.flatMap(d=>pool[d]).map(q=>q.id));while(ids.length<N&&rest.length)ids.push(rest.shift());
  return shuf(ids)}
function beginExam(ids){
  if(!ids.length){toast('出題できる問題がありません');return}
  S.E={ids,ans:{},flag:{},i:0,left:S.ex.min*60,total:S.ex.min*60,paused:false,at:Date.now()};
  saveE();go('exam');runTick()}
function startExam(){if(!S.Q.length){toast('問題データがありません');return}beginExam(makeIds(S.ex.n))}
function runTick(){stopTick();let c=0;tick=setInterval(()=>{if(!S.E)return stopTick();S.E.left--;c++;
  const t=document.getElementById('tm');if(t)t.textContent=fmt(S.E.left);
  if(c%5===0)saveE();if(S.E.left<=0){toast('時間切れです');finishExam(true)}},1000)}
function exAns(i){const E=S.E,q=byId(E.ids[E.i]);let sel=E.ans[E.i]||[];
  if(q.answer.length>1)sel=sel.includes(i)?sel.filter(x=>x!==i):[...sel,i];else sel=[i];
  E.ans[E.i]=sel;saveE();render()}
function exMove(d){S.E.i=Math.max(0,Math.min(S.E.ids.length-1,S.E.i+d));saveE();render()}
function exFlag(){const E=S.E;E.flag[E.i]=!E.flag[E.i];saveE();render()}
function pauseExam(){stopTick();S.E.paused=true;S.E.pausedAt=Date.now();saveE();go('paused')}
function resumeExam(){S.E.paused=false;saveE();go('exam');runTick()}
function discardExam(){if(confirm('中断中の試験を破棄しますか？')){stopTick();S.E=null;DB.set('exam',null);go('examcfg')}}
function finishExam(force){
  const E=S.E;if(!E)return;
  const un=E.ids.length-Object.keys(E.ans).length;
  if(!force&&un>0&&!confirm(`未回答が ${un} 問あります。採点しますか？`))return;
  stopTick();let ok=0;
  E.ids.forEach((id,i)=>{const q=byId(id),sel=E.ans[i],r=isOk(q,sel);if(r)ok++;if(sel)record(id,r)});
  const rec={at:Date.now(),n:E.ids.length,ok,used:E.total-E.left,limit:E.total,ids:E.ids,ans:E.ans};
  S.P.exams=S.P.exams||[];S.P.exams.push({at:rec.at,n:rec.n,ok,used:rec.used});
  S.rv=rec;S.list.tab='all';S.E=null;DB.set('exam',null);save();go('examresult')}
const wrongIds=r=>r.ids.filter((id,i)=>!isOk(byId(id),r.ans[i]));
function retake(kind){const r=S.rv;if(kind==='same')beginExam(shuffle0(r.ids));else if(kind==='wrong')beginExam(shuf(wrongIds(r)));else go('examcfg')}
const shuffle0=a=>shuf(a);
function reviewQ(i){S.rv.cur=i;go('review')}

// ================= 読み込み =================
async function importFiles(files){
  let add=0;const map=new Map(S.Q.map(q=>[q.id,q]));
  for(const f of files){
    try{const j=JSON.parse(await f.text());if(!Array.isArray(j))throw 0;
      for(const q of j){if(!q||!q.id||!q.q||!Array.isArray(q.options)||!Array.isArray(q.answer))throw 0;if(!map.has(q.id))add++;map.set(q.id,q)}
    }catch(e){toast(f.name+' は問題JSONとして読めません');return}
  }
  S.Q=[...map.values()].sort((a,b)=>a.id<b.id?-1:1);await DB.set('questions',S.Q);
  toast(`${add} 問を追加（計 ${S.Q.length} 問）`);render()}
document.getElementById('file').addEventListener('change',e=>{if(e.target.files.length)importFiles([...e.target.files]);e.target.value=''});
const pickFile=()=>document.getElementById('file').click();
async function wipe(what){
  if(what==='progress'&&confirm('学習履歴とブックマークを消去しますか？')){S.P={hist:{},bm:{},exams:[],chunk:{}};await save();toast('履歴を消去しました')}
  if(what==='data'&&confirm('読み込んだ問題データを削除しますか？')){S.Q=[];await DB.set('questions',[]);toast('問題データを削除しました')}
  render()}

// ================= 部品 =================
const dbar=(name,rate,color)=>`<div class="dbar"><div class="l"><span>${name}</span><b style="color:${rate==null?'var(--sub)':color||'var(--ink)'}">${rate==null?'—':rate+'%'}</b></div><div class="bar"><i style="width:${rate||0}%;background:${color||'var(--bar)'}"></i></div></div>`;
const optRow=(key,val,cur,icon,t,s,fn)=>`<div class="opt ${cur===val?'on':''}" onclick="${fn}"><span class="oi">${ic(icon)}</span><div><b>${t}</b><small>${s}</small></div><span class="radio"></span></div>`;
function qTags(q){const d=domOf(q),s=secOf(q);return `<span class="tag" ${d?`style="background:${DOM[d].c}"`:''}>${d?DOM[d].n:'—'}</span>${q.answer.length>1?'<span class="tag o">複数選択</span>':'<span class="tag o">単一</span>'}`}
const optList=(q,cls)=>q.options.map((t,i)=>`<div class="ans ${cls(i)}" onclick="${cls.fn?cls.fn(i):''}"><span class="k">${L[i]}</span><span>${md(t)}</span></div>`).join('');
const expl=q=>!q.explanation?`<div class="exp">この問題には解説がありません（正解のみ収録）。</div>`:`<div class="exp">${md(q.explanation)}${q.tips?`<br><br><b>ポイント</b><br>${md(q.tips)}`:''}</div>`;

// ================= 画面 =================
const V={
home(){
  const head=`<header><div class="pillg"><button class="ib" onclick="go('settings')" aria-label="設定">${ic('gear')}</button><button class="ib" onclick="go('info')" aria-label="試験情報">${ic('info')}</button></div><h1>GH-300: GitHub Copilot</h1><div class="pillg"><button class="ib" onclick="go('stats')" aria-label="統計">${ic('bars')}</button><button class="ib" onclick="S.cfg.mode='bm';openStudy('all')" aria-label="ブックマーク">${ic('bm')}</button></div></header>`;
  if(!S.Q.length)return head+`<main><div class="empty"><div style="font-size:48px">📚</div><h2>問題データがありません</h2><p>問題JSONファイルを読み込むと学習を始められます。</p><div style="height:12px"></div><button class="btn" onclick="pickFile()">問題JSONを読み込む</button></div></main>`;
  const all=stat(S.Q),pct=all.total?Math.round(all.done/all.total*100):0,ex=S.P.exams||[],exr=ex.length?Math.round(ex.reduce((a,e)=>a+e.ok/e.n,0)/ex.length*100):null;
  const secCards=d=>DOM[d].secs.map(s=>{const st=stat(inSec(s));return `<div class="card item ${st.total?'':'lk'}" ${st.total?`onclick="openStudy('s${s}')"`:''} style="${st.total?'':'opacity:.5'}"><div class="num">${s}</div><div class="t"><b>${SEC[s]}</b><small>${st.total} 問 / ${st.done} 解答済み</small><div class="bar"><i style="width:${st.total?st.done/st.total*100:0}%"></i></div></div>${st.rate!=null?`<div class="pct">${st.rate}%<small>正答率</small></div>`:''}<span style="color:var(--sub)">${ic('chev',18)}</span></div>`}).join('');
  return head+`<main>
  <div class="hero"><div class="row"><div style="flex:1"><div class="big">${all.done}<small> / ${all.total}</small></div><small>セクション進捗</small><div class="bar"><i style="width:${pct}%"></i></div><small>${pct}% 完了</small></div><div class="div"></div><div style="text-align:center"><div class="ring">${exr==null?'--':exr+'%'}</div><small>模擬試験 正答率</small><br><small>${exr==null?'未受験':''}</small></div></div><div class="foot">${all.done} 問解答済み・模擬試験 ${ex.length} 回</div></div>
  <button class="btn" onclick="go(S.E?'paused':'examcfg')">${ic('target')} 模擬試験${S.E?'（再開）':''}</button>
  <div class="dh" style="margin-top:26px"><span>セクション</span></div>
  ${[1,2,3,4,5,6].map(d=>`<div class="dh"><span class="ic" style="color:${DOM[d].c}">${ic(DOM[d].ic)}</span><span>${DOM[d].n}</span><span>${DOM[d].w}%</span></div>${secCards(d)}`).join('')}
  <div style="height:8px"></div><button class="btn ghost" onclick="openStudy('all')">${ic('play')} 全問題を学習</button></main>`},

info(){
  const cnt=d=>inDom(d).length;
  return hdr(backB('home'),'試験情報')+`<main>
  <div style="text-align:center;margin:6px 0 14px;color:var(--navy)">${ic('spark',44)}<h2 style="color:var(--ink);margin:8px 0">GH-300 試験について</h2></div>
  <p style="color:var(--sub);line-height:1.8;margin:0 0 20px">GH-300（GitHub Copilot）試験は、GitHub Copilot を効果的かつ責任を持って活用する力を問います。IDE 機能、CLI、Agent Mode からデータの取り扱い、プロンプトエンジニアリング、プライバシーとセーフガードまで、6 つのドメインで構成されます。</p>
  <div class="lbl">ドメイン配分</div><div class="card">${[1,2,3,4,5,6].map(d=>dbar(DOM[d].n,DOM[d].w,DOM[d].c).replace(/>(\d+)%</,'>$1%<')).join('')}</div>
  <div style="text-align:center;margin:26px 0 8px;color:var(--navy)">${ic('card',40)}<h2 style="color:var(--ink);margin:8px 0">アプリのセクション構成</h2></div>
  <p style="color:var(--sub);margin:0 0 14px">6 ドメイン・14 セクション構成</p>
  ${[1,2,3,4,5,6].map(d=>`<div class="card" style="background:${DOM[d].c}1f"><div style="display:flex;align-items:center;gap:10px;font-weight:700"><span class="sc" style="background:${DOM[d].c}"></span>${DOM[d].n}</div>${DOM[d].secs.map(s=>`<div style="display:flex;justify-content:space-between;margin:10px 0 0 30px;color:var(--sub)"><span>${SEC[s]}</span><b style="color:${DOM[d].c}">${inSec(s).length} 問</b></div>`).join('')}</div>`).join('')}
  <div class="card" style="display:flex;justify-content:space-between;font-weight:700"><span>全 ${S.Q.length} 問</span><span>${S.Q.length}</span></div>
  <div class="lbl" style="margin-top:26px">出題形式</div><div class="card"><div class="opt"><span class="oi">${ic('check')}</span><div><b>単一選択</b><small>複数の選択肢から正解を 1 つ選びます。</small></div></div><div class="opt"><span class="oi">${ic('list')}</span><div><b>複数選択</b><small>複数の正解を選択します（問題文に選択数を明記）。</small></div></div></div>
  <div class="lbl">試験概要</div><div class="card"><div class="opt" style="cursor:default"><span>問題数</span><b style="margin-left:auto">公式サイト参照</b></div><div class="opt" style="cursor:default"><span>試験時間</span><b style="margin-left:auto">公式サイト参照</b></div><div class="opt" style="cursor:default"><span>合格基準</span><b style="margin-left:auto">700 / 1000</b></div></div></main>`},

study(){
  const ch=chunks(),n=pick().length,title=S.cfg.sec==='all'?'学習':String(S.cfg.sec).startsWith('s')?SEC[String(S.cfg.sec).slice(1)]:DOM[String(S.cfg.sec).slice(1)].n;
  return hdr(backB('home'),'学習')+`<main>
  <div class="card"><h3>${ic('doc',18)} 学習モード</h3>${MODES.map(o=>optRow('mode',o[0],S.cfg.mode,o[1],o[2],o[3],`S.cfg.mode='${o[0]}';render()`)).join('')}</div>
  <div class="card"><h3>${ic('list',18)} 出題順</h3><div class="chips" style="margin-top:8px"><div class="chip ${!S.cfg.shuffle?'on':''}" onclick="S.cfg.shuffle=false;render()">順番</div><div class="chip ${S.cfg.shuffle?'on':''}" onclick="S.cfg.shuffle=true;render()">ランダム</div></div></div>
  <div class="card"><h3>${ic('list',18)} 学習チャンク</h3>
    <div class="opt ${S.cfg.chunk==='all'?'on':''}" onclick="S.cfg.chunk='all';render()" style="padding:12px 8px;border-radius:12px;${S.cfg.chunk==='all'?'background:var(--chip)':''}"><div><b>すべて</b><small>${baseList().length} 問</small></div>${S.cfg.chunk==='all'?`<span style="margin-left:auto;color:var(--navy)">${ic('check')}</span>`:''}</div>
    ${ch.length>1?ch.map((c,i)=>{const sc=(S.P.chunk||{})[chunkKey(i)];return `<div class="opt" onclick="S.cfg.chunk=${i};render()" style="padding:12px 8px;border-radius:12px;${S.cfg.chunk===i?'background:var(--chip)':''}"><div><b>${dispId(c[0])} – ${dispId(c[c.length-1])}</b><small>${c.length} 問</small></div><span style="margin-left:auto;text-align:right">${sc!=null?`<small>前回スコア</small><br><b style="color:var(--acc)">${sc}%</b>`:''}${S.cfg.chunk===i?`<span style="color:var(--navy)">${ic('check')}</span>`:''}</span></div>`}).join(''):''}
  </div></main>
  <div class="dock"><div class="sum"><span class="chip s">${MODES.find(m=>m[0]===S.cfg.mode)[2]}</span><span class="chip s">${S.cfg.chunk==='all'?'すべて':'チャンク '+(S.cfg.chunk+1)}</span></div><button class="btn" ${n?'':'disabled'} onclick="start()">${ic('play',20)} はじめる（${n} 問）</button></div>`},

q(){const s=S.ses,q=s.qs[s.i],multi=q.answer.length>1,sec=SEC[secOf(q)]||'学習';
  const cls=i=>s.done?(q.answer.includes(i)?(s.sel.includes(i)?'ok':'miss'):s.sel.includes(i)?'ng':''):(s.sel.includes(i)?'sel':'');cls.fn=i=>`toggle(${i})`;
  return `<header><button class="ib" onclick="go('home')" aria-label="ホーム">${ic('home')}</button><h1>${esc(sec)}</h1><button class="tb" onclick="endSession()">セッション終了</button></header><main>
  <div style="color:var(--sub);font-size:14px">${s.i+1} / ${s.qs.length}</div><div class="bar" style="margin:6px 0 14px"><i style="width:${(s.i+1)/s.qs.length*100}%"></i></div>
  <div class="meta">${qTags(q)}<span class="sp"></span>${dispId(q)}<span onclick="bm('${q.id}')" style="cursor:pointer;color:var(--ink)" role="button" aria-label="ブックマーク">${ic('bm')}</span></div>
  <div class="card q"><div>${md(q.q)}</div></div>${multi?`<p class="hint">${q.answer.length} つ選択してください</p>`:''}
  ${optList(q,cls)}
  ${s.done?`<div class="banner ${s.last?'ok':'ng'}" style="margin-top:6px">${ic(s.last?'check':'x',26)} ${s.last?'正解':'不正解（正解: '+q.answer.map(a=>L[a]).join(', ')+'）'}</div>${expl(q)}`:''}</main>
  <div class="dock">${s.done?`<button class="btn" onclick="next()">${s.i<s.qs.length-1?'次の問題へ':'結果を見る'}</button>`:`<button class="btn" ${s.sel.length?'':'disabled'} onclick="submit()">回答する</button>`}</div>`},

result(){const s=S.ses,n=s.n;
  return hdr('<span style="width:44px"></span>','学習結果')+`<main><div class="hero" style="text-align:center"><div class="big">${s.ok}<small> / ${n}</small></div><div style="font-size:22px;font-weight:700;margin-top:10px">${n?Math.round(s.ok/n*100):0}%</div></div></main>
  <div class="dock"><button class="btn" onclick="go('study')">もう一度</button><button class="btn ghost" onclick="go('home')">ホームへ</button></div>`},

examcfg(){return hdr(backB('home'),'模擬試験 設定')+`<main>
  <div class="card"><h3>${ic('list',18)} 出題数</h3><div class="chips" style="margin-top:8px">${[10,20,30,60].map(n=>`<div class="chip ${S.ex.n===n?'on':''}" onclick="S.ex.n=${n};render()">${n} 問</div>`).join('')}</div></div>
  <div class="card"><h3>${ic('clock',18)} 制限時間</h3><div class="chips" style="margin-top:8px">${[30,60,100].map(n=>`<div class="chip ${S.ex.min===n?'on':''}" onclick="S.ex.min=${n};render()">${n} 分</div>`).join('')}</div><small style="color:var(--sub);display:block;margin-top:12px">本試験の目安: 60 問 / 100 分 / 合格 700/1000（公式で要確認）。合格ラインは 70% で表示します。</small></div>
  ${hasSec()?`<div class="card"><h3>${ic('gauge',18)} ドメイン比率</h3>${optRow('ratio','official',S.ex.ratio,'check','公式配分','D1:18% D2:28% D3:13% D4:13% D5:14% D6:14%',`S.ex.ratio='official';render()`)}${optRow('ratio','even',S.ex.ratio,'check','均等','6 ドメイン均等',`S.ex.ratio='even';render()`)}</div>`:''}</main>
  <div class="dock"><div class="sum"><span class="chip s">${S.ex.n} 問</span><span class="chip s">${S.ex.min} 分</span><span class="chip s">${S.ex.ratio==='official'?'GH-300 公式':'均等'}</span></div><button class="btn" onclick="startExam()">${ic('play',20)} 試験開始</button></div>`},

exam(){const E=S.E,q=byId(E.ids[E.i]),sel=E.ans[E.i]||[],multi=q.answer.length>1,last=E.i===E.ids.length-1;
  return `<header><button class="ib" onclick="go('examlist')" aria-label="問題一覧">${ic('grid')}</button><h1>模擬試験</h1><button class="ib" onclick="pauseExam()" aria-label="中断">${ic('pause')}</button></header><main>
  <div class="timer"><span>${ic('clock',22)}<span id="tm">${fmt(E.left)}</span></span><span style="color:var(--sub);font-weight:500">${E.i+1} / ${E.ids.length}</span></div>
  <div class="meta">${qTags(q)}<span class="sp"></span>${dispId(q)}<span onclick="exFlag()" style="cursor:pointer;color:${E.flag[E.i]?'var(--acc)':'var(--ink)'}" role="button" aria-label="フラグ">${ic('flag')}</span></div>
  <div class="card q"><div>${md(q.q)}</div></div>${multi?`<p class="hint">${q.answer.length} つ選択してください</p>`:''}
  ${q.options.map((t,i)=>`<div class="ans ${sel.includes(i)?'sel':''}" onclick="exAns(${i})"><span class="k">${L[i]}</span><span>${md(t)}</span></div>`).join('')}</main>
  <div class="dock"><div class="flex"><button class="btn ghost" ${E.i?'':'disabled'} onclick="exMove(-1)">前へ</button>${last?`<button class="btn" onclick="finishExam()">採点する</button>`:`<button class="btn" onclick="exMove(1)">次へ</button>`}</div></div>`},

examlist(){const E=S.E;return hdr(backB('exam'),'問題一覧','<button class="tb" onclick="finishExam()" style="color:var(--navy)">採点</button>')+`<main>
  <div class="card"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">${E.ids.map((_,i)=>{const a=!!E.ans[i];return `<div onclick="S.E.i=${i};go('exam')" style="height:48px;border-radius:12px;display:grid;place-items:center;font-weight:700;cursor:pointer;position:relative;border:2px solid ${i===E.i?'var(--navy)':'var(--line)'};background:${a?'var(--navy)':'var(--card)'};color:${a?'var(--card)':'var(--ink)'}">${i+1}${E.flag[i]?`<span style="position:absolute;top:-7px;right:-5px;color:var(--acc)">${ic('flag',16)}</span>`:''}</div>`}).join('')}</div>
  <p class="note">回答済み ${Object.keys(E.ans).length} / ${E.ids.length}　・　フラグ ${Object.values(E.flag).filter(Boolean).length}</p></div></main>`},

paused(){const E=S.E,n=Object.keys(E.ans).length,d=new Date(E.pausedAt||Date.now());
  return hdr(backB('home'),'中断中の試験')+`<main>
  <div class="card" style="text-align:center"><div class="bar"><i style="width:${n/E.ids.length*100}%"></i></div><b style="font-size:20px;display:block;margin-top:14px">${n} / ${E.ids.length}</b></div>
  <div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="card" style="text-align:center">${ic('check')}<b style="font-size:22px">${n}</b><small>回答済</small></div><div class="card" style="text-align:center">${ic('clock')}<b style="font-size:22px">${Math.round((E.total-E.left)/60)}分</b><small>経過時間</small></div><div class="card" style="text-align:center">${ic('clock')}<b style="font-size:22px">${Math.ceil(E.left/60)}分</b><small>残り</small></div></div>
  <p class="note">${d.getMonth()+1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')} に中断</p>
  <button class="btn" onclick="resumeExam()">${ic('play',20)} 試験を再開</button><div style="height:12px"></div><button class="btn ghost" onclick="discardExam()">新しい試験を開始</button></main>`},

examresult(){const r=S.rv,pct=Math.round(r.ok/r.n*100),pass=pct>=70;
  const drow=[1,2,3,4,5,6].map(d=>{const ids=r.ids.filter(id=>domOf(byId(id))===d);if(!ids.length)return '';const ok=ids.filter(id=>isOk(byId(id),r.ans[r.ids.indexOf(id)])).length;return dbar(DOM[d].n,Math.round(ok/ids.length*100),DOM[d].c)}).join('');
  return hdr(backB('home'),'試験結果')+`<main>
  <div class="hero" style="text-align:center"><div class="big" style="font-size:64px">${r.ok}<small> / ${r.n}</small></div><div style="font-size:26px;font-weight:700;margin-top:12px">${pct}%</div><div class="foot">${pass?'合格ライン（70%）到達':'合格ライン（70%）未達'}</div></div>
  <div class="card" style="display:flex"><div style="flex:1"><small style="color:var(--sub)">制限時間</small><br><b style="font-size:20px">${Math.round(r.limit/60)}分</b></div><div style="flex:1"><small style="color:var(--sub)">所要時間</small><br><b style="font-size:20px">${Math.round(r.used/60)}分</b></div></div>
  ${drow?`<div class="card"><h3 style="color:var(--ink);font-size:16px">ドメイン別結果</h3>${drow}</div>`:''}
  <p class="note" style="text-align:left">本アプリは非公式の学習補助ツールです。スコアは正答率による推定値であり、実際の試験（IRT 等）とは採点方式が異なります。実際の試験結果を保証するものではありません。</p>
  <div style="display:flex;flex-direction:column;gap:10px;margin-top:6px">
  <button class="btn" onclick="retake('same')">${ic('redo',20)} 同じ問題で再受験</button>
  <button class="btn ghost" onclick="retake('wrong')">${ic('xc',20)} 不正解のみ再受験</button>
  <button class="btn ghost" onclick="go('reslist')">${ic('doc',20)} 結果を見る</button>
  <button class="btn ghost" onclick="retake('new')">${ic('retry',20)} 再受験</button>
  <button class="btn ghost" onclick="go('home')">${ic('home',20)} ホーム</button></div></main>`},

reslist(){const r=S.rv,w=wrongIds(r),tab=S.list.tab;
  const items=r.ids.map((id,i)=>({id,i,q:byId(id),ok:isOk(byId(id),r.ans[i])})).filter(x=>tab==='all'||!x.ok);
  const groups={};items.forEach(x=>(groups[secOf(x.q)]=groups[secOf(x.q)]||[]).push(x));
  return hdr(backB('examresult'),'結果一覧')+`<main>
  <div class="seg"><div class="${tab==='all'?'on':''}" onclick="S.list.tab='all';render()">すべて</div><div class="${tab==='wrong'?'on':''}" onclick="S.list.tab='wrong';render()">不正解のみ</div></div>
  <div style="display:flex;align-items:center;gap:14px;margin:6px 2px 14px"><span style="display:flex;align-items:center;gap:6px"><span class="ri ok" style="width:26px;height:26px">${ic('check',16)}</span><b style="font-size:20px">${r.n-w.length}</b></span><span style="display:flex;align-items:center;gap:6px"><span class="ri ng" style="width:26px;height:26px">${ic('x',16)}</span><b style="font-size:20px">${w.length}</b></span><span style="margin-left:auto;color:var(--sub)">${items.length} / ${r.n}</span></div>
  ${Object.keys(groups).map(s=>`<div class="lbl">${SEC[s]||'未分類'}</div>${groups[s].map(x=>`<div class="card res" onclick="reviewQ(${x.i})"><span class="ri ${r.ans[x.i]?(x.ok?'ok':'ng'):'na'}">${ic(x.ok?'check':'x',18)}</span><div class="t"><b>${dispId(x.q)}</b><small>#${x.i+1}</small></div><span style="color:var(--sub)">${ic('chev',18)}</span></div>`).join('')}`).join('')}</main>`},

review(){const r=S.rv,i=r.cur,q=byId(r.ids[i]),sel=r.ans[i]||[],ok=isOk(q,sel);
  const cls=k=>q.answer.includes(k)?(sel.includes(k)?'ok':'miss'):sel.includes(k)?'ng':'';
  return hdr(backB('reslist'),`${i+1} / ${r.n}`)+`<main>
  <div class="banner ${ok?'ok':'ng'}">${ic(ok?'check':'x',26)} ${ok?'正解':(sel.length?'不正解':'未回答')}</div>
  <div class="lbl" style="margin-top:0">問題</div><div style="line-height:1.8">${md(q.q)}</div>
  <div class="lbl">選択肢</div>${optList(q,cls)}
  <div class="lbl">解説</div>${expl(q)}</main>
  <div class="dock"><div class="flex"><button class="btn ghost" ${i?'':'disabled'} onclick="reviewQ(${i-1})">前へ</button><button class="btn ghost" ${i<r.n-1?'':'disabled'} onclick="reviewQ(${i+1})">次へ</button></div></div>`},

stats(){const all=stat(S.Q),ex=S.P.exams||[],last=ex[ex.length-1],exh=ex.slice(-10).reverse();
  const bms=Object.keys(S.P.bm).length,wr=S.Q.filter(q=>lastOk(q.id)===false).length;
  return hdr(backB('home'),'統計')+`<main>
  <div class="lbl" style="margin-top:0">全体</div>
  <div class="stats"><div class="card">${ic('target',26)}<b>${ex.length}</b><small>模擬試験</small></div><div class="card">${ic('check',26)}<b>${last?Math.round(last.ok/last.n*100)+'%':'未受験'}</b><small>最新スコア</small></div><div class="card">${ic('bm',26)}<b>${bms}</b><small>ブックマーク</small></div><div class="card">${ic('xc',26)}<b>${wr}</b><small>最近の不正解</small></div></div>
  <div class="lbl">ドメイン別の正答率</div><div class="card">${[1,2,3,4,5,6].map(d=>{const st=stat(inDom(d));return dbar(`${DOM[d].n}（${st.done}/${st.total}）`,st.rate,DOM[d].c)}).join('')}</div>
  <div class="lbl">模擬試験の履歴</div><div class="card">${exh.length?exh.map(e=>{const p=Math.round(e.ok/e.n*100),d=new Date(e.at);return `<div class="opt" style="cursor:default"><span class="ri ${p>=70?'ok':'ng'}">${ic(p>=70?'check':'x',18)}</span><div><b>${p}%（${e.ok} / ${e.n}）</b><small>${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}　所要 ${Math.round(e.used/60)} 分</small></div></div>`}).join(''):'<p class="note">まだ受験していません</p>'}</div></main>`},

settings(){return hdr(backB('home'),'設定')+`<main>
  <div class="card"><h3>問題データ</h3><p style="margin:0 0 12px">${S.Q.length} 問を読み込み済み</p><button class="btn" onclick="pickFile()">問題JSONを読み込む</button><div style="height:10px"></div><button class="btn ghost" onclick="wipe('data')">問題データを削除</button></div>
  <div class="card"><h3>学習履歴</h3><button class="btn ghost" onclick="wipe('progress')">履歴とブックマークを消去</button></div>
  <div class="note">データはこの端末内にのみ保存されます</div></main>`}
};
function render(){
  const fn=V[S.route];if(!fn){S.route='home';return render()}
  try{$app.innerHTML=`<div class="screen" style="display:flex;flex-direction:column;height:100%;min-height:0">${fn()}</div>`}
  catch(e){console.error(e);S.route='home';$app.innerHTML='<main><div class="empty"><h2>表示エラー</h2><button class="btn" onclick="go(\'home\')">ホームへ</button></div></main>'}}
(async()=>{
  try{S.Q=(await DB.get('questions'))||[];const p=await DB.get('progress');if(p)S.P=Object.assign({hist:{},bm:{},exams:[],chunk:{}},p);S.E=(await DB.get('exam'))||null;if(S.E&&!S.Q.length)S.E=null;
    navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){console.warn(e)}
  render();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
