class AppError extends Error {
	constructor(message, statusCode) {
		super(message);

		this.statusCode = statusCode;
		this.status = `${this.statusCode}`.startsWith(4) ? "fail" : "error";
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor); // this line used for older verison of node js (v < 12)
		// above version 12 the node js automatic add this line of code (captureStackTrace).
	}
}

export default AppError;
