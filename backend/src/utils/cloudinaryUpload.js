const cloudinary = require("../config/cloudinary.js");

const uploadPdfToCloudinary = async (fileInput) => {
    try {
        if (Buffer.isBuffer(fileInput)) {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "auto",
                        folder: "studyvault/notes",
                    },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary Stream Upload Error:", error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(fileInput);
            });
        } else {
            const result = await cloudinary.uploader.upload(fileInput, {
                resource_type: "auto",
                folder: "studyvault/notes",
            });
            return result;
        }
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);

        throw new Error("Failed to upload PDF to Cloudinary.");
    }
};

module.exports = uploadPdfToCloudinary;