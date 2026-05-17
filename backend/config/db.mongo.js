import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cabinet_plus');
    console.log('MongoDB connecte');
  } catch (err) {
    console.error('MongoDB erreur:', err.message);
    process.exit(1);
  }
};

export default connectMongo;
