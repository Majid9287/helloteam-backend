import jwt from 'jsonwebtoken';
import 'dotenv/config';
// Generate Access Token
export const generateAccessToken = (userId, role, profileId = null) => {
  return jwt.sign(
    { id: userId, role: role, profileId: profileId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '30d' }
  );
};


// Generate Refresh Token
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

