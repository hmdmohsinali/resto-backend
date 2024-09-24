import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";


dotenv.config();

const connectToDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(chalk.bold.green(`MongoDB Connected: ${conn.connection.host}`));
  } catch (error) {
    console.error(chalk.bold.red(`Error: ${error.message}`));
    process.exit(1);
  }
};

export default connectToDB;