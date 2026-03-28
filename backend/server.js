const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const trendRoutes = require("./routes/trendRoutes");
const searchRoutes = require("./routes/searchRoutes");
const topicRoutes = require("./routes/topicRoutes");
const trendingRoutes = require("./routes/trendingRoutes");
const alertRoutes = require("./routes/alertRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");
const { startCron } = require("./utils/cron");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/trend", trendRoutes);
app.use("/api", searchRoutes);
app.use("/api", topicRoutes);
app.use("/api", trendingRoutes);
app.use("/api/alerts", alertRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startCron();