import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectToDB = async () => {
    try {
        if(!ENV.MONGO_URI){
            throw new Error("Please provide MONGO_URI in the environment variables");
        }
        const conn = await mongoose.connect(ENV.MONGO_URI);
        console.log("Connected to MongoDB" , conn.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // 1 status code means fail , 0 means success
    }
};