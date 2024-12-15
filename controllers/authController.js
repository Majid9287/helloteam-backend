import User from "../models/UserModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

// Signup
export const signup = async (req, res) => {
  const { name, email, password} = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists"});
    }

    const newUser = new User({ name, email, password});
    await newUser.save();

    // No profileId on signup
    const accessToken = generateAccessToken(newUser._id, newUser.role, null);
    const refreshToken = generateRefreshToken(newUser._id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ message: "User registered", accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ message: "Error registering user", error: err.message });
  }
};

// Signin
export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
c

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role, user.profileId || null);
    const refreshToken = generateRefreshToken(user._id);

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Send response
    return res.json({ message: "Signed in successfully", accessToken, refreshToken });
  } catch (err) {
    return res.status(500).json({ message: "Error signing in", error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // Verify the refresh token to extract the user ID
    const verifiedRefreshToken = verifyRefreshToken(refreshToken);

    if (!verifiedRefreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Look up the user in the database using the user ID from the refresh token
    const user = await User.findById(verifiedRefreshToken.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new access token with the user's role and profileId (if it exists)
    const newAccessToken = generateAccessToken(user._id, user.role, user.profileId || null);

    // Set the new access token in cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60* 60 * 1000, // 30 * 24 minutes
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(500).json({ message: "Error refreshing token", error: err.message });
  }
};



export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP and expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Hash the OTP for security
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Update user with hashed OTP and expiration
    user.resetOtp = hashedOtp;
    user.resetOtpExpires = otpExpires;
    await user.save();

    // Send OTP via email
    const subject = 'Your OTP for Password Reset';
    const text = `Your OTP for password reset is ${otp}`;
    const html = `<p>Your OTP for password reset is <b>${otp}</b></p>`;
    // await sendEmail(user.email, subject, text, html);

    return res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    return res.status(500).json({ message: 'Error sending OTP', error: err.message });
  }
};





export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP and check expiration
    if (!await bcrypt.compare(otp, user.resetOtp) || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP is valid, set otpVerified flag to true
    user.otpVerified = true;
    await user.save();

    return res.status(200).json({ message: "OTP verified successfully", nextStep: "Enter new password" });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if OTP was verified
    if (!user.otpVerified) {
      return res.status(400).json({ message: "OTP verification required before resetting password" });
    }

    // Set new password and clear OTP fields and verification flag
    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.otpVerified = false;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};



