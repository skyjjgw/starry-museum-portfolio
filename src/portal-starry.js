import * as T from 'three';
const woodColor='assets/starry-gallery/wood/oak-veneer.webp';

export const STARRY_STOPS=[[-1.1,.35],[1.35,-.25],[-1.35,.15],[1.1,.48],[-.85,-.28],[.35,.18],[1.2,0]];

export function decorateStarryFrames(root,count=4){
 // Only build rims that have a live exhibit.
 for(const extra of root.children.slice(count)){root.remove(extra);extra.traverse(mesh=>mesh.geometry?.dispose());}
 const loader=new T.TextureLoader();
 // Texture references must exist before attachPortalOcclusion clones materials.
 // TextureLoader fills these same Texture objects when decoding completes.
 const maps=[woodColor].map(url=>{
  const texture=loader.load(url);texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.anisotropy=8;return texture;
 });
 maps[0].colorSpace=T.SRGBColorSpace;
 const wood=new T.MeshPhysicalMaterial({color:'#c89b59',map:maps[0],bumpMap:maps[0],
  bumpScale:.018,roughness:.88,metalness:0,clearcoat:0,vertexColors:true});
 const fillet=new T.MeshStandardMaterial({color:'#b29659',roughness:.62,metalness:.55});
 const shapes=[woodRail('top'),woodRail('right'),woodRail('bottom'),woodRail('left')];
 root.children.forEach((frame,i)=>{
  while(frame.children.length){const old=frame.children[0];frame.remove(old);old.geometry?.dispose();}
  shapes.forEach((geometry,side)=>{
   const material=wood.clone();material.color.multiplyScalar(1-(i%3)*.025-(side%2)*.015);
   const rail=new T.Mesh(geometry,[material,fillet.clone()]);rail.name='solid-wood-rail';frame.add(rail);
  });
 });
}

function woodRail(side){
 const w=2.23,h=2.88;
 // Exhibition moulding: narrow inner fillet, shadow groove, swept cove,
 // rounded raised bead and an outer stepped rail. Grain follows the mitres.
 const profile=[[0,.045],[.022,.065],[.04,.065],[.054,.035],
  [.073,.025],[.092,.045],[.11,.12],[.135,.155],
  [.34,.155],[.365,.13],[.38,.09],[.38,-.18],[0,-.18]];
 const positions=[],uvs=[],colors=[],indices=[];
 const vertical=side==='left'||side==='right';
 const sign=side==='left'||side==='bottom'?-1:1;
 for(let j=0;j<profile.length;j++){
  const k=(j+1)%profile.length;
  for(const [d,z] of [profile[j],profile[k]]){
   for(const end of [-1,1]){
    const long=end*((vertical?h:w)+d-.0015);
    const across=sign*((vertical?w:h)+d);
    positions.push(vertical?across:long,vertical?long:across,z);
    // Grain follows each wooden board along its length, including the mitres.
    uvs.push((d+.14)/.8+(vertical?.32:0),long/3.8+1.35);
    const tone=d<.04?1:(d<.092?.67:1);
    colors.push(tone,tone,tone);
   }
  }
  const base=j*4;
  const forward=(vertical&&sign<0)||(!vertical&&sign>0);
  if(forward)indices.push(base,base+1,base+2,base+1,base+3,base+2);
  else indices.push(base,base+2,base+1,base+1,base+2,base+3);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 for(let j=0;j<profile.length;j++)geometry.addGroup(j*6,6,j<3?1:0);
 geometry.computeVertexNormals();return geometry;
}

export function arrangeStarryFrames(root,group,camera,phase,time=0,viewportHeight=900){
 const spread=Math.min(1,camera.aspect/1.15);
 const last=root.children.length-1;
 const index=Math.min(last,Math.floor(phase)),t=T.MathUtils.clamp(phase-index,0,1),s=t*t*(3-2*t);
 const a=STARRY_STOPS[index],b=STARRY_STOPS[Math.min(last+1,index+1)];
 const x=T.MathUtils.lerp(a[0],b[0],s)*spread,y=T.MathUtils.lerp(a[1],b[1],s);
 group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.setScalar(1);root.rotation.set(0,0,0);
 root.children.forEach((frame,i)=>{
  const drift=time*.62+i*1.35;
  // Keep the current artwork floating too; the old zero amplitude made it
  // appear fixed whenever the viewer stopped in front of a frame.
  const motion=.7+.3*T.MathUtils.smoothstep(Math.abs(phase-i),.22,.65);
  const exit=i===last?T.MathUtils.smoothstep(phase,last+.15,last+1.2):0;
  const retreat=i<last?T.MathUtils.smoothstep(phase,i+.08,i+.98):0;
  const side=i%2?1:-1;
  frame.position.set(STARRY_STOPS[i][0]*spread+Math.sin(drift*.7)*.085*motion+side*retreat*9.5,STARRY_STOPS[i][1]+Math.sin(drift)*.23*motion+exit*11+retreat*.7,-i*3.4-exit*.8-retreat*.9);
  frame.rotation.set(Math.sin(drift*.8)*.025*motion,((i%2?1:-1)*.075+Math.cos(drift*.65)*.035)*motion,((i%2?1:-1)*.035+Math.sin(drift*.6)*.025)*motion);
 });
 // Fit the outer rim and its drift between navigation and bottom controls.
 const topInset=Math.min(100,viewportHeight*.16);
 const bottomInset=Math.min(118,viewportHeight*.2);
 const usableHeight=Math.max(.45,1-(topInset+bottomInset)/viewportHeight);
 const tangent=Math.tan(T.MathUtils.degToRad(camera.fov/2));
 const distance=Math.max(3.55/(tangent*usableHeight),2.95/(tangent*camera.aspect*.90))+.3;
 const centerShift=(bottomInset-topInset)/viewportHeight*distance*tangent;
 camera.position.set(x,y-centerShift,distance-phase*3.4);
 camera.lookAt(x,y-centerShift,-phase*3.4);
}
