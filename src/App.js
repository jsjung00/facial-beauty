import "./App.css";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import webStyles from "./webcam.module.css";
import { LandmarkDriver } from "./landmark.js";
import { LandmarkModel } from "./model.js";

var landmarkDriver;
var landmarkModel;
function App() {
  const WebcamComponent = () => <Webcam />;
  const videoConstraints = {
    width: 500,
    height: 500,
    facingMode: "user",
  };
  const [image, setImage] = useState("");
  const [landmarkDriverLoaded, setLandmarkDriverLoaded] = useState(false);
  const [landmarkModelLoaded, setLandmarkModelLoaded] = useState(false);
  //initialize the landmarkDriver and model
  useEffect(() => {
    landmarkDriver = new LandmarkDriver();
    const driverInitP = landmarkDriver.init();
    driverInitP.then(() => setLandmarkDriverLoaded(true));
    landmarkModel = new LandmarkModel();
    const modelInitP = landmarkModel.initModel();
    modelInitP.then(() => setLandmarkModelLoaded(true));
  }, []);

  const redo = React.useCallback(() => {
    setImage("");
  });
  const submit = React.useCallback(async () => {
    let img = document.createElement("img");
    img.src = image;
    img.width = "500";
    img.height = "500";
    //get the face box and convert to jpeg
    console.log(img);
  });

  const WebcamCapture = () => {
    const webcamRef = React.useRef(null);
    const capture = React.useCallback(() => {
      const imageSrc = webcamRef.current.getScreenshot();
      setImage(imageSrc);
    }, [webcamRef]);
    return (
      <>
        <div className={webStyles.wrapper}>
          <Webcam
            audio={false}
            height={500}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={500}
            videoConstraints={videoConstraints}
          />
          <button onClick={capture} className={webStyles.snapButton}>
            Capture
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="allWrapper">
      <div className="photoWrapper">
        <div className="faceBox"></div>
        <div className="viewWrapper">
          {image == "" ? <WebcamCapture /> : <img src={image} />}
          {image != "" && (
            <div className="buttonsContainer">
              <button onClick={redo}>Redo</button>
              {/* TODO: use material UI button, have the submit button be loading until the model is finished and prediction is finished */}
              <button onClick={submit}>Submit</button>
            </div>
          )}
        </div>
      </div>
      <div className="ratingWrapper">Rating bar goes here</div>
    </div>
  );
}

export default App;
