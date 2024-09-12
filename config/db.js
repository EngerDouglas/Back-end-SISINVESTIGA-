import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connection = process.env.CONNECTION_STRING;

export const db = mongoose.connect(connection)
  .then(() => {
    console.log("Connected to BBDD!");
  })
  .catch((err) => {
    console.log("Connection Failured", err);
  });
