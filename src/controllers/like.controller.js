import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const likedBy = req.user._id
    
    if(!videoId) {
        throw new ApiError(404,"Video Id required")
    }

    const existedLike = await Like.findOne({video: videoId, likedBy: likedBy})
    if(existedLike){
        await Like.deleteOne({ _id: existedLike.id})
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
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const likedBy = req.user._id

    if(!commentId) {
        throw new ApiError(404,"Comment Id required")
    }

    const existedCommentLike = await Like.findOne({comment: commentId, likedBy: likedBy})
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

    if(!tweetId){
        throw new ApiError(404, "Tweet Id required")
    }

    const existedTweetLike = await Like.findOne({tweet: tweetId, likedBy: likedBy})
    if (existedTweetLike) {
        await Like.deleteOne(existedTweetLike)
        return res
        .status(201)
        .json(
            new ApiResponse(201,{},"Tweet Un liked Successfully")
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
        $match: {likedBy : userId}
    },
    {
        $lookup: {
          from: "videos",
          foreignField: "video",
          localField: "_id",
          as: "video_detail",
        }
    },
    {
        $unwind: {
            $video_detail
        }
    },
    {
        $project: {
            "video_detail.videoFile": 1,
            "video_detail.thumbnail" : 1,
            "video_detail.title" : 1,
            "video_detail.description" : 1,
            "video_detail.duration" : 1,
            "video_detail.owner": 1,
            "video_detail.createdAt": 1
        }
    }
    ]
    )

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