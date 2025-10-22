# HabitTrail - Habit Tracking Application

A full-stack habit tracking application built with React, Express, and MongoDB.

## Features
- User authentication and registration
- Create and manage daily/weekly habits
- Track completion streaks
- Progress analytics and visualization
- Responsive design with dark/light themes

## Prerequisites

Before running HabitTrail, make sure you have:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS version

2. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

## Quick Start

### Step 1: Install Node.js
1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Run the installer and follow the setup wizard
4. Restart your computer after installation
5. Verify installation by opening terminal/command prompt and typing:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Download the Project
1. Download ALL project files to a folder on your computer (e.g., `C:\HabitTrail` or `~/HabitTrail`)
2. Make sure all files and folders are in the same directory

### Step 3: Install Dependencies
1. Open terminal/command prompt in your project folder:
   - **Windows:** Hold Shift + Right-click in folder → "Open PowerShell window here"
   - **Mac:** Right-click in folder → "Services" → "New Terminal at Folder"
   - **Or navigate manually:** `cd C:\HabitTrail` (Windows) or `cd ~/HabitTrail` (Mac/Linux)

2. Install all required packages:
   ```bash
   npm install
   ```
   Wait for installation to complete (may take 2-5 minutes)

### Step 4: Set up Environment Variables
1. Copy `.env.example` to `.env` (or create new `.env` file)
2. The `.env` file should contain:
   ```
   MONGODB_URI=mongodb+srv://charlescarmichaal:PPEqsgt8pVX9v6oa@habitcluster.ymf4dab.mongodb.net/?retryWrites=true&w=majority&appName=habitcluster
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

### Step 5: Start the Application
```bash
npm run dev
```

You should see messages like:
```
[express] serving on port 5000
Successfully connected to MongoDB Atlas
MongoDB storage initialized successfully
```

The application will be available at: **http://localhost:5000**

### Step 6: Use the Application
1. Open your web browser
2. Go to `http://localhost:5000`
3. Create a new account
4. Start tracking your habits!

## Troubleshooting

### Common Issues:

**1. "npm not found" error**
- Install Node.js from nodejs.org
- Restart your terminal/command prompt

**2. "MongoDB connection failed"**
- Check your internet connection
- Verify the MONGODB_URI in your .env file

**3. Port already in use**
- The app uses port 5000. If it's busy, change it in server/index.ts

**4. Dependencies installation fails**
- Try: `npm cache clean --force`
- Then: `npm install`

## Project Structure
```
habittrail/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Support
If you encounter any issues, check that:
1. Node.js is properly installed
2. All dependencies are installed (`npm install`)
3. Environment variables are set correctly
4. Port 5000 is available

Happy habit tracking! 🎯