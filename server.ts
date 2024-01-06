import dotenv from 'dotenv';
dotenv.config();
import { app } from './app';
import connectDB from './utils/db';
import { v2 as cloudinary } from 'cloudinary';

const port: number | string = process.env.PORT || 8080;

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.listen(port, () => {
  console.log(`Server is up & running on port ${port}`);
  connectDB();
});
