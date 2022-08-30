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
import DenseAppBar from "./AppBar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Slider from "@mui/material/Slider";
import CropIcon from "@mui/icons-material/Crop";
import RedoIcon from "@mui/icons-material/Redo";
import Button from "@mui/material/Button";

import * as tf from "@tensorflow/tfjs";

var landmarkDriver;
var landmarkModel;
var outputNormArr;

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
  var driverModelLoaded = landmarkDriverLoaded && landmarkModelLoaded;
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [cropDone, setCropDone] = useState(false);
  const aspect = 1;

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
    //flip image if camera, else don't
    const landmarkArr = await landmarkDriver.getLandmarkArr(
      img,
      !showFileUpload
    );
    console.log(landmarkArr);
    return landmarkArr;

    //normalize array
    const mean_tensor = tf.tensor(arr_means);
    const stds_tensor = tf.tensor(arr_stds);
    let normArr = tf.tensor(landmarkArr).sub(mean_tensor).div(stds_tensor);
    normArr = tf.expandDims(normArr, 0);
    if (!Boolean(outputNormArr)) {
      outputNormArr = normArr.dataSync();
    } else {
      console.log("is the same:", outputNormArr === normArr.dataSync());
    }
    //normArr = normArr.cast(normArr, "float32");
    console.log("normArr", normArr.dataSync());
    const predictionScore = await landmarkModel.predict(normArr).dataSync();
    console.log("prediction score", predictionScore);
    return predictionScore;
  });

  const WebcamCapture = () => {
    const webcamRef = React.useRef(null);
    const capture = React.useCallback(() => {
      const imageSrc = webcamRef.current.getScreenshot();
      setRawImage(imageSrc);
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
            mirrored={true}
          />
          <IconButton
            component="label"
            className={webStyles.snapButton}
            onClick={capture}
            size="large"
            sx={{ width: 70, height: 70, bottom: 10, position: "absolute" }}
          >
            <PhotoCamera fontSize="large" color="primary" />
          </IconButton>
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
      <FileUploader
        handleChange={handleChange}
        name="file"
        types={fileTypes}
        className="fileUploader"
      />
    );
  };
  //contains the image, the cropping of image, and the cropped image on the right
  const CropFile = () => {
    const [completedCrop, setCompletedCrop] = useState(null);
    const [crop, setCrop] = useState(null);
    const [scale, setScale] = useState(1);
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

    function onImageLoad(e) {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    }

    function getResizeImage(image, crop) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      var imageElm = new Image();
      imageElm.onload = () => {
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
        );
        const finalImgSrc = canvas.toDataURL("image/png");
        setFinalImage(finalImgSrc);
        setCropDone(true);
      };
      imageElm.src = rawImage;
    }

    async function onCropDone() {
      if (completedCrop && completedCrop.width && completedCrop.height) {
        var imgElement = document.createElement("img");
        imgElement.src = rawImage;
        getResizeImage(imgElement, completedCrop);
      }
    }
    return (
      <Box
        sx={{
          width: 600,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ReactCrop
          crop={crop}
          onChange={(pixelCrop, percentCrop) => setCrop(pixelCrop)}
          onComplete={(pixelCrop, percentCrop) => setCompletedCrop(pixelCrop)}
          aspect={aspect}
        >
          <img
            alt="Crop me"
            src={rawImage}
            style={{ transform: `scale(${scale})` }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
        <Box
          sx={{ display: "flex", justifyContent: "center", padding: "1rem" }}
        >
          <Typography variant="h6" align="center" sx={{ marginRight: "2rem" }}>
            Zoom Ratio
          </Typography>
          <Box sx={{ width: 100 }}>
            <Slider
              aria-label="Always visible"
              defaultValue={1}
              step={0.1}
              valueLabelDisplay="on"
              min={1}
              max={2}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </Box>
          <Button
            variant="contained"
            endIcon={<CropIcon />}
            sx={{ marginLeft: "3rem" }}
            onClick={onCropDone}
          >
            Crop
          </Button>
        </Box>
      </Box>
    );
  };
  const FileComponent = () => {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FileBox />
      </Box>
    );
  };
  const WebCamComponent = () => {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <WebcamCapture />
      </Box>
    );
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
      <DenseAppBar />
      <div className="bodyWrapper">
        <Typography variant="h1" align="center">
          Hot or Not
        </Typography>
        {driverModelLoaded ? (
          <>
            <div className="topWrapper">
              {!Boolean(rawImage) && !showFileUpload && <WebCamComponent />}
              {!Boolean(rawImage) && showFileUpload && <FileComponent />}
              {Boolean(rawImage) && !Boolean(finalImage) && <CropFile />}
            </div>
            {Boolean(rawImage) && (
              <Box>
                <Button variant="outlined" startIcon={<RedoIcon />}>
                  Redo
                </Button>
                <Button
                  variant="contained"
                  endIcon={<CropIcon />}
                  sx={{ marginLeft: "3rem" }}
                >
                  Send
                </Button>
              </Box>
            )}
            <div className="ratingWrapper">Rating bar goes here</div>
          </>
        ) : (
          <div className="topWrapper">
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 500,
                height: 500,
                borderRadius: "2rem",
                boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
              }}
            >
              <CircularProgress size={100} />
            </Box>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
