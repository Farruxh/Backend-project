import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const likedBy = req.user._id 

    if (!isValidObjectId(videoId) && !isValidObjectId(likedBy)) {
        throw new ApiError(404,"Id's not valid")
    }
    const videoObjectId = new mongoose.Types.ObjectId(videoId);
    const likedByObjectId = new mongoose.Types.ObjectId(likedBy);      

    const existedLike = await Like.findOne({video: videoObjectId, likedBy: likedByObjectId})
    console.log("existedLike: ",existedLike);
        if(existedLike){
            await Like.deleteOne({ _id: existedLike._id})
            return res
            .status(201)
            .json(
                new ApiResponse(201,{},"Video Unliked Successfully")
            )
        }
        else{
            const Liked = await Like.create({video: videoId, likedBy: likedBy})
            return res
            .status(201)
            .json(
                new ApiResponse(201,Liked,"Video liked Successfully")
            )
        }
    }  
)

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const likedBy = req.user._id

    if(!isValidObjectId(commentId) && !isValidObjectId(likedBy)){
        throw new ApiError(404, "Invalid Id's provided")
    }

    const commentObjectID = new mongoose.Types.ObjectId(commentId)
    const likedByObjectID = new mongoose.Types.ObjectId(likedBy)
    const existedCommentLike = await Like.findOne({comment: commentObjectID, likedBy: likedByObjectID})
    
    if(existedCommentLike){
        await Like.deleteOne(existedCommentLike)
        return res
        .status(201)
        .json(
            new ApiResponse(201,{},"Comment Unliked Successfully")
        )
    }
    else{
        const newCommentLike = await Like.create({comment: commentId, likedBy: likedBy})
        return res
        .status(201)
        .json(
            new ApiResponse(201,newCommentLike,"Comment liked Successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const likedBy = req.user._id

    if(!isValidObjectId(tweetId) && !isValidObjectId(likedBy)){
        throw new ApiError(404, "Invalid Id's provided")
    }

    const tweetObjectID = new mongoose.Types.ObjectId(tweetId)
    const likedByObjectID = new mongoose.Types.ObjectId(likedBy)

    const existedTweetLike = await Like.findOne({tweet: tweetObjectID, likedBy: likedByObjectID})
    if (existedTweetLike) {
        await Like.deleteOne(existedTweetLike)
        return res
        .status(201)
        .json(
            new ApiResponse(201,{},"Tweet Unliked Successfully")
        )
    }
    else{
        const newTweetLike = await Like.create({tweet: tweetId, likedBy: likedBy})
        return res
        .status(201)
        .json(
            new ApiResponse(201,newTweetLike,"Tweet liked Successfully")
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy : userId, 
            }
        },
        {
            $project: {
                video: 1,
                likedBy:1,
            }
        },
        {
            $match: {              
                video: { $exists: true, $ne: null }
            }
        }
    ])
    
    return res
    .status(201)
    .json(
        new ApiResponse(201, likedVideos, "All liked videos fetched Successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}