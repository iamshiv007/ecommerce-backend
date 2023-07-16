const User = require('../models/userModel')
const ErrorHandler = require('../utils/errorhandler')
const catchAsyncError = require('..//middleware/catchAsyncErrors')
const cloudinary = require('cloudinary')
const sendToken = require('../utils/jwtToken')
const sendEmail = require("../utils/sendEmail")
const crypto = require('crypto')

// 1 Register a User
exports.registerUser = catchAsyncError( async (req, res, next) => {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder:"Avatars",
        width:150,
        crop:"scale"
    })

    const { name, email, password } = req.body
    
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    })

    sendToken(user, 201, res)
})

// 2 Login User
exports.loginUser = catchAsyncError( async (req, res, next) => {
    const { email, password } = req.body
    
    // Checking if user has given email and password both

    if(!email || !password) {
        return next(new ErrorHandler("Please Enter email & password", 400))
    }

    const user = await User.findOne({ email }).select("+password")

    if(!user) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    const isPasswordMatched = await user.comparePassword(password) 

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email or password", 401))
    }


    sendToken(user, 200, res)
})

// 3 Logout User
exports.logout = catchAsyncError( async (req, res, next) => {
    res.cookie("token", null, {
        expires : new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success:true,
        message: "Logged out"
    })
})

// 4 Forgot Password
exports.forgotPassword = catchAsyncError( async (req, res, next) => {
    const user = await User.findOne({email: req.body.email})

    if(!user) {
        return next(new ErrorHandler("User Not found", 404))
    }


   // Get reset password token
    const resetToken = user.getResetPasswordToken()

    await user.save({validateBeforeSave: false})

    const resetPasswordUrl = `${req.protocol}://localhost:3000/password/reset/${resetToken}`

    const message = `Your password reset token is :- \n\n${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`

    try {
        sendEmail({
            email: user.email,
            subject: "Ecommerce Password Recovery",
            message
        })

        res.status(200).json({
            success:true,
            message: `Email  sent to ${user.email} successfully`
        })
    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave : false})

        return next(new ErrorHandler(error.message, 500))
    }
})

// 5 Reset password
exports.resetPassword = catchAsyncError( async (req, res, next) => {
    // creating token hash
    const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest("hex")

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt : Date.now()}
    })

    if(!user) {
        return next(
             new ErrorHandler(
                "Reset passwor token is invalid or has been expired",
                400
             ))
    }

    if( req.body.password !== req.body.confirmPassword) {
        return next( new ErrorHandler("Password does not match", 400))
    }

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetTokenExpire = undefined

    await user.save()

    sendToken(user, 200, res)
})

// 6 Get user detail
exports.getUserDetails = catchAsyncError( async (req, res, next) => {
    const user = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        user
    })
})

// 7 Update user password
exports.updatePassword = catchAsyncError( async ( req, res, next) => {
    const user = await User.findById(req.user.id).select("+password")

    const isPasswordMatch = await user.comparePassword(req.body.oldPassword)

    if(!isPasswordMatch) {
        return next(new ErrorHandler("Password does not match", 400))
    }

    user.password = req.body.newPassword

    await user.save()

    sendToken(user, 200, res)
})

// 8 Update User Profile
exports.updateProfile = catchAsyncError( async( req, res, next) => {
    console.log(req.body)
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    if(req.body.avatar !== ""){
        const user = await User.findById(req.user.id)

        const imageId = user.avatar.public_id

        await cloudinary.v2.uploader.destroy(imageId)

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width:150,
            crop:'scale'
        })

        newUserData.avatar = {
            public_id : myCloud.public_id,
            url:myCloud.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData,{
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success:true,
        user
    })
})

// 9 Get all users -- admin
exports.getAllUsers = catchAsyncError( async (req, res, next) => {
    const users = await User.find()

    res.status(200).json({
        success:true,
        users
    })
})

// 10 Get single users -- admin
exports.getSingleUser = catchAsyncError( async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if(!user){
        return next(
            new ErrorHandler(`User is not axist with this user id : ${req.params.id}}`)
        )
    }

    res.status(200).json({
        success:true,
        user
    })
})

// 11 Update User role -- admin
exports.updateUserRole = catchAsyncError (async (req, res, next) => {
    const newUserData = {
        name : req.body.name,
        email : req.body.email,
        role : req.body.role
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new : true,
        runValidators : true,
        useFindAndModify : false
    })

    res.status(200).json({
        success:true,
        updatedUser
    })
})

// 12 Delete user admin
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if(!user){
        return next(new ErrorHandler(`User does not axist with Id: ${req.params.id}`, 400))
    }

    // const imageId = user.avatar.public_id

    // await cloudinary.v2.uploader.destroy(imageId);
    
    await User.findByIdAndDelete(req.params.id)

    res.status(200).json({
        success:true,
        message:"User Deleted Successfully"
    })
})