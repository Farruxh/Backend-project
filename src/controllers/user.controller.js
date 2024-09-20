import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Jwt } from "jsonwebtoken"

//function for generating tokens when passed a userId(Id = _id that generates by db)
const generateAccessAndRefreshTokens = async(userId) => {
      try {
        //finding user
        const user = await User.findById(userId)

        // generating tokens
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        //saving tokens
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return { accessToken, refreshToken }
      } catch (error) {
          throw new ApiError(500, "Something went wrong while generating Refresh and Access token")
      }
}

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

    console.log("Request Body: ",req.body);

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
    const existedUser = await User.findOne({
        $or: [{username} , {email}]
    })

    console.log(existedUser);

    if(existedUser){
        throw new ApiError(409,"User with username or email already exist in DataBase")
    }
    console.log("Request Files: ",req.files);

    // checking for images, checking for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    console.log("Avatar Local Path ",avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    console.log("Cover Image Local Path", coverImageLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    // uploading them on cloudinary  
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    console.log("Avatar: ",avatar);
    console.log("coverImage: ",coverImage);

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
    
    console.log("User: ",user);

    // removing password and referesh token field from response from select()
    const createdUser = await User.findById(user._id).select("-password -refreshTokens")

    console.log("User Created: ", createdUser);

    // checking for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while Registering User")
    }

    // returning response in a structured manner 
    return res.status(201).json(
        new ApiResponse(201, createdUser , "User registered successfully")
    )
})

const loginUser = asyncHandler( async (req,res) =>{
    // req.body -> data: username, email, password
    const {username, email, password} = req.body
    
    // checking for validation
    if (!username || !email) {
        throw new ApiError(400, "username or email required")
    }
    
    // user finding in db
    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    // checking if user exists
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    // password
    const isPaswword = await user.isPasswordCorrect(password)

    // checking if password is correct
    if (!isPaswword) {
        throw new ApiError(401, "Password is incorrect")
    }

    // generating and saving access and refresh tokens
    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // updating user
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // updating cookies options
    const options = {
        httpOnly: true,
        secure: true
    }

    // returning response
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
     )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,{}, "LoggedOut Successfully")
    )
}) 

const refreshAccessTokens = asyncHandler(async(req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }
    const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh Token is expired or used")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user?._id)

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken", newRefreshToken , options)
    .json(
        new ApiResponse(
            200,
            {accessToken,refreshToken: newRefreshToken}, 
            "Access Token Refreshed"
        )
    )
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const { currentPassword , newPassword } = req.body

    const user = await User.findById(req.user?.id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if(!isPasswordCorrect){
        throw new ApiError(404,"Invalid current password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Password changes successfully"))
})

const getCurrentUser = asyncHandler( async(req,res) =>{
    return req
    .status(200)
    .json(new ApiResponse(200 , req.user, "Current User Fetched Successfully"))
})
export {registerUser,loginUser,logoutUser,refreshAccessTokens,changeCurrentPassword,getCurrentUser}