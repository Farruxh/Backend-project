import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "asc", userId } = req.query

    // const filter = {}
    // if (query) {
    //     filter.$or= [
    //         {title : $regex = query, $options : "i"},
    //         {description : $regex = query, $options : "i"}
    //     ]
    // }
    // if (userId) {
    //     filter.userId = userId
    // }

    // const sort = { [sort] : sortType === "asc"? 1 : -1}

    // const skip = (page - 1)/limit

    // const video = Video
    // .find(filter)
    // .sort(sort)
    // .skip(skip)
    // .limit(limit)
    
    if (!query || !userId) {
        throw new ApiError(400, "query and user Id required");
    }
    const video = await Video.aggregate([
        {
            $match : {
                $or : [
                    {title : $regex = query, $options : "i"},
                    {description : $regex = query, $options : "i"},
                    userId = userId 
            ]
        }
        },
        {
            $sort  : { [sortBy] : sortType === "asc"? 1 : -1}
        },
        {
            $skip  :(page - 1)/limit
        },
        {
            $limit: limit
        },  
        {
            $project: {
                title: 1,
                description: 1,
                createdAt: 1,
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "All Videos Fetched Successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    if(!title || !description){
        throw new ApiError("Title and description are required")
    }

    const videoLocalPath = req.files?.video[0]?.path
    if (!videoLocalPath) {
        throw new ApiError("Video is required")
    }
    console.log("VideoPath: ",videoLocalPath)
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    console.log("Cloudinary Video File: ",videoFile)
    
    const thumbnailLocalPath = req.files?.video[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError("Video is required")
    }
    console.log("thumbnailLocalPath: ",thumbnailLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)
    console.log("Cloudinary thumbnail File: ",thumbnailFile)

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        videoOwner: req.user._id
    })


    return res
    .status(200)
    .json(
        new ApiResponse(200,video, "Video Uploaded Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params.id
    if (!videoId) {
        throw new ApiError(402,"Video Id missing")
    }
    const video = await Video.findById(
        videoId
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video Fetched Successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(402,"Video Id missing")
    }
    const videoLocalPath = req.files?.video?.[0]?.path
    if (!videoLocalPath) {
        throw new ApiError(400, "New video file is required")
    }
    const uploadedVideo = await uploadOnCloudinary(videoLocalPath)
    if (!uploadedVideo || !uploadedVideo.url) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                videoFile : uploadedVideo.url
            }
        }, {new:true}
    ).select("-password")
    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedVideo,"Video Updated Successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError("Video Id required")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    await deleteFromCloudinary(video.videoFile)
    await Video.findByIdAndDelete(
        videoId,
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Video Deleted Successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(409,"Video Id missing")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video not found")
    }
    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave: false})

    const statusMessage = video.isPublished? "Video Published Successfully" : "Video UnPublished Successfully"
    return res
    .status(200)
    .json(
        new ApiResponse(200,video,statusMessage)
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}