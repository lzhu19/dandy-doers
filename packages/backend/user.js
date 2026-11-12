import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
  },
  { collection: 'users-list' }
);

const User = mongoose.model('User', userSchema);

export default User;
