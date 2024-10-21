import mongoose from "mongoose";
const tweetSchema = new mongoose.Schema(
    {  
      id:{
        type: String,
        required: true
      },
      content:{
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
export const Tweets = mongoose.model("Tweets",tweetSchema)