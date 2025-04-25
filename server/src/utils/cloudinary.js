import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import { unlink } from "fs/promises";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnClodinary = async (localFilePath, folder = "uploads") => {
  const normalizedPath = path.normalize(localFilePath).replace(/\\/g, "/");
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(normalizedPath, {
      folder: folder,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    throw error;
  } finally {
    try {
      await unlink(localFilePath);
    } catch (error) {
      console.error("Error deleting local file:", error.message);
    }
  }
};
