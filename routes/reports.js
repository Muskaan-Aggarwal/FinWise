import express from "express";
import authMiddleware from "../middleware/auth.js";
import Expense from "../models/expense.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

const router = express.Router();

// 🔹 Export CSV Report
router.get("/csv", authMiddleware, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).lean();

        const fields = [
            { label: "Category", value: "category" },
            { label: "Amount (₹)", value: "amount" },
            { label: "Date", value: (row) => new Date(row.date).toLocaleDateString("en-IN") }
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(expenses);

        res.header("Content-Type", "text/csv");
        res.attachment("financial_report.csv");
        res.send(csv);
    } catch (error) {
        console.error("CSV Generation Error:", error);
        res.status(500).json({ message: "Error generating CSV" });
    }
});

// 🔹 Export PDF Report (Streaming Approach)
router.get("/pdf", authMiddleware, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).lean();

        res.setHeader("Content-Disposition", "attachment; filename=financial_report.pdf");
        res.setHeader("Content-Type", "application/pdf");

        const doc = new PDFDocument();
        doc.pipe(res);

        // ✅ Title
        doc.fontSize(20).text("Financial Report", { align: "center" }).moveDown(1);

        // ✅ Table Header
        doc.fontSize(14).text("S.No   Category     Amount (₹)    Date", { bold: true });
        doc.moveDown(0.5);

        // ✅ Expense Entries
        expenses.forEach((exp, index) => {
            const formattedDate = new Date(exp.date).toLocaleDateString("en-IN");
            doc.fontSize(12).text(`${index + 1}.  ${exp.category}      ₹${exp.amount}      ${formattedDate}`);
        });

        doc.end();
    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ message: "Error generating PDF" });
    }
});

export default router;

