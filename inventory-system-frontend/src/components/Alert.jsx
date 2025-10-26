// components/Alert.jsx
import { useEffect } from "react";

export default function Alert({ message, clearMessage, onRetry }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        clearMessage();
      }, 3000); // auto-dismiss after 3s
      return () => clearTimeout(timer);
    }
  }, [message, clearMessage]);

  if (!message) return null;

  return (
    <div
      className={`alert ${
        message.type === "error" ? "alert-error" : "alert-success"
      } shadow-lg`}
    >
      <div className="flex-1">
        <span>{message.text}</span>
      </div>
      {onRetry && message.type === "error" && (
        <button className="btn btn-sm btn-ghost ml-2" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}