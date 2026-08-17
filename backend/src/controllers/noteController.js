
const uploadPdfToCloudinary = require("../utils/cloudinaryUpload");
const deletePdfFromCloudinary = require("../utils/cloudinaryDelete");
const Note = require("../models/note");
const fs = require("fs");
const path = require("path");
const extractTextFromPDF =
  require("../utils/pdfExtractor");
const { ingestAndStoreText } = require("../../services/ai/ingestion_service");

const uploadNote = async (req, res) => {
    let uploadResult = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a PDF",
            });
        }

        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Title is required",
            });
        }

        // Save local copy of PDF file to backend/uploads
        const localFilename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
        const uploadDir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadDir, localFilename), req.file.buffer);
        const localUrl = `${req.protocol}://${req.get("host")}/uploads/${localFilename}`;

        // Upload PDF directly from buffer to Cloudinary (as backup/metadata)
        try {
            uploadResult = await uploadPdfToCloudinary(req.file.buffer);
        } catch (cldErr) {
            console.error("Warning: Cloudinary upload failed:", cldErr.message);
            uploadResult = { secure_url: localUrl, public_id: "local" };
        }

        // Extract text directly from the uploaded buffer (saves network request and works offline/safely)
        const extractedText = await extractTextFromPDF(req.file.buffer);

        // Save note in MongoDB with local URL to bypass restricted Cloudinary delivery rules
        const note = await Note.create({
            title,
            pdfUrl: localUrl,
            cloudinaryPublicId: uploadResult.public_id,
            extractedText,
            uploadedBy: req.user._id,
        });

        // Index note chunks in Qdrant for RAG
        try {
            await ingestAndStoreText({
                noteId: note._id,
                userId: req.user._id,
                text: extractedText
            });
        } catch (ragError) {
            console.error("Warning: Failed to index note chunks in Qdrant:", ragError.message);
        }

        return res.status(201).json({
            message: "PDF uploaded successfully",
            note,
        });

    } catch (error) {
        // Cleanup Cloudinary file if it was uploaded but saving to DB or text extraction failed
        if (uploadResult && uploadResult.public_id) {
            try {
                const resourceType = uploadResult.secure_url && uploadResult.secure_url.includes("/raw/") ? "raw" : "image";
                await deletePdfFromCloudinary(uploadResult.public_id, resourceType);
            } catch (err) {
                console.error("Failed to clean up Cloudinary file:", err.message);
            }
        }
        return res.status(500).json({
            message: error.message,
        });
    }
};

const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      uploadedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(notes);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSingleNote = async (req, res) => {
  try {
    const note = await Note.findById(
        req.params.id
    );

    if (!note) {
        return res.status(404).json({
            message: "Note not found",
      });
    }

    if (note.uploadedBy.toString() !==req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.status(200).json(note);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: "Note not found",
            });
        }

        if (
            note.uploadedBy.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        // Delete PDF file (local or Cloudinary)
        try {
            if (note.cloudinaryPublicId === "local" || note.pdfUrl.includes("/uploads/")) {
                const filename = note.pdfUrl.substring(note.pdfUrl.lastIndexOf("/") + 1);
                const localPath = path.join(__dirname, "../../uploads", filename);
                if (fs.existsSync(localPath)) {
                    await fs.promises.unlink(localPath);
                }
            } else {
                // Delete PDF from Cloudinary
                const resourceType = note.pdfUrl && note.pdfUrl.includes("/raw/") ? "raw" : "image";
                await deletePdfFromCloudinary(
                    note.cloudinaryPublicId,
                    resourceType
                );
            }
        } catch (storageError) {
            console.error("Storage deletion failed, proceeding with DB deletion:", storageError.message);
        }

        // Delete MongoDB document
        await note.deleteOne();

        return res.status(200).json({
            message: "Note deleted successfully",
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
module.exports= {uploadNote,getNotes,getSingleNote,deleteNote};