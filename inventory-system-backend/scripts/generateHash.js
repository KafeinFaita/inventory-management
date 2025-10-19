import bcrypt from "bcrypt";

const run = async () => {
  const password = "admin123"; 
  const hash = await bcrypt.hash(password, 10);
  console.log("🔐 Bcrypt hash:", hash);
};

run();