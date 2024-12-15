import jwt from 'jsonwebtoken'

// import { promisify } from 'util'
import AppError from './../utils/appError.js'
import catchAsync from './../utils/catchAsync.js'

// import Customer from '../models/users/customerModel.js'
// import Vendor from '../models/sellers/vendorModel.js'
// import Employee from '../models/admin/employeeModel.js'
// import Role from './../models/admin/roleModel.js'
// import redisClient from '../config/redisConfig.js'

// const models = {
//     sub_admin: Employee,
//     admin: Employee,
//     vendor: Vendor,
//     customer: Customer,
// }

// export const selectModelByRole = (req, res, next) => {
//     const userRole = req.user?.role?.name.toLowerCase()
//     const Model = models[userRole]

//     if (!Model) {
//         return next(new AppError('User role not recognized.', 401))
//     }

//     // Attach the selected model to the request object
//     req.Model = Model
//     next()
// }

export const protect = catchAsync(async (req, res, next) => {
    let token
    // Get the access token from headers or cookies
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1]
    }
    // else if (req.cookies.jwt) {
    //     // Support tokens from cookies for session-based auth
    //     token = req.cookies.jwt
    // }

    if (!token) return next(new AppError('You are not logged in!', 401))

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    const { userId, role } = decoded

    // Check Redis cache for the user and role data
    const cachedUser = await redisClient.get(`cache:User:${userId}`)
    if (cachedUser) {
        req.user = JSON.parse(cachedUser)
        return next()
    }

    console.log({ decoded })

    let Model
    if (role === 'customer') Model = Customer
    else if (role === 'vendor') Model = Vendor
    else Model = Employee

    const currentUser = await Model.findById(userId)
    if (!currentUser) return next(new AppError('User not found.', 401))

    if (currentUser.changePasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'Your password has been changed. Please log in again to continue.',
                401
            )
        )
    }

    req.user = currentUser

    console.log(req.user)

    await redisClient.setEx(
        `cache:User:${userId}`,
        3600,
        JSON.stringify(currentUser)
    )
    next()
})

// export const restrictTo = (moduleName) => async (req, res, next) => {
//     const roleName = req.user?.role?.name
//     const cachedRole = await redisClient.get(`cache:Role:${roleName}`)

//     let role
//     if (cachedRole) {
//         role = JSON.parse(cachedRole)
//     } else {
//         role = await Role.findOne({ name: roleName })
//         if (!role) return next(new AppError('Role not found.', 404))
//         await redisClient.setEx(
//             `cache:Role:${roleName}`,
//             3600,
//             JSON.stringify(role)
//         )
//     }

//     const hasAccess = role.modules.includes(moduleName)
//     if (!hasAccess) {
//         return next(new AppError('Access denied to this module.', 403))
//     }
//     next()
// }

// export const validateSessionToken = async (req, res, next) => {
//     const { token } = req.body

//     try {
//         // 2) Verification token
//         const decoded = await promisify(jwt.verify)(
//             token,
//             process.env.JWT_SECRET
//         )

//         const { userId } = decoded

//         // Check token in Redis Cache
//         const refreshToken = await getRefreshToken(userId, next)

//         if (!refreshToken) {
//             return next(new AppError('expired', 401))
//         }

//         return res.status(200).json({ status: 'valid' })
//     } catch (error) {
//         return res.status(401).json({ status: 'expired' })
//     }
// }
