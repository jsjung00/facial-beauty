import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { IMAGE_HEIGHT, IMAGE_WIDTH } from "./params";
//object that gets the landmark arr from an image element
export class LandmarkDriver {
  constructor() {
    this.initFinished = false;
  }
  async init() {
    const state = { backend: "webgl" };
    await tf.setBackend(state.backend);
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    this.model = model;
    const detectorConfig = {
      runtime: "mediapipe",
      maxFaces: 1,
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
    };
    const detector = await faceLandmarksDetection.createDetector(
      model,
      detectorConfig
    );
    this.detector = detector;
    this.initFinished = true;
  }
  async getLandmarkArr(imgElm) {
    if (!this.initFinished) {
      console.error("getlandmarkarr called before init finished");
      return;
    }
    //TODO: confirm the flipHorizontal
    const faces = await this.detector.estimateFaces(imgElm, {
      flipHorizontal: true,
    });
    let landmarkArr = [];
    faces[0].keypoints.forEach((keypoint) => {
      landmarkArr.push(
        ...[keypoint.x / IMAGE_WIDTH, keypoint.y / IMAGE_HEIGHT]
      );
    });
    return landmarkArr;
  }
}
