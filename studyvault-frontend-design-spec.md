# StudyVault — Frontend Design Specification

A complete, implementation-ready design spec for an intermediate React developer (or an LLM coding assistant) to build the StudyVault frontend on top of the existing MERN + RAG backend.

---

## 1. Overall Design Direction

StudyVault should feel like **a well-organized personal study tool**, not an AI startup landing page. Think "a smart classmate built you a really tidy study app" — calm, legible, and fast to navigate. The AI features (chat, summaries, flashcards, quizzes) should feel like natural parts of a study workflow, not the star of a sci-fi UI.

Reference points: Notion's calm content areas, Linear's clean navigation chrome, and a simple flashcard app — combined, not competing.

**One sentence brief:** "A tidy, focused workspace that turns a PDF into something you can talk to, review, and be tested on."

---

## 2. Design Philosophy

- **Content first.** The PDF, the summary, the chat — these are the product. Chrome (nav, sidebars, buttons) stays quiet.
- **One accent color, used sparingly.** Everything else is neutral so the accent always means "primary action" or "AI-generated."
- **Predictable layout everywhere.** Every study page (Chat, Summary, Flashcards, Quiz) shares the same shell so users never feel lost.
- **Few states, clearly designed.** Loading, empty, and error states are treated as first-class screens, not afterthoughts — because AI generation takes a few seconds and users need to trust it's working.
- **No decoration without a job.** No gradients, no glassmorphism, no illustrations. Icons label actions; they don't fill space.

---

## 3. Color Palette

Use as Tailwind config `extend.colors`, so it's referenced by name (`bg-primary`, `text-ink`, etc.) instead of raw hex everywhere.

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#2F6FED` | Primary buttons, active nav item, links, focus rings |
| `primary-hover` | `#2558C7` | Button hover state |
| `accent` | `#0EA5A4` (teal) | AI-generated content markers (chat bubbles, "AI" badges, summary highlights) — used to visually distinguish "AI said this" from "you wrote this" |
| `background` | `#F8F9FB` | App background |
| `surface` | `#FFFFFF` | Cards, panels, modals |
| `border` | `#E4E7EC` | Card borders, dividers |
| `ink` | `#111827` | Primary text |
| `ink-muted` | `#6B7280` | Secondary text, timestamps, placeholders |
| `success` | `#16A34A` | Correct quiz answer, upload success |
| `danger` | `#DC2626` | Errors, delete actions, wrong quiz answer |
| `warning` | `#D97706` | Processing/pending states |

**Why blue + teal:** blue reads as trustworthy/academic (not flashy), and a single second accent (teal) gives you a cheap, consistent way to say "this came from AI" across chat, summaries, and flashcards without adding new colors per feature.

Avoid: purple/violet gradients (overused "AI product" cliché), pure black backgrounds, neon greens.

---

## 4. Typography

Two font roles, both easy to pull from Google Fonts / Tailwind defaults:

- **UI & headings:** `Inter` (or Tailwind's default `font-sans`) — clean, legible at small sizes, works for both headings and buttons.
- **Reading content (PDF summary, flashcard/quiz text):** also `Inter`, but increase line-height and size — no need for a second typeface family; a second face adds implementation overhead for little gain at this scale.

**Type scale (Tailwind classes):**

| Role | Class |
|---|---|
| Page title | `text-2xl font-semibold text-ink` |
| Section heading | `text-lg font-semibold text-ink` |
| Body text | `text-base text-ink leading-relaxed` |
| Secondary/meta text | `text-sm text-ink-muted` |
| Button label | `text-sm font-medium` |
| Reading content (summary body) | `text-base leading-7 text-ink` |

No display/serif font, no oversized hero type over 36px. Confidence comes from consistency, not scale.

---

## 5. Navigation Structure

**Two navigation contexts:**

1. **App shell nav** (Dashboard, Library, Profile) — left sidebar on desktop.
2. **Study workspace nav** (Document, Summary, Chat, Flashcards, Quiz) — a horizontal tab bar nested *inside* a single document's workspace, always showing which document is open.

```
Route map:
/                      → Landing
/login                 → Login
/register              → Register
/dashboard             → Dashboard
/library               → PDF Library
/library/upload        → Upload PDF (can also be a modal, see §7)
/document/:id          → Study Workspace (redirects to /document/:id/summary)
/document/:id/summary  → Summary tab
/document/:id/chat     → AI Chat tab
/document/:id/flashcards → Flashcards tab
/document/:id/quiz     → Quiz tab
/profile               → Profile / Settings
```

Implemented with React Router nested routes: `/document/:id` renders the workspace shell (doc title, tab bar) with an `<Outlet />` for each tab — a clean fit for basic React Router, no extra state libraries needed.

**Sidebar (desktop, app shell):** Logo, Dashboard, Library, Profile at bottom, logout at bottom. Fixed width `w-60`.

**Top bar (mobile):** Logo + hamburger icon that toggles a slide-over sidebar via `useState(isSidebarOpen)`.

---

## 6. Page-by-Page Design

### 6.1 Landing Page

**Purpose:** Explain the product in under 10 seconds and get the visitor to register.

**Layout (single column, max-width container, generous vertical spacing):**
1. **Hero** — Logo/nav bar with "Log in" / "Get Started" buttons top-right. Headline: "Turn your PDFs into an interactive study workspace." Subheadline: one line on chat/summary/flashcards/quiz. One primary CTA button ("Get Started — it's free"). A simple static screenshot-style mockup of the study workspace below (an image or a simplified illustrative card, not an animated demo).
2. **How it works** — 3 numbered steps in a horizontal row (stacks vertically on mobile): Upload → Ask & Review → Practice & Test. Each step: icon, short title, one-line description. Numbering is justified here since it's a real sequence.
3. **Core features** — 4-card grid (2×2 on tablet, 1 column mobile): AI Chat, Summaries, Flashcards, Quizzes. Each card: icon, title, 1-sentence description.
4. **Simple product preview** — one static image/mockup of the Study Workspace (Summary tab), captioned.
5. **Call to action** — centered heading + "Get Started" button.
6. **Footer** — logo, 2–3 links (About, Contact, Login), copyright line.

**Components used:** `Navbar` (marketing variant), `Button`, `Card`.
**Mobile behavior:** all sections stack to single column; hero image moves below text.
**No loading/error states** — this is a static page.

---

### 6.2 Login

**Layout:** Centered card (`max-w-md`) on the `background` color, logo above the card.

**Fields:** Email, Password. **Buttons:** "Log in" (primary, full width), text link "Don't have an account? Register".

**States:**
- **Loading:** button shows spinner + "Logging in…", disabled.
- **Error:** red inline text below the form ("Incorrect email or password.") — from failed API call.
- **Empty state:** N/A (form validation only — disable submit until both fields filled).

**Mobile:** card becomes full-width with side padding, no visual change otherwise.

---

### 6.3 Register

Same layout pattern as Login for consistency.

**Fields:** Name, Email, Password, Confirm Password.
**Button:** "Create account" (primary, full width). Link: "Already have an account? Log in".

**States:**
- **Loading:** button spinner, "Creating account…".
- **Error:** inline red text (e.g., "Email already in use.", "Passwords don't match." — validate client-side with `useState` before hitting the API for the match check).

---

### 6.4 Dashboard

**Purpose:** Land the user somewhere useful immediately after login — not a stats page, a "pick up where you left off" page.

**Layout:** Sidebar (desktop) + main content, `max-w-5xl` container, vertical sections:

1. **Welcome header** — "Welcome back, {name}" + document count next to it as plain text (e.g., "12 documents").
2. **Continue studying** — horizontal row (scrollable on mobile) of 1–3 `DocumentCard`s for the most recently opened documents, each with an "Open" button that routes to `/document/:id`.
3. **Quick actions** — a small row of 2 buttons: "Upload new PDF" (primary), "Browse library" (secondary).
4. **Recent activity** — simple list (not a table): "You generated flashcards for *Chapter 3 Notes* — 2 hours ago." Icon + text + relative timestamp, 5 items max.

**States:**
- **Empty (no documents yet):** replace "Continue studying" with an `EmptyState` component: icon, "No documents yet", "Upload your first PDF to get started" + primary "Upload PDF" button. Hide "Recent activity" entirely.
- **Loading:** `LoadingSkeleton` cards (3 gray rounded rectangles) while dashboard data fetches.
- **Error:** inline banner at top: "Couldn't load your dashboard. Retry" with a retry button.

**Mobile:** sidebar collapses to top bar + hamburger; sections stack full-width; "Continue studying" row becomes horizontally scrollable with snap.

---

### 6.5 Notes / PDF Library

**Purpose:** Browse, search, and manage all uploaded documents.

**Layout:** Sidebar + main content.
- Top row: page title "Your Library", search input (right-aligned), "Upload PDF" primary button.
- Below: responsive grid of `DocumentCard`s (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`).

**DocumentCard contents:** file icon, PDF name (truncated with `line-clamp-1`), upload date, page count (if available from backend), "Open" primary button, a "⋯" menu button (opens a small dropdown: Rename, Delete) — implemented as `useState(openMenuId)`.

**States:**
- **Empty:** centered `EmptyState`: "No documents yet" + "Upload PDF" button.
- **No search results:** `EmptyState` variant: "No documents match '{query}'."
- **Loading:** grid of `LoadingSkeleton` cards.
- **Error:** inline error banner with retry.
- **Delete confirmation:** simple `Modal` — "Delete {filename}? This can't be undone." Cancel / Delete (danger) buttons.

**Search:** client-side filter via `useState(query)` over the fetched document list — no need for a debounced server search at this scale, but debounce with `useEffect` + `setTimeout` if the library can grow large.

**Mobile:** grid becomes 1 column; search input and upload button stack.

---

### 6.6 Upload PDF

Can be implemented as a dedicated route (`/library/upload`) or a `Modal` triggered from Dashboard/Library — **recommend a Modal** for a lighter flow, since it avoids a full context switch.

**Layout:** Modal with:
- `UploadBox` — a dashed-border drop zone (`border-2 border-dashed border-border rounded-lg`) with "Drag & drop a PDF, or click to browse" text and a hidden `<input type="file">`. Basic drag events (`onDragOver`, `onDrop`) are standard DOM events, no library needed.
- Selected file preview: file name + size + a small "×" remove button.
- "Upload" primary button (disabled until a file is selected).

**States:**
- **Uploading:** progress bar (`ProgressBar` component, driven by axios `onUploadProgress`) + "Uploading… 42%".
- **Processing:** after upload completes, backend needs to extract text/generate embeddings. Show a distinct state: spinner + "Processing your document… this may take a minute." Poll a status endpoint every few seconds with `useEffect` + `setInterval`, or simply redirect to the document workspace which itself shows a processing state (see §7).
- **Error:** "Upload failed. Please try again." with a Retry button. Separate message for wrong file type ("Only PDF files are supported.").
- **Success:** modal closes, redirect to `/document/:id`.

---

### 6.7 Single PDF / Study Workspace

Covered in detail in **Section 7** below.

---

### 6.8 AI Chat

**Purpose:** Ask questions about the currently open PDF, answered via RAG.

**Layout:** Full-height column within the workspace content area:
- Scrollable message list (`flex-1 overflow-y-auto`), oldest to newest, auto-scrolls to bottom on new message (`useRef` + `scrollIntoView` in a `useEffect` keyed on messages length).
- Fixed input bar at the bottom: text input + "Send" button (primary, icon-only on mobile).

**ChatMessage component:** two visual variants via a prop (`sender="user" | "ai"`):
- User messages: right-aligned, `bg-primary text-white` bubble.
- AI messages: left-aligned, `bg-surface border border-border` bubble with a small teal "AI" badge/icon to reinforce the accent-color convention from §3.

**States:**
- **Empty (no messages yet):** centered `EmptyState`: chat icon, "Ask anything about this document", 2–3 example prompt chips (clickable, populate the input) like "Summarize chapter 2" — clicking sets input text via `useState`.
- **Loading (AI response pending):** a `ChatMessage` in AI style showing a typing indicator (3 animated dots, plain CSS) instead of text.
- **Error:** an inline AI-style bubble in red-tinted style: "Something went wrong answering that. Try again." with a small retry icon.

**Interaction:** `useState([])` for message list, append user message immediately on send, `POST` to the chat/RAG endpoint, append AI response (or error) when it resolves. No streaming UI — full response rendered at once, per the "no advanced real-time systems" constraint.

**Mobile:** input bar stays fixed at bottom above the mobile tab bar; message bubbles max-width 85%.

---

### 6.9 Summary

**Purpose:** Present the AI-generated summary in a highly readable format.

**Layout:** Single reading column, `max-w-3xl mx-auto`, generous line-height.
- Page heading: "Summary" + a small "Regenerate" secondary button (icon + text) top-right.
- Content rendered from structured summary data (headings, paragraphs, bullet lists) — if the backend returns Markdown or structured JSON, render headings as `text-lg font-semibold mt-6`, paragraphs as `text-base leading-7`, bullets as a standard `<ul>` with `list-disc pl-5`.

**States:**
- **Empty (not generated yet):** `EmptyState`: "No summary yet" + "Generate Summary" primary button (triggers the AI generation call).
- **Loading (generating):** skeleton lines (`LoadingSkeleton` variant: 6–8 gray bars of varying width) + "Generating your summary…" caption.
- **Error:** "Couldn't generate a summary. Retry" button.

**Mobile:** column padding reduces, font size unchanged for readability.

---

### 6.10 Flashcards

**Purpose:** Review AI-generated Q&A flashcards one at a time.

**Layout:** Centered single `Flashcard` component (`max-w-lg mx-auto`), progress indicator above it, navigation controls below.

**Flashcard component:** a card showing the question; a "Show Answer" secondary button reveals the answer below it (`useState(isFlipped)` per current card — no 3D flip animation, just a simple show/hide with a light fade transition).

**Controls below card:** "← Previous" / "Next →" buttons (Next disabled on last card, or becomes "Finish"), and a `ProgressBar` or simple text "Card 4 of 12" above the card.

**Interaction:** `useState(currentIndex)`, `useState(isFlipped)` — reset `isFlipped` to false via `useEffect` or directly in the nav click handler whenever `currentIndex` changes.

**States:**
- **Empty:** "No flashcards yet" + "Generate Flashcards" primary button.
- **Loading (generating):** spinner + "Creating flashcards from your document…".
- **Error:** "Couldn't generate flashcards. Retry."
- **Finished (last card reviewed):** simple end screen: "You've reviewed all 12 cards" + "Restart" and "Back to library" buttons.

**Mobile:** card takes full width with side padding; buttons stack if needed but generally fit in a row.

---

### 6.11 Quiz

**Purpose:** Self-test with AI-generated multiple-choice questions.

**Layout:** Same centered single-question pattern as Flashcards for consistency.
- Progress indicator top ("Question 3 of 10" + `ProgressBar`).
- `QuizQuestion` component: question text + 4 option buttons stacked vertically, full width.
- Selecting an option highlights it (`bg-primary/10 border-primary`); after selection, correct/incorrect styling appears (`success`/`danger` border + a small check/x icon) — immediate feedback per question is simpler to implement than review-at-the-end and gives clearer state boundaries.
- "Next Question" primary button appears once an option is selected.

**Final screen:** score summary — "You scored 8/10" large text, a simple per-question breakdown list (question text + ✓/✗ icon), "Retake Quiz" and "Back to Library" buttons.

**Interaction:** `useState(currentIndex)`, `useState(selectedAnswers)` (object keyed by question index), `useState(score)` computed at the end from `selectedAnswers` vs correct answers — no need for a quiz "engine," just arrays and an index.

**States:**
- **Empty:** "No quiz yet" + "Generate Quiz" primary button.
- **Loading (generating):** spinner + "Building your quiz…".
- **Error:** "Couldn't generate a quiz. Retry."

**Mobile:** options stack full width (already default); everything else unchanged.

---

### 6.12 Profile / Settings

**Purpose:** Basic account management.

**Layout:** Sidebar + main content, single column `max-w-xl`.
- Section: "Account" — name, email (editable fields with a "Save changes" button).
- Section: "Password" — change password form (current, new, confirm).
- Section: "Danger zone" — "Log out" button (secondary), "Delete account" button (danger, opens confirmation `Modal`).

**States:**
- **Saving:** button shows spinner "Saving…".
- **Success:** small green inline confirmation text "Changes saved" that fades after a few seconds (`setTimeout` + `useState`).
- **Error:** inline red text under the relevant field.

**Mobile:** sections stack, full-width fields.

---

## 7. Detailed PDF Study Workspace

This is the core experience, so it gets its own shell, separate from the outer app sidebar.

**Structure:**

```
┌─────────────────────────────────────────────┐
│ ← Back to Library   |   Document Title.pdf   │  <- workspace header
├─────────────────────────────────────────────┤
│  Summary   Chat   Flashcards   Quiz          │  <- tab bar (active tab underlined, primary color)
├─────────────────────────────────────────────┤
│                                               │
│              [ active tab content ]          │
│                                               │
└─────────────────────────────────────────────┘
```

- **Header:** a back arrow + "Back to Library" link (routes to `/library`), and the document's file name as the page title. Keeps the user oriented on *which* document they're studying at all times, addressing the brief's core requirement.
- **Tab bar:** implemented with React Router `<NavLink>`s to the four nested routes (`/document/:id/summary`, `/chat`, `/flashcards`, `/quiz`), styled with `NavLink`'s `isActive` to underline/color the current tab. This is simpler than manual `useState` tab logic and keeps URLs shareable/bookmarkable.
- **Document access:** rather than a dedicated "Document" tab with a PDF viewer (which adds real implementation complexity — PDF.js, viewer controls), put a small "View original PDF" link/icon in the header that opens the Cloudinary-hosted PDF in a new browser tab. This satisfies "user should easily access the document" without requiring an embedded PDF viewer component. *(If an embedded viewer is genuinely wanted later, `<iframe src={cloudinaryUrl}>` is the basic-React-friendly option — call this out as a stretch goal, not v1.)*

**Processing state (whole workspace):** if the document is still being processed (embeddings not ready) when a user lands on `/document/:id`, show a full-panel state instead of tabs: spinner + "We're still processing this document. Summary, chat, and other tools will be ready shortly." Poll with `useEffect`/`setInterval` every 5s, or simply prompt "Refresh" — avoid WebSockets per the constraints.

**Mobile:** header stays as-is (back link + truncated title); tab bar becomes horizontally scrollable (`overflow-x-auto`) instead of a hamburger menu, since 4 tabs fit reasonably on most phone widths with smaller padding.

---

## 8. Reusable React Components

**Truly reusable (used across 3+ pages):**

| Component | Props (typical) | Used in |
|---|---|---|
| `Navbar` | `variant="marketing" \| "app"` | Landing, all app pages |
| `Sidebar` | `activeRoute` | Dashboard, Library, Profile |
| `Button` | `variant="primary" \| "secondary" \| "danger"`, `isLoading`, `disabled` | everywhere |
| `Card` | `children`, `className` | Dashboard, Library, Landing features |
| `DocumentCard` | `document`, `onOpen`, `onDelete` | Dashboard, Library |
| `UploadBox` | `onFileSelect` | Upload modal |
| `Modal` | `isOpen`, `onClose`, `title`, `children` | Delete confirmations, Upload |
| `ProgressBar` | `current`, `total` | Upload, Flashcards, Quiz |
| `LoadingSkeleton` | `variant="card" \| "line"`, `count` | Dashboard, Library, Summary, Chat |
| `EmptyState` | `icon`, `title`, `description`, `actionLabel`, `onAction` | Library, Dashboard, Summary, Chat, Flashcards, Quiz |

**Page-specific (do not over-abstract these):**

- `ChatMessage`, `ChatInput` — only used in AI Chat; keep local to that page/folder.
- `Flashcard` — only used in Flashcards page.
- `QuizQuestion` — only used in Quiz page.
- `Tabs` — actually replaced by React Router `NavLink`s in the workspace (see §7), so a generic `Tabs` component isn't needed unless another part of the app needs client-side-only tab switching (it doesn't, at this scope) — **cut from the component list**.

**Guideline:** build a shared component only once it's used in a second place. Building `ChatMessage` as "reusable" when only Chat uses it just adds an indirection layer for no benefit.

---

## 9. State Management Approach

No Redux/Zustand/MobX. Two layers only:

1. **Local component state (`useState`)** — the default for almost everything: form fields, modal open/closed, current flashcard index, quiz answers, chat messages, search query.
2. **One shared Context: `AuthContext`** — holds `{ user, token, login(), logout() }`, created with `createContext` + a `useAuth()` hook, wrapping the app in `App.jsx`. This is the *only* genuinely cross-cutting state (needed by Navbar, protected routes, and API calls), so it's the one justified use of Context per the brief's constraints.

**Data fetching pattern (repeated across pages):** a simple `useEffect` on mount that sets `isLoading`, calls the API, then sets `data`/`error` — the same 3-state pattern (`loading`, `error`, `data`) reused everywhere, no custom data-fetching library needed.

```js
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setIsLoading(true);
  axios.get(`/api/documents/${id}`)
    .then(res => setData(res.data))
    .catch(() => setError("Couldn't load this document."))
    .finally(() => setIsLoading(false));
}, [id]);
```

Protected routes: a simple `<ProtectedRoute>` wrapper component that checks `useAuth().user` and redirects to `/login` if absent — standard React Router pattern, no extra library.

---

## 10. API Integration Points

| Page/Feature | Endpoint (assumed REST shape) | Notes |
|---|---|---|
| Login | `POST /api/auth/login` | store token via `AuthContext` |
| Register | `POST /api/auth/register` | |
| Dashboard | `GET /api/documents?recent=true` | recent docs + counts |
| Library | `GET /api/documents`, `DELETE /api/documents/:id` | |
| Upload | `POST /api/documents/upload` (multipart) | use `axios` `onUploadProgress` for the progress bar |
| Document status | `GET /api/documents/:id/status` | polled while processing |
| Summary | `GET /api/documents/:id/summary`, `POST /api/documents/:id/summary/generate` | generate-on-demand pattern |
| Chat | `POST /api/documents/:id/chat` `{ message }` → `{ reply }` | one request per message, no streaming |
| Flashcards | `GET /api/documents/:id/flashcards`, `POST /api/documents/:id/flashcards/generate` | |
| Quiz | `GET /api/documents/:id/quiz`, `POST /api/documents/:id/quiz/generate` | |
| Profile | `GET /api/user/me`, `PUT /api/user/me`, `PUT /api/user/password` | |

All calls go through a single `axios` instance (`src/api/client.js`) with the auth token attached via an interceptor — keeps every page's fetch code identical to the pattern in §9.

---

## 11. Loading / Empty / Error States — Summary Table

| Situation | UI Treatment |
|---|---|
| No documents in library | `EmptyState` + "Upload PDF" CTA |
| PDF uploading | `ProgressBar` with % |
| PDF processing (post-upload) | Full-panel spinner + explanatory text, polled |
| AI generation in progress (summary/flashcards/quiz) | Spinner/skeleton + specific caption per feature |
| Chat response loading | Typing-indicator `ChatMessage` |
| Failed API request (generic) | Inline banner or text with a "Retry" button |
| Failed PDF processing | Error panel in workspace: "We couldn't process this document. Try re-uploading." |
| No flashcards / no quiz yet | `EmptyState` + "Generate" CTA |
| Empty chat | `EmptyState` with example prompt chips |

All driven by the same 3-variable pattern from §9 (`isLoading`, `error`, `data`) — no new state pattern is introduced per feature.

---

## 12. Responsive Design

Standard Tailwind breakpoints only: `sm` (640px), `md` (768px), `lg` (1024px).

- **Desktop (`lg+`):** Sidebar (app shell) visible, `w-60` fixed; content area `flex-1`. Workspace tab bar horizontal, full labels.
- **Tablet (`md`–`lg`):** Sidebar collapses to icon-only rail (optional simplification: just reuse mobile top-bar pattern instead, to avoid building a third layout) — **recommendation: treat tablet the same as mobile layout** (top bar + slide-over sidebar) to avoid a third bespoke breakpoint's worth of design work.
- **Mobile (`<md`):** Top bar with logo + hamburger → toggles a slide-over `Sidebar` (`fixed inset-0` overlay + `translate-x` transition, controlled by `useState(isSidebarOpen)`). Grids collapse to 1 column. Workspace tab bar becomes horizontally scrollable.

This two-layout system (desktop sidebar vs. mobile top bar + drawer) is enough; no separate tablet-specific component variants needed.

---

## 13. Animation Guidelines

Keep to Tailwind's built-in `transition`, `duration-150`/`200`, and `animate-spin`/`animate-pulse` utilities only.

Allowed:
- Button/card hover: `hover:bg-primary-hover transition-colors duration-150`
- Modal open/close: `transition-opacity` + `transition-transform` (scale/fade in, ~150ms)
- Sidebar slide-over on mobile: `transition-transform duration-200`
- Loading spinner: Tailwind `animate-spin` on a simple SVG/border-circle
- Skeleton loading: `animate-pulse` on gray blocks
- Flashcard answer reveal: `transition-opacity` fade-in, no 3D flip

Not allowed: Framer Motion, GSAP, scroll-triggered reveals, page-transition libraries, confetti/celebration animations, animated gradients.

---

## 14. Suggested React Folder Structure

```
src/
  api/
    client.js              # axios instance + interceptors
  context/
    AuthContext.jsx
  components/
    Navbar.jsx
    Sidebar.jsx
    Button.jsx
    Card.jsx
    DocumentCard.jsx
    UploadBox.jsx
    Modal.jsx
    ProgressBar.jsx
    LoadingSkeleton.jsx
    EmptyState.jsx
    ProtectedRoute.jsx
  pages/
    Landing.jsx
    Login.jsx
    Register.jsx
    Dashboard.jsx
    Library.jsx
    Profile.jsx
    Workspace/
      WorkspaceLayout.jsx  # header + tab bar + <Outlet />
      Summary.jsx
      Chat/
        Chat.jsx
        ChatMessage.jsx
        ChatInput.jsx
      Flashcards/
        Flashcards.jsx
        Flashcard.jsx
      Quiz/
        Quiz.jsx
        QuizQuestion.jsx
  App.jsx                  # routes
  main.jsx
```

Page-specific subcomponents (`ChatMessage`, `Flashcard`, `QuizQuestion`) live inside their feature folder, not in the shared `components/` directory — keeps the shared folder honestly "shared" (see §8).

---

## 15. Implementation Guidelines

- Build `Button`, `Card`, `Modal`, `EmptyState`, `LoadingSkeleton` first — nearly every page depends on them.
- Build `AuthContext` + `ProtectedRoute` early so routing/auth works before wiring up feature pages.
- Build pages in this order for fastest visible progress: Login/Register → Dashboard → Library → Upload → Workspace shell (§7) → Summary → Flashcards → Quiz → Chat → Profile → Landing (landing can be last since it doesn't depend on auth/data).
- Use one consistent API-call pattern (§9) everywhere — copy-paste it rather than inventing a new one per page.
- Keep every page's max content width consistent (`max-w-5xl` for dashboards/grids, `max-w-3xl`/`max-w-lg` for reading/single-item pages) so the app feels like one product.

---

## 16. "DO NOT OVERENGINEER" RULES

1. No global state library. `useState` + one `AuthContext` is enough.
2. No streaming chat UI — one request, one response, rendered fully.
3. No embedded PDF viewer in v1 — link out to the Cloudinary URL instead.
4. No generic `Tabs` component — use React Router `NavLink`s for the workspace tab bar.
5. No tablet-specific layout — mobile layout covers tablet too.
6. No animation library — Tailwind transitions and `animate-spin`/`animate-pulse` cover every approved animation.
7. No component abstraction until something is reused a second time.
8. No client-side caching layer — refetch on mount; the backend is fast enough for a study app at this scale.
9. No custom design-token build pipeline — a Tailwind config extension is the whole design system.
10. No charts/analytics on the dashboard — plain text counts and a recent-activity list are enough.

If a future feature seems to require any of the above, that's a signal to simplify the feature, not to add the tooling.
