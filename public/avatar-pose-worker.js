/* Classic worker: MediaPipe WASM uses importScripts. No network writes or video publishing. */
self.exports = {};
let tracker;
self.onmessage = async ({data}) => {
 try {
  if(data.type==='init') {
   importScripts('/mediapipe/vision-worker.js');
   const {PoseLandmarker,FilesetResolver}=self.exports;
   tracker=await PoseLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('/mediapipe/wasm'),{
    baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},
    canvas:new OffscreenCanvas(320,240),runningMode:'VIDEO',numPoses:1,outputSegmentationMasks:false,
    minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,minTrackingConfidence:.6
   });
   self.postMessage({type:'ready'});
  } else if(data.type==='frame') {
   const start=performance.now();
   try {const result=tracker.detectForVideo(data.bitmap,data.ts);self.postMessage({type:'pose',points:result.landmarks[0]??[],world:result.worldLandmarks[0]??[],ms:performance.now()-start});}
   finally {data.bitmap.close();}
  }
 } catch (error) {console.warn("[avatar-pose]",error.message);self.postMessage({type:'error'});}
};
