"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import * as tmImage from "@teachablemachine/image";

export interface DetectedObject {
  className: string;
  score: number;
}

interface ObjectDetectorProps {
  onDetection: (objects: DetectedObject[]) => void;
  isActive: boolean;
  onActivationChange: (active: boolean) => void;
  autoCapture?: boolean;
  captureThreshold?: number;
  confidenceThreshold?: number;
  modelUrl?: string;
  noObjectThreshold?: number;
}

const ObjectDetector = ({
  onDetection,
  isActive,
  onActivationChange,
  autoCapture,
  captureThreshold = 0.8,
  confidenceThreshold = 0.7,
  modelUrl = "/teachableModels/",
  noObjectThreshold = 0.7,
}: ObjectDetectorProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const detectionRef = useRef<NodeJS.Timeout | null>(null);
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(autoCapture);

  // Memoize detect function to prevent unnecessary re-renders
  const detect = useCallback(async (): Promise<DetectedObject[] | null> => {
    if (!model || !webcamRef.current) return null;
    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) return null;

    try {
      const predictions = await model.predict(video);
      return predictions.map((p) => ({
        className: p.className,
        score: p.probability,
      }));
    } catch (error) {
      console.error("Detection error:", error);
      return null;
    }
  }, [model]);

  // Initialize TensorFlow.js and load the model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        setIsLoading(true);
        const loadedModel = await tmImage.load(
          `${modelUrl}model.json`,
          `${modelUrl}metadata.json`
        );
        setModel(loadedModel);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading model:", error);
        setIsLoading(false);
        onActivationChange(false);
      }
    };

    if (isActive) {
      loadModel();
    }

    return () => {
      if (detectionRef.current) {
        clearInterval(detectionRef.current);
        detectionRef.current = null;
      }
    };
  }, [isActive, onActivationChange, modelUrl]);

  // Run object detection
  useEffect(() => {
    if (!isActive || !model || isLoading) return;

    const runDetection = async () => {
      if (detectionRef.current) {
        clearInterval(detectionRef.current);
      }

      detectionRef.current = setInterval(async () => {
        const predictions = await detect();
        if (predictions) {
          const highestConfidence = Math.max(
            ...predictions.map((p) => p.score)
          );

          if (highestConfidence < noObjectThreshold) {
            const noObjectResult: DetectedObject[] = [
              {
                className: "No Object",
                score: 1.0,
              },
            ];
            setDetectedObjects(noObjectResult);
          } else {
            const filteredDetections = predictions
              .filter((obj) => obj.score >= confidenceThreshold)
              .sort((a, b) => b.score - a.score);

            if (filteredDetections.length > 0) {
              setDetectedObjects(filteredDetections);
              if (autoCloseEnabled) {
                const highConfidenceDetection = filteredDetections.find(
                  (obj) => obj.score >= captureThreshold
                );
                if (highConfidenceDetection) {
                  onDetection(filteredDetections);
                  onActivationChange(false);
                }
              }
            } else {
              setDetectedObjects([{ className: "No Object", score: 1.0 }]);
            }
          }
        } else {
          setDetectedObjects([{ className: "No Object", score: 1.0 }]);
        }
      }, 100);
    };

    runDetection();

    return () => {
      if (detectionRef.current) {
        clearInterval(detectionRef.current);
        detectionRef.current = null;
      }
    };
  }, [
    model,
    isActive,
    isLoading,
    autoCloseEnabled,
    captureThreshold,
    confidenceThreshold,
    noObjectThreshold,
    onDetection,
    onActivationChange,
    detect, // Now included in dependencies
  ]);

  const handleCapture = () => {
    if (
      detectedObjects.length > 0 &&
      detectedObjects[0].className !== "No Object"
    ) {
      onDetection(detectedObjects);
      if (autoCloseEnabled) {
        onActivationChange(false);
      }
    }
  };

  const handleClose = () => {
    if (detectionRef.current) {
      clearInterval(detectionRef.current);
      detectionRef.current = null;
    }
    onActivationChange(false);
  };

  const toggleAutoClose = () => {
    setAutoCloseEnabled(!autoCloseEnabled);
  };

  if (!isActive) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Button
          onClick={() => onActivationChange(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Camera size={16} />
          Start Object Detection
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] overflow-hidden border rounded-md">
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex justify-between items-center z-20">
        <p className="text-sm font-medium text-white">
          Teachable Machine Model
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-7 px-2 text-xs text-white hover:bg-black hover:bg-opacity-30"
        >
          <XCircle size={16} />
        </Button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-white" />
            <p className="text-white text-sm">
              Loading Teachable Machine model...
            </p>
          </div>
        </div>
      )}

      <div className="relative w-full h-full">
        <Webcam
          ref={webcamRef}
          muted={true}
          mirrored={true}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
          }}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex flex-col gap-1 z-20">
        <div className="grid grid-cols-2 gap-2">
          {detectedObjects.map((obj, index) => (
            <div key={index} className="text-xs text-white">
              <span className="font-medium">{obj.className}</span>:{" "}
              {obj.className === "No Object"
                ? "100%"
                : (obj.score * 100).toFixed(2) + "%"}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            <Switch
              id="auto-capture"
              checked={autoCloseEnabled}
              onCheckedChange={toggleAutoClose}
              className="mr-2"
            />
            <Label htmlFor="auto-capture" className="text-xs text-white">
              Auto Capture
            </Label>
          </div>
          <Button
            onClick={handleCapture}
            disabled={
              detectedObjects.length === 0 ||
              detectedObjects[0].className === "No Object"
            }
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs bg-white hover:bg-gray-100"
          >
            Capture
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetector;
