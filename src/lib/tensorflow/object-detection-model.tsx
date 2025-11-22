"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scan, ShoppingCart, X } from "lucide-react";
import ObjectDetector, { DetectedObject } from "./object-detector";
import { useObjectDetection } from "@/hooks/use-object-detection";
import { CustomModal } from "@/app/(dashboard)/(sub-items)/manage-product/_components/custom-modal";

interface ObjectDetectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (productName: string) => void;
}

export const ObjectDetectionModal = ({
  isOpen,
  onOpenChange,
  onProductFound,
}: ObjectDetectionModalProps) => {
  const {
    isDetecting,
    detectedProduct,
    isLoading,
    startDetection,
    stopDetection,
    clearDetection,
    handleDetection,
  } = useObjectDetection();

  const handleClose = () => {
    stopDetection();
    clearDetection();
    onOpenChange(false);
  };

  const handleUseProduct = () => {
    if (detectedProduct) {
      onProductFound(detectedProduct.name);
      handleClose();
    }
  };

  // Handle successful detection - stop camera automatically
  const handleDetectionSuccess = (objects: DetectedObject[]) => {
    handleDetection(objects);
    // Stop detection after successful capture
    stopDetection();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Object Detection"
      description="Use your camera to detect objects and find matching products in your inventory."
      maxWidth="max-w-2xl"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {detectedProduct && (
            <Button onClick={handleUseProduct}>Search This Product</Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Object Detector */}
        <div className="border rounded-lg overflow-hidden">
          <ObjectDetector
            onDetection={handleDetectionSuccess}
            isActive={isDetecting}
            onActivationChange={(active) => {
              if (active) {
                startDetection();
              } else {
                stopDetection();
              }
            }}
            confidenceThreshold={0.7}
          />
        </div>

        {/* Detection Results */}
        {detectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Product Match Found
                </span>
                <Button variant="ghost" size="sm" onClick={clearDetection}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                We found a matching product in your inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {detectedProduct.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {detectedProduct.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  Detected:{" "}
                  {detectedProduct.objectName || detectedProduct.className}
                </Badge>
                <span className="font-semibold text-lg">
                  ₱{detectedProduct.price}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    clearDetection();
                    startDetection();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Detect Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Searching for matching products...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions when no detection */}
        {!detectedProduct && !isLoading && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-sm text-muted-foreground">
                <Scan className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Point your camera at an object to detect products</p>
                <p className="text-xs mt-1">
                  Make sure the object is well-lit and clearly visible
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomModal>
  );
};
