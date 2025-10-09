import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      default: "My Business",
      trim: true,
    },
    businessLogoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    businessAddress: {
      type: String,
      trim: true,
      default: "",
    },
    themeMode: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    pdfSettings: {
      footerText: { type: String, default: "" },
      pageSize: { type: String, enum: ["A4", "Letter"], default: "A4" },
      orientation: { type: String, enum: ["portrait", "landscape"], default: "portrait" },
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
