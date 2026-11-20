const TAU = Math.PI * 2;
export const circlePoints = (n, radius, center = [0, 0, 0], offsetDeg = 0) => Array.from({ length: n }, (_, i) => {
  const angle = (offsetDeg / 360 + i / n) * TAU;
  return [center[0] + Math.cos(angle) * radius, center[1], center[2] + Math.sin(angle) * radius];
});
export function levelFor(night) {
  const base = { night, spawn: [0, 0, 0], islands: [], ramps: [], pads: [], charms: [], tower: null };
  if (night === 1) return { ...base, name: 'Đảo Bến', duration: 300, shadeInterval: 480, shadeMax: 6, shadeSpeed: 4, islands: [{ center: [0, 0, 0], radius: 40 }], lanterns: [[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]], motePoints: [...circlePoints(8,12), ...circlePoints(16,33)], shadePoints: circlePoints(12,37,[0,0,0],15) };
  if (night === 2) return { ...base, name: 'Đảo Cau', duration: 330, shadeInterval: 420, shadeMax: 8, shadeSpeed: 4, islands: [{ center: [0,0,0], radius: 28 }, { center: [70,0,0], radius: 28 }], bridge: { minX:26,maxX:44,minZ:-2,maxZ:2 }, lanterns: [[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]], motePoints: [0,70].flatMap((x) => [...circlePoints(4,10,[x,0,0]), ...circlePoints(8,22,[x,0,0])]), shadePoints: [0,70].flatMap((x) => circlePoints(8,26,[x,0,0],22.5)), pads: [{ pos:[20,0,18],target:[70,0,0],vertical:14,horizontal:24 }, { pos:[50,0,-18],target:[0,0,0],vertical:14,horizontal:24 }], charms: [{id:'C1',pos:[35,0,0]}] };
  if (night === 3) return { ...base, spawn:[0,0,-30], name: 'Đảo Chuông', duration:360,shadeInterval:360,shadeMax:10,shadeSpeed:4.5,islands:[{center:[0,0,0],radius:45}],lanterns:[[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]],motePoints:[...circlePoints(18,34), ...Array.from({length:8},(_,i)=>{const a=(i+1)*20*Math.PI/180;return [18*Math.cos(a),3,18*Math.sin(a)];}), ...circlePoints(4,5,[0,6,0],45)],shadePoints:circlePoints(16,43),ramps:[30,150].map((angle)=>({angle,minRadius:24,maxRadius:30,width:3,height:3})),pads:[{pos:[0,3,13],target:[0,3,0],vertical:12,horizontal:8}],tower:{pos:[0,6,0],radius:2,height:8},charms:[{id:'C1',pos:[30,0,25]},{id:'C2',pos:[-30,0,25]}] };
  throw new RangeError('night must be 1, 2, or 3');
}
export function groundHeight(level, x, z) {
  let y = -Infinity;
  for (const island of level.islands) if (Math.hypot(x-island.center[0],z-island.center[2]) <= island.radius + 1e-9) y = Math.max(y,island.center[1]);
  const b=level.bridge;
  if(b && x>=b.minX-1e-9 && x<=b.maxX+1e-9 && z>=b.minZ-1e-9 && z<=b.maxZ+1e-9) y=Math.max(y,0);
  if(level.night!==3 || y===-Infinity) return y;
  const r=Math.hypot(x,z);
  if(r>=12-1e-9 && r<=24+1e-9 && z>0) y=Math.max(y,3);
  if(r<=8+1e-9) y=Math.max(y,6);
  for(const ramp of level.ramps){
    const a=ramp.angle*Math.PI/180, along=x*Math.cos(a)+z*Math.sin(a), across=-x*Math.sin(a)+z*Math.cos(a);
    if(along>=24-1e-9 && along<=30+1e-9 && Math.abs(across)<=1.5+1e-9) y=Math.max(y,(30-along)/2);
  }
  return y;
}
export function blocked(level,x,z,footY){
  if(groundHeight(level,x,z)>footY+.24) return true;
  const t=level.tower;
  return Boolean(t && Math.hypot(x-t.pos[0],z-t.pos[2])<t.radius && footY<t.pos[1]+t.height);
}
export const compareIds = (a,b) => {
  const am=/^(.*?)(\d+)$/.exec(a.id), bm=/^(.*?)(\d+)$/.exec(b.id);
  if(am && bm && am[1]===bm[1]) return Number(am[2])-Number(bm[2]);
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};
