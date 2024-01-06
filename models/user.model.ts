import dotenv from 'dotenv';
dotenv.config();
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';

const emailRegexPattern =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
  signAccessToken: () => string;
  signRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      validate: {
        validator: (value: string) => {
          return emailRegexPattern.test(value);
        },
        message: 'Please enter a valid email address',
      },
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true },
);

// hash password
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign access token
userSchema.methods.signAccessToken = function () {
  return jwt.sign(
    { id: this._id },
    (process.env.ACCESS_TOKEN as Secret) || '',
    {
      expiresIn: '5m',
    },
  );
};

// sign refresh token
userSchema.methods.signRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    (process.env.REFRESH_TOKEN as Secret) || '',
    {
      expiresIn: '7d',
    },
  );
};

// compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const userModel: Model<IUser> = mongoose.model('User', userSchema);

export default userModel;
