import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl: string = process.env.DB_URI || '';

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl).then((data: typeof mongoose) => {
      console.log(`Database Connected: ${data?.connection.host}`);
      // console.log(data.connection._connectionString);
    });
  } catch (error: unknown) {
    console.log((error as Error).message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
