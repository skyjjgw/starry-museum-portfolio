const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,p)=>a+(b-a)*p;
// Twenty whole-route camera/geometry choreographies, not a common left/right handoff.
export function storyPose(key,p,value=.5){
 p=clamp(p);const q=p*5,a=p*Math.PI*2;
 const pose={x:2.3,y:0,z:0,rx:0,ry:0,rz:0,scale:1,cx:0,cy:0,cz:19,tx:0,ty:0,tz:0,draw:1,opacity:1,grow:0};
 switch(key){
  case 'sky':Object.assign(pose,{x:mix(2,0,p),y:Math.sin(a)*.3,ry:Math.sin(a)*.35,scale:1+Math.sin(p*Math.PI)*.32,cz:19-p*2,grow:p});break;
  case 'cloud':Object.assign(pose,{x:Math.sin(q*1.05)*2.5,y:1+Math.sin(q*.8)*.5,rz:Math.cos(q)*.08,cz:17,grow:p});break;
  case 'knot':Object.assign(pose,{x:Math.sin(a)*2.1,y:Math.sin(a*2)*.6,ry:a,rz:Math.sin(a)*.55,scale:1.1,grow:p});break;
  case 'archive':Object.assign(pose,{x:2.8,ry:-.35,rx:.1,scale:1.1,cz:20,grow:p});break;
  case 'tunnel':Object.assign(pose,{x:0,cz:12-p*94,tz:-115,cx:Math.sin(a)*.3,cy:Math.sin(a*1.5)*.3,rz:0});break;
  case 'orbit':Object.assign(pose,{x:0,cx:Math.sin(a)*16,cz:Math.cos(a)*16,cy:2.5+Math.sin(a)*2,ry:0,grow:p});break;
  case 'ribbon':Object.assign(pose,{x:2.6,cy:mix(-2,3,p),ty:mix(-2,3,p),ry:p*2.2,scale:1.15,draw:.13+.87*p});break;
  case 'prism':Object.assign(pose,{x:2.1,ry:q*Math.PI*2/3,rx:Math.sin(q)*.3,cz:18+Math.sin(q*Math.PI)*1.8,scale:1.15});break;
  case 'bloom':Object.assign(pose,{x:2.2,y:mix(-1,.7,p),scale:.18+p*1.05,cz:17,rx:mix(-.7,0,p),grow:p});break;
  case 'signal':Object.assign(pose,{x:2.5,ry:p*.5,scale:.7+.3*p,draw:Math.max(.03,p),grow:p,opacity:.25+.75*p});break;
  case 'paper':Object.assign(pose,{x:2.1,y:Math.sin(p*Math.PI)*1.2,rx:mix(1.15,-.25,p),ry:p*.85,rz:Math.sin(q)*.12,scale:.7+p*.25,grow:p});break;
  case 'mobile':Object.assign(pose,{x:-2.6,cy:mix(3,-2,p),ty:mix(3,-2,p),ry:p*.5,rz:Math.sin(a)*.07,cz:20,grow:p});break;
  case 'voxel':Object.assign(pose,{x:0,cx:mix(-9,9,p),cy:8+Math.sin(p*Math.PI)*2,cz:15,tz:0,ry:0,scale:1.2,grow:p});break;
  case 'wave':Object.assign(pose,{x:0,y:-1.5,cz:15-p*2,cy:3.5,ty:-.4,ry:p*.35,scale:1.6,grow:p});break;
  case 'portal':Object.assign(pose,{x:0,cz:13-p*13,ty:0,tz:-12,cx:Math.sin(q*Math.PI)*.15,scale:1,grow:p});break;
  case 'helix':Object.assign(pose,{x:1.9,cy:mix(-4,4,p),ty:mix(-3.2,3.2,p),cx:Math.sin(a)*2,ry:-a,cz:17,grow:p});break;
  case 'clock':Object.assign(pose,{x:2.3,rz:-p*Math.PI*1.7,ry:-.25,cz:17,grow:p});break;
  case 'fabric':Object.assign(pose,{x:1.1,rx:.6,rz:mix(-.7,.3,p),scale:1.1,draw:.015+.985*p,grow:p});break;
  case 'monolith':Object.assign(pose,{x:mix(3,-3,p),y:-.2,ry:mix(-.7,.4,p),cz:15,scale:1.2,grow:p});break;
  case 'constellation':Object.assign(pose,{x:0,cx:Math.sin(q*1.3)*3.5,cy:Math.cos(q*1.1)*2,tx:Math.sin(q*1.3)*1.3,ty:Math.cos(q*1.1)*.8,cz:15+p*2,draw:.08+.92*p,grow:p});break;
 }
 return pose;
}
export function framePose(key,d){
 const f={opacity:clamp(1-Math.abs(d)*1.5),transform:'none',clipPath:'none',filter:'none'};
 switch(key){
  case 'sky':f.transform=`translateX(${d*110}%) scale(${1+Math.abs(d)*.4})`;break;
  case 'cloud':f.transform=`translateY(${d*108}vh)`;f.opacity=clamp(1-Math.abs(d)*.65);break;
  case 'knot':f.transform=`translate(${Math.sin(d*2)*65}%,${d*25}%) rotate(${d*32}deg)`;break;
  case 'archive':f.transform=`perspective(1600px) rotateY(${clamp(-d,0,1)*-175}deg) translateX(${Math.max(0,d)*28}%)`;f.opacity=d>=0?clamp(1-d*2):clamp(1+d*1.1);break;
  case 'tunnel':f.transform=`scale(${Math.max(.05,1-d*.75)})`;f.filter=`blur(${Math.abs(d)*3}px)`;break;
  case 'orbit':f.transform=`translate(${Math.sin(d*1.1)*95}%,${(1-Math.cos(d*1.1))*45}%) rotate(${d*22}deg)`;break;
  case 'ribbon':f.transform=`translate(${d*30}%,${d*110}%) skewY(${d*9}deg)`;break;
  case 'prism':f.transform=`translateX(${d*12}%)`;f.clipPath=`polygon(${clamp(-d)*100}% 0,100% 0,${100-clamp(d)*100}% 100%,0 100%)`;break;
  case 'bloom':f.transform=`scale(${Math.max(.05,1-Math.abs(d)*.5)})`;f.clipPath=`circle(${Math.max(0,100-Math.abs(d)*90)}% at 50% 60%)`;break;
  case 'signal':f.clipPath=`inset(${clamp(d)*100}% 0 ${clamp(-d)*100}% 0)`;f.transform=`translateX(${d*10}px)`;break;
  case 'paper':f.transform=`perspective(1500px) rotateX(${d*85}deg) translateY(${d*18}%)`;break;
  case 'mobile':f.transform=`rotate(${d*55}deg) translateY(${Math.abs(d)*50}%)`;break;
  case 'voxel':f.transform=`perspective(1300px) rotateY(${d*30}deg) translateX(${d*110}%) translateZ(${-Math.abs(d)*350}px)`;break;
  case 'wave':f.transform=`translateY(${d*35}%)`;f.clipPath=`inset(${clamp(-d)*100}% 0 ${clamp(d)*100}% 0)`;break;
  case 'portal':f.transform=`perspective(1100px) rotateY(${d*90}deg)`;break;
  case 'helix':f.transform=`perspective(1400px) translateY(${d*85}%) rotateY(${d*65}deg)`;break;
  case 'clock':f.transform=`rotate(${d*66}deg) translateX(${Math.abs(d)*65}%)`;break;
  case 'fabric':f.transform=`translateX(${d*25}%) skewY(${d*-5}deg)`;f.clipPath=`inset(0 ${clamp(d)*100}% 0 ${clamp(-d)*100}%)`;break;
  case 'monolith':f.transform=`translateX(${d*105}vw)`;f.opacity=1;break;
  case 'constellation':f.transform=`translate(${d*55}%,${Math.sin(d*1.2)*55}%) scale(${Math.max(.1,1-Math.abs(d)*.25)})`;break;
 }
 return f;
}
