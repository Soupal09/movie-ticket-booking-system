
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Role = require("../models/Role");

const signup = async (req, res) => {
  let createdUser;

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input format"
      });
    }

    if (!name.trim() || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and email cannot be empty"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    if (
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.APP_BASE_URL
    ) {
      return res.status(500).json({
        success: false,
        message: "Email configuration is missing"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    const userRole = await Role.findOne({
      name: "User"
    });

    if (!userRole) {
      return res.status(500).json({
        success: false,
        message: "User role not found"
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const hashedPassword = await bcrypt.hash(password, 12);

    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole._id,
      isEmailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000)
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const verificationLink =
      `${process.env.APP_BASE_URL.replace(/\/$/, "")}` +
      `/api/auth/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: normalizedEmail,
      subject: "Verify Your Email",
      text:
        `Hello ${name.trim()},\n\n` +
        `Verify your email using this link:\n${verificationLink}\n\n` +
        "This link expires in 15 minutes.",
      html:
        `<p>Hello ${name.trim()},</p>` +
        "<p>Please verify your email by clicking the link below.</p>" +
        `<p><a href="${verificationLink}">Verify Email</a></p>` +
        "<p>This link expires in 15 minutes.</p>"
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email."
    });
  } catch (error) {
    if (createdUser) {
      try {
        await User.deleteOne({ _id: createdUser._id });
      } catch (deleteError) {
        console.error("User cleanup failed:", deleteError);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Signup failed. Check email configuration."
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (typeof token !== "string" || !token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() }
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link"
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Email verification failed"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured"
      });
    }

    const role = await Role.findById(user.role);

    if (!role) {
      return res.status(500).json({
        success: false,
        message: "User role not found"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: role.name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role.name
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

module.exports = { signup, login, verifyEmail };
