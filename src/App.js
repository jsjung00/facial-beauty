import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import { FileUploader } from "react-drag-drop-files";
import Webcam from "react-webcam";
import webStyles from "./webcam.module.css";
import { LandmarkDriver } from "./landmark.js";
import { LandmarkModel } from "./model.js";
import { arr_means, arr_stds } from "./params";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import * as tf from "@tensorflow/tfjs";

var landmarkDriver;
var landmarkModel;

function App() {
  const videoConstraints = {
    width: 500,
    height: 500,
    facingMode: "user",
  };

  const [rawImage, setRawImage] = useState("");
  const [finalImage, setFinalImage] = useState("");
  const [landmarkDriverLoaded, setLandmarkDriverLoaded] = useState(false);
  const [landmarkModelLoaded, setLandmarkModelLoaded] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(true);

  //initialize the landmarkDriver and model
  useEffect(() => {
    console.log("initializing model and driver");
    landmarkDriver = new LandmarkDriver();
    const driverInitP = landmarkDriver.init();
    driverInitP.then(() => setLandmarkDriverLoaded(true));
    landmarkModel = new LandmarkModel();
    const modelInitP = landmarkModel.initModel();
    modelInitP.then(() => setLandmarkModelLoaded(true));
  }, []);

  useEffect(
    () => console.log("loaded change"),
    [landmarkDriverLoaded, landmarkModelLoaded]
  );

  const redo = React.useCallback(() => {
    setRawImage("");
  });
  const submit = React.useCallback(async () => {
    let img = document.createElement("img");
    img.src = finalImage;
    img.width = "320";
    img.height = "320";

    //get the face box and convert to jpeg
    if (!landmarkDriverLoaded || !landmarkModelLoaded) {
      console.error("submit button only ready once loaded");
      return;
    }
    const landmarkArr = await landmarkDriver.getLandmarkArr(img);
    console.log(landmarkArr);

    //normalize array
    const mean_tensor = tf.tensor(arr_means);
    const stds_tensor = tf.tensor(arr_stds);
    let normArr = tf.tensor(landmarkArr).sub(mean_tensor).div(stds_tensor);
    normArr = tf.expandDims(normArr, 0);
    //normArr = normArr.cast(normArr, "float32");
    console.log("normArr", normArr);
    const predictionScore = await landmarkModel.predict(normArr).dataSync();
    console.log("prediction score", predictionScore);
    return predictionScore;
  });

  const WebcamCapture = () => {
    const webcamRef = React.useRef(null);
    const capture = React.useCallback(() => {
      const imageSrc = webcamRef.current.getScreenshot();
      console.log("imageSrc", imageSrc);
      setRawImage(imageSrc);
      setFinalImage(imageSrc);
      //TODO: convert raw image into cropped version
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
  //component where user can upload file
  const FileBox = () => {
    const fileTypes = ["JPG", "PNG"];
    const handleChange = (file) => {
      console.log(file);
      const imageUrl = URL.createObjectURL(file);
      console.log(imageUrl);
      setRawImage(imageUrl);
    };
    return (
      <FileUploader handleChange={handleChange} name="file" types={fileTypes} />
    );
  };
  //contains the image, the cropping of image, and the cropped image on the right
  const CropFile = () => {
    const centerAspectCrop = (mediaWidth, mediaHeight, aspect) => {
      return centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          aspect,
          mediaWidth,
          mediaHeight
        ),
        mediaWidth,
        mediaHeight
      );
    };
    const [crop, setCrop] = useState(null);
    const [completedCrop, setCompletedCrop] = useState(null);
    const [cropDone, setCropDone] = useState(false);
    const [scale, setScale] = useState(1);
    const aspect = 1;

    function onImageLoad(e) {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    }

    function getResizeImage(image, crop) {
      const canvas = document.createElement("canvas");
      const imageElm = document.createElement("img");
      imageElm.src = rawImage;
      imageElm.width = 500;
      imageElm.height = 500;
      console.log(imageElm);
      const ctx = canvas.getContext("2d");
      //canvas.width = 320;
      //canvas.height = 320;
      canvas.width = 1000;
      canvas.height = 1000;
      /*
      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        320,
        320
      );*/
      ctx.drawImage(imageElm, 0, 0);
      const finalImgSrc = canvas.toDataURL("image/png");
      return finalImgSrc;
    }

    async function onCropDone() {
      console.log("crop", completedCrop);
      if (completedCrop && completedCrop.width && completedCrop.height) {
        var imgElement = document.createElement("img");
        imgElement.src = rawImage;
        const imgPath = getResizeImage(imgElement, completedCrop);
        console.log("final image", imgPath);
        setFinalImage(imgPath);
        setCropDone(true);
      }
    }

    return (
      <>
        {!cropDone && (
          <>
            <div className="cropControls">
              <input
                id="scale-input"
                type="number"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              />
              <button
                onClick={() => {
                  onCropDone();
                }}
              >
                Crop
              </button>
            </div>
            <ReactCrop
              crop={crop}
              onChange={(pixelCrop, percentCrop) => setCrop(pixelCrop)}
              onComplete={(pixelCrop, percentCrop) =>
                setCompletedCrop(pixelCrop)
              }
              aspect={aspect}
            >
              <img
                alt="Crop me"
                src={rawImage}
                style={{ transform: `scale(${scale})` }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </>
        )}
        {cropDone && (
          <>
            <p>Helo</p>
            <img src={finalImage}></img>
          </>
        )}
      </>
    );
  };
  const FileComponent = () => {
    return <div>{Boolean(rawImage) ? <CropFile /> : <FileBox />}</div>;
  };
  const [fileSrc, setFileSrc] = useState(null);
  const DumbFileComponent = () => {
    function handleChange(e) {
      var reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.addEventListener("load", () => {
        console.log("changing file src", reader.result);
        setFileSrc(reader.result);
        setRawImage(reader.result);
        setFinalImage(reader.result);
      });
    }
    return (
      <>
        <input type="file" onChange={handleChange} />
        <img src={fileSrc} styles={{ height: 320, width: 320 }} />
      </>
    );
  };

  return (
    <div className="allWrapper">
      <div className="topWrapper">
        {!showFileUpload && (
          <>
            <div className="viewWrapper">
              <div className="faceBox"></div>
              {rawImage == "" ? <WebcamCapture /> : <img src={rawImage} />}
            </div>
          </>
        )}
        {showFileUpload && <DumbFileComponent />}
      </div>

      {Boolean(rawImage) && (
        <div className="buttonsContainer">
          <button onClick={redo}>Redo</button>
          {/* TODO: use material UI button, have the submit button be loading until the model is finished. Then have it load again until prediction finished -> done modal */}
          <button onClick={submit}>Submit</button>
        </div>
      )}

      <div className="ratingWrapper">Rating bar goes here</div>
    </div>
  );
}

export default App;
