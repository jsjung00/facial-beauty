import "./App.css";
import React, { useState } from "react";
import Webcam from "react-webcam";
import webStyles from "./webcam.module.css";

function App() {
  const WebcamComponent = () => <Webcam />;
  const videoConstraints = {
    width: 500,
    height: 500,
    facingMode: "user",
  };
  const [image, setImage] = useState("");

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
        <div className="viewWrapper">
          {image == "" ? <WebcamCapture /> : <img src={image} />}
        </div>
      </div>
      <div className="ratingWrapper">Rating bar goes here</div>
    </div>
  );
}

export default App;
