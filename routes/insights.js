import express from "express";
import authMiddleware from "../middleware/auth.js";
import Expense from "../models/expense.js";
import Budget from "../models/budget.js";

const router = express.Router();

// 🔹 Get Advanced Financial Insights
router.get("/", authMiddleware, async (req, res) => {
    try {
        const budget = await Budget.findOne({ user: req.user.id });

        // ✅ Define start and end of the current period
        const startOfPeriod = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfPeriod = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        // ✅ Aggregate total spent by category
        const totalSpent = await Expense.aggregate([
            { 
                $match: { 
                    user: req.user.id, 
                    date: { $gte: startOfPeriod, $lte: endOfPeriod } 
                } 
            },
            { $group: { _id: "$category", total: { $sum: "$amount" } } }
        ]);

        const spentAmount = totalSpent.reduce((acc, item) => acc + item.total, 0);
        const budgetAmount = budget ? budget.amount : 0;
        const remainingBudget = budgetAmount - spentAmount;

        // ✅ Dynamic Spending Recommendations
        let recommendation = "You're on track!";
        if (!budget) {
            recommendation = "Set a budget to track your expenses effectively.";
        } else if (remainingBudget < 0) {
            recommendation = "🚨 You're exceeding your budget! Cut down non-essentials.";
        } else if (remainingBudget > budgetAmount * 0.6) {
            recommendation = "🎯 You have significant savings! Consider investments.";
        } else if (remainingBudget < budgetAmount * 0.2) {
            recommendation = "⚠️ You’re close to your budget limit. Spend wisely!";
        }

        // ✅ Investment Tip
        const investmentTip = spentAmount < budgetAmount * 0.4
            ? "You're saving well! Consider investing in mutual funds or SIPs."
            : "Monitor expenses and ensure savings before investing.";

        res.json({ spentAmount, remainingBudget, recommendation, investmentTip, categoryWiseSpending: totalSpent });
    } catch (error) {
        console.error("Error fetching financial insights:", error);
        res.status(500).json({ message: "Error fetching financial insights" });
    }
});

export default router;
