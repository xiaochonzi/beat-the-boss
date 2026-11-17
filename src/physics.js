import Matter from 'matter-js'
const {Engine,Bodies,Body,Composite,Constraint,Vector}=Matter
export const W=960,H=600,FLOOR=485,TARGET=[560,820]
export function createExperiment(level=1){
 const engine=Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8,constraintIterations:6});engine.gravity.y=1
 const wallOpts={isStatic:true,friction:.13,restitution:.08}
 Composite.add(engine.world,[Bodies.rectangle(480,515,1000,60,{...wallOpts,label:'地面'}),Bodies.rectangle(-18,300,40,600,{...wallOpts,label:'边界'}),Bodies.rectangle(978,300,40,600,{...wallOpts,label:'边界'})])
 const group=Body.nextGroup(true), opts={collisionFilter:{group},friction:.11,frictionStatic:.35,frictionAir:.023,restitution:.08,sleepThreshold:45}
 const part=(name,x,y,w,h,r=6)=>{const b=Bodies.rectangle(x,y,w,h,{...opts,chamfer:{radius:r},label:name});return b}
 const head=Bodies.circle(250,349,23,{...opts,label:'头部',density:.0013})
 const torso=part('身体',250,402,49,62),hip=part('腰部',250,439,40,20)
 const la=part('左臂',214,401,16,53),ra=part('右臂',286,401,16,53),ll=part('左腿',237,463,17,43),rl=part('右腿',263,463,17,43)
 const parts=[head,torso,hip,la,ra,ll,rl]
 const link=(a,pa,b,pb,length=0)=>Constraint.create({bodyA:a,pointA:pa,bodyB:b,pointB:pb,length,stiffness:.94,damping:.19})
 const links=[link(head,{x:0,y:19},torso,{x:0,y:-32},2),link(torso,{x:-15,y:28},hip,{x:-15,y:-8}),link(torso,{x:15,y:28},hip,{x:15,y:-8}),link(torso,{x:-24,y:-21},la,{x:0,y:-23},5),link(torso,{x:24,y:-21},ra,{x:0,y:-23},5),link(hip,{x:-13,y:7},ll,{x:0,y:-18}),link(hip,{x:13,y:7},rl,{x:0,y:-18})]
 Composite.add(engine.world,[...parts,...links]);parts.forEach(b=>Body.setStatic(b,true))
 let gate=null,ball=null,bar=null,hinge=null,gateOpen=false
 if(level===2){gate=Bodies.rectangle(440,365,24,240,{label:'隔板',density:.006,friction:.4,frictionAir:.04,restitution:0});hinge=Constraint.create({pointA:{x:440,y:480},bodyB:gate,pointB:{x:0,y:115},length:0,stiffness:1});Composite.add(engine.world,[gate,hinge])}
 if(level===3){ball=Bodies.circle(155,455,30,{label:'滚轮',density:.004,friction:.05,frictionAir:.008,restitution:.05});bar=Bodies.rectangle(430,479,24,12,{...wallOpts,label:'挡条'});Composite.add(engine.world,[ball,bar])}
 const budget=level===3?3:2
 let fired=false,shots=budget,moving=false,elapsed=0,stable=0,winStable=0,state='ready',lastPart='',lastPower=0,steps=0
 function strike(body,point,dx,dy){if(moving||state!=='ready'||shots<=0)return false;const len=Math.hypot(dx,dy);if(len<16)return false
 const power=Math.min(1,len/155),dir=Vector.normalise({x:dx,y:dy});if(!fired&&body!==gate){parts.forEach(b=>Body.setStatic(b,false));fired=true}
 const speed=5+power*18;
 if(parts.includes(body)){parts.forEach(b=>{Matter.Sleeping.set(b,false);Body.setVelocity(b,{x:dir.x*speed*.75,y:dir.y*speed*.75-1.4})});Body.setVelocity(body,{x:dir.x*speed*1.25,y:dir.y*speed*1.25-1.4});Body.setAngularVelocity(body,Math.max(-.22,Math.min(.22,((point.x-body.position.x)*dir.y-(point.y-body.position.y)*dir.x)*.009)))}
 else if(body===gate&&!gateOpen){Matter.Sleeping.set(gate,false);Body.setAngularVelocity(gate,Math.max(-.16,Math.min(.16,dir.x*speed*.012)))}
 else if(body===ball){Matter.Sleeping.set(ball,false);Body.setVelocity(ball,{x:dir.x*speed*1.6,y:dir.y*speed*1.6});Body.setAngularVelocity(ball,dir.x*speed/30)}
 shots--;moving=true;elapsed=0;stable=0;winStable=0;lastPart=body.label;lastPower=power;return true}
 function step(){if(!moving)return;Engine.update(engine,1000/60);steps++;elapsed+=1/60;
 if(gate&&!gateOpen&&gate.angle>1.4&&gate.speed<.15&&Math.abs(gate.angularVelocity)<.01){gateOpen=true;Composite.remove(engine.world,hinge);Body.setStatic(gate,true)}
 const speed=Math.max(...parts.map(b=>b.speed),ball?.speed||0,gate&&!gateOpen?gate.speed:0);stable=speed<.35?stable+1/60:0
 const inTarget=torso.position.x>=TARGET[0]&&torso.position.x<=TARGET[1]&&torso.position.y>FLOOR-100
 winStable=inTarget&&speed<.8?winStable+1/60:0
 if(winStable>.6){state='won';moving=false}else if(stable>.6&&elapsed>.8){moving=false;state=shots?'ready':'lost'}
 }
 function snapshot(){return {level,budget,gateOpen,objects:[gate,ball,bar].filter(Boolean).map(b=>({name:b.label,x:b.position.x,y:b.position.y,angle:b.angle,speed:b.speed})),state,moving,shots,elapsed,stable,lastPart,lastPower,steps,torso:{x:torso.position.x,y:torso.position.y},parts:parts.map(b=>({name:b.label,x:b.position.x,y:b.position.y,angle:b.angle,speed:b.speed})),target:TARGET}}
 return {engine,parts,links,head,torso,hip,ll,rl,gate,ball,bar,budget,strike,step,snapshot,get moving(){return moving},get state(){return state},get shots(){return shots}}
}
