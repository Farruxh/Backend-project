import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

//function for generating tokens when passed a userId(Id = _id that generates by db)
const generateAccessAndRefreshTokens = async(userId) => {
      try {
        //finding user
        const user = await User.findById(userId)

        // generating tokens
        const accessToken = user.generateAccessToken()
        const refreshTokens = user.generateRefreshToken()
        
        //saving tokens
        user.refreshTokens = refreshTokens
        await user.save({validateBeforeSave: false})

        return { accessToken, refreshTokens }
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
    const {accessToken , refreshTokens} = await generateAccessAndRefreshTokens(user._id)

    // updating user
    const loggedInUser = await User.findById(user._id).select("-password -refreshTokens")

    // updating cookies options
    const options = {
        httpOnly: true,
        secure: true
    }

    // returning response
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshTokens, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshTokens
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
    console.log("incomingRefreshToken:", incomingRefreshToken);
    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
        console.log("Decoded Token:", decodedToken);
        const user = await User.findById(decodedToken?._id)
        console.log("Decoded Token:", decodedToken.refreshTokens);

        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
        console.log("user refreshToken:", user.refreshTokens);
        if(incomingRefreshToken !== user?.refreshTokens){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user?._id)

        user.refreshTokens = newRefreshToken;
        await user.save();
        const updatedUser = await User.findById(user._id);
        console.log("Saved user refreshToken:", updatedUser.refreshTokens);
            
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
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const { currentPassword , newPassword } = req.body

    const user = await User.findById(req.user?._id).select("+password")
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    console.log("Entered New Password:", newPassword)
    console.log("Entered Current Password:", currentPassword)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)
    
    if(!isPasswordCorrect){
        throw new ApiError(404,"Invalid current password")
    }

    if(!newPassword){
        throw new ApiError(404,"New password is required")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Password changes successfully"))
})

const getCurrentUser = asyncHandler( async(req,res) =>{
    return res
    .status(200)
    .json(new ApiResponse(200 , req.user, "Current User Fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullname , email} = req.body
    console.log("req.body: ",req.body);
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }
 
    const userId = await User.findById(req.user._id)
    const avatarUrl = userId.avatar.url
    const avatarPublicId = avatarUrl?.split("/").pop().split(".")[0]
    if (avatarPublicId) {
        await deleteFromCloudinary(avatarPublicId)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : avatar.url
            },
        }, {new:true}
    ).select("-password")

    if (!user) {
        throw new ApiError(500, "Error while updating user avatar");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Updated Successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover Image file is missing")
    }
 
    const userId = await User.findById(req.user._id)
    const coverImageUrl = userId.coverImage.url
    const coverImagePublicId = coverImageUrl?.split("/").pop().split(".")[0]
    if (coverImagePublicId) {
        await deleteFromCloudinary(coverImagePublicId)
    }
    
    const uploadCoverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!uploadCoverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : uploadCoverImage.url
            },
        }, {new:true}
    ).select("-password")

    if (!user) {
        throw new ApiError(500, "Error while updating user cover Image");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image Updated Successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
  
    if (!username?.trim()) {
      throw new ApiError(400, "Username is missing");
    }
  
    const channel = await User.aggregate([
      // First stage: $match
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      // Second stage: $lookup for subscriber details
      {
        $lookup: {
          from: "subscriptions",
          foreignField: "channel",
          localField: "_id",
          as: "subscriber_detail",
        },
      },
      // Third stage: $lookup for channels the user is subscribed to
      {
        $lookup: {
          from: "subscriptions",
          foreignField: "subscriber",
          localField: "_id",
          as: "subscribedTo_detail",
        },
      },
      // Fourth stage: $addFields to add custom fields
      {
        $addFields: {
          subscribersCount: { $size: "$subscriber_detail" },
          channelsSubscribedToCount: { $size: "$subscribedTo_detail" },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscriber_detail.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      // Fifth stage: $project to include only specific fields
      {
        $project: {
          fullname: 1,
          username: 1,
          email: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          createdAt: 1,
        },
      },
    ]);
  
    // Log the result for debugging
    console.log("Channel: ",channel);
  
    if (!channel?.length) {
      throw new ApiError(404, "Channel doesn't exist");
    }
  
    // Return the response with channel data
    return res
      .status(200)
      .json(new ApiResponse(200, channel[0], "User channel Fetched Successfully"));
});  

const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watch History",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "videoOwner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
        }]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory, "Watch-History of videos fetched Succesfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessTokens,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}