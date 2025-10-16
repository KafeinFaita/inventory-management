import mongoose from "mongoose";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Brand from "./models/Brand.js";
import Sale from "./models/Sale.js";
import dotenv from "dotenv";
dotenv.config();


const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("Users indexes:", await User.collection.getIndexes());
  console.log("Products indexes:", await Product.collection.getIndexes());
  console.log("Categories indexes:", await Category.collection.getIndexes());
  console.log("Brands indexes:", await Brand.collection.getIndexes());
  console.log("Sales indexes:", await Sale.collection.getIndexes());

  await mongoose.disconnect();
};

run().catch(console.error);

