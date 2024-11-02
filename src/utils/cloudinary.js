import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUDNAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) 
        return null;
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
        })
        //    When uploaded successfully, it will unlink the file
        fs.unlinkSync(localFilePath)
        return response
    }
    catch(error){
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async (publicId) => {
    try{
        if(!publicId) 
        return null;
        const response = await cloudinary.uploader.destroy(publicId , {
            resource_type: "auto"
        })
        return response
    }
    catch(error){
        return null
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}