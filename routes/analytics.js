import express from "express";
import mongoose from "mongoose";
import authMiddleware from "./auth.js";
import Expense from "../models/expense.js";

const router = express.Router();

// Get Monthly Budget vs. Expenses
router.get("/monthly-summary", authMiddleware, async (req, res) => {
    try {
        console.log("📌 Request Headers:", req.headers);

        if (!req.user || !req.user._id) {
            console.error("❌ No user ID found in request!");
            return res.status(401).json({ message: "Unauthorized: No user ID found" });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        console.log(`📌 User ID: ${userId}`);

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const expenses = await Expense.aggregate([
            { $match: { user: userId, date: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $group: { _id: { $dayOfMonth: "$date" }, total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }
        ]);

        console.log("📊 Monthly Summary Data:", expenses);

        res.json(expenses);
    } catch (error) {
        console.error("❌ Error fetching monthly summary:", error.message);
        res.status(500).json({ message: "Error fetching expense data", error: error.message });
    }
});



// Get Category-Wise Expense Breakdown
router.get("/category-breakdown", authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Unauthorized: No user ID found" });
        }

        const userId = new mongoose.Types.ObjectId(req.user._id);
        console.log(`📌 User ID: ${userId}`);

        const expenses = await Expense.aggregate([
            { $match: { user: userId } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } }
        ]);

        console.log("📊 Raw Expenses Data:", expenses);

        const categoryBreakdown = expenses.map(d => ({
            id: d._id ? d._id.toString() : "Unknown",  
            name: d._id ? d._id.toString() : "Unknown",  
            total: d.total || 0  
        }));

        console.log("✅ Category Breakdown Response:", categoryBreakdown);

        res.json(categoryBreakdown);
    } catch (error) {
        console.error("❌ Error fetching category breakdown:", error);
        res.status(500).json({ message: "Error fetching category breakdown", error: error.message });
    }
});


export default router;
