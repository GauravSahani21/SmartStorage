import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // In production, MONGO_URI is mandatory
    if (process.env.NODE_ENV === 'production' && !uri) {
      console.error('❌ MONGO_URI environment variable is required in production!');
      process.exit(1);
    }

    // If no URI is set (development only), fall back to in-memory MongoDB
    if (!uri) {
      console.log('⚠️  No MONGO_URI set — starting in-memory MongoDB for development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('✅ In-memory MongoDB started (data resets on restart)');
        console.log('   To use persistent storage, set MONGO_URI in backend/.env');
      } catch (memErr) {
        console.error('❌ Could not start in-memory MongoDB. Please set MONGO_URI in backend/.env');
        console.error('   Error:', memErr.message);
        process.exit(1);
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
