import mongoose from 'mongoose';

const viewLogSchema = new mongoose.Schema({
  document:  { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  ip:        { type: String, default: '' },
  userAgent: { type: String, default: '' },
  city:      { type: String, default: '' },
  country:   { type: String, default: '' },
  viewedAt:  { type: Date, default: Date.now },
});

const ViewLog = mongoose.model('ViewLog', viewLogSchema);
export default ViewLog;
