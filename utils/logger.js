import winston from 'winston';

const { combine, timestamp, printf, errors } = winston.format;

// Define a custom format for log messages
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return stack
        ? `${timestamp} [${level}]: ${message}\n${stack}`
        : `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        new winston.transports.Console(), // Output to console
        new winston.transports.File({ filename: 'error.log', level: 'error' }), // Save error logs to file
        new winston.transports.File({ filename: 'combined.log' }) // Save all logs to file
    ]
});

export default logger;

