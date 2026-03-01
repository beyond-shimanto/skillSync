import mongoose from "mongoose";

//user model
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    joiningDate: {
        type: Date,
        required: true,
        default: Date.now
    }


})

export const userModel = mongoose.model('User', userSchema)

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    }
})

export const refreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema)