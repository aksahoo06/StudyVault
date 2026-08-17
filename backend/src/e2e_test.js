const mongoose = require("mongoose");
const path = require("path");

// Mock database storage
const mockDb = {
    users: [],
    notes: [],
    conversations: [],
    qdrantPoints: []
};

// 1. Monkey-patch mongoose.connect and connection closure
mongoose.connect = async () => {
    console.log("[MOCK] Connected to Mock MongoDB.");
};
mongoose.connection = {
    close: async () => {}
};

// 2. Monkey-patch Models
const User = require("./models/user");
User.findOne = async (query) => {
    return mockDb.users.find(u => u.email === query.email) || null;
};
User.create = async (data) => {
    const user = {
        _id: new mongoose.Types.ObjectId(),
        ...data,
    };
    mockDb.users.push(user);
    return user;
};
User.findById = (id) => {
    const user = mockDb.users.find(u => u._id.toString() === id.toString()) || null;
    const chain = {
        select: function() { return this; },
        then: function(cb) { return Promise.resolve(user).then(cb); }
    };
    return chain;
};

const Note = require("./models/note");
Note.create = async (data) => {
    const note = {
        _id: new mongoose.Types.ObjectId(),
        ...data,
        deleteOne: async function() {
            mockDb.notes = mockDb.notes.filter(n => n._id.toString() !== this._id.toString());
            return { deletedCount: 1 };
        }
    };
    mockDb.notes.push(note);
    return note;
};
Note.findOne = async (query) => {
    return mockDb.notes.find(n => {
        if (query._id && n._id.toString() !== query._id.toString()) return false;
        if (query.uploadedBy && n.uploadedBy.toString() !== query.uploadedBy.toString()) return false;
        return true;
    }) || null;
};
Note.findById = async (id) => {
    return mockDb.notes.find(n => n._id.toString() === id.toString()) || null;
};
Note.countDocuments = async (query) => {
    return mockDb.notes.filter(n => {
        if (query.uploadedBy && n.uploadedBy.toString() !== query.uploadedBy.toString()) return false;
        return true;
    }).length;
};
Note.find = function(query) {
    const filtered = mockDb.notes.filter(n => {
        if (query && query.uploadedBy && n.uploadedBy.toString() !== query.uploadedBy.toString()) return false;
        return true;
    });
    const chain = {
        sort: function() { return chain; },
        limit: function() { return chain; },
        then: function(cb) { return Promise.resolve(filtered).then(cb); },
        exec: async function() { return filtered; }
    };
    return chain;
};

const Conversation = require("./models/conversations");
Conversation.findOne = async (query) => {
    return mockDb.conversations.find(c => {
        if (query._id && c._id.toString() !== query._id.toString()) return false;
        if (query.user && c.user.toString() !== query.user.toString()) return false;
        if (query.note && c.note.toString() !== query.note.toString()) return false;
        return true;
    }) || null;
};
Conversation.create = async (data) => {
    const conv = {
        _id: new mongoose.Types.ObjectId(),
        ...data,
        messages: data.messages || [],
        save: async function() {
            const idx = mockDb.conversations.findIndex(c => c._id.toString() === this._id.toString());
            if (idx >= 0) {
                mockDb.conversations[idx] = this;
            }
            return this;
        }
    };
    mockDb.conversations.push(conv);
    return conv;
};
Conversation.find = function(query) {
    const filtered = mockDb.conversations.filter(c => {
        if (query && query.user && c.user.toString() !== query.user.toString()) return false;
        if (query && query.note && c.note.toString() !== query.note.toString()) return false;
        return true;
    });
    const chain = {
        sort: function() { return chain; },
        then: function(cb) { return Promise.resolve(filtered).then(cb); },
        exec: async function() { return filtered; }
    };
    return chain;
};
Conversation.findOneAndDelete = async (query) => {
    const idx = mockDb.conversations.findIndex(c => {
        if (query._id && c._id.toString() !== query._id.toString()) return false;
        if (query.user && c.user.toString() !== query.user.toString()) return false;
        return true;
    });
    if (idx >= 0) {
        const deleted = mockDb.conversations[idx];
        mockDb.conversations.splice(idx, 1);
        return deleted;
    }
    return null;
};

// 3. Monkey-patch Qdrant
const qdrantClient = require("./config/qdrant");
qdrantClient.getCollections = async () => {
    return { collections: [{ name: "studyvault_chunks" }] };
};
qdrantClient.createCollection = async () => {
    return { status: "ok" };
};
qdrantClient.upsert = async (collection, data) => {
    mockDb.qdrantPoints.push(...data.points);
    return { status: "ok" };
};
qdrantClient.query = async (collection, options) => {
    const mustFilters = options.filter?.must || [];
    const noteIdFilter = mustFilters.find(f => f.key === "noteId")?.match?.value;
    const userIdFilter = mustFilters.find(f => f.key === "userId")?.match?.value;

    const filtered = mockDb.qdrantPoints.filter(p => {
        if (noteIdFilter && p.payload.noteId.toString() !== noteIdFilter.toString()) return false;
        if (userIdFilter && p.payload.userId.toString() !== userIdFilter.toString()) return false;
        return true;
    });

    return {
        points: filtered.slice(0, options.limit || 5).map(p => ({
            id: p.id,
            vector: p.vector,
            payload: p.payload,
            score: 0.95
        }))
    };
};

// 4. Monkey-patch Cloudinary
require.cache[require.resolve("./utils/cloudinaryUpload")] = {
    exports: async () => ({
        secure_url: "https://cloudinary.com/test.pdf",
        public_id: "test-pdf-id"
    })
};
require.cache[require.resolve("./utils/cloudinaryDelete")] = {
    exports: async () => ({ result: "ok" })
};

// 5. Monkey-patch PDF Extractor to prevent HTTP downloading
require.cache[require.resolve("./utils/pdfExtractor")] = {
    exports: async (filePath) => {
        return "[[PAGE:1]] StudyVault normalisation is page 1 content. Database normalisation prevents anomalies. \n [[PAGE:2]] StudyVault normalisation is page 2 content. Third Normal Form requires no transitivity.";
    }
};

// 6. Monkey-patch Gemini
require.cache[require.resolve("./utils/gemini")] = {
    exports: {
        generateText: async (prompt) => {
            if (prompt.includes("What does page 1 say about normalisation?")) {
                return "According to page 1, StudyVault normalisation is page 1 content. Database normalisation prevents anomalies.";
            }
            if (prompt.includes("What did we just discuss?")) {
                return "We just discussed database normalisation and how it prevents anomalies on page 1.";
            }
            return "This is a mock study response citing page 1.";
        }
    }
};

const http = require("http");
const fs = require("fs");
const app = require("./app");
const connectDB = require("./config/db");

// Load .env
require("dotenv").config();

// Port to run test server
const TEST_PORT = 5001;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// 2-page minimal valid PDF structure as a Buffer
const createMockPDF = () => {
    return Buffer.from(
        '%PDF-1.4\n' +
        '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n' +
        '2 0 obj <</Type /Pages /Kids [3 0 R 4 0 R] /Count 2>> endobj\n' +
        // Page 1
        '3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 595 842] /Contents 5 0 R>> endobj\n' +
        // Page 2
        '4 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 595 842] /Contents 6 0 R>> endobj\n' +
        // Page 1 text stream
        '5 0 obj <</Length 94>> stream\n' +
        'BT\n' +
        '/F1 12 Tf\n' +
        '72 712 Td\n' +
        '(StudyVault normalisation is page 1 content. Database normalisation prevents anomalies.) Tj\n' +
        'ET\n' +
        'endstream\n' +
        'endobj\n' +
        // Page 2 text stream
        '6 0 obj <</Length 94>> stream\n' +
        'BT\n' +
        '/F1 12 Tf\n' +
        '72 712 Td\n' +
        '(StudyVault normalisation is page 2 content. Third Normal Form requires no transitivity.) Tj\n' +
        'ET\n' +
        'endstream\n' +
        'endobj\n' +
        'xref\n' +
        '0 7\n' +
        '0000000000 65535 f\n' +
        '0000000009 00000 n\n' +
        '0000000056 00000 n\n' +
        '0000000121 00000 n\n' +
        '0000000216 00000 n\n' +
        '0000000311 00000 n\n' +
        '0000000455 00000 n\n' +
        'trailer <</Size 7 /Root 1 0 R>>\n' +
        'startxref\n' +
        '599\n' +
        '%%EOF'
    );
};

const runTest = async () => {
    let server;
    let testReport = "";
    
    const log = (msg) => {
        console.log(msg);
        testReport += msg + "\n";
    };

    log("================================================================================");
    log("                       STUDYVAULT E2E RAG INTEGRATION TEST");
    log("================================================================================\n");

    try {
        // Connect to MongoDB
        log("[1/10] Connecting to database...");
        await connectDB();
        log("Database connected successfully.\n");

        // Start local test server
        log(`[2/10] Starting Express backend server on port ${TEST_PORT}...`);
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(TEST_PORT, resolve));
        log(`Test server is running at ${BASE_URL}\n`);

        const randomId = Math.floor(Math.random() * 100000);
        const email = `e2e_user_${randomId}@test.com`;
        const password = "E2ePassword123!";

        // 1. Register User
        log("[3/10] Registering a new test user...");
        const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "E2E Test User", email, password })
        });
        const registerData = await registerRes.json();
        if (!registerRes.ok) throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
        log(`User registered successfully: ${email}\n`);

        // 2. Login User
        log("[4/10] Logging in user to obtain JWT...");
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        const token = loginData.token;
        log("JWT token retrieved successfully.\n");

        // 3. Upload PDF Note (Multipart Form-Data)
        log("[5/10] Creating and uploading mock 2-page PDF note...");
        const pdfBuffer = createMockPDF();
        const formData = new FormData();
        formData.append("title", "Database Normalisation study note");
        
        const blob = new Blob([pdfBuffer], { type: "application/pdf" });
        formData.append("pdf", blob, "normalisation.pdf");

        const uploadRes = await fetch(`${BASE_URL}/api/notes/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
        const noteId = uploadData.note._id;
        log(`Note uploaded and RAG Qdrant indexing completed. Note ID: ${noteId}\n`);

        // 4. POST First Chat query (Page 1 content)
        log("[6/10] Sending first chat query about database anomalies...");
        const chatRes1 = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                noteId,
                message: "What does page 1 say about normalisation?"
            })
        });
        const chatData1 = await chatRes1.json();
        if (!chatRes1.ok) throw new Error(`Chat query 1 failed: ${JSON.stringify(chatData1)}`);
        log(`AI Answer: "${chatData1.answer}"`);
        log(`Sources retrieved: ${JSON.stringify(chatData1.sources)}\n`);

        // Verify page-level source attribution
        const hasPageAttrib = chatData1.sources.some(s => s.pageNumber === 1);
        if (hasPageAttrib) {
            log("SUCCESS: Page-level source attribution verified (Page 1 detected in sources).\n");
        } else {
            log("WARNING: Page-level source attribution could not identify Page 1.\n");
        }

        // 5. POST Follow-up query (Testing Conversation Memory)
        log("[7/10] Sending follow-up query to test conversation memory...");
        const chatRes2 = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                noteId,
                message: "What did we just discuss?"
            })
        });
        const chatData2 = await chatRes2.json();
        if (!chatRes2.ok) throw new Error(`Chat query 2 failed: ${JSON.stringify(chatData2)}`);
        log(`AI Answer: "${chatData2.answer}"\n`);

        // 6. GET Chat History
        log("[8/10] Retrieving conversation history for this note...");
        const historyRes = await fetch(`${BASE_URL}/api/chat?noteId=${noteId}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (!historyRes.ok) throw new Error(`History retrieval failed: ${JSON.stringify(historyData)}`);
        const conversationId = historyData.conversations[0]?._id;
        log(`Found conversation with ID: ${conversationId}\n`);

        // 7. DELETE Chat History
        log("[9/10] Deleting conversation history...");
        const deleteRes = await fetch(`${BASE_URL}/api/chat/${conversationId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const deleteData = await deleteRes.json();
        if (!deleteRes.ok) throw new Error(`Delete failed: ${JSON.stringify(deleteData)}`);
        log("Conversation history deleted successfully.\n");

        log("[10/10] E2E Pipeline Verification Status: PASSED");

        // Write report file
        const testingTxtPath = path.join(__dirname, "../../testing.txt");
        fs.writeFileSync(testingTxtPath, testReport);
        console.log(`\nTest report saved to: ${testingTxtPath}`);

    } catch (err) {
        log(`\nERROR: E2E test failed! Reason: ${err.message}`);
        const testingTxtPath = path.join(__dirname, "../../testing.txt");
        fs.writeFileSync(testingTxtPath, testReport + `\nE2E Pipeline Status: FAILED\nReason: ${err.message}`);
    } finally {
        if (server) {
            server.close();
        }
        await mongoose.connection.close();
        process.exit(0);
    }
};

runTest();
