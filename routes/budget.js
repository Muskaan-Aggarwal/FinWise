import express from "express";
import authMiddleware from "./auth.js";
import Expense from "../models/expense.js";
import Budget from "../models/budget.js";

const router = express.Router();

// Helper function to get date range
const getDateRange = (period) => {
    const now = new Date();
    if (period === "weekly") {
        const start = new Date(now);
        start.setDate(now.getDate() - 7); // Last 7 days
        return { start, end: now };
    } else {
        // Default to monthly
        return {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    }
};

// 🔹 Set or Update Budget (Supports Different Periods)
router.post("/set", authMiddleware, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            console.error("❌ No user ID found in request!");
            return res.status(401).json({ error: "User not authenticated" });
        }

        const { amount, period } = req.body;
        let budget = await Budget.findOne({ user: userId, period });

        if (budget) {
            budget.amount = amount;
        } else {
            budget = new Budget({ user: userId, amount, period });
        }

        await budget.save();
        res.json({ message: "Budget updated successfully!", budget });
    } catch (error) {
        console.error("Error setting budget:", error);
        res.status(500).json({ message: "Error setting budget" });
    }
});

// 🔹 Get Budget and Expenses for a Specific Period
router.get("/:period", authMiddleware, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            console.error("❌ No user ID found in request!");
            return res.status(401).json({ error: "User not authenticated" });
        }

        const { period } = req.params;
        const budget = await Budget.findOne({ user: userId, period });

        if (!budget) return res.status(404).json({ message: "No budget found for this period" });

        const { start, end } = getDateRange(period);

        const totalExpenses = await Expense.aggregate([
            { 
                $match: { 
                    user: userId, 
                    date: { $gte: start, $lte: end } 
                } 
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            budget: budget.amount,
            totalExpenses: totalExpenses[0]?.total || 0
        });
    } catch (error) {
        console.error("Error fetching budget:", error);
        res.status(500).json({ message: "Error fetching budget" });
    }
});

// 🔹 Budget Alert: Check if Budget is Exceeded
router.get("/alert", authMiddleware, async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            console.error("❌ No user ID found in request!");
            return res.status(401).json({ error: "User not authenticated" });
        }

        const budget = await Budget.findOne({ user: userId });
        if (!budget) return res.json({ overBudget: false, message: "No budget set." });

        const { start, end } = getDateRange(budget.period);

        const totalSpent = await Expense.aggregate([
            { $match: { user: userId, date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const spentAmount = totalSpent.length ? totalSpent[0].total : 0;
        const overBudget = spentAmount > budget.amount;

        res.json({ overBudget, message: overBudget ? "🚨 Budget Exceeded!" : "✅ Within Budget" });
    } catch (error) {
        console.error("Error checking budget:", error);
        res.status(500).json({ message: "Error checking budget" });
    }
});

export default router;
