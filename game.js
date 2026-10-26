(()=>{'use strict';
const COLORS=['red','bluebus','yellow','greenbus','purple','pink'];
const HEX={red:'#f04444',bluebus:'#3187fa',yellow:'#ffc82e',greenbus:'#25c967',purple:'#925be7',pink:'#ff72b6'};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let level=1,state=null,history=[],unlocked=Math.max(1,+localStorage.getItem('loopUnlocked')||1),coins=+localStorage.getItem('loopCoins')||320;
function rng(seed){return()=>((seed=Math.imul(seed^seed>>>15,1|seed),seed^=seed+Math.imul(seed^seed>>>7,61|seed))^seed>>>14)>>>0/4294967296};
function codeFor(n){let x=(n*73+19)%676;return `LOOP-${String(n).padStart(3,'0')}-${String.fromCharCode(65+Math.floor(x/26))}${String.fromCharCode(65+x%26)}`}
function codeToLevel(code){code=code.trim().toUpperCase();for(let i=1;i<=100;i++)if(codeFor(i)===code)return i;return 0}
function makeLevel(n){const r=rng(n*92821),colorCount=Math.min(6,2+Math.floor((n-1)/12)),busCount=Math.min(14,4+Math.floor(n/8)),cap=n<10?3:n<45?4:5,colors=COLORS.slice(0,colorCount);let buses=[];for(let i=0;i<busCount;i++)buses.push({color:colors[Math.floor(r()*colors.length)],cap});
 let passengerColors=[];buses.forEach(b=>{for(let j=0;j<b.cap;j++)passengerColors.push(b.color)}); passengerColors.sort(()=>r()-.5);
 let queues=Array.from({length:Math.min(4,2+Math.floor(n/18))},()=>[]);passengerColors.forEach((c,i)=>queues[i%queues.length].push(c));
 // Put at least one currently playable color near fronts, then shuffle buses for the puzzle.
 const front=new Set(queues.map(q=>q[0])); buses.sort((a,b)=>(front.has(b.color)?1:0)-(front.has(a.color)?1:0)||r()-.5);
 return {queues,buses,docks:[],done:0,total:buses.length,cap,maxDock:n<20?5:n<60?4:3,moves:0};}
function person(c){return `<i class="person" style="background:${HEX[c]}"></i>`}
function busEl(c,small=false){return `<div class="${small?'miniBus':'trackBus'}" style="background:${HEX[c]}">${small?'<small>BUS</small>':''}</div>`}
function showScreen(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active')}
function start(n){level=Math.max(1,Math.min(100,n));state=makeLevel(level);history=[];$('#levelNo').textContent=level;$('#coins').textContent=coins;showScreen('game');render();}
function mission(){let counts={};state.queues.flat().forEach(c=>counts[c]=(counts[c]||0)+1);$('#mission').innerHTML=Object.entries(counts).map(([c,v])=>`<span class="missionItem"><i class="dot" style="background:${HEX[c]}"></i>${v}</span>`).join('')||'<b>道路畅通！</b>'}
function render(){mission();const q=$('#queues');q.innerHTML=state.queues.map((arr,i)=>`<div class="queue q${i}">${arr.slice(0,8).map(person).join('')}</div>`).join('');
 const d=$('#docks');d.innerHTML=Array.from({length:state.maxDock},(_,i)=>`<div class="dock" data-i="${i}">${state.docks[i]?busEl(state.docks[i].color,true):''}</div>`).join('');$('#dockCount').textContent=`${state.docks.length}/${state.maxDock}`;
 $('#mission').title=`剩余巴士 ${state.buses.length}`; renderTrack();}
function renderTrack(){const box=$('#movingBus');box.innerHTML='';state.buses.slice(0,8).forEach((b,i)=>{let a=(i/Math.max(8,state.buses.length))*Math.PI*2-.7,x=50+34*Math.cos(a),y=50+37*Math.sin(a);let el=document.createElement('button');el.className='trackBus';el.style.cssText=`left:${x}%;top:${y}%;background:${HEX[b.color]};transform:translate(-50%,-50%) rotate(${a*180/Math.PI+90}deg)`;el.dataset.i=i;el.setAttribute('aria-label','派出巴士');el.onclick=()=>sendBus(i);box.appendChild(el)})}
function board(bus){let boarded=0,progress=true;while(boarded<bus.cap&&progress){progress=false;for(const q of state.queues){if(q[0]===bus.color&&boarded<bus.cap){q.shift();boarded++;progress=true}}}return boarded}
function sendBus(i){if(i>=state.buses.length)return;history.push(JSON.stringify(state));const bus=state.buses.splice(i,1)[0];state.moves++;let boarded=board(bus);if(boarded===bus.cap){state.done++;animate(bus.color,'COMBO!');setTimeout(check,500)}else{bus.left=bus.cap-boarded;state.docks.push(bus);animate(bus.color,boarded?'继续等待':'颜色不匹配');if(state.docks.length>state.maxDock){toast('车位已满！');setTimeout(()=>{state=JSON.parse(history.pop());render()},700)}}render()}
function tryDocks(){let changed=true;while(changed){changed=false;for(let i=state.docks.length-1;i>=0;i--){let b=state.docks[i],got=board({color:b.color,cap:b.left});b.left-=got;if(b.left<=0){state.docks.splice(i,1);state.done++;changed=true}}}render();check()}
function check(){tryDocksNoLoop();if(!state.queues.flat().length&&state.done===state.total){unlocked=Math.max(unlocked,Math.min(100,level+1));localStorage.setItem('loopUnlocked',unlocked);coins+=20;localStorage.setItem('loopCoins',coins);$('#levelCode').textContent=codeFor(level);$('#winTitle').textContent=level===100?'全部 100 关完成！':'太棒了！';openModal('winModal')}}
function tryDocksNoLoop(){let changed=true;while(changed){changed=false;for(let i=state.docks.length-1;i>=0;i--){let b=state.docks[i],got=board({color:b.color,cap:b.left});b.left-=got;if(b.left<=0){state.docks.splice(i,1);state.done++;changed=true}}}render()}
function animate(c,msg){let b=document.createElement('div');b.className='trackBus';b.style.cssText=`left:45%;top:55%;background:${HEX[c]}`;$('#movingBus').appendChild(b);requestAnimationFrame(()=>{b.style.left='110%';b.style.top='15%'});setTimeout(()=>b.remove(),500);toast(msg)}
function toast(t){let x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),650)}
function openModal(id){let m=$('#'+id);m.classList.add('open');m.setAttribute('aria-hidden','false')}
function closeModal(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function buildLevels(){let g=$('#levelGrid');g.innerHTML='';for(let i=1;i<=100;i++){let b=document.createElement('button');b.className='levelCell'+(i>unlocked?' locked':'');b.innerHTML=`${i}<span class="starsmall">${i<unlocked?'★★★':i===unlocked?'▶':'🔒'}</span>`;if(i<=unlocked)b.onclick=()=>start(i);g.appendChild(b)}}
function shuffle(){if(state.buses.length<2)return;history.push(JSON.stringify(state));let r=rng(Date.now());state.buses.sort(()=>r()-.5);render();toast('已重新排序')}
function hint(){const fronts=new Set(state.queues.filter(q=>q.length).map(q=>q[0]));let idx=state.buses.findIndex(b=>fronts.has(b.color));if(idx<0)return toast('先腾出等待车位');const el=$(`.trackBus[data-i="${idx}"]`);if(el){el.style.boxShadow='0 0 0 6px #fff,0 0 25px 12px #ffe333';toast('选择发光巴士')}}
$('#playBtn').onclick=()=>start(Math.min(unlocked,100));$('#levelsBtn').onclick=()=>{buildLevels();showScreen('levels')};$('#codeBtn').onclick=()=>{openModal('codeModal');$('#codeInput').focus()};$('#backHome').onclick=()=>showScreen('home');$$('[data-close]').forEach(b=>b.onclick=()=>showScreen('home'));$$('[data-modal-close]').forEach(b=>b.onclick=()=>closeModal(b.closest('.modal')));
$('#confirmCode').onclick=()=>{let n=codeToLevel($('#codeInput').value);if(!n)return $('#codeError').textContent='关卡代码无效，请检查格式';unlocked=Math.max(unlocked,n);localStorage.setItem('loopUnlocked',unlocked);closeModal($('#codeModal'));start(n)};
$('#undoBtn').onclick=()=>{if(!history.length)return toast('没有可撤销步骤');state=JSON.parse(history.pop());render()};$('#hintBtn').onclick=hint;$('#shuffleBtn').onclick=shuffle;$('#nextBtn').onclick=()=>{closeModal($('#winModal'));start(Math.min(100,level+1))};$('#winHome').onclick=()=>{closeModal($('#winModal'));showScreen('home')};$('#copyCode').onclick=()=>navigator.clipboard?.writeText($('#levelCode').textContent).then(()=>toast('代码已复制'));
$('#codeInput').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase();$('#codeError').textContent=''});$('#homePeople').innerHTML=COLORS.map(person).join('');
})();
