import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res) => {
    // STRATEGY: 
    // get user details from frontend
    // validation - check if empty
    // check if user already exists: username,email
    // check for images, check for avatar
    // upload them on cloudinary
    // check on cloudinary
    // create user object - create entry in db
    // remove password and referesh token field from response
    // check for user creation
    // return res



    // getting user details from frontend    
    const {fullname , email , username , password} = req.body
    console.log("email of user" , email);

    // validation - checking if empty
    if(fullname === ""){
        throw new ApiError(400, "fullname is required")
    }
    else if(email === ""){
        throw new ApiError(400, "email is required")
    }
    else if(username === ""){
        throw new ApiError(400, "username is required")
    }
    else if(password === ""){
        throw new ApiError(400, "password is required")
    }


    // checking if user already exists: username,email
    const existedUsername = User.findOne({
        $or: {username}
    })
    const existedEmail = User.findOne({
        $or: {email}
    })
    if(existedUsername){
        throw new ApiError(409,"User with username already exist in DataBase")
    }
    else if(existedEmail){
        throw new ApiError(409,"User with email already exist in DataBase")
    } 


    // checking for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    console.log("Avatar Local Path ",avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log("Cover Immage Local Path", coverImageLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }


    // uploading them on cloudinary  
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    // checking on cloudinary
    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }


    // creating user object - creating entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password,
    })
    

    // removing password and referesh token field from response from select()
    const createdUser = User.findById(user._id).select("-password -refreshTokens")

    // checking for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while Registering User")
    }

    // returning response in a structured manner 
    return res.status(201),json(
        new ApiResponse(200, createdUser , "User registered successfully")
    )
})

export {registerUser}