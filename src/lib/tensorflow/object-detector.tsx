"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, Camera } from "lucide-react";
import * as tmImage from "@teachablemachine/image";

export interface DetectedObject {
  className: string;
  score: number;
}

interface ObjectDetectorProps {
  onDetection: (objects: DetectedObject[]) => void;
  isActive: boolean;
  onActivationChange: (active: boolean) => void;
  confidenceThreshold?: number;
  modelUrl?: string;
  noObjectThreshold?: number;
}

const ObjectDetector = ({
  onDetection,
  isActive,
  onActivationChange,
  confidenceThreshold = 0.7,
  modelUrl = "/teachableModels/",
  noObjectThreshold = 0.7,
}: ObjectDetectorProps) => {
  const webcamRef = useRef<Webcam>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const detectionRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const stableDetectionRef = useRef<string | null>(null);
  const stableDetectionCount = useRef<number>(0);

  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio for notification
  useEffect(() => {
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjSD0fPTgjMGHm7A7+OZURE="
    );

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Memoize detect function
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
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
        countdownRef.current = null;
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [isActive, onActivationChange, modelUrl]);

  // Auto-capture when stable object detected
  const startCountdown = useCallback(() => {
    if (isCapturing || isOnCooldown) return;

    setIsCapturing(true);
    setCountdown(3);

    let count = 3;

    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);

      if (count === 0) {
        clearInterval(countdownInterval);

        // Play sound and capture
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((err) => console.error("Audio play failed:", err));
        }

        if (
          detectedObjects.length > 0 &&
          detectedObjects[0].className !== "No Object"
        ) {
          onDetection(detectedObjects);
        }

        // Reset and start cooldown
        setCountdown(null);
        setIsCapturing(false);
        setIsOnCooldown(true);
        stableDetectionRef.current = null;
        stableDetectionCount.current = 0;

        // 3 second cooldown before next capture
        cooldownTimerRef.current = setTimeout(() => {
          setIsOnCooldown(false);
        }, 3000);
      }
    }, 1000);

    countdownRef.current = countdownInterval;
  }, [detectedObjects, onDetection, isCapturing, isOnCooldown]);

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
              { className: "No Object", score: 1.0 },
            ];
            setDetectedObjects(noObjectResult);
            stableDetectionRef.current = null;
            stableDetectionCount.current = 0;

            // Cancel countdown if no object
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
              setCountdown(null);
              setIsCapturing(false);
            }
          } else {
            const filteredDetections = predictions
              .filter((obj) => obj.score >= confidenceThreshold)
              .sort((a, b) => b.score - a.score);

            if (filteredDetections.length > 0) {
              setDetectedObjects(filteredDetections);

              // Check for stable detection (same object for 5 consecutive frames)
              const currentObject = filteredDetections[0].className;
              if (stableDetectionRef.current === currentObject) {
                stableDetectionCount.current++;

                // Start countdown after 5 stable detections (~0.5 seconds)
                if (stableDetectionCount.current >= 5 && !isCapturing) {
                  startCountdown();
                }
              } else {
                stableDetectionRef.current = currentObject;
                stableDetectionCount.current = 1;
              }
            } else {
              setDetectedObjects([{ className: "No Object", score: 1.0 }]);
              stableDetectionRef.current = null;
              stableDetectionCount.current = 0;
            }
          }
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
    confidenceThreshold,
    noObjectThreshold,
    detect,
    isCapturing,
    startCountdown,
  ]);

  const handleClose = () => {
    if (detectionRef.current) {
      clearInterval(detectionRef.current);
      detectionRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    onActivationChange(false);
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

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-30">
          <div className="text-center">
            <div className="text-8xl font-bold text-white animate-pulse">
              {countdown}
            </div>
            <p className="text-white text-lg mt-4">Hold still...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex flex-col gap-1 z-20">
        <div className="grid grid-cols-2 gap-2">
          {detectedObjects.map((obj, index) => (
            <div key={index} className="text-sm text-white font-medium">
              {obj.className}
            </div>
          ))}
        </div>
        {detectedObjects.length > 0 &&
          detectedObjects[0].className !== "No Object" &&
          !isCapturing && (
            <p className="text-xs text-white text-center mt-1">
              Object detected! Preparing to capture...
            </p>
          )}
      </div>
    </div>
  );
};

export default ObjectDetector;
