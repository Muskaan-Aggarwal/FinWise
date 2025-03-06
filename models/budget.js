import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0, default: 0 }, // Prevents negative values
    period: { type: String, enum: ["monthly", "weekly"], default: "monthly" }, // Can be expanded later
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

export default mongoose.model("Budget", BudgetSchema);
