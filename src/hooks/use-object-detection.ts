"use client";

import { useState } from "react";
import type { FormData } from "@/types/product-types";
import { DetectedObject } from "@/lib/tensorflow/object-detector"; 

interface ProductMatch {
  _id?: string;
  objectName?: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status?: string;
  image?: string;
  barcode?: string;
  className?: string;
}

interface DetectionResponse {
  found: boolean;
  source: "database" | "suggestion" | "generated";
  product: ProductMatch;
  suggestion?: boolean;
}

export const useObjectDetection = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedProduct, setDetectedProduct] = useState<ProductMatch | null>(
    null
  );
  const [detectionResponse, setDetectionResponse] =
    useState<DetectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchProductByObject = async (
    className: string
  ): Promise<DetectionResponse | null> => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/products/object/${encodeURIComponent(className)}`
      );

      if (response.ok) {
        const data: DetectionResponse = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error searching product by object:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle detection from DetectedObject array (for object detection)
  const handleDetection = async (objects: DetectedObject[]) => {
    if (objects.length > 0 && objects[0].className !== "No Object") {
      const topDetection = objects[0];
      const response = await searchProductByObject(topDetection.className);

      if (response) {
        setDetectedProduct(response.product);
        setDetectionResponse(response);
      }
    }
  };

  // Handle detection from product name string (for modal callback)
  const handleProductFound = async (productName: string) => {
    const response = await searchProductByObject(productName);

    if (response) {
      setDetectedProduct(response.product);
      setDetectionResponse(response);
    }
  };

  const populateForm = (setFormData: (data: FormData) => void) => {
    if (detectedProduct) {
      setFormData({
        name: detectedProduct.name,
        sku: detectedProduct.sku,
        category: detectedProduct.category,
        price: detectedProduct.price.toString(),
        stock: detectedProduct.stock.toString(),
        description: detectedProduct.description,
        image: detectedProduct.image || "",
      });
    }
  };

  const getDetectionMessage = (): string => {
    if (!detectionResponse) return "";

    switch (detectionResponse.source) {
      case "database":
        return `Found existing product: ${detectionResponse.product.name}`;
      case "suggestion":
        return `Product suggestion based on detected object: ${detectionResponse.product.name}`;
      case "generated":
        return `Generated product template for: ${detectionResponse.product.name}`;
      default:
        return "Product detected";
    }
  };

  const isExistingProduct = (): boolean => {
    return (
      detectionResponse?.source === "database" && !detectionResponse.suggestion
    );
  };

  const isSuggestion = (): boolean => {
    return detectionResponse?.suggestion === true;
  };

  const startDetection = () => {
    setIsDetecting(true);
    setDetectedProduct(null);
    setDetectionResponse(null);
  };

  const stopDetection = () => {
    setIsDetecting(false);
  };

  const clearDetection = () => {
    setDetectedProduct(null);
    setDetectionResponse(null);
  };

  return {
    isDetecting,
    detectedProduct,
    detectionResponse,
    isLoading,
    startDetection,
    stopDetection,
    clearDetection,
    handleDetection,
    handleProductFound, // New function for string-based detection
    searchProductByObject,
    populateForm,
    getDetectionMessage,
    isExistingProduct,
    isSuggestion,
  };
};
