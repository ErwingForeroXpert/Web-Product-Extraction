// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import Webcam from "react-webcam";
import "./App.css";
import { get_unique_colors, draw_objects } from "./utilities";

tf.setBackend("webgl");
tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 256000000);

const THRESHOLD_PRODUCT_DETECTION = 0.6
const DETECTION_SIZE_MODEL = [320, 320]

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const get_model_classification_info = async () => {
    try {
      const response = await fetch(process.env.PUBLIC_URL + '/model_fnt_mobilnet_beta_0.0.0.json');
      if (!response.ok) {
        throw new Error('Failed to fetch model file');
      }
      const json = await response.json()
      return json
    } catch (error) {
      console.error('Error fetching model file:', error);
    }

  }
  const runDetection = async () => {
    const model_classification_info = await get_model_classification_info()
    const model_detection_products = await loadGraphModel('https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/sku/models/sku80/model.json')
    const model_classification_products = await tf.loadLayersModel(`${process.env.PUBLIC_URL}/${model_classification_info['production_model']}/model.json`)

    const model_classification = {
      ...model_classification_info,
      "model": model_classification_products,
      "colors_styles": get_unique_colors(model_classification_info['index_to_class'].length)
    }

    setInterval(() => {
      detect(model_detection_products, model_classification)
    }, 500);

  };

  const detect_product_objects = async (image, model) => {
    const casted = image.toInt()
    const expanded = casted.transpose([0, 1, 2]).expandDims()
    const result = await model.executeAsync(expanded)

    console.log(`numBytesInGPUAllocated: ${tf.memory().numBytesInGPUAllocated}`);

    const boxes = result[4].arraySync()
    const scores = result[7].arraySync()
    const classes = result[0].arraySync()

    tf.dispose(casted)
    tf.dispose(expanded)
    tf.dispose(result)

    return [tf.tensor2d(boxes[0]), tf.tensor1d(classes[0]), tf.tensor1d(scores[0])]

  }

  const detect = async (model_detection, model_classification) => {

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // // Set video width
      // webcamRef.current.video.width = videoWidth;
      // webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const actual_frame = tf.browser.fromPixels(video)
      const result = await detect_product_objects(actual_frame, model_detection)
      const boxes = result[0]
      const classes = result[1]
      const scores = result[2]

      // const boxes = await obj[4].array()
      // const classes = await obj[5].array()
      // const scores = await obj[6].array()
      // Draw mesh
      const ctx = canvasRef.current.getContext("2d")
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      await draw_objects(actual_frame, boxes, classes, scores, model_classification, THRESHOLD_PRODUCT_DETECTION, ctx)

      tf.dispose(actual_frame)
      tf.dispose(boxes)
      tf.dispose(classes)
      tf.dispose(scores)
    }
  };

  useEffect(() => { runDetection() }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          muted={true}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 720,
            height: 720,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 720,
            height: 720,
          }}
        />
      </header>
    </div>
  );
}

export default App;
