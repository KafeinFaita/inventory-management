// components/Form.jsx
import Alert from "./Alert";

export default function Form({
  title,
  fields,
  values,
  setValues,
  submitting,
  onSubmit,
  onCancel,
  show,
  error, // string or null
  clearError, // new prop
}) {
  if (!show) return null;

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-base-100/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal box */}
      <div className="relative bg-base-100 rounded-xl shadow-lg w-full max-w-lg mx-4">
        <form className="space-y-4 p-6" onSubmit={onSubmit}>
          {title && <h2 className="text-xl font-semibold">{title}</h2>}

          {/* Inline error using Alert */}
          <Alert
            message={error ? { type: "error", text: error } : null}
            clearMessage={clearError}
          />

          {fields.map((field) => {
            switch (field.type) {
              case "text":
              case "number":
                return (
                  <div key={field.name}>
                    <label className="block font-semibold mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={values[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="input input-bordered w-full"
                      required={field.required}
                      disabled={submitting}
                    />
                  </div>
                );
              case "textarea":
                return (
                  <div key={field.name}>
                    <label className="block font-semibold mb-1">{field.label}</label>
                    <textarea
                      value={values[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="textarea textarea-bordered w-full"
                      required={field.required}
                      disabled={submitting}
                    />
                  </div>
                );
              default:
                return null;
            }
          })}

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className={`btn btn-primary ${submitting ? "loading" : ""}`}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}