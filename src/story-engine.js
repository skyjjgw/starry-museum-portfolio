import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createWorld} from './visual-world-models.js';
import {storyPose,framePose} from './story-motion.js';
import {attachPortalOcclusion,updatePortalFade,PORTAL_SURFACE} from './portal-occlusion.js';
import {decorateStarryFrames,arrangeStarryFrames} from './portal-starry.js';

const key=document.body.dataset.story;
const config=globalThis.MUSEUM_WORLDS.find(w=>w.key===key);
const story=globalThis.MUSEUM_STORIES[key];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const integrated=document.body.classList.contains('journey-integrated');
const starry=integrated&&key==='portal'&&document.body.classList.contains('starry-edition');
const mobileQuality=starry&&(matchMedia('(max-width:760px)').matches||navigator.connection?.saveData);
const frames=[...document.querySelectorAll('.story-frame')];
const lastChapter=frames.length-1;
const stops=[...document.querySelectorAll('.story-stop')];
const state={value:.5,choice:'',letter:'',collected:new Set(),booted:new Set(),paused:false};
let progress=0,portalPhase=0,portalEntrance=1,active=0,uiFrame=0,renderWake=()=>{};
const clamp=T.MathUtils.clamp;
const footerLabel=document.querySelector('[data-stop-label]');
const status=document.querySelector('[data-live-status]');
const previousButton=document.querySelector('button[data-prev]');
const nextButton=document.querySelector('button[data-next]');
const nextLabel=document.body.dataset.nextLabel||document.body.dataset.next||'下一幕';
const choiceBadges=[...document.querySelectorAll('[data-carry-choice]')];
const portalFinale=starry?document.querySelector('.portal-finale'):null;
const portalPrologue=starry?document.querySelector('.portal-prologue'):null;
const wallLabels=[...document.querySelectorAll('[data-wall-label]')];

let messageTimer;
function notify(message){clearTimeout(messageTimer);status.textContent=message;messageTimer=setTimeout(()=>{status.textContent='';},4500);}
function syncMemory(){
 choiceBadges.forEach(e=>e.textContent=state.choice||'还没有选择');
 document.querySelectorAll('[data-carry-letter]').forEach(e=>e.textContent=state.letter||'你还没有留下文字。可以回到第一张信纸，写下想告诉未来的话。');
 document.querySelectorAll('[data-count]').forEach(e=>e.textContent=String(state.collected.size));
 document.querySelectorAll('[data-boot-report]').forEach(e=>e.textContent=state.booted.size?[...state.booted].map(n=>'✓ '+n+' / 本地演示已启动').join('\n'):'尚未启动子系统。可以回到开场，选择要唤醒的模块。');
 document.querySelectorAll('[data-memory-point]').forEach(e=>e.classList.toggle('is-lit',state.collected.has(e.dataset.memoryPoint)));
 document.querySelectorAll('[data-reading]').forEach(e=>e.textContent=Math.round(state.value*100)+'%');
 const reward=document.querySelector('[data-reward-open]');if(reward)reward.disabled=state.collected.size<3;
 const finalStatus=document.querySelector('[data-final-status]');if(finalStatus)finalStatus.textContent=state.collected.size>=3?'三颗星都到齐了，包裹可以打开啦。':`包裹里有 ${state.collected.size} / 3 颗星，还可以回到沿途寻找。`;
 document.body.style.setProperty('--user-value',state.value);renderWake();
}
function go(index){index=clamp(index,0,lastChapter);if(starry&&window.museumPortalNavigate){window.museumPortalNavigate(frames[index]);return;}const top=(integrated||reduced.matches)?scrollY+frames[index].getBoundingClientRect().top-90:(document.documentElement.scrollHeight-innerHeight)*index/lastChapter;scrollTo({top,behavior:reduced.matches?'instant':'smooth'});}
function updateUI(){
 uiFrame=0;
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress=clamp(scrollY/max,0,1);
 if(integrated){
  const offsets=frames.map(f=>scrollY+f.getBoundingClientRect().top-90);
  if(portalPrologue){
   const entry=clamp(scrollY/Math.max(1,offsets[0]),0,1);
   const introOpacity=1-T.MathUtils.smoothstep(entry,.08,.48);
   portalEntrance=T.MathUtils.smoothstep(entry,.55,1);
   document.body.style.setProperty('--portal-intro-opacity',introOpacity);
   document.body.style.setProperty('--portal-exhibits-opacity',portalEntrance);
   document.body.classList.toggle('portal-entering',portalEntrance<.98);
   portalPrologue.inert=introOpacity<.05;
  }
  active=0;offsets.forEach((top,i)=>{if(scrollY+innerHeight*.25>=top)active=i;});
  let segment=0;offsets.forEach((top,i)=>{if(scrollY>=top)segment=i;});
  const fraction=segment<lastChapter?clamp((scrollY-offsets[segment])/Math.max(1,offsets[segment+1]-offsets[segment]),0,1):0;
  progress=clamp((segment+fraction)/lastChapter,0,1);
  portalPhase=progress*lastChapter;
  if(portalFinale&&segment===lastChapter){
   const end=Math.max(offsets[lastChapter]+innerHeight,scrollY+portalFinale.getBoundingClientRect().top-90);
   portalPhase=lastChapter+clamp((scrollY-offsets[lastChapter])/(end-offsets[lastChapter]),0,1)*1.5;
  }
 }
 else if(reduced.matches){active=0;frames.forEach((f,i)=>{if(f.getBoundingClientRect().top<innerHeight*.5)active=i;});}
 else active=Math.round(progress*5);
 document.body.style.setProperty('--story-progress',progress);document.body.style.setProperty('--story-phase',starry?portalPhase:progress*5);document.body.dataset.chapter=String(active);
 if(portalFinale){
  const arrival=clamp((portalPhase-lastChapter-1.2)/.3,0,1);
  document.body.style.setProperty('--portal-arrival',arrival);
  document.body.style.setProperty('--portal-last-copy',1-clamp((portalPhase-lastChapter-.1)/.65,0,1));
  document.body.classList.toggle('portal-arrived',arrival>.98);portalFinale.inert=arrival<.98;
 }
 wallLabels.forEach((label,index)=>{
  const distance=Math.abs(portalPhase-index);
  const opacity=(1-T.MathUtils.smoothstep(distance,.16,.48))*portalEntrance;
  label.style.opacity=String(opacity);
  label.setAttribute('aria-hidden',String(opacity<.5));
 });
 const phase=progress*5;
 frames.forEach((f,i)=>{
  if(integrated||reduced.matches){f.removeAttribute('aria-hidden');f.inert=false;f.style.cssText='';return;}
  const d=i-phase;const motion=framePose(key,d);
  f.style.opacity=Math.abs(d)>1.25?'0':String(motion.opacity);f.style.transform=motion.transform;f.style.clipPath=motion.clipPath;f.style.filter=motion.filter;
  f.style.visibility=Math.abs(d)>1.3?'hidden':'visible';f.style.zIndex=String(i<=phase?30+i:20-i);
  f.inert=i!==active;f.setAttribute('aria-hidden',String(i!==active));
 });
 stops.forEach((b,i)=>{b.setAttribute('aria-current',i===active?'step':'false');});
 footerLabel.textContent=String(active+1).padStart(2,'0')+' / '+(starry?wallLabels[active]?.querySelector('h2')?.textContent||story.chapters[active][0]:story.chapters[active][0]);
 previousButton.disabled=active===0;nextButton.textContent=active===lastChapter?'重新出发 ↻':nextLabel+' →';
 if(portalFinale&&active===lastChapter)nextButton.textContent='走向画廊 ↓';
 const route=document.querySelector('.route-ink');if(route){const length=route.getTotalLength();route.style.strokeDasharray=String(length);route.style.strokeDashoffset=String(length*(1-progress));}
 const traveller=document.querySelector('.route-traveller');if(traveller&&route){const p=route.getPointAtLength(route.getTotalLength()*progress);traveller.setAttribute('cx',p.x);traveller.setAttribute('cy',p.y);}
 renderWake();
}
function recoverReading(error){
 document.body.classList.remove('story-enhanced');
 frames.forEach(f=>{f.style.cssText='';f.inert=false;f.removeAttribute('aria-hidden');});
 console.warn('Scroll presentation fell back to the readable document.',error);
}
function refreshUI(){try{updateUI();}catch(error){uiFrame=0;recoverReading(error);}}
function queueUI(){if(!uiFrame)uiFrame=requestAnimationFrame(refreshUI);}
previousButton.addEventListener('click',()=>go(active-1));nextButton.addEventListener('click',()=>{
 if(portalFinale&&active===lastChapter){if(window.museumPortalNavigate)window.museumPortalNavigate(portalFinale);else scrollTo({top:scrollY+portalFinale.getBoundingClientRect().top-90,behavior:reduced.matches?'instant':'smooth'});return;}
 go(active===lastChapter?0:active+1);
});
stops.forEach((button,i)=>button.addEventListener('click',()=>go(i)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.go))));
document.querySelector('[data-pause]').addEventListener('click',e=>{state.paused=!state.paused;e.currentTarget.setAttribute('aria-pressed',String(state.paused));if(starry)window.museumStarryFlowPause?.(state.paused);e.currentTarget.textContent=state.paused?'继续环境动态 ▷':'暂停环境动态 Ⅱ';renderWake();});
addEventListener('scroll',queueUI,{passive:true});addEventListener('resize',queueUI);reduced.addEventListener('change',queueUI);
syncMemory();document.body.classList.add('story-enhanced');refreshUI();

try{
 const canvas=document.getElementById('story-canvas');
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:mobileQuality?'low-power':'default'});renderer.setPixelRatio(Math.min(devicePixelRatio,mobileQuality?1:1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.1,160),group=new T.Group();scene.add(group);
 if(!mobileQuality){const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();}
 const sunlight=new T.DirectionalLight('#fff3df',4);sunlight.position.set(-4,6,8);scene.add(sunlight);
 const fill=new T.DirectionalLight('#bfdcff',2.5);fill.position.set(4,-2,5);scene.add(fill);scene.add(new T.HemisphereLight(0xffffff,0x52677a,2));
 const {root,update}=createWorld(key,config.accent);group.add(root);
 if(starry){decorateStarryFrames(root,frames.length);scene.environmentIntensity=.35;}
 if(integrated&&key==='portal')attachPortalOcclusion(root.children);
 const fullCounts=new Map();root.traverse(o=>{if(o.geometry)fullCounts.set(o.geometry,o.geometry.drawRange.count===Infinity?(o.geometry.index?.count||o.geometry.attributes.position.count):o.geometry.drawRange.count);});
 const initialParts=root.children.map(o=>({position:o.position.clone(),scale:o.scale.clone()}));
 let frame=0,last=0,time=0,lost=false;const pointer=new T.Vector2(),eased=new T.Vector2();
 const orbitEye=new T.Vector3(),look=new T.Vector3();
 function render(now){
  frame=0;if(lost||document.hidden)return;
  if(mobileQuality&&!state.paused&&!reduced.matches&&now-last<1000/30-1){frame=requestAnimationFrame(render);return;}
  const dt=Math.min((now-last)/1000||.016,.1);last=now;
  if(!state.paused&&!reduced.matches)time+=dt;eased.lerp(pointer,1-Math.exp(-dt*4));

  const p=reduced.matches?0:progress,pose=storyPose(key,p,state.value),mobile=innerWidth<720;
  const influence=['bloom','paper','signal'].includes(key)?clamp(p+state.value*.15,0,1):state.value;
  update(time,influence,p);
  if(key==='ribbon'||key==='fabric'||key==='signal'||key==='constellation')root.traverse(o=>{
   if(!o.geometry)return;if(key==='constellation'&&!o.isLine)return;
   const count=fullCounts.get(o.geometry),unit=o.isMesh?3:1;o.geometry.setDrawRange(0,Math.max(unit,Math.floor(count*pose.draw/unit)*unit));
  });
  if(key==='mobile'||key==='voxel')root.children.forEach((o,i)=>{const reveal=clamp(p*1.25-i/root.children.length+.3,0,1);const size=initialParts[i].scale;o.scale.set(size.x,Math.max(.01,reveal)*size.y,size.z);});
  if(key==='portal'){
   if(integrated)root.rotation.y=-.3*(1-p);
   root.children.forEach((o,i)=>{o.position.z=-i*2.5;o.rotation.y=Math.sin(p*5*Math.PI-i*.2)*state.value*.12;});
   if(integrated)updatePortalFade(root.children,starry?portalPhase:progress*5);
  }
  if(key==='clock')root.rotation.z=time*.04*state.value;
  const depthWorld=['tunnel','portal','orbit','voxel','wave'].includes(key);
  group.position.set(pose.x,pose.y,pose.z);group.rotation.set(pose.rx+eased.y*.04,pose.ry+eased.x*.045,pose.rz);
  group.scale.setScalar(pose.scale*(mobile&&!depthWorld?.58:1));
  if(mobile&&!depthWorld){group.position.x=0;group.position.y+=2.65;}
  orbitEye.set(pose.cx,pose.cy,pose.cz);look.set(pose.tx,pose.ty,pose.tz);camera.position.copy(orbitEye);camera.lookAt(look);
  if(starry)arrangeStarryFrames(root,group,camera,portalPhase,reduced.matches?0:time,innerHeight);
  if(key==='wave')group.position.y+=Math.sin(p*Math.PI*5)*.6+state.value*.65;
  sunlight.intensity=key==='tunnel'?1:3+state.value;fill.color.set(['prism','bloom','fabric'].includes(key)?getComputedStyle(document.body).getPropertyValue('--story-accent').trim():config.accent);
  if(starry){sunlight.intensity=1.55;fill.color.set('#d4dbe2');fill.intensity=.65;}
  canvas.style.opacity=String((reduced.matches?.12:(key==='signal'?.28+Math.min(1,p*2+state.booted.size*.2)*.72:pose.opacity))*(starry?portalEntrance:1));
  if(integrated&&key==='portal'&&typeof window.museumPortalProject==='function'){
   try{scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);window.museumPortalProject(root.children,camera,innerWidth,innerHeight,PORTAL_SURFACE);}
   catch(error){console.warn('Portal artwork projection fell back to the readable links.',error);window.museumPortalProject=null;}
  }
  renderer.render(scene,camera);document.body.classList.add('story-webgl');
  if(!document.hidden&&!reduced.matches&&!state.paused)frame=requestAnimationFrame(render);
 }
 function wake(){if(!frame&&!lost&&!document.hidden)frame=requestAnimationFrame(render);}
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();wake();}
 renderWake=wake;addEventListener('resize',resize);addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight*2-1));wake();},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();wake();}});
 reduced.addEventListener('change',wake);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;document.body.classList.remove('story-webgl');});canvas.addEventListener('webglcontextrestored',()=>{lost=false;wake();});resize();
}catch(error){console.warn('The story remains available with its illustrated fallback.',error);}
