import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const { userId } = req.params

    if (!userId) {
        throw new ApiError(404, "User Id required")
    }

    const totalVideos = await Video.countDocuments( { videoOwner : userId })
    const totalSubscribers = await Subscription.countDocuments( { channel : userId })
    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                foreignField: "video",
                localField: "_id",
                as: "videoLike_detail"
            }
        },
        {
            $unwind: "$videoLike_detail"
        },
        {
            $match: {
                "videoLike_detail.videoOwner": userId
            }
        },
        {
            $count: "totalLikes"
        },
    ])
    const totalVideoViews = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                foreignField: "video",
                localField: "_id",
                as: "videoView_detail"
            }
        },
        {
            $unwind: "$videoView_detail" 
        },
        {
            $match:{
                "videoView_detail.videoOwner" : userId
            }
        },
        {
            $count: "totalViews"

        },
    ])

    return res
    .status(201)
    .json(
        new ApiResponse(201,[
            totalVideos,
            totalSubscribers,
            totalLikes,
            totalVideoViews
        ],
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {userId} = req.params

    if (!userId) {
        throw new ApiError(404, "Channel Id required")
    }

    const channelVideos = await Video.find({
        videoOwner: userId
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,channelVideos,"Videos of channel fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
}