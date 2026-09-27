import * as T from 'three';

// Match the live DOM surface inside the rim. Color stays transparent so the
// underlying webpage is visible, while depth rejects every object behind it.
export const PORTAL_SURFACE = {halfWidth:2.23,halfHeight:2.88,z:0};
export function attachPortalOcclusion(frames,count=6){
  // Each rim needs its own material so fading one frame cannot dim the others.
  frames.forEach(frame=>frame.traverse(object=>{
    if(!object.isMesh)return;
    const clone=material=>{const copy=material.clone();copy.transparent=true;return copy;};
    object.material=Array.isArray(object.material)?object.material.map(clone):clone(object.material);
  }));
  const geometry=new T.PlaneGeometry(PORTAL_SURFACE.halfWidth*2,PORTAL_SURFACE.halfHeight*2);
  const material=new T.MeshBasicMaterial({colorWrite:false,depthWrite:true,depthTest:true,side:T.DoubleSide});
  return frames.slice(0,count).map(frame=>{
    const panel=new T.Mesh(geometry,material.clone());
    // The page remains a solid depth barrier while its whole frame exits.
    // Alpha hashing punched holes through the page and speckled rear wood rails.
    panel.name='portal-webpage-depth';
    panel.position.z=PORTAL_SURFACE.z;
    panel.renderOrder=-10;
    frame.add(panel);
    return panel;
  });
}

export function updatePortalFade(frames,phase){
  frames.forEach((frame,index)=>{
    const t=T.MathUtils.clamp((phase-index-.04)/.88,0,1);
    const opacity=1-t*t*(3-2*t);
    frame.userData.portalOpacity=opacity;
    frame.visible=opacity>0;
    frame.traverse(object=>{
      if(!object.isMesh)return;
      for(const material of [object.material].flat()){
       material.opacity=object.name==='portal-webpage-depth'?1:opacity;
       if(object.name!=='portal-webpage-depth')material.depthWrite=opacity===1;
      }
    });
  });
}
