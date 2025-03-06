import express from "express";
import Expense from "../models/expense.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// 🔹 Add an expense
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { title, amount, category } = req.body;

        // ✅ Input Validation
        if (!title || !amount || !category) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newExpense = new Expense({
            user: req.user.id,
            title,
            amount,
            category,
            date: new Date() // ✅ Auto-set the date
        });

        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).json({ message: "Error adding expense" });
    }
});

// 🔹 Get all expenses for a user (sorted by date)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Error fetching expenses" });
    }
});

// 🔹 Update an expense
router.put("/update/:id", authMiddleware, async (req, res) => {
    try {
        const { title, amount, category } = req.body;

        // ✅ Check if expense exists
        let expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // ✅ Ensure the user owns this expense
        if (expense.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { title, amount, category },
            { new: true }
        );

        res.json(expense);
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ message: "Error updating expense" });
    }
});

// 🔹 Delete an expense
router.delete("/delete/:id", authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        // ✅ Check if expense exists
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // ✅ Ensure the user owns this expense
        if (expense.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ message: "Error deleting expense" });
    }
});

export default router;
