import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import Expense from "../models/expense.js";
import Budget from "../models/budget.js";
import authMiddleware from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";

dotenv.config();
const router = express.Router();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache responses for 1 hour

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});

router.use(limiter);

// Generate AI Financial Insights using tinyllama model
router.get("/", authMiddleware, async (req, res) => {
    try {
        const cacheKey = `insights_${req.user.id}`;
        const cachedResponse = cache.get(cacheKey);

        if (cachedResponse) {
            return res.json({ insights: cachedResponse });
        }

        // Find user’s budget (period-based, default to 0 if not set)
        const budget = await Budget.findOne({ user: req.user.id }) || { amount: 0 };

        // Fetch user's expenses
        const expenses = await Expense.find({ user: req.user.id });

        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remainingBudget = budget.amount - totalExpenses;

        // Categorize expenses
        const categories = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});

        const categoryBreakdown = Object.entries(categories).length
            ? Object.entries(categories)
                .map(([key, value]) => `${key}: ₹${value}`)
                .join(", ")
            : "No spending recorded yet.";

        // Construct AI prompt
        const prompt = `
            You are a financial expert. The user has a budget of ₹${budget.amount}.
            Their total spending is ₹${totalExpenses}, categorized as follows: ${categoryBreakdown}.
            The remaining budget is ₹${remainingBudget}.
            
            Provide:
            1. A brief analysis of their spending pattern.
            2. Two personalized saving tips.
            3. Two investment opportunities that align with their financial situation.
        `;

        // Call tinyllama locally using Ollama
        const aiResponse = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: "tinyllama",
                prompt: prompt,
                stream: false
            },
            { headers: { "Content-Type": "application/json" } } // Fix missing headers
        );

        const insights = aiResponse.data.response;
        cache.set(cacheKey, insights); // Cache the response

        res.json({ insights });
    } catch (error) {
        console.error("Error generating financial insights:", error);

        if (error.response) {
            // Handle API-specific errors
            res.status(error.response.status).json({ message: error.response.data });
        } else {
            res.status(500).json({ message: "Error generating financial insights", error: error.message });
        }
    }
});

export default router;