import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0 // Prevents negative expenses
    },
    category: {
      type: String,
      required: true,
      enum: ["Food", "Transport", "Shopping", "Rent", "Entertainment", "Bills", "Health", "Other"] // Standardized categories
    },
    description: {
      type: String,
      maxlength: 255 // Prevents excessively long descriptions
    },
    date: {
      type: Date,
      default: Date.now, // Defaults to current date if not provided
      required: true
    }
  },
  { timestamps: true } // Adds createdAt & updatedAt fields automatically
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;


