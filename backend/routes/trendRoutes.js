const express = require("express");
const router = express.Router();
const { getTrendData } = require("../controllers/trendController");

router.get("/:keyword", getTrendData);


module.exports = router;