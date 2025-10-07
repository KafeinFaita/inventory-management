import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtSale: {
    type: Number,
    required: true, // store product price at time of sale
  },
});

const saleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [saleItemSchema],

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    // 🧾 Invoice-related fields (non-breaking additions)
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true, // prevents index errors if not all sales have invoices
    },
    customerName: {
      type: String,
    },
    customerEmail: {
      type: String,
    },
    customerPhone: {
      type: String,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Automatically calculate total amount before saving
saleSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.priceAtSale * item.quantity,
    0
  );
  next();
});

// Auto-generate invoice number if not set
saleSchema.pre("save", function (next) {
  if (!this.invoiceNumber) {
    const timestamp = Date.now().toString().slice(-6);
    this.invoiceNumber = `INV-${timestamp}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;

