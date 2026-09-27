import * as T from 'three';
import {PAINT_FRAGMENT} from './starry-paint-warp.js';

const host=document.querySelector('.starry-edition .story-atmosphere');
if(host){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width:760px)').matches||navigator.connection?.saveData;
 const paintingUrl=mobile?'assets/starry-gallery/starry-night-mobile.webp':'assets/starry-gallery/starry-night-desktop.webp';
 const canvas=document.createElement('canvas');
 canvas.className='starry-flow-canvas';canvas.setAttribute('aria-hidden','true');
 let renderer,frame=0,last=0,time=0,paused=false,ready=false,lost=false;
 try{
  renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const uniforms={uPainting:{value:null},uFlow:{value:null},uViewport:{value:new T.Vector2(1,1)},uTime:{value:0}};
  const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,toneMapped:false,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:PAINT_FRAGMENT});
  scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
  function render(now){
   frame=0;if(!ready||lost||document.hidden)return;
   if(mobile&&!paused&&!reduced.matches&&now-last<1000/30-1){frame=requestAnimationFrame(render);return;}
   if(!paused&&!reduced.matches)time+=Math.min((now-last)/1000,.1);
   last=now;uniforms.uTime.value=reduced.matches?0:time;renderer.render(scene,camera);
   host.classList.add('has-starry-flow');
   if(!paused&&!reduced.matches)frame=requestAnimationFrame(render);
  }
  function wake(){
   if(frame)cancelAnimationFrame(frame);frame=0;last=performance.now();
   if(ready&&!lost&&!document.hidden)frame=requestAnimationFrame(render);
  }
  function resize(){
   const w=host.clientWidth||innerWidth,h=host.clientHeight||innerHeight;
   renderer.setSize(w,h,false);uniforms.uViewport.value.set(w,h);wake();
  }
  const loader=new T.TextureLoader();
  Promise.all([loader.loadAsync(paintingUrl),loader.loadAsync('assets/starry-gallery/starry-flow-map.png')]).then(([texture,flow])=>{
   texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearFilter;texture.generateMipmaps=false;
   flow.colorSpace=T.NoColorSpace;flow.flipY=false;flow.minFilter=flow.magFilter=T.LinearFilter;flow.generateMipmaps=false;
   uniforms.uFlow.value=flow;
   uniforms.uPainting.value=texture;ready=true;host.append(canvas);resize();
  }).catch(error=>{renderer.dispose();console.warn('Using the static painting because a flow texture failed to load.',error);});
  window.museumStarryFlowPause=value=>{paused=value;wake();};
  reduced.addEventListener('change',wake);document.addEventListener('visibilitychange',wake);
  addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',event=>{
   event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;host.classList.remove('has-starry-flow');
  });
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;resize();});
 }catch(error){renderer?.dispose();canvas.remove();console.warn('The original Starry Night remains visible; WebGL animation is unavailable.',error);}
}
