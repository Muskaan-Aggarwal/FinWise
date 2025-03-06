import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js"; // Authentication routes
import authMiddleware from "./middleware/auth.js"; // Authentication middleware
import expenseRoutes from "./routes/expense.js";
import budgetRoutes from "./routes/budget.js";
import aiInsightsRoutes from "./routes/aiInsights.js";
import analyticsRoutes from "./routes/analytics.js";

dotenv.config();

// Check for required environment variables
if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error("❌ FATAL ERROR: MONGO_URI is not defined.");
    process.exit(1);
}

const app = express();

// ✅ Fix: Move `cors()` before `express.json()`
app.use(cors({
    origin: "http://localhost:3000", // Adjust for production
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"] // ✅ Allow Authorization
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// ✅ Debug Middleware (Check Headers)
app.use((req, res, next) => {
    console.log("🔍 Request Headers:", req.headers);
    next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/ai-insights", aiInsightsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Protected Route Example
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "You have accessed a protected route!" });
});

// ✅ Catch Uncaught Errors
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// ✅ Catch Unhandled Promise Rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

export default app;
