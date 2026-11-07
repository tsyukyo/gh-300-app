'use strict';
// ---- 永続化 (IndexedDB) ----
const DB={
  open(){return this._p||(this._p=new Promise((res,rej)=>{const r=indexedDB.open('gh300',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
  async get(k){const d=await this.open();return new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  async set(k,v){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
};
const S={route:'home',Q:[],P:{hist:{},bm:{}},ses:null,cfg:{mode:'seq',shuffle:false,sec:'all'},msg:''};
const $app=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^\s*- /gm,'• ').replace(/\n/g,'<br>');
const L='ABCDEFGHIJ';
const save=()=>DB.set('progress',S.P);
const go=r=>{S.route=r;render()};
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$app.append(t);setTimeout(()=>t.remove(),2000)}
const lastOk=id=>{const h=S.P.hist[id];return h&&h.length?h[h.length-1]:null};
const tests=()=>[...new Set(S.Q.map(q=>q.test))].sort((a,b)=>a-b);
const stat=qs=>{let d=0,ok=0;for(const q of qs){const h=S.P.hist[q.id];if(h&&h.length){d++;if(h[h.length-1])ok++}}return{total:qs.length,done:d,rate:d?Math.round(ok/d*100):null}};
const back=to=>`<button class="ib" onclick="go('${to}')" aria-label="戻る">‹</button>`;

// ---- 学習対象の選別 ----
function pick(){
  let qs=S.cfg.sec==='all'?S.Q:S.Q.filter(q=>q.test===+S.cfg.sec);
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
  if(what==='progress'&&confirm('学習履歴とブックマークを消去しますか？')){S.P={hist:{},bm:{}};await save();toast('履歴を消去しました')}
  if(what==='data'&&confirm('読み込んだ問題データを削除しますか？')){S.Q=[];await DB.set('questions',[]);toast('問題データを削除しました')}
  render()}

// ---- 画面 ----
const V={
home(){
  if(!S.Q.length)return `<header><span style="width:44px"></span><h1>GH-300 学習</h1><button class="ib" onclick="go('settings')" aria-label="設定">⚙</button></header>
  <main><div class="empty"><div style="font-size:48px">📚</div><h2>問題データがありません</h2><p>問題JSONファイルを読み込むと学習を始められます。</p><div style="height:12px"></div><button class="btn" onclick="pickFile()">問題JSONを読み込む</button></div></main>`;
  const all=stat(S.Q),pct=all.total?all.done/all.total*100:0;
  return `<header><button class="ib" onclick="go('settings')" aria-label="設定">⚙</button><h1>GH-300 学習</h1><button class="ib" onclick="S.cfg.mode='bm';S.cfg.sec='all';go('study')" aria-label="ブックマーク">🔖</button></header>
  <main><div class="hero"><div style="flex:1"><div class="big">${all.done}<small> / ${all.total}</small></div><small>学習済みの問題</small><div class="bar"><i style="width:${pct}%"></i></div><small>${Math.round(pct)}% 完了</small></div><div class="ring">${all.rate==null?'--':all.rate+'%'}</div></div>
  <div style="height:14px"></div><button class="btn" onclick="S.cfg.sec='all';S.cfg.mode='seq';go('study')">▶ 全問題を学習</button>
  <div class="sec"><span>練習テスト</span><span>${tests().length} 本</span></div>
  ${tests().map(t=>{const st=stat(S.Q.filter(q=>q.test===t));return `<div class="card item" onclick="S.cfg.sec=${t};go('study')"><div class="num">${t}</div><div class="t"><b>練習テスト ${String(t).padStart(2,'0')}</b><small>${st.total} 問 / ${st.done} 解答済み</small><div class="bar light"><i style="width:${st.total?st.done/st.total*100:0}%"></i></div></div>${st.rate!=null?`<div class="pct">${st.rate}%<small>正答率</small></div>`:''}<span style="color:var(--sub)">›</span></div>`}).join('')}
  <div class="note">模擬試験は次のバージョンで追加予定です</div></main>`},

study(){
  const opts=[['seq','📋','順番通り','問題番号順に出題'],['new','✨','未学習','まだ解答していない問題のみ'],['wrong','⚠️','最近不正解','直前の解答が不正解の問題'],['wrong3','🔁','直近3回で不正解','直近3回に1回以上間違えた問題'],['bm','🔖','ブックマーク','ブックマークした問題']];
  const n=pick().length;
  return `<header>${back('home')}<h1>学習${S.cfg.sec==='all'?'':'（テスト'+S.cfg.sec+'）'}</h1><span style="width:44px"></span></header><main>
  <div class="card"><h3>学習モード</h3>${opts.map(o=>`<div class="opt ${S.cfg.mode===o[0]?'on':''}" onclick="S.cfg.mode='${o[0]}';render()"><span>${o[1]}</span><div><b>${o[2]}</b><small>${o[3]}</small></div><span class="radio"></span></div>`).join('')}</div>
  <div class="card"><h3>出題順</h3><div class="chips"><div class="chip ${!S.cfg.shuffle?'on':''}" onclick="S.cfg.shuffle=false;render()">順番</div><div class="chip ${S.cfg.shuffle?'on':''}" onclick="S.cfg.shuffle=true;render()">ランダム</div></div></div></main>
  <div class="dock"><button class="btn" ${n?'':'disabled'} onclick="start()">▶ はじめる（${n} 問）</button></div>`},

q(){const s=S.ses,q=s.qs[s.i],multi=q.answer.length>1;
  return `<header>${back('home').replace('‹','⌂')}<h1>練習テスト ${String(q.test).padStart(2,'0')}</h1><button class="tb" onclick="go('result')">終了</button></header><main>
  <div class="timer" style="font-weight:500;color:var(--sub)"><span>${s.i+1} / ${s.qs.length}</span><span>${q.id}</span></div><div class="bar light" style="margin:8px 0 12px"><i style="width:${(s.i+1)/s.qs.length*100}%"></i></div>
  <div class="meta"><span class="sp"></span><span onclick="bm('${q.id}')" style="font-size:22px;cursor:pointer" role="button" aria-label="ブックマーク">${S.P.bm[q.id]?'🔖':'📑'}</span></div>
  <div class="card q"><div class="md">${md(q.q)}</div></div>${multi?`<p class="hint">${q.answer.length} つ選択してください</p>`:''}
  ${q.options.map((t,i)=>{let c='';if(s.done){c=q.answer.includes(i)?(s.sel.includes(i)?'ok':'miss'):s.sel.includes(i)?'ng':''}else if(s.sel.includes(i))c='sel';
    return `<div class="ans ${c}" onclick="toggle(${i})"><span class="k">${L[i]}</span><span>${md(t)}</span></div>`}).join('')}
  ${s.done?`<div class="exp"><b>${s.last?'✅ 正解':'❌ 不正解（正解: '+q.answer.map(a=>L[a]).join(', ')+'）'}</b><br><br>${md(q.explanation)}${q.tips?`<br><br><b>ポイント</b><br>${md(q.tips)}`:''}</div>`:''}</main>
  <div class="dock">${s.done?`<button class="btn" onclick="next()">${s.i<s.qs.length-1?'次の問題へ':'結果を見る'}</button>`:`<button class="btn" ${s.sel.length?'':'disabled'} onclick="submit()">回答する</button>`}</div>`},

result(){const s=S.ses;const n=s.i+(s.done?1:0);
  return `<header><span style="width:44px"></span><h1>結果</h1><span style="width:44px"></span></header><main><div class="card" style="text-align:center"><div class="big" style="font-size:44px;font-weight:800">${n?Math.round(s.ok/n*100):0}%</div><p>${n} 問中 ${s.ok} 問正解</p></div></main>
  <div class="dock"><button class="btn" onclick="go('home')">ホームへ</button></div>`},

settings(){return `<header>${back('home')}<h1>設定</h1><span style="width:44px"></span></header><main>
  <div class="card"><h3>問題データ</h3><p style="margin:0 0 12px">${S.Q.length} 問を読み込み済み</p><button class="btn" onclick="pickFile()">問題JSONを読み込む</button><div style="height:10px"></div><button class="btn ghost" onclick="wipe('data')">問題データを削除</button></div>
  <div class="card"><h3>学習履歴</h3><button class="btn ghost" onclick="wipe('progress')">履歴とブックマークを消去</button></div>
  <div class="note">データはこの端末内にのみ保存されます</div></main>`}
};
function render(){$app.innerHTML=`<div class="screen" style="display:flex;flex-direction:column;height:100%;min-height:0">${V[S.route]()}</div>`}
(async()=>{
  try{S.Q=(await DB.get('questions'))||[];S.P=(await DB.get('progress'))||S.P;navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){console.warn(e)}
  render();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
