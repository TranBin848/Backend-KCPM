const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAuth = require("./middleware/authMiddleware");
const { checkAdmin } = require("./middleware/roleMiddleware");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const createUserController = require("./controllers/userController");
const createUserRoutes = require("./routes/userRoutes");

require("dotenv").config();

const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// OTP store
const otpStore = new Map();

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email sending function
async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Initialize controller with dependencies
const userController = createUserController({
  pool,
  bcrypt,
  jwt,
  otpStore,
  sendEmail,
});

// Initialize routes with dependencies
const userRoutes = createUserRoutes({
  userController,
  checkAuth,
  checkAdmin,
});

// Mount routes
app.use("/api", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`UserService server is running on port ${PORT}`)
);
