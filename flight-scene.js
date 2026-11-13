/* Original procedural quadcopter and circuit, rendered locally. Not flight telemetry. */
(async () => {
 const THREE=await import('./vendor/three.module.min.js');
 const media=matchMedia('(prefers-reduced-motion: reduce)');let paused=media.matches,stop=()=>{};
 function mount(){
  stop();stop=()=>{};const canvas=document.querySelector('.flight-canvas');if(!canvas)return;
  const button=document.querySelector('.motion-toggle');let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch{button.hidden=true;canvas.parentElement.classList.add('scene-unavailable');canvas.setAttribute('aria-label','Gece yarışı sahnesi bu tarayıcıda görüntülenemiyor.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#080d16');scene.fog=new THREE.FogExp2('#080d16',.028);
  const camera=new THREE.PerspectiveCamera(44,1,.1,160);camera.position.set(8,5,12);camera.lookAt(0,1,-5);
  scene.add(new THREE.HemisphereLight('#c4deff','#212326',2.5));
  const key=new THREE.DirectionalLight('#e5edff',5);key.position.set(3,12,8);scene.add(key);
  const warm=new THREE.PointLight('#ff5727',70,30,2);warm.position.set(-5,4,0);scene.add(warm);
  const rim=new THREE.PointLight('#7aaee7',100,30,2);rim.position.set(4,5,-5);scene.add(rim);
  const carbon=new THREE.MeshStandardMaterial({color:'#171d25',metalness:.65,roughness:.4});
  const edge=new THREE.MeshStandardMaterial({color:'#45515c',metalness:.85,roughness:.27});
  const orange=new THREE.MeshStandardMaterial({color:'#ff592d',metalness:.2,roughness:.35});
  const black=new THREE.MeshStandardMaterial({color:'#080b10',roughness:.8});
  const metal=new THREE.MeshStandardMaterial({color:'#a8b5c1',metalness:1,roughness:.22});
  const propMat=new THREE.MeshPhysicalMaterial({color:'#ff764d',metalness:.15,roughness:.25,transparent:true,opacity:.52,side:THREE.DoubleSide,depthWrite:false});
  function box(parent,w,h,d,material,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function cylinder(parent,r,h,material,x,y,z,r2=r){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r2,h,32),material);m.position.set(x,y,z);parent.add(m);return m;}
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:'#101925',metalness:.3,roughness:.7}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.7;scene.add(floor);
  // Finite circuit markings, rather than a decorative page grid.
  const marking=new THREE.MeshBasicMaterial({color:'#4a5360'});for(const x of [-5,5])box(scene,.035,.015,110,marking,x,-1.68,-35);
  for(let z=10;z>-90;z-=4)for(const x of [-5,5])box(scene,.25,.02,1.5,orange,x,-1.66,z);
  const gates=[];for(let i=0;i<10;i++){
   const gate=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:i%2?'#708caa':'#ed542c',metalness:.3,roughness:.45,emissive:i%2?'#142d46':'#96270f',emissiveIntensity:.4});
   box(gate,.15,5,.2,mat,-3,.8,0);box(gate,.15,5,.2,mat,3,.8,0);box(gate,6.15,.15,.2,mat,0,3.3,0);
   const led=new THREE.MeshBasicMaterial({color:i%2?'#c5e4ff':'#ff9b70'});box(gate,.025,5,.025,led,-2.91,.8,.11);box(gate,.025,5,.025,led,2.91,.8,.11);box(gate,5.85,.025,.025,led,0,3.21,.11);
   gate.position.set(Math.sin(i*.7)*1.2,0,-i*10-3);scene.add(gate);gates.push(gate);
  }
  const drone=new THREE.Group();scene.add(drone);const rotors=[];
  // Five-inch style stretched-X frame; deliberately not a branded drone replica.
  for(const [x,z] of [[-1.5,-1.25],[1.5,-1.25],[-1.5,1.25],[1.5,1.25]]){
   const len=Math.hypot(x,z),arm=box(drone,.24,.10,len,carbon,x/2,0,z/2);arm.rotation.y=Math.atan2(x,z);
   box(drone,.23,.10,.29,edge,x,0,z);
   cylinder(drone,.24,.28,edge,x,.18,z);cylinder(drone,.245,.04,orange,x,.32,z);cylinder(drone,.12,.11,metal,x,.38,z);
   for(let k=0;k<12;k++){const a=k*Math.PI/6;box(drone,.027,.16,.025,metal,x+Math.cos(a)*.22,.2,z+Math.sin(a)*.22);}
   const rotor=new THREE.Group();rotor.position.set(x,.47,z);drone.add(rotor);rotors.push(rotor);
   for(let b=0;b<3;b++){const blade=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),propMat);blade.scale.set(.16,.015,.69);blade.position.set(Math.sin(b*Math.PI*2/3)*.45,0,Math.cos(b*Math.PI*2/3)*.45);blade.rotation.y=b*Math.PI*2/3+.2;rotor.add(blade);}
   cylinder(rotor,.09,.07,metal,0,.04,0);
  }
  box(drone,.78,.11,1.8,carbon,0,.06,0);box(drone,.76,.08,1.45,carbon,0,.5,0);
  for(const x of [-.3,.3])for(const z of [-.53,.53])cylinder(drone,.04,.43,orange,x,.29,z);
  const battery=box(drone,.62,.42,1.14,orange,0,.76,.1);box(drone,.63,.06,1.15,black,0,.96,.1);
  for(const z of [-.24,.46])box(drone,.68,.48,.095,black,0,.76,z);
  box(drone,.49,.36,.42,black,0,.31, -.82);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.15,.17,.17,32),metal);lens.rotation.x=Math.PI/2;lens.position.set(0,.32,-1.1);drone.add(lens);
  const glass=new THREE.Mesh(new THREE.CircleGeometry(.115,32),new THREE.MeshPhysicalMaterial({color:'#315576',metalness:.8,roughness:.08}));glass.rotation.y=Math.PI;glass.position.set(0,.32,-1.19);drone.add(glass);
  const antenna=cylinder(drone,.025,.95,black,.25,.87,.8);antenna.rotation.x=.35;cylinder(drone,.08,.15,black,.25,1.35,.95);
  drone.position.set(2.1,1.3,.5);drone.rotation.set(-.13,-.5,-.2);drone.scale.setScalar(1.2);
  let frame=0,last=0,t=0,visible=true,disposed=false;
  function draw(){renderer.render(scene,camera);}
  function size(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.fov=r.width<600?53:44;camera.setViewOffset(r.width,r.height,-r.width*.18,0,r.width,r.height);camera.updateProjectionMatrix();draw();}
  function tick(now){frame=0;if(disposed||paused||media.matches||document.hidden||!visible)return;if(now-last>=32){const dt=Math.min((now-last)/1000,.06);last=now;t+=dt;drone.position.y=1.3+Math.sin(t*.9)*.16;drone.rotation.z=-.2+Math.sin(t*.6)*.035;rotors.forEach((r,i)=>r.rotation.y+=dt*29*(i%2?1:-1));gates.forEach((g,i)=>g.position.z=-i*10-3+(t*.7%10));draw();}frame=requestAnimationFrame(tick);}
  function sync(){const halted=paused||media.matches;button.textContent=halted?'Hareketi oynat':'Hareketi durdur';button.setAttribute('aria-pressed',String(halted));button.disabled=media.matches;button.title=media.matches?'Cihazının azaltılmış hareket tercihi etkin.':'';canvas.parentElement.classList.toggle('scene-paused',halted);cancelAnimationFrame(frame);last=performance.now();if(!halted&&!document.hidden&&visible)frame=requestAnimationFrame(tick);else draw();}
  button.onclick=()=>{paused=!paused;sync();};const ro=new ResizeObserver(size);ro.observe(canvas);const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});io.observe(canvas);document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);size();sync();
  stop=()=>{disposed=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();};
 }
 const original=render;render=function(){stop();stop=()=>{};original();mount();};mount();
})().catch(err=>{console.warn('FPV scene unavailable',err);const b=document.querySelector('.motion-toggle');if(b)b.hidden=true;});
