"use client";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
}

export function CustomDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: CustomDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: XCircle,
      iconColor: "text-red-600",
      buttonClass: "bg-red-600 hover:bg-red-700 text-white",
      iconBg: "bg-red-100 dark:bg-red-900/20",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600",
      buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-green-600",
      buttonClass: "bg-green-600 hover:bg-green-700 text-white",
      iconBg: "bg-green-100 dark:bg-green-900/20",
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <div className="p-6">
          {/* Icon */}
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${style.iconBg} mb-4`}
          >
            <Icon className={`h-6 w-6 ${style.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2 break-words">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 break-words">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${style.buttonClass}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
