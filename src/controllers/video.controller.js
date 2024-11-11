import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "asc", userId } = req.query
    
    if (!userId) {
        throw new ApiError(400, "user id required");
    }
    const video = await Video.aggregate([
        {
            $match : {
                $or : [
                    {title :{ $regex : query, $options : "i"} },
                    {description :{ $regex : query, $options : "i"} },
                ],
                videoOwner : new mongoose.Types.ObjectId(userId) 
            }
        },
        {
            $sort  : { [sortBy] : sortType === "asc"? 1 : -1}
        },
        {
            $skip  :(page - 1)*limit
        },
        {
            $limit: parseInt(limit)
        },  
        {
            $project: {
                title: 1,
                description: 1,
                createdAt: 1,
            }
        }
    ])

    if (!video.length) {
        throw new ApiError(404, "No videos found for this user with such title or description")
    }

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

    const videoLocalPath = req.files?.videoFile[0]?.path
    if (!videoLocalPath) {
        throw new ApiError("Video is required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError("Video is required")
    }
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        duration: videoFile.duration,
        videoOwner: req.user._id
    })
    console.log("Video id: ",video._id);

    return res
    .status(200)
    .json(
        new ApiResponse(200,video, "Video Uploaded Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
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

    const videoLocalPath = req.files?.videoFile[0]?.path
    console.log("videoLocalPath: ",videoLocalPath);
    if (!videoLocalPath) {
        throw new ApiError(400, "New video file is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    console.log("thumbnailLocalPath: ",thumbnailLocalPath);
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "New thumbnail is required")
    }
    const existingVideo = await Video.findById(videoId)
    if (!existingVideo) {
        throw new ApiError(404, "Video not found");
    }
    const existingVideoUrl = existingVideo.videoFile.url
    const videoPublicId = existingVideoUrl?.split("/").pop().split(".")[0]
    await deleteFromCloudinary(videoPublicId)

    const existingThumbnailUrl = existingVideo.thumbnail?.url
    const thumbnailPublicId = existingThumbnailUrl?.split("/").pop().split(".")[0]
    await deleteFromCloudinary(thumbnailPublicId)

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)

    console.log("uploadedVideo: ",uploadedVideo);
    console.log("thumbnailFile: ",thumbnailFile);
    if (!uploadedVideo) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                videoFile : uploadedVideo.url,
                thumbnail : thumbnailFile.url
            }
        }, 
        {new:true}
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
    const videoUrl = video.videoFile?.url
    const videoPublicID = videoUrl?.split("/").pop().split(".")[0]
    await deleteFromCloudinary(videoPublicID)
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

    const statusMessage = video.isPublished? "Video Published Successfully":"Video UnPublished Successfully"
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