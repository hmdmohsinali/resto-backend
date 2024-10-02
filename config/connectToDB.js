import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const connectToDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    // Already connected or connecting
    console.log(chalk.bold.blue("Using existing MongoDB connection"));
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(chalk.bold.green(`MongoDB Connected: ${conn.connection.host}`));
  } catch (error) {
    console.error(chalk.bold.red(`Error: ${error.message}`));
    process.exit(1); // Exit process with failure
  }
};

export default connectToDB;