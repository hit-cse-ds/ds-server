import { app } from "./app";
import connectDB from "./utlis/db";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
  });

  
app.listen(8080 , () => {
    console.log(`server is connected to `);
    connectDB();
})