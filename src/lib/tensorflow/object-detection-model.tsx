"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import ObjectDetector from "./object-detector";
import { useObjectDetection } from "@/hooks/use-object-detection";

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Object Detection
          </DialogTitle>
          <DialogDescription>
            Use your camera to detect objects and find matching products in your
            inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Object Detector */}
          <div className="border rounded-lg overflow-hidden">
            <ObjectDetector
              onDetection={handleDetection}
              isActive={isDetecting}
              onActivationChange={(active) => {
                if (active) {
                  startDetection();
                } else {
                  stopDetection();
                }
              }}
              autoCapture={true}
              captureThreshold={0.8}
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
                    ${detectedProduct.price}
                  </span>
                </div>
                {detectedProduct.barcode && (
                  <div className="text-sm">
                    <span className="font-medium">Barcode:</span>{" "}
                    {detectedProduct.barcode}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleUseProduct} className="flex-1">
                    Search This Product
                  </Button>
                  <Button variant="outline" onClick={clearDetection}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
