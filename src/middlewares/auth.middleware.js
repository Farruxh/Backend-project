import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js"

export const verifyJWT = asyncHandler( async (req,res,next) =>{
     try {
          const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
     
          if(!token){
               throw new ApiError(401, "Unauthorized Request")
          }
     
          const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     
          const user = await User.findById(decodedToken._id).select("-password -refreshTokens")
     
          if(!user){
               throw new ApiError(401, "Invalid Access Token")
          }
     
          // not returning instead adding a new object in "req"
          req.user = user
          next()
     } catch (error) {
          throw new ApiError(401, error?.message || "Invalid access token")
     }
})