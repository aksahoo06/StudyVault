const cloudinary = require("../config/cloudinary.js");

const deletePdfFromCloudinary = async (publicId, resourceType = "raw") => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        if (result.result !== "ok") {
            throw new Error("Cloudinary failed to delete the PDF.");
        }

        return result;
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);

        throw new Error("Failed to delete PDF from Cloudinary.");
    }
};

module.exports = deletePdfFromCloudinary;