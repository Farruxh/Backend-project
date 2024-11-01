import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name || !description) {
        throw new ApiError(400, "Name and description is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating Playlist")
    }

    console.log("Playlist: ",playlist);
    return res
    .status(201)
    .json(
        new ApiResponse(201,playlist,"Playlist created Successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    if (!userId) {
        throw new ApiError(400, "User Id is required")
    }

    const playlists = await Playlist.find({userId})

    if (!playlists) {
        throw new ApiError(404, "No playlists found for this user")
    }
    
    console.log("Fetched Playlists: ",playlists);

    return res
    .status(201)
    .json(
        new ApiResponse(201,playlists,"Playlists Fetched by Id Successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "No playlist found with this Id")
    }

    console.log("Fetched Playlist: ",playlist);

    return res
    .status(201)
    .json(
        new ApiResponse(201,playlist,"Playlist Fetched by Id Successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist and video Id required")
    }

    const videoLocalPath = req.files?.video[0]?.path

    const video = await uploadOnCloudinary(videoLocalPath)

    if (!video) {
        throw new ApiError(400, "Video is required")
    }

    const videoToPlaylist = await Playlist.findById(
        playlistId
    )

    Playlist.videos.push(videoId);
    await Playlist.save();
    console.log("Videos on playlist: ",videoToPlaylist);

    return res
    .status(201)
    .json(
        new ApiResponse(201,videoToPlaylist,"Playlist Fetched by Id Successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist and video Id required")
    }

    const removedVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull : {videos : videoId}
        },
        { new: true }
    )

    if (!removedVideo) {
        throw new ApiError(404, "Playlist not found or video not removed");
    }

    console.log("Removed video from playlist: ",removedVideo);

    return res
    .status(201)
    .json(
        new ApiResponse(201,{},"Playlist Fetched by Id Successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist Id required")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201,{},"Playlist deleted Successfully")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }

    const {name, description} = req.body

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(404, "Error: Playlist not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201,updatedPlaylist,"Playlist Updated Successfully")
    )
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}