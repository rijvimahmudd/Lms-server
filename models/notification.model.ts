import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  status: string;
  userId: string;
}

export const notificationSchema: Schema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'unread',
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema,
);

export default Notification;
