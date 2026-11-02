require("dotenv").config();

const connectDB = require("./src/config/db");
const Role = require("./src/models/Role");

const seedRoles = async () => {
  try {
    await connectDB();

    await Role.updateOne(
      { name: "User" },
      { $setOnInsert: { name: "User" } },
      { upsert: true }
    );

    await Role.updateOne(
      { name: "Admin" },
      { $setOnInsert: { name: "Admin" } },
      { upsert: true }
    );

    console.log("User and Admin roles created successfully");

    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

seedRoles();