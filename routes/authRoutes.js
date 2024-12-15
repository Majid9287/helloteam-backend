import express from 'express';
import { signup, signin,verifyOTP, forgotPassword, resetPassword, refreshToken} from '../controllers/authController.js';
const router = express.Router();

// Authentication Routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/verify-OTP', verifyOTP);


export default router;
