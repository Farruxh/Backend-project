import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId, subscriberId} = req.params

    console.log("Channel ID:", channelId);
    console.log("Subscriber ID:", subscriberId);

    if (!channelId || !subscriberId) {
        throw new ApiError(404, "channel and subscriber Id required")
    }

    const existedSubscribe = await Subscription.findOne({ channel : channelId, subscriber: subscriberId })

    if(existedSubscribe) {
        console.log("Existing subscribe: ",existedSubscribe.id);
        await Subscription.deleteOne({ _id:existedSubscribe.id }) 
        return res
        .status(201)
        .json(
            new ApiResponse(201,{},"Unsubscribed Successfully")
        )
    }
    else{
        const newSubscribe = await Subscription.create({ channel : channelId, subscriber: subscriberId })
        const sub_id = newSubscribe._id
        console.log("New Subscribe: ",sub_id)
        return res
        .status(201)
        .json(
            new ApiResponse(201,newSubscribe,"Subscribed Successfully")
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(404, "channel Id required")
    }

    const channelSubscriber = await Subscription.find({channel:channelId})

    return res
        .status(201)
        .json(
            new ApiResponse(201,channelSubscriber,"Subscribed Successfully")
        )
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(404, "subscriber Id required")
    }

    const channelSubscribed = await Subscription.find({subscriber:subscriberId})

    return res
        .status(201)
        .json(
            new ApiResponse(201,channelSubscribed,"channel subscribed by user fetched Successfully")
        )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}