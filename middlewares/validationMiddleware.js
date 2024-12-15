import AppError from './../utils/appError.js'

export const validateSchema = (Schema) => (req, res, next) => {
    const { error } = Schema.validate(req.body)
    if (error) {
        return next(new AppError(error.details[0].message, 400))
    }
    next()
}
