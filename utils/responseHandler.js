import logger from "./logger.js";
// utils/responseHandler.js
export const sendSuccessResponse = (res, data, message) => {
	res.status(200).json({
		success: true,
		message,
		docs: data || null,
	});
};

export const sendErrorResponse = (res, error) => {
	logger.error(error.message || error);
	res.status(500).json({
		success: false,
		message: "Internal Server Error",
		error: error.message,
	});
};
