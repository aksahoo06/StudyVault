# StudyVault — AI-Powered Learning Platform

StudyVault is a full-stack, AI-powered learning platform that allows students to upload PDF study materials and transform them into interactive learning resources. Built on a robust MERN (MongoDB, Express, React, Node) architecture, it implements a custom **Retrieval-Augmented Generation (RAG)** pipeline, native embedding generation, and persistent vector search to deliver contextual learning tools.

---

## 🚀 Core Technology Stack

- **Frontend:** React (Vite, TailwindCSS v4, React Router v7)
- **Backend:** Node.js + Express.js
- **Primary Database:** MongoDB Atlas + Mongoose (for user authentication, PDF metadata, flashcards, quizzes, and persistent chat history)
- **Vector Database:** [Qdrant](https://qdrant.tech/) (storing vector embeddings, chunk text, page references, and performing similarity searches)
- **Authentication:** JSON Web Tokens (JWT) + password hashing via `bcryptjs`
- **PDF Management:** `multer` (configured for in-memory uploads)
- **PDF Storage:** Cloudinary (for persistent remote document hosting)
- **Large Language Model (LLM):** Google Gemini API (`gemini-2.5-flash` model using `@google/generative-ai`)
- **Embedding Model:** Google Gemini API `text-embedding-004` (called directly from the Node.js backend using the `@google/generative-ai` SDK, set to output 384 dimensions to optimize storage and query speed)
- **RAG Pipeline:** Custom manual implementation (built from scratch, bypassing frameworks like LangChain or LlamaIndex to ensure full control over data chunking, embeddings, storage, retrieval, and prompt injection defense)

---

## 🛠️ Detailed Architecture & System Flows

### 1. Ingestion Pipeline (PDF Upload & Processing)

When a user uploads a study material (PDF), the data flows as follows:

```
[User App Interface]
        │  (Upload PDF via React client)
        ▼
[Express Backend]
        │  (1. Multer intercepts request & buffers file in RAM)
        │  (2. Cloudinary Upload: pipes buffer to Cloudinary cloud storage)
        ▼
[Cloudinary PDF URL]
        │
        ▼  (3. Extraction: backend downloads PDF stream via fetch)
[pdf-parse + Custom Page Renderer]
        │  (4. Parses PDF & injects page boundaries: "[[PAGE:N]]" into extracted text)
        ├─────────────────────────────┐
        ▼                             ▼
[MongoDB note metadata record]   [RAG Ingestion Service]
                                      │  (5. Segment text page-by-page)
                                      │  (6. Chunk text page-by-page: 500-word limit, 50-word overlap)
                                      ▼
                             [Gemini API (Embedding Model)]
                                      │  (7. Generate 384-dimension vector embeddings using text-embedding-004)
                                      ▼
                                 [Qdrant DB]
                                         (8. Upsert chunks, vectors, and metadata:
                                             noteId, userId, chunkIndex, pageNumber, text)
```

### 2. Retrieval & Generation Pipeline (RAG Chat)

When a user asks a question about their PDF, the system executes a grounded, context-aware query response loop:

```
                  [User submits query in chat]
                               │
                               ▼
                 [Gemini API (Embedding Model)]
                               │  (Generates query vector embedding)
                               ▼
                          [Qdrant DB]
                               │  (Performs similarity search with Cosine distance)
                               │  (Applies strict filters: userId = X AND noteId = Y)
                               ▼
               [Top-K (limit=5) Relevant Chunks]
                               │
                               ▼
                  [Prompt Construction Service]
                               │  (Isolates context using XML tags to prevent injections)
                               │  (Appends last 10 messages of conversation history)
                               ▼
                   [Google Gemini API]
                               │  (Formulates answer based strictly on document context)
                               ▼
                  [Grounded Response + Sources]
                                 - Answer citing page citations
                                 - Sources: Note ID, chunk index, page number, similarity score
```

---

## ✨ Key Features

### 🔐 Secure Authentication & Multi-Tenancy
- Register and login endpoints using password hashing via `bcryptjs`.
- Session state preserved using HTTP Authorization headers (JWT).
- **Protected Vector Space:** Vector database searches in Qdrant are isolated per user via strict metadata filtering on `userId` and `noteId` keys.

### 📁 Cloud-Based Document Library
- Eliminates dependencies on local disk space. Uploads are strictly memory-buffered and piped directly to Cloudinary.
- Safe-cleanup hooks: If text extraction or database record updates fail post-upload, the uploaded resource is immediately deleted from Cloudinary.
- Extract page markers during parsing to reconstruct exactly which page a segment of text belongs to.

### 📚 AI Study Resources
- **AI Flashcards:** Instantly generates sets of 10 interactive question/answer study cards based on the document's content.
- **AI Quizzes:** Generates customized 5-question multiple-choice quizzes (MCQs). Users take the quizzes, receive scoring reports, and can review or retake tests.
- **AI Summary:** Auto-formats clean, readable Markdown summaries of notes complete with bullet lists and headers.

### 💬 Grounded RAG Chat
- Interactive conversation thread showing exact page citations (e.g., `Operating Systems.pdf — Page 42`).
- Conversational history is stored and loaded from MongoDB, passing the last 10 messages to Gemini for conversational context.

### 🛡️ RAG Prompt Injection & Jailbreak Defense
- **Jailbreak Keyword Filter:** The Express controller detects common prompt injection keywords (e.g., "ignore previous instructions", "jailbreak") at the request level.
- **XML Context Isolation:** Untrusted document contexts and user queries are wrapped inside strict `<document_context>` and `<user_question>` tags. 
- **Meta-Instruction Constraints:** Gemini is explicitly commanded to treat all content inside the document context as untrusted data, ignoring any commands or overrides contained within it.

---

## 📂 Project Directory Structure

```
StudyVault/
├── backend/
│   ├── src/
│   │   ├── config/              # MongoDB & Qdrant clients configuration
│   │   ├── controllers/         # Note, AI, Chat, Auth controllers
│   │   ├── middleware/          # JWT protection, multer memory upload
│   │   ├── models/              # Mongoose schemas (User, Note, Flashcard, Test, Conversation)
│   │   ├── routes/              # Express API endpoints
│   │   ├── utils/               # Cloudinary handlers, pdf-parse extractor, Gemini client
│   │   ├── app.js               # Express application initialization
│   │   └── server.js            # Server entry point
│   ├── services/
│   │   └── ai/                  # RAG Ingestion, Retrieval, Qdrant, & Chat services
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components (AppLayout, Button, EmptyState, etc.)
│   │   ├── pages/               # Dashboard, Login, Library, and Study Workspace panels
│   │   └── services/            # Axios API config
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
└── package.json                 # Project root package configuration
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB database)
- Qdrant Cloud account (or local Qdrant instance)
- Cloudinary developer account
- Google Gemini API Key

### 1. Configure Backend Environment
Navigate to the `backend/` directory, install packages, and create a `.env` file:
```bash
cd backend
npm install
```
Add the following keys to your `backend/.env` file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=your_qdrant_instance_url
QDRANT_API_KEY=your_qdrant_api_key
```
Start the backend development server:
```bash
npm run dev
```

### 2. Run Frontend Application
Navigate to the `frontend/` directory, install dependencies, and start the Vite dev server:
```bash
cd ../frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.
