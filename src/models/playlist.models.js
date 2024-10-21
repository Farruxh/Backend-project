import mongoose from "mongoose";
const playlistSchema = new mongoose.Schema(
    {
      videos:[
        {
            type: mongoose.Types.ObjectId,
            ref: "Video"
        }
    ],  
      id:{
        type: String,
        required: true
      },
      name:{
        type: "String",
        required: true
      },
      description:{
        type: "String",
        required: true
      },
      owner:{
        type: mongoose.Types.ObjectId,
        ref: "User"
      }
    },
    {timestamps: true}
)
export const Playlist = mongoose.model("Playlist",playlistSchema)