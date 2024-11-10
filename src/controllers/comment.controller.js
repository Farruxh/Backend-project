import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new ApiError(404,"VideoId required")
    }

    const videoComments = await Comment.aggregate([
        {
            $match: {video:videoId}
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "video",
                localField: "_id",
                as: "comment_detail",
            }
        },
        {
            $unwind: "$comment_detail"
        },
        {
            $skip: (page-1)/limit
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                "comment_detail.id":1,
                "comment_detail.content":1,
                "comment_detail.video":1,
                "comment_detail.owner":1,
            }
        }
    ])

    if (!videoComments.length) {
        throw new ApiError(404,"This video has no comments")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201,videoComments,"Fetched all comments for a video successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    if(!videoId){
        throw new ApiError(404,"VideoId required")
    }

    else if(!content){
        throw new ApiError(404,"Content required")
    }

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,comment,"Added comment to a video successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if(!commentId || !content){
        throw new ApiError(404,"CommentId and content are required")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,{
            $set: { content : content }
        },
        {new:true}
    )

    return res
    .status(201)
    .json(
        new ApiResponse(201,updatedComment,"Comment Updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(404,"CommentId required")
    }

    await Comment.findByIdAndDelete(commentId)
    return res
    .status(201)
    .json(
        new ApiResponse(201,{},"Comment Updated successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }