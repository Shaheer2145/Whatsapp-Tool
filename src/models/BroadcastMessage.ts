import mongoose from 'mongoose';

const BroadCastMessageSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  contacts: [{ type: String, required: true }],
  message: { type: String, required: true },
  // messageID: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Broadcastmessage = mongoose.model(
  'BroadCastMessage',
  BroadCastMessageSchema
);
export default Broadcastmessage;
