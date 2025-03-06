import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.js";
import authenticateToken from "../middleware/auth.js";
import cookieParser from "cookie-parser";

dotenv.config();
const router = express.Router();
router.use(cookieParser()); // Enable cookie parsing

// 🔹 Function to Generate Access & Refresh Tokens
const generateTokens = (userId) => {
  try {
    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      throw new Error("JWT secrets are missing in environment variables");
    }

    const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("❌ Error generating tokens:", error.message);
    throw error;
  }
};

// ✅ Register User
router.post(["/register", "/signup"], async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.toLowerCase();
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    // 🔹 Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      user: { id: user._id, name, email },
    });

  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens(user._id);

    // 🔹 Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: { _id: user._id, name: user.name, email: user.email, budget: user.budget },
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Refresh Access Token (When Access Token Expires)
router.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).json({ message: "No refresh token provided" });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

    res.json({ accessToken: newAccessToken });
  });
});

// ✅ Logout User
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// ✅ Fetch User Details (Protected Route)
router.get("/user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
