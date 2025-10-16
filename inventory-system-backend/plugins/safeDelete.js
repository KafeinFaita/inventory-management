// plugins/safeDelete.js
export default function safeDeletePlugin(schema, options = {}) {
  // Add the active flag + optional deletedAt timestamp
  schema.add({
    active: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  });

  // Instance method: mark a document inactive
  schema.methods.safeDelete = async function () {
    this.active = false;
    this.deletedAt = new Date();
    return this.save();
  };

  // Static method: find only active docs
  schema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, active: true });
  };

  // Optional: override deleteOne/deleteMany to enforce safe delete
  if (options.overrideMethods) {
    schema.pre("deleteOne", { document: true, query: false }, async function (next) {
      this.active = false;
      this.deletedAt = new Date();
      await this.save();
      next(new Error("Safe delete applied — document not removed"));
    });
  }
}