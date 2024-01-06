import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOrder extends Document {
  courseId: string;
  userId: string;
  payment_info: object;
}

export const orderSchema: Schema = new Schema<IOrder>(
  {
    courseId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    payment_info: {
      type: Object,
      // required: true
    },
  },
  {
    timestamps: true,
  },
);

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
