import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const connection = process.env.CONNECTION_STRING;

export const connectDB = async () => {
  try {
    await mongoose.connect(connection)
    logger.info('Connected to BBDD!');
  } catch (err) {
    logger.error('Connection Failed', err)
    throw err;
  }
}
  