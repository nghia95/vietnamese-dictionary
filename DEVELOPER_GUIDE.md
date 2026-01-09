# Developer Guide

Welcome to the Vietnamese Dictionary project! This guide is designed to help you understand the codebase structure and how to make changes effectively.

## 📚 Recommended Reading Order

To understand how the application works, we recommend reading the files in this specific order. This follows the data flow from the database up to the user interface.

### 1. The Foundation (Database & Auth)
Start here to understand how data is stored and secured.

- **`lib/db.ts`** (CRITICAL): This is the heart of the application.
  - **What it does**: Sets up the SQLite/Turso connection, defines the database schema (tables like `users`, `words`, `definitions`), and contains all "Helper Functions" (e.g., `addWord`, `getGlobalStats`, `createWordType`).
  - **Why read it**: If you want to change *what* data we store (e.g., adding a "difficulty" field to words), you start here.

- **`auth.ts` & `auth.config.ts`**:
  - **What it does**: Configures NextAuth.js (v5). It handles Google/Credentials login, session management, and role checks (Admin vs User).

### 2. The Backend (API Routes)
These files act as the bridge between the frontend and the database.

- **`app/api/words/route.ts`**: Handles searching and fetching words.
- **`app/api/admin/extract/route.ts`**: The logic for the AI Import feature. Shows how we process files (PDF/Excel) and talk to Gemini AI.

### 3. The Reusable Blocks (Components)
UI pieces used across multiple pages.

- **`components/WordCard.tsx`** (COMPLEX): The most important UI component.
  - **What it does**: Displays a single word with all its meanings, plays audio, handles "Editing" mode, and "Selection" mode.
  - **Look for**: The `onClick` handler (counts views) and the rendering logic for definitions.

- **`components/WordForm.tsx`**: The form used for both Adding and Editing words.

### 4. The Pages (Frontend Logic)
Where everything comes together.

- **`app/page.tsx`**: The Homepage.
  - **What it does**: Manages the Search Bar state, fetches results from the API, and renders the list of `WordCard`s.

- **`app/admin/import/page.tsx`**: The AI Import page. Good for understanding file handling and fancy progress UI.

---

## 🛠 Common Modification Workflows

### How to add a new field to a Word?
*Example: Adding a "Difficulty" level (Easy/Hard)*

1.  **Database**: Open `lib/db.ts`.
    *   Find `initializeDatabase`. Add `difficulty TEXT` to the `CREATE TABLE words` SQL.
    *   Update `addWord` function to accept `difficulty` argument and `INSERT` it.
2.  **API**: Open `app/api/words/route.ts` (POST method). extract `difficulty` from `req.json()` and pass it to `addWord`.
3.  **UI (Read)**: Open `components/WordCard.tsx`. Add a `<div>` to display `{word.difficulty}`.
4.  **UI (Write)**: Open `components/WordForm.tsx`. Add a `<select>` input for difficulty.

### How to change the styling?
*   **Global**: `app/globals.css` (Variables for colors like `--primary-color`).
*   **Component**: Most components use Tailwind classes (e.g., `text-xl`, `p-4`). 
*   **Specifics**: Some complex components like `Header` have their own `.module.css` file (e.g., `components/Header.module.css`).

## 🧠 Key Concepts
- **Server vs Client Components**: 
  - Files with `'use client'` at the top run in the browser (interactive, like forms).
  - Files without it run on the server (accessing DB directly).
- **Turso/LibSQL**: We use a remote SQLite database. `lib/db.ts` handles the connection.

## 🐛 Debugging
- Check the **Terminal** where `npm run dev` is running for Server Errors (API issues).
- Check the **Browser Console** (F12) for Client Errors (React/UI issues).
