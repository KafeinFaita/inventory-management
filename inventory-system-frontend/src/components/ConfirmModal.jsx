// src/components/ConfirmModal.jsx
export default function ConfirmModal({
  show,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  return (
    <div
      className="
        fixed inset-0 flex items-center justify-center 
        bg-black/30 backdrop-blur-sm z-50
      "
      onClick={onCancel} // click backdrop closes modal
    >
      <div
        className="bg-base-100 p-6 rounded-lg shadow-lg w-96"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              onConfirm();
              onCancel(); // auto-close after confirm
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}