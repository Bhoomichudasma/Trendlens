const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const trendRoutes = require("./routes/trendRoutes");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));



app.use(express.json());

app.use("/api/trend", trendRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));