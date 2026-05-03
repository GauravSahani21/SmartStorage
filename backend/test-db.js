import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function test() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log("URI:", uri);
  await mongoose.connect(uri);
  console.log("Connected");
  
  const User = mongoose.model('User', new mongoose.Schema({ name: String }));
  await User.create({ name: 'test' });
  console.log("Created");
  
  const docs = await User.find();
  console.log("Found:", docs);
  process.exit(0);
}
test().catch(console.error);
