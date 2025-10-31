import {v2 as cloudinary} from 'cloudinary'
import { log } from 'console'
const connectCloudinary=async ()=>{
 cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
 })
 console.log('✅ Connected to Cloudinary')
 
 
}
export default connectCloudinary