import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  budget: { type: Number, default: 0 },
  expenses: { type: Array, default: [] },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;



