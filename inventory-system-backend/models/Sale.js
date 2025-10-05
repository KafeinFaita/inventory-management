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
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

saleSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.priceAtSale * item.quantity,
    0
  );
  next();
});

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
