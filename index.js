import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import {connectDB} from './config/dbConfig.js';
// Entry point (e.g., server.js or app.js)
import './services/ticketSyncService.js';
import './scheduler.js';
// Load environment variables
dotenv.config();
const app = express();
connectDB() //db connection

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true, // Enable cookies for cross-origin requests
}));


// Import Routes
import userRoutes from './routes/userRoutes.js';

import authRoutes from './routes/authRoutes.js';
import tickets from './routes/ticketRoutes.js';
import organization from './routes/organizationRoutes.js';
import formRoutes from './routes/formRoutes.js'
import sessionNote from './routes/sessionNoteRoutes.js'
// Register Routes
app.use('/api/auth', authRoutes);

app.use('/api/tickets', tickets);
app.use('/api/organization', organization);
app.use('/api/tickets', tickets);
app.use('/api/session-forms', formRoutes);
app.use('/api/session-notes', sessionNote);
app.use('/api/users', userRoutes);
// Root Route
app.get('/', (req, res) => {
    res.send('Backend is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
const PORT = process.env.PORT || 8080 ;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
