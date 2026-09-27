// The authored direction map is from DomonJi/InteractiveStarryNight (MIT).
// Advect the full painting texture, not particle marks drawn over it.
export const PAINT_WIDTH=1200,PAINT_HEIGHT=950,FLOW_COLS=240,FLOW_ROWS=190;
export const FLOW_PERIOD=12,FLOW_TRAVEL=108,FLOW_STEPS=18;

export function encodeFlow(text){
 const values=text.trim().split(/\s+/),bytes=new Uint8Array(FLOW_COLS*FLOW_ROWS*4);
 let vectors=new Float32Array(FLOW_COLS*FLOW_ROWS*2);
 for(let x=0;x<FLOW_COLS;x++)for(let y=0;y<FLOW_ROWS;y++){
  const [vx,vy]=values[x*FLOW_ROWS+y].split(',').map(Number),i=(y*FLOW_COLS+x)*2;
  vectors[i]=vx;vectors[i+1]=vy;
 }
 // Smooth the hand-drawn grid before deforming a continuous image surface.
 for(let pass=0;pass<4;pass++){
  const smooth=new Float32Array(vectors.length);
  for(let y=0;y<FLOW_ROWS;y++)for(let x=0;x<FLOW_COLS;x++){
   let sx=0,sy=0,total=0;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    const weight=(3-Math.abs(dx))*(3-Math.abs(dy));
    const i=(clamp(y+dy,0,FLOW_ROWS-1)*FLOW_COLS+clamp(x+dx,0,FLOW_COLS-1))*2;
    sx+=vectors[i]*weight;sy+=vectors[i+1]*weight;total+=weight;
   }
   const i=(y*FLOW_COLS+x)*2;smooth[i]=sx/total;smooth[i+1]=sy/total;
  }
  vectors=smooth;
 }
 for(let i=0;i<vectors.length/2;i++){
  bytes[i*4]=Math.round((vectors[i*2]+1)*127.5);bytes[i*4+1]=Math.round((vectors[i*2+1]+1)*127.5);bytes[i*4+3]=255;
 }
 return bytes;
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function flowPhases(time){
 const a=((time/FLOW_PERIOD)%1+1)%1;
 return {a,b:(a+.5)%1,weightA:1-Math.abs(2*a-1)};
}
export function sourcePoint(x,y,phase,bytes){
 let px=x,py=y;
 const step=(phase-.5)*FLOW_TRAVEL/FLOW_STEPS;
 for(let n=0;n<FLOW_STEPS;n++){
  const gx=clamp(px/5,0,FLOW_COLS-1),gy=clamp(py/5,0,FLOW_ROWS-1);
  const ix=Math.floor(gx),iy=Math.floor(gy),tx=gx-ix,ty=gy-iy;
  const a=(iy*FLOW_COLS+ix)*4,b=(iy*FLOW_COLS+Math.min(ix+1,FLOW_COLS-1))*4;
  const c=(Math.min(iy+1,FLOW_ROWS-1)*FLOW_COLS+ix)*4,d=(Math.min(iy+1,FLOW_ROWS-1)*FLOW_COLS+Math.min(ix+1,FLOW_COLS-1))*4;
  const vx=((bytes[a]*(1-tx)+bytes[b]*tx)*(1-ty)+(bytes[c]*(1-tx)+bytes[d]*tx)*ty)/127.5-1;
  const vy=((bytes[a+1]*(1-tx)+bytes[b+1]*tx)*(1-ty)+(bytes[c+1]*(1-tx)+bytes[d+1]*tx)*ty)/127.5-1;
  const edge=clamp(Math.min(px,py,PAINT_WIDTH-1-px,PAINT_HEIGHT-1-py)/42,0,1);
  const fade=edge*edge*(3-2*edge);
  px-=vx*step*fade;py-=vy*step*fade;
 }
 return [clamp(px,0,PAINT_WIDTH-1),clamp(py,0,PAINT_HEIGHT-1)];
}

export const PAINT_FRAGMENT=`
 uniform sampler2D uPainting;
 uniform sampler2D uFlow;
 uniform vec2 uViewport;
 uniform float uTime;
 varying vec2 vUv;
 vec2 sourcePoint(vec2 point,float phase){
  vec2 p=point;
  float stepSize=(phase-.5)*${FLOW_TRAVEL.toFixed(1)}/${FLOW_STEPS.toFixed(1)};
  for(int i=0;i<${FLOW_STEPS};i++){
   vec2 flowUV=(p/5.0+.5)/vec2(240.0,190.0);
   vec2 direction=texture2D(uFlow,clamp(flowUV,vec2(0.0),vec2(1.0))).rg*2.0-1.0;
   float edge=smoothstep(0.0,42.0,min(min(p.x,p.y),min(1199.0-p.x,949.0-p.y)));
   p-=direction*stepSize*edge;
  }
  return clamp(p,vec2(0.0),vec2(1199.0,949.0));
 }
 vec4 paintingAt(vec2 point){
  vec2 uv=point/vec2(1200.0,950.0);
  return texture2D(uPainting,vec2(uv.x,1.0-uv.y));
 }
 void main(){
  float aspect=uViewport.x/uViewport.y;
  float imageAspect=1200.0/950.0;
  vec2 cover=vec2(min(1.0,aspect/imageAspect),min(1.0,imageAspect/aspect));
  vec2 center=vec2(uViewport.x<760.0?.6:.5,.5);
  vec2 point=((vec2(vUv.x,1.0-vUv.y)-.5)*cover+center*(1.0-cover)+.5*cover)*vec2(1200.0,950.0);
  float a=fract(uTime/${FLOW_PERIOD.toFixed(1)}),b=fract(a+.5);
  float weightA=1.0-abs(2.0*a-1.0);
  vec4 first=paintingAt(sourcePoint(point,a));
  vec4 second=paintingAt(sourcePoint(point,b));
  gl_FragColor=mix(second,first,weightA);
  #include <colorspace_fragment>
 }
`;
