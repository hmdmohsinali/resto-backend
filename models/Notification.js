import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
});

export default mongoose.model('Notification', notificationSchema);
