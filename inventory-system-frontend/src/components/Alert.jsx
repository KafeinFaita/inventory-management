import React, { useEffect } from "react";

export default function Alert({ message, onRetry, clearMessage }) {
  // Auto-dismiss success after 3s
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => {
        clearMessage?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, clearMessage]);

  if (!message) return null;

  return (
    <div
      className={`alert shadow-md transition-all duration-300 ${
        message.type === "error" ? "alert-error" : "alert-success"
      }`}
    >
      <span className="flex items-center gap-2">
        {message.type === "error" ? "⚠️" : "✅"}
        {message.text}
      </span>

      {message.type === "error" && onRetry && (
        <button
          className="btn btn-xs btn-outline ml-4"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}