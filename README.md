# Từ Điển Việt - Vietnamese Dictionary

A modern, full-stack Vietnamese dictionary web application built with Next.js 14, TypeScript, and SQLite.

## Features

✨ **Public Word Lookup** - Anyone can search and browse Vietnamese words  
🔐 **User Authentication** - Sign up and login with email/password  
📝 **Word Contribution** - Authenticated users can add new words with:
  - Multiple definitions with sources
  - Etymologies (Nguồn gốc)
  - Synonyms and Antonyms
✏️ **Edit Words** - Contributors can edit their own words
🎨 **Modern UI** - Premium design with Vietnamese typography and smooth animations  
📱 **Responsive** - Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **Authentication**: NextAuth.js v5
- **Styling**: Vanilla CSS with modern design system
- **Fonts**: Lexend (optimized for Vietnamese)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone or navigate to this directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

The database (`dictionary.db`) will be automatically created and seeded with sample Vietnamese words on first run.

## Usage

### Search for Words
- Visit the home page
- Type in the search box to find Vietnamese words
- Results update in real-time as you type

### Create an Account
1. Click "Đăng ký" (Sign up) in the header
2. Fill in your name, email, and password
3. Submit the form to create your account

### Login
1. Click "Đăng nhập" (Login) in the header
2. Enter your email and password
3. Click login to access authenticated features

### Add New Words
1. Login to your account
2. Click "Thêm từ mới" (Add new word) in the header
3. Fill in the word and phonetic (optional)
4. Add one or more **definitions** with sources
5. Add **etymologies** (optional)
6. Add **synonyms** and **antonyms** (optional)
7. Submit to add the word to the dictionary

### Edit Words
1. Login to your account
2. Navigate to a word you created (search for it)
3. Click the **Edit** (✏️) button next to the word title
4. Update the information and save

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   └── words/        # Word CRUD endpoints
│   ├── add-word/         # Add word page (protected)
│   ├── edit-word/        # Edit word page (protected)
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Home page with search
├── components/            # React components
│   ├── Header.tsx        # Navigation header
│   ├── WordCard.tsx      # Word display card
│   └── WordForm.tsx      # Reusable form for Add/Edit
├── lib/                   # Utilities and database
│   └── db.ts             # SQLite database setup
├── types/                 # TypeScript type definitions
├── auth.ts               # NextAuth configuration
└── middleware.ts         # Route protection middleware
```

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Hashed password
- `name` - User's display name
- `created_at` - Registration timestamp

### Words Table
- `id` - Primary key
- `word` - The Vietnamese word
- `phonetic` - Optional phonetic pronunciation
- `user_id` - Foreign key to users (contributor)
- `created_at` - Addition timestamp

### Definitions Table
- `id`, `word_id`, `definition`, `source`, `order`

### Etymologies Table
- `id`, `word_id`, `etymology`

### Related Words Table
- `id`, `word_id`, `word`, `type` ('synonym' or 'antonym')

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
