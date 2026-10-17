const TYPES=[
  {id:'pen',icon:'🖊️',name:'钢笔'}, {id:'book',icon:'📕',name:'书本'},
  {id:'cup',icon:'☕',name:'咖啡'}, {id:'phone',icon:'📱',name:'手机'},
  {id:'clip',icon:'📎',name:'回形针'}, {id:'plant',icon:'🪴',name:'盆栽'},
  {id:'note',icon:'📝',name:'便签'}, {id:'glass',icon:'👓',name:'眼镜'}
];
const TOTAL=TYPES.length*6, MAX_SLOTS=7;
let board=[],tray=[],history=[],toolsLeft={undo:2,shuffle:2,vacuum:1};
let playing=false,timeLeft=150,timerId=null,combo=0,soundOn=true,seed=Date.now()%2147483647;
const $=s=>document.querySelector(s), pile=$('#pile'), trayEl=$('#tray');
function rand(){seed=seed*16807%2147483647;return(seed-1)/2147483646}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function beep(freq=520,d=.06){if(!soundOn)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.05,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d)}
function makeBoard(){
  board=[];let ids=[];TYPES.forEach(t=>{for(let i=0;i<6;i++)ids.push(t.id)});shuffle(ids);
  ids.forEach((type,i)=>{const layer=Math.floor(i/16),col=i%8,row=Math.floor((i%16)/8);board.push({key:`${Date.now()}-${i}`,type,x:10+col*11.5+(rand()*9-4.5),y:18+row*27+layer*9+(rand()*14-7),r:Math.round(rand()*36-18),s:(.82+rand()*.25).toFixed(2),z:i+1})});
}
function renderBoard(){pile.innerHTML='';board.forEach(x=>{const t=TYPES.find(v=>v.id===x.type),b=document.createElement('button');b.className='item';b.dataset.key=x.key;b.title=t.name;b.setAttribute('aria-label',t.name);b.textContent=t.icon;b.style.cssText=`left:${x.x}%;top:${x.y}%;--r:${x.r}deg;--s:${x.s};z-index:${x.z}`;b.onclick=()=>pick(x.key,b);pile.appendChild(b)});updateStatus()}
function renderTray(){trayEl.innerHTML='';for(let i=0;i<MAX_SLOTS;i++){const s=document.createElement('div');s.className='slot'+(tray[i]?' filled':'');if(tray[i])s.textContent=TYPES.find(t=>t.id===tray[i].type).icon;trayEl.appendChild(s)}}
function pick(key,el){if(!playing||tray.length>=MAX_SLOTS)return;const idx=board.findIndex(x=>x.key===key);if(idx<0)return;const item=board[idx];history.push({item:{...item}});board.splice(idx,1);el.classList.add('removing');beep(440);setTimeout(()=>{renderBoard();tray.push(item);renderTray();checkMatch(item.type)},130)}
function checkMatch(type){const matches=tray.map((x,i)=>x.type===type?i:-1).filter(i=>i>=0);if(matches.length>=3){setTimeout(()=>{matches.slice(0,3).reverse().forEach(i=>tray.splice(i,1));combo++;showCombo();beep(780,.11);renderTray();updateStatus();if(board.length===0&&tray.length===0)return end(true);},240)}else if(tray.length>=MAX_SLOTS)setTimeout(()=>end(false,'收纳格塞满了'),220)}
function showCombo(){const c=$('#combo');c.textContent=combo>1?`COMBO ×${combo}`:'收纳成功!';c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}
function updateStatus(){const remaining=board.length+tray.length;$('#remaining').textContent=remaining;$('#progress').style.width=`${(TOTAL-remaining)/TOTAL*100}%`;$('#timer').textContent=`${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`;Object.keys(toolsLeft).forEach(k=>{$(`#${k}Count`).textContent=toolsLeft[k];document.querySelector(`[data-tool=${k}]`).disabled=toolsLeft[k]<=0||!playing})}
function start(){clearInterval(timerId);tray=[];history=[];toolsLeft={undo:2,shuffle:2,vacuum:1};timeLeft=150;combo=0;seed=Date.now()%2147483647;makeBoard();renderBoard();renderTray();playing=true;$('#overlay').classList.remove('show');updateStatus();timerId=setInterval(()=>{timeLeft--;updateStatus();if(timeLeft<=0)end(false,'时间到了')},1000)}
function end(win,reason=''){playing=false;clearInterval(timerId);$('#modalSticker').textContent=win?'✨':'🫠';$('#modalEyebrow').textContent=win?'DESK CLEARED':'TRY AGAIN';$('#modalTitle').textContent=win?'桌面焕然一新！':reason;$('#modalText').textContent=win?`你用 ${150-timeLeft} 秒完成了收纳，连击最高达到 ${Math.max(combo,1)} 次。`:'别急，优先凑齐已有物品，给收纳格留一点余地。';$('#startBtn').textContent=win?'再收拾一次':'重新挑战';$('#overlay').classList.add('show');updateStatus()}
function useTool(name){if(!playing||toolsLeft[name]<=0)return;
  if(name==='undo'){const h=history.pop();if(!h||!tray.length)return flash();const i=[...tray].reverse().findIndex(x=>x.key===h.item.key);if(i<0)return flash();tray.splice(tray.length-1-i,1);board.push({...h.item,z:board.length+60});}
  if(name==='shuffle'){board.forEach((x,i)=>{x.x=8+rand()*84;x.y=12+rand()*76;x.r=Math.round(rand()*50-25);x.z=i+1});shuffle(board);}
  if(name==='vacuum'){const counts={};board.forEach(x=>counts[x.type]=(counts[x.type]||0)+1);const type=Object.keys(counts).find(k=>counts[k]>=3);if(!type)return flash();let n=0;board=board.filter(x=>x.type===type&&n++<3?false:true);combo++;showCombo();}
  toolsLeft[name]--;beep(650,.1);renderBoard();renderTray();if(board.length===0&&tray.length===0)end(true)
}
function flash(){document.querySelector('.game-shell').classList.remove('shake');void document.body.offsetWidth;document.querySelector('.game-shell').classList.add('shake');beep(180,.12)}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>useTool(b.dataset.tool));
$('#startBtn').onclick=start;$('#soundBtn').onclick=()=>{soundOn=!soundOn;$('#soundBtn').textContent=soundOn?'♪':'×'};
renderTray();updateStatus();
