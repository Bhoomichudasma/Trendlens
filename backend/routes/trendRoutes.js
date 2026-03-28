const express = require("express");
const router = express.Router();
const { getTrendData, exportPDF } = require("../controllers/trendController");

// Updated route to support query parameters for filtering
router.get("/:keyword", getTrendData);

// PDF export route
router.post("/export/pdf", exportPDF);

module.exports = router;