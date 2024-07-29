import mongoose from "mongoose"
import {DB_NAME} from "../constant.js"

const connectDB = async ()=>{
    try{
        //Variable is used to hold the response of connection
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
    } catch(error){
        console.log("MongoDb connection error",error)
        process.exit(1)
    }
}

export default connectDB