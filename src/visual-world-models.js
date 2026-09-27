import * as T from 'three';
export function createWorld(){
 const root=new T.Group();
 for(let i=0;i<4;i++)root.add(new T.Group());
 return {root,update(){}};
}
