/* Standalone motion design prototype. No network, game engine or private session. */
(() => {
'use strict';
const D=window.PUBLIC_PROJECTION, reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
const overlay=document.querySelector('#overlay'), stateSelect=document.querySelector('#state'), peopleSelect=document.querySelector('#people');
const phase=document.querySelector('#phase-label'), turn=document.querySelector('#turn'), population=document.querySelector('#population');
const status=document.querySelector('#demo-status');
let token=0, paused=false, state='waiting', people=3, page=0, speaker=0, votes=0, animations=new Set();
const ease=getComputedStyle(document.documentElement).getPropertyValue('--ease-ui').trim();
const reduced=()=>reducedQuery.matches||document.querySelector('#reduced').checked;
function a(el,frames,duration=180,delay=0){if(!el)return;let f=frames;if(reduced())f=frames.map(k=>({opacity:k.opacity??1}));const anim=el.animate(f,{duration:reduced()?100:duration,delay:reduced()?0:delay,easing:ease,fill:'both'});animations.add(anim);if(paused)anim.pause();anim.finished.catch(()=>{}).finally(()=>animations.delete(anim));return anim;}
function clearMotion(){for(const x of animations)x.cancel();animations.clear();}
const roster=['Camille','Nassim','Élodie','Alexandre-Louis','Maya','Rayan','Noémie','Lou','Hugo','Inès','Sacha','Alexandre-Louis-de-la-Très-Longue-Lignée'];
const pos={players:[216,840,1488,196],vote:[600,856,720,180],result:[216,786,1488,250],events:[600,950,720,86]};
const place=(name)=>{let [x,y,w,h]=pos[name];return `left:${x}px;top:${y}px;width:${w}px;height:${h}px`};
const img=(id)=>D.contents.find(c=>c.id===id);
const contentCard=(c,idx,p,final=false)=>`<article class="tv-content-card ${p?'tv-assignment':'tv-duo'}${final?' tv-final-card':''}" data-card="${idx}">${c?.image?`<img src="${c.image}" alt="">`:''}<span class="tv-shade"></span>${p?`<span class="tv-player" title="${p.name}">#${p.number} ${p.name}</span>`:''}<strong class="tv-word">${c?.label||''}</strong>${final?`<span class="tv-camp">${p.camp||''}</span>`:''}</article>`;
function cards(final=false){const start=page*3;const list=D.publicAssignments.slice(start,start+3).map((p,i)=>contentCard(img(p.content),i,p,final)).join('');const pages=Math.ceil(people/3);return list+(pages>1?`<span class="tv-page">${start+1}–${Math.min(start+3,people)} / ${people} · ${page+1}/${pages}</span>`:'');}
const event=(label,value,extra='')=>`<div class="tv-event"><p>${label}</p><strong>${value}</strong>${extra}</div>`;
function phaseChange(label,instant){if(phase.textContent===label)return;if(!instant){const old=phase.cloneNode(true);old.removeAttribute('id');phase.parentNode.append(old);const out=a(old,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-4px)'}],140);out.finished.catch(()=>{}).finally(()=>old.remove());}phase.textContent=label;if(!instant)a(phase,[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],180,40);}
function render(next,{instant=false,keepToken=false}={}){
 if(!keepToken){token++;paused=false;document.querySelector('#pause').textContent='Pause';clearMotion();}
 state=next;stateSelect.value=next;overlay.dataset.people=String(people);let body='',cls='',where='players',label='Discussion';
 if(next==='waiting'||next==='transitions'){label='Préparation';}
 if(next==='discussion'||next==='micro'||next==='cycle')body=`<div class="tv-event tv-speaker"><span class="active-glow"></span><span class="tv-speaker-number">${speaker+1}</span><div><p>Au tour de</p><strong title="${roster[speaker]}">${roster[speaker]}</strong></div></div>`;
 if(next==='duo'){cls='tv-duo-group';body=D.contents.map((c,i)=>contentCard(c,i)).join('')+'<span class="tv-vs" aria-hidden="true">VS</span>';}
 if(next==='assignments'&&D.publicAssignments){cls='tv-assignment-group';body=cards();}
 if(next==='vote'||next==='vote-closed'){label='Vote';where='vote';cls='tv-vote';body=event(next==='vote-closed'?'Vote terminé':'Le vote est ouvert',`<span class="tv-counter">${votes} / ${people} votes reçus</span>`,`<span class="vote-track"><span class="vote-fill" style="transform:scaleX(${votes/people})"></span></span>`);}
 if(next==='elimination'){label='Résultat';where='result';body=event('Élimination','Élodie quitte le jeu');}
 if(next==='tie'){label='Résultat';where='result';body=event('Égalité','Aucun joueur éliminé');}
 if(next==='reveal'&&D.kind==='final'){label='Révélation';where='result';cls='tv-final-group';body=cards(true);}
 if(next==='victory'&&D.kind==='final'){label='Résultat';where='result';body=event('Manche terminée','<span class="tv-positive">Victoire des Civils</span>');}
 if((next==='durable'||next==='final-next')&&D.kind==='final'){label='Résultat';where='result';body='<div class="tv-event tv-result-compact"><p>Résultat final</p><strong class="tv-positive">Victoire des Civils</strong></div>';}
 if(next==='elimination-durable'){label='Résultat';where='events';body='<span class="tv-event tv-compact-note">Élodie quitte le jeu</span>';}
 if(next==='tie-durable'){label='Résultat';where='events';body='<span class="tv-event tv-compact-note">Égalité · aucun joueur éliminé</span>';}
 if(next==='next'){label='Transition';where='result';body=event('Manche suivante','Le Game Master prépare la suite.');}
 let existing=overlay.querySelector('#lower');if(existing)existing.remove();
 if(body){const n=document.createElement('div');n.id='lower';n.className=`tv-lower motion-unit ${cls}`;n.dataset.widget=where;n.dataset.playerLayout='horizontal';n.setAttribute('style',place(where));n.innerHTML=body;overlay.append(n);
 if(!instant){if(next==='duo'){let nodes=n.querySelectorAll('[data-card]');a(nodes[0],[{opacity:0,transform:'translateX(-18px)'},{opacity:1,transform:'translateX(0)'}],240);a(nodes[1],[{opacity:0,transform:'translateX(18px)'},{opacity:1,transform:'translateX(0)'}],240,40);a(n.querySelector('.tv-vs'),[{opacity:0},{opacity:1}],180,80);}else if(next==='assignments'||next==='reveal'){n.querySelectorAll('[data-card]').forEach((el,i)=>a(el,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],240,i*40));}else a(n,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],next==='victory'?240:180);if(next==='micro'&&!reduced())a(n.querySelector('.active-glow'),[{opacity:0},{opacity:.55},{opacity:0}],240);}
 }
 phaseChange(label,instant);turn.hidden=!(next==='discussion'||next==='micro'||next==='cycle'||next==='duo'||next==='assignments');turn.textContent=next==='cycle'?'Tour 1/2':'Tour 1/2';population.textContent=`${people} joueurs`;document.body.classList.toggle('motion-reduced',reduced());
 document.querySelector('#page').disabled=!D.publicAssignments||people<=3;status.textContent=`${stateSelect.selectedOptions[0]?.textContent||next} · ${reduced()?'Mouvement réduit':'Mouvement normal'}`;
 window.DEMO_STATE={state,people,page,speaker,votes,reduced:reduced(),projection:D.kind};
}
function delay(ms,t){return new Promise(resolve=>{let elapsed=0,last=performance.now();function tick(){if(t!==token)return resolve(false);const now=performance.now();if(!paused)elapsed+=now-last;last=now;if(elapsed>=ms)return resolve(true);setTimeout(tick,16);}tick();});}
async function leave(t){const n=overlay.querySelector('#lower');if(!n)return true;a(n,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(10px)'}],180);return delay(reduced()?100:180,t);}
async function step(s,t,hold=0){if(t!==token)return false;if(!await leave(t))return false;render(s,{keepToken:true});return hold?delay(hold,t):true;}
async function play(which=state){token++;clearMotion();paused=false;document.querySelector('#pause').textContent='Pause';let t=token;
 render(which,{keepToken:true});
 if(which==='transitions'){render('waiting',{keepToken:true});if(!await delay(1000,t))return;if(!await step('discussion',t,1200))return;speaker=(speaker+1)%people;if(!await step('micro',t,1000))return;if(!await step('vote',t,1000))return;votes=people;if(!await step('vote-closed',t,1000))return;if(!await step('elimination',t,2400))return;if(!await step('elimination-durable',t,1000))return;await step('cycle',t);}
 else if(which==='waiting'){if(await delay(1100,t))await step('discussion',t);}
 else if(which==='micro'){if(await delay(1600,t)){speaker=(speaker+1)%people;await step('discussion',t);}}
 else if(which==='discussion'){if(await delay(1800,t)){speaker=(speaker+1)%people;await step('discussion',t);}}
 else if(which==='duo'){if(await delay(2600,t))await step('discussion',t);}
 else if(which==='assignments'){if(people>3){for(let i=1;i<Math.ceil(people/3);i++){if(!await delay(2600,t))return;page=i;await step('assignments',t);}}}
 else if(which==='vote'){for(let i=1;i<=people;i++){if(!await delay(people>6?280:700,t))return;votes=i;const counter=overlay.querySelector('.tv-counter');counter.textContent=`${votes} / ${people} votes reçus`;a(counter,[{opacity:.65},{opacity:1}],140);overlay.querySelector('.vote-fill').style.transform=`scaleX(${votes/people})`;window.DEMO_STATE.votes=votes;}if(await delay(800,t))await step('vote-closed',t);}
 else if(which==='vote-closed'){if(await delay(1200,t))await step('elimination',t);}
 else if(which==='elimination'){if(await delay(2400,t))await step('elimination-durable',t);}
 else if(which==='tie'){if(await delay(2400,t))await step('tie-durable',t);}
 else if(which==='reveal'){if(await delay(2800,t))await step('durable',t);}
 else if(which==='victory'){if(await delay(2800,t))await step('durable',t);}
 else if(which==='final-next'){render('durable',{keepToken:true});if(await delay(1800,t))await step('next',t,2200);if(t===token)await step('waiting',t);}
 else if(which==='next'){if(await delay(2200,t))await step('waiting',t);}
 else if(which==='cycle'){turn.textContent='Tour 1/2';}
}
function resize(){const v=document.querySelector('.review-viewport');document.querySelector('.stage').style.transform=`scale(${v.clientWidth/1920})`;}
stateSelect.addEventListener('change',()=>{votes=0;render(stateSelect.value);});
peopleSelect.addEventListener('change',()=>{people=+peopleSelect.value;page=0;speaker=0;render(state);});
document.querySelector('#play').onclick=()=>{votes=0;page=0;play();};
document.querySelector('#pause').onclick=()=>{paused=!paused;for(const anim of animations)paused?anim.pause():anim.play();document.querySelector('#pause').textContent=paused?'Reprendre':'Pause';};
document.querySelector('#stop').onclick=()=>render(state,{instant:true});
document.querySelector('#page').onclick=()=>{page=(page+1)%Math.ceil(people/3);render(D.kind==='final'?'reveal':'assignments');};
document.querySelector('#late').onclick=()=>render(D.kind==='final'?'durable':'elimination-durable',{instant:true});
document.querySelector('#reduced').onchange=()=>render(state,{instant:true});
reducedQuery.addEventListener('change',()=>render(state,{instant:true}));
window.addEventListener('resize',resize);
window.motionDemo={render:(s,opts)=>render(s,opts),play,setPeople:n=>{people=n;peopleSelect.value=String(n);page=0;render(state,{instant:true});},setPage:n=>{page=n;render(D.kind==='final'?'reveal':'assignments',{instant:true});},nextSpeaker:()=>{speaker=(speaker+1)%people;render('micro');},reduce:on=>{document.querySelector('#reduced').checked=on;render(state,{instant:true});},setVotes:n=>{votes=n;render('vote',{instant:true});}};
const q=new URLSearchParams(location.search);if(q.get('overlay')==='1')document.body.classList.add('overlay-only');people=+(q.get('people')||3);peopleSelect.value=String(people);render(q.get('state')||(D.kind==='final'?'durable':'waiting'),{instant:true});resize();
})();
