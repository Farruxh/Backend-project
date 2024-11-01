import mongoose, { isValidObjectId } from "mongoose"
import {Tweets} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const tweetContent = req.body

    if (!tweetId || !tweetContent) {
        throw new ApiError(404, "tweetId and content required")
    }

    const tweet = await Tweets.Create({
        id: tweetId,
        content: tweetContent,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,tweet, "Tweet created Successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params

    if (!userId) {
        throw new ApiError(404, "User Id required")
    }

    const userTweets = await Tweets.aggregate([
        {
            $match: {
                owner: userId
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "user",
                localField: "_id",
                as: "tweet_detail",
            }   
        },
        {
            $unwind: {
                $tweet_detail
            }
        },
        {
            $project: {
                "tweet_detail.id": 1,
                "tweet_detail.content": 1,
                "tweet_detail.owner": 1
            }
        }
    ])

    return res
    .status(201)
    .json(
        new ApiResponse(201,userTweets, "Fetched user Tweets Successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const updatedContent = req.body

    if (!tweetId || !updatedContent) {
        throw new ApiError(404, "tweetId and new content required")
    }

    const updatedTweet = await Tweets.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: updatedContent
            }   
        },
        { new: true }
    )

    return res
    .status(201)
    .json(
        new ApiResponse(201,updatedTweet, "Tweet updated Successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if (!tweetId) {
        throw new ApiError(404, "tweetId required")
    }

    await findByIdAndDelete(tweetId)

    return res
    .status(201)
    .json(
        new ApiResponse(201, {}, "Tweet deleted Successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}