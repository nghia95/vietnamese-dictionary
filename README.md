# Từ điển tiếng Việt - Vietnamese Dictionary

A modern, full-stack Vietnamese dictionary web application built with Next.js 14, TypeScript, and SQLite.

## Features

### 🔍 Search & Discovery
*   **Smart Search**: Real-time search with Vietnamese-specific sorting (A, Ă, Â...).
*   **User History**: Authenticated users can track:
    *   **Search History**: Automatically logs your search queries.
    *   **View History**: Tracks words you've explored.
    *   **Management**: View and clear your history.
*   **Alphabetical Sorting**: Accurate Vietnamese alphabetical ordering for all word lists.

### 📝 Contribution System
*   **Word Management**: Authenticated users can add new words with:
    *   **Images**: Upload illustrations (supporting standard file formats and URLs).
    *   **Definitions**: Multiple meanings with sources.
    *   **Etymologies**: Word origins.
    *   **Relations**: Synonyms and Antonyms.
*   **Editing**: Edit words you have contributed.

### 👥 Role-Based Access Control (RBAC)
*   **User Roles**:
    *   **User**: Can search, view history, and add new words.
    *   **Moderator**: Can edit *any* word (including those by others) and view user reports.
    *   **Admin**: Full system access, including assigning roles (`Moderator`, `User`) and banning users.
*   **Account Management**:
    *   **[Admin Only]** Dashboard to search users, update roles, and ban/unban accounts.

### 🎨 Modern UI/UX
*   **Pastel Professional Theme**: A clean, light-mode interface featuring warm creams and fresh greens.
*   **Responsive Design**: Mobile-friendly layout for all devices.
*   **Interactive Cards**: Click-to-expand word cards with subtle, intuitive controls.

## Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Database**: SQLite (with `better-sqlite3` and `libsql`)
*   **Authentication**: NextAuth.js v5
*   **Styling**: Vanilla CSS (CSS Modules) with a custom Design System
*   **Sorting**: Custom Vietnamese collation logic

## Getting Started

### Prerequisites

*   Node.js 18+
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/viet-dict.git
    cd viet-dict
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run migrations (if applicable) or start dev server to auto-seed:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000). The database `dictionary.db` is automatically created.

## Usage

### User Features
1.  **Sign Up/Login**: Create an account to access advanced features.
2.  **Dashboard**: Access your History and Profile from the header.
3.  **Add Word**: Click "Thêm từ mới", upload an image, and fill in definitions.
4.  **Edit Own Words**: You can always edit words you have contributed.

### Moderator & Admin Features
1.  **Edit Any Word (Moderator+)**: Moderators sees an edit pencil (✏️) on *all* word cards to fix errors.
2.  **User Management (Admin Only)**: Navigate to `/admin/users` to assign roles or ban users.

## Project Structure

```
├── app/
│   ├── api/               # API Routes (Words, History, Admin, Images)
│   ├── admin/             # Admin Dashboard
│   ├── history/           # User History Page
│   ├── add-word/          # Word Creation
│   ├── edit-word/         # Word Editing
│   └── page.tsx           # Home & Search
├── components/            # Reusable UI Components
│   ├── WordCard/          # Complex Word Display Logic
│   ├── Header/            # Navigation & Auth Status
│   └── ...
├── lib/
│   ├── db.ts              # Database Client & Helpers
│   └── utils.ts           # Sorting & Formatting Utilities
├── scripts/               # Database Migrations & utilities
└── public/                # Static assets
```

## Database Schema

*   **Users**: `id`, `email`, `role` (user/moderator/admin), `banned`
*   **Words**: `id`, `word`, `image`, `sort_key`, `user_id`
*   **History**: `id`, `user_id`, `type` (SEARCH/VIEW), `data`
*   **Definitions/Etymologies/Relations**: Related tables for word details.

## License

MIT
