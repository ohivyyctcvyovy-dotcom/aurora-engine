// Prefabs procedurais do Aurora Engine. Tudo é desenhado com Canvas/Three.js, sem imagens externas.
export function drawAurora2DPrefab(ctx,o){
 const w=o.w||120,h=o.h||100;
 if(!['house','tree','mountain','cloud','water','road','bridge','building'].includes(o.type))return false;
 ctx.save();
 if(o.type==='house'){
  ctx.fillStyle='#9b7654';ctx.fillRect(-w*.38,-h*.12,w*.76,h*.58);
  ctx.fillStyle=o.color||'#c99a62';ctx.beginPath();ctx.moveTo(-w*.48,-h*.12);ctx.lineTo(0,-h*.52);ctx.lineTo(w*.48,-h*.12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#392b28';ctx.fillRect(-w*.09,h*.12,w*.18,h*.34);ctx.fillStyle='#bde4ed';ctx.fillRect(-w*.29,-h*.02,w*.15,h*.16);ctx.fillRect(w*.14,-h*.02,w*.15,h*.16);
 }else if(o.type==='tree'){
  ctx.fillStyle='#765034';ctx.fillRect(-w*.07,h*.02,w*.14,h*.42);ctx.fillStyle=o.color||'#39734a';
  for(const [x,y,r] of [[0,-h*.22,w*.28],[-w*.17,-h*.05,w*.22],[w*.17,-h*.05,w*.22]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
 }else if(o.type==='mountain'){
  ctx.fillStyle=o.color||'#78849a';ctx.beginPath();ctx.moveTo(-w*.5,h*.45);ctx.lineTo(-w*.08,-h*.48);ctx.lineTo(w*.5,h*.45);ctx.closePath();ctx.fill();
  ctx.fillStyle='#eee9df';ctx.beginPath();ctx.moveTo(-w*.19,-h*.22);ctx.lineTo(-w*.08,-h*.48);ctx.lineTo(w*.06,-h*.22);ctx.closePath();ctx.fill();
 }else if(o.type==='cloud'){
  ctx.fillStyle=o.color||'#e8edf4';for(const [x,y,r] of [[-w*.2,0,h*.25],[0,-h*.12,h*.34],[w*.22,0,h*.25]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
 }else if(o.type==='water'){
  ctx.fillStyle=o.color||'#287fa8';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#d9f4ff99';ctx.lineWidth=3;
  for(let yy=-h*.25;yy<h*.4;yy+=h*.28){ctx.beginPath();for(let x=-w*.45;x<=w*.45;x+=8){const y=yy+Math.sin(x/18+yy)*4;x===-w*.45?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
 }else if(o.type==='road'){
  ctx.fillStyle='#34363d';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#f1d18a';ctx.lineWidth=Math.max(2,h*.035);ctx.setLineDash([w*.06,w*.05]);ctx.beginPath();ctx.moveTo(-w*.46,0);ctx.lineTo(w*.46,0);ctx.stroke();ctx.setLineDash([]);
 }else if(o.type==='bridge'){
  ctx.fillStyle='#806348';ctx.fillRect(-w/2,-h*.12,w,h*.24);ctx.fillRect(-w*.42,-h*.4,w*.06,h*.7);ctx.fillRect(w*.36,-h*.4,w*.06,h*.7);ctx.strokeStyle='#d7ad58';ctx.lineWidth=Math.max(3,h*.06);ctx.beginPath();ctx.moveTo(-w*.5,-h*.24);ctx.lineTo(w*.5,-h*.24);ctx.stroke();
 }else if(o.type==='building'){
  ctx.fillStyle=o.color||'#8293a4';ctx.fillRect(-w*.36,-h*.5,w*.72,h);ctx.fillStyle='#bfe5f0';
  for(let yy=-h*.38;yy<h*.4;yy+=h*.23)for(let xx=-w*.23;xx<w*.25;xx+=w*.23)ctx.fillRect(xx,yy,w*.12,h*.12);
 }else return false;
 ctx.restore();return true;
}

export function buildAurora3DPrefab(THREE,o){
 const kinds=['house','castle','bridge','road','water','mountain','rock','lamp','bench','fountain','portal','forest','village','city','temple','room'];
 if(!kinds.includes(o.kind))return null;
 const group=new THREE.Group(),base=o.color||0xd7ad58;
 const mat=(color,roughness=.65,metalness=.08,transparent=false,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness,metalness,transparent,opacity});
 const add=(geo,m,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 const box=(x,y,z,w,h,d,m)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(x,y,z,rt,rb,h,m,n=16)=>add(new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
 const tree=(x,z,k=1)=>{cyl(x,30*k,z,8*k,12*k,60*k,mat(0x765034));add(new THREE.ConeGeometry(42*k,90*k,10),mat(0x39734a),x,95*k,z);add(new THREE.ConeGeometry(32*k,72*k,10),mat(0x4d9155),x,145*k,z)};
 const house=(x,z,k=1,color=0xc99a62)=>{box(x,42*k,z,100*k,84*k,90*k,mat(color));add(new THREE.ConeGeometry(76*k,62*k,4),mat(0x75434a),x,112*k,z).rotation.y=Math.PI/4;box(x,28*k,z+46*k,22*k,55*k,5*k,mat(0x513a2e));box(x-30*k,58*k,z+47*k,18*k,20*k,4,mat(0x9bcddd,.2,.25));box(x+30*k,58*k,z+47*k,18*k,20*k,4,mat(0x9bcddd,.2,.25))};
 if(o.kind==='house')house(0,0,1,base);
 if(o.kind==='mountain'){add(new THREE.ConeGeometry(110,220,7),mat(base),0,110,0);add(new THREE.ConeGeometry(32,62,7),mat(0xe8e4df),0,198,0)}
 if(o.kind==='rock')add(new THREE.DodecahedronGeometry(52,1),mat(base),0,28,0);
 if(o.kind==='road'){box(0,0,0,260,3,70,mat(0x34363d,1));for(let x=-105;x<120;x+=55)box(x,2,0,28,1,4,mat(0xf1d18a))}
 if(o.kind==='water'){box(0,-2,0,260,2,220,mat(base,.18,.25,true,.82));for(let z=-80;z<=80;z+=40)box(0,0,z,190,.7,1.5,mat(0x9be8f0,.15,0,true,.5))}
 if(o.kind==='bridge'){box(0,0,0,240,12,72,mat(0x806348));for(const x of [-100,100]){box(x,24,0,12,48,72,mat(0x9a805e));box(x,52,0,18,8,80,mat(0xd7ad58))}for(let x=-90;x<=90;x+=30){box(x,30,-34,5,36,5,mat(0x806348));box(x,30,34,5,36,5,mat(0x806348))}}
 if(o.kind==='castle'){box(0,35,0,220,70,170,mat(0xb4a38c));for(const [x,z] of [[-95,-70],[95,-70],[-95,70],[95,70]]){cyl(x,92,z,24,28,115,mat(0x8b8175),12);add(new THREE.ConeGeometry(30,48,12),mat(0x75434a),x,174,z)}box(0,100,0,150,18,120,mat(0xb4a38c));box(0,22,88,38,48,5,mat(0x49372f))}
 if(o.kind==='forest'){for(const [x,z,k] of [[-70,-55,.8],[0,-80,1.1],[75,-45,.9],[-90,35,1],[0,30,1.2],[90,55,.85]])tree(x,z,k)}
 if(o.kind==='village'){box(0,-3,0,420,5,320,mat(0x657b4b,1));house(-105,35,.75,0xc99a62);house(95,35,.85,0xb9c4ce);house(0,-95,.68,0xd4b27c);box(0,1,115,300,3,34,mat(0x806348));tree(-175,-100,.8);tree(175,-110,.9);tree(165,120,.8)}
 if(o.kind==='city'){box(0,-3,0,480,5,300,mat(0x45464b,1));for(const [x,z,h,w,c] of [[-150,-70,180,70,0x8293a4],[-50,-80,260,75,0x687d94],[65,-65,210,82,0x9b8d83],[170,-70,150,70,0x748c9d],[-90,80,120,90,0x8b8e9a],[80,85,160,85,0x7b8793]]){box(x,h/2,z,w,h,70,mat(c));for(let y=20;y<h-10;y+=35)for(let xx=x-w*.28;xx<x+w*.3;xx+=28)box(xx,y,z+36,12,18,2,mat(0xb9d9e8,.2,.2))}}
 if(o.kind==='temple'){box(0,4,0,230,8,160,mat(0xb9b09b));for(const x of [-82,-27,27,82])cyl(x,68,50,8,10,120,mat(0xe1d7bd),16);box(0,135,0,230,18,160,mat(0xd0c4a6));add(new THREE.ConeGeometry(155,55,4),mat(0x8b7652),0,170,0).rotation.y=Math.PI/4}
 if(o.kind==='room'){box(0,-3,0,220,6,180,mat(0x6f6254));box(0,70,-88,220,140,8,mat(0x8d9aa4));box(-108,70,0,8,140,180,mat(0x8d9aa4));box(108,70,0,8,140,180,mat(0x8d9aa4));box(0,25,70,48,50,8,mat(0x513a2e));box(-55,24,-35,65,48,35,mat(0x8b6546))}
 if(o.kind==='bench'){box(0,0,0,90,8,30,mat(0x8b6546));box(0,25,-12,90,8,8,mat(0x8b6546));for(const x of [-34,34])box(x,-22,0,7,42,7,mat(0x44434a))}
 if(o.kind==='fountain'){cyl(0,0,0,62,62,12,mat(0x8c9ba8,.25,.5));cyl(0,24,0,12,18,42,mat(0xb4c0c8,.25,.55));add(new THREE.SphereGeometry(13,16,12),mat(0x65c9e8,.1,.1,true,.8),0,52,0)}
 if(o.kind==='portal'){const ring=add(new THREE.TorusGeometry(52,9,16,48),mat(0x8f73db,.2,.6),0,60,0);ring.rotation.y=Math.PI/2;box(0,60,0,4,92,84,mat(0x72c9f0,.1,.2,true,.25))}
 if(o.kind==='lamp'){cyl(0,55,0,4,6,110,mat(0x34343b,.4,.7));box(0,112,0,24,12,24,mat(0xffd58a,.25,.1))}
 group.position.set(o.x||0,o.y||0,o.z||0);group.scale.set(o.sx||1,o.sy||1,o.sz||1);group.rotation.set(THREE.MathUtils.degToRad(o.rx||0),THREE.MathUtils.degToRad(o.ry||0),THREE.MathUtils.degToRad(o.rz||0));
 return group;
}
