/**
 * Recent animation-loop cadence, not a CPU-duration-derived FPS estimate.
 * Captured from the existing WebGLRenderer.setAnimationLoop callback; no
 * additional animation loop, network telemetry, storage or permanent samples.
 */
const round2=v=>Number(v.toFixed(2));
const percentile=(sorted,p)=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];

export class FrameTimingWindow {
  constructor(capacity=120){
    if(!Number.isInteger(capacity)||capacity<5)throw new RangeError('At least five samples required');
    this.capacity=capacity;
    this.intervals=new Float32Array(capacity);
    this.callbacks=new Float32Array(capacity);
    this.count=0;this.next=0;this.lastTimestamp=null;this.pauseCount=0;
  }
  record(timestamp,callbackMs){
    if(!Number.isFinite(timestamp)||!Number.isFinite(callbackMs)||callbackMs<0)return false;
    const previous=this.lastTimestamp;this.lastTimestamp=timestamp;
    if(previous===null)return false;
    const delta=timestamp-previous;
    if(delta<=0)return false;
    // A long interval while VISIBLE is genuine severe jank, not a resume.
    this.intervals[this.next]=delta;
    this.callbacks[this.next]=callbackMs;
    this.next=(this.next+1)%this.capacity;
    this.count=Math.min(this.capacity,this.count+1);
    return true;
  }
  suspend(){
    this.count=0;this.next=0;this.lastTimestamp=null;this.pauseCount++;
  }
  snapshot(){
    const n=this.count;
    const empty={sampleCount:0,fps:null,medianFps:null,frameP50Ms:null,frameP95Ms:null,
      frameP99Ms:null,callbackP95Ms:null,slowFramePct:null,pauseCount:this.pauseCount};
    if(n<5)return {...empty,sampleCount:n};
    const frames=Array.from(this.intervals.subarray(0,n)).sort((a,b)=>a-b);
    const cpu=Array.from(this.callbacks.subarray(0,n)).sort((a,b)=>a-b);
    const average=frames.reduce((sum,value)=>sum+value,0)/n;
    const slow=frames.filter(v=>v>1000/30).length;
    const median=percentile(frames,.5);
    return {sampleCount:n,fps:round2(1000/average),medianFps:round2(1000/median),
      frameP50Ms:round2(median),frameP95Ms:round2(percentile(frames,.95)),
      frameP99Ms:round2(percentile(frames,.99)),callbackP95Ms:round2(percentile(cpu,.95)),
      slowFramePct:round2(slow*100/n),pauseCount:this.pauseCount};
  }
}
