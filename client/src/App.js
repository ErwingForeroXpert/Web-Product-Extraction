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
    const model_detection_products = await loadGraphModel(`${process.env.PUBLIC_URL}/model_sku_detection/model.json`)
    const model_classification_products = await tf.loadLayersModel(`${process.env.PUBLIC_URL}/${model_classification_info['production_model']}/model.json`)

    const model_classification = {
      ...model_classification_info,
      "model": model_classification_products,
      "colors_styles": get_unique_colors(model_classification_info['index_to_class'].length)
    }

    console.log("reading model")

    setInterval(() => {
      detect(model_detection_products, model_classification)
    }, 500);

  };

  const detect_product_objects = async (image, model) => {

    const processed_img = image.toInt().expandDims()
    const result = await model.executeAsync(processed_img)

    console.log(`numBytesInGPUAllocated: ${tf.memory().numBytesInGPUAllocated}`);

    const boxes = result[4].arraySync()
    const scores = result[7].arraySync()

    tf.dispose(processed_img)
    tf.dispose(result)

    return [tf.tensor2d(boxes[0]), tf.tensor1d(scores[0])]

  }

  const detect = async (model_detection, model_classification) => {

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const actual_frame = tf.browser.fromPixels(video)
      const [boxes, scores] = await detect_product_objects(actual_frame, model_detection)

      const ctx = canvasRef.current.getContext("2d")
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      await draw_objects(actual_frame, boxes, scores, model_classification, THRESHOLD_PRODUCT_DETECTION, ctx)

      tf.dispose(actual_frame)
      tf.dispose(boxes)
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
