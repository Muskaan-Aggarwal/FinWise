import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Helper function for logging (only in development mode)
const log = (...args) => {
    if (process.env.NODE_ENV !== "production") {
        console.log(...args);
    }
};

const authMiddleware = async (req, res, next) => {
    try {
        log("📌 Incoming Headers:", req.headers);

        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            log("❌ No valid token found in request headers!");
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1];
        if (!token || token === "null") {
            log("❌ Received an empty or null token!");
            return res.status(401).json({ message: "Invalid token." });
        }

        log("🔍 Extracted Token:", token);

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            log("❌ Token verification failed:", error.message);
            return res.status(403).json({ message: "Invalid or expired token." });
        }

        if (!decoded.id) {
            log("❌ Token does not contain a valid user ID.");
            return res.status(403).json({ message: "Invalid token." });
        }

        log("✅ Token Decoded:", decoded);

        // Fetch user and exclude password
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            log("❌ No user found for ID:", decoded.id);
            return res.status(404).json({ message: "User not found." });
        }

        // Attach user object to request with both `id` and `_id`
        req.user = { id: decoded.id, _id: decoded.id };
        log("✅ Authenticated User:", req.user);

        next(); // Proceed to next middleware/route
    } catch (error) {
        log("❌ Authentication Error:", error.message);
        res.status(500).json({ message: "Server error during authentication." });
    }
};

export default authMiddleware;




