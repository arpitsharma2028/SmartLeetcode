# 🚀 Smart Leetcode

**[Live Demo](https://minileetcode-1.onrender.com/)**

The My Library changes described below are in this local project. The live demo may still show an older version until these changes are deployed.

Smart Leetcode is a modern, real-time web application built with **React, Node.js, and Supabase**. It allows users to practice coding algorithms, compete against others in real-time, conduct structured mock interviews, and receive targeted hints from an AI tutor.

---

## 🎯 The Vision

Learning Data Structures and Algorithms on traditional platforms can often feel isolating, frustrating, and punishing. When you get stuck, your only option is usually to give up and read the solution, completely ruining the learning process. Smart Leetcode solves this by introducing a supportive **AI Mentor** to nudge you in the right direction, **Multiplayer Sparring** to make coding social, and **Mock Interview** rooms to prepare for real-world technical screens!

### Why Smart Leetcode?
While traditional platforms focus strictly on grinding out hundreds of problems, Smart Leetcode focuses on **gamification and active learning**:
1. **No More Reading Solutions:** Instead of giving up, our AI Mentor analyzes your exact code and gives you a tiny hint to help you solve it yourself.
2. **Visual Accountability:** We don't just track if you solved a problem; our custom Heatmap tracks *how cleanly* you solved it. Relying too heavily on AI hints will permanently turn your heatmap yellow or red, and break your streaks!
3. **Multiplayer & Collaborative by Default:** Coding shouldn't be lonely. Challenge a friend to a 1v1 battle or conduct a formal Mock Interview with real-time code synchronization.

---

## 🏛️ Project Architecture

Smart Leetcode is built with a highly scalable, decoupled architecture to handle real-time synchronization, secure code execution, and data persistence:

- **Client Layer (React + Vite):** A responsive, single-page application utilizing `react-router-dom` for navigation, `@monaco-editor/react` for a rich IDE experience, and TailwindCSS for a sleek, dark-themed UI.
- **WebSocket Layer (Socket.io):** Handles low-latency, bi-directional communication. Dedicated "Rooms" are dynamically provisioned for Sparring and Mock Interviews, ensuring keystroke-level code synchronization and live presence indicators without overloading the REST API.
- **API & Gamification Engine (Node.js/Express):** A stateless backend handling authentication, dynamic scoring logic (factoring in difficulty, streak multipliers, and hint penalties), and routing AI requests.
- **AI Integration (Google Gemini 1.5 Flash):** Prompt-engineered to act as a strict mentor. It ingests the user's current code string and the problem context to generate highly contextual, concise nudges without revealing the answer.
- **Persistence Layer (Supabase/PostgreSQL):** Relational database managing user profiles, complex stats aggregations, interview rubrics, and historical submission logging via automated triggers.
- **Code Execution:** User code is securely executed via isolated local child processes, supporting multiple languages (Node.js, Python 3, C++, Java) and comparing output against structured test cases.

---

## ✨ Core Features

- **🏆 Practice Arena:** Solve a curated list of Easy, Medium, and Hard coding questions. Write code directly in the browser and run tests in real-time. Automatically tracks solved questions with visual checkmarks.
- **🧠 AI Mentor:** Click "Get a Hint" and our Google Gemini-powered AI Mentor will analyze your current code and give you a gentle nudge in the right direction!
- **👔 Mock Interview Mode:** Simulate a real tech-screen! Invite a peer into a dedicated Interview Room. The Interviewer has full control to assign questions, view the candidate's live code, fill out an interactive evaluation rubric, and submit a final Pass/Fail grade with private feedback.
- **⚔️ Sparring Mode (Multiplayer 1v1):** Challenge your friends to a coding battle! Create a room, share the link, and race to solve a random Medium difficulty question. See each other's live progress and submission results instantly.
- **📊 Detailed Profiles & Custom Heatmap:** Track your Global Score and Clean Streak. Your Activity Heatmap uses custom color-coding based on your reliance on hints (Green = Flawless, Yellow = Heavy Hint Usage, Red = Streak Broken). Includes a private Interview History log.
- **⚖️ Profile Comparison:** Enter an opponent's username to get a side-by-side statistical comparison of your scores, streaks, and solved problem counts. 
- **🌐 Multi-Language Support:** Write and submit solutions in **JavaScript (Node.js)**, **Python 3**, **C++**, and **Java**.
- **📚 My Library:** Save Smart Leetcode questions or links from LeetCode, GeeksforGeeks, and other platforms. The Detect button suggests a title and difficulty for a supported link; review them before saving. Smart Leetcode questions open in this app's editor, while external questions open on their source sites.
- **🗂️ Folders and platform browsing:** The library opens with folder cards, including Graph, DP, Stacks, Array, Binary Search, and Revision. Add custom folders or use Unfiled. Switch between **By folder** and **By platform**, then open a category to see its problems. Source, difficulty, and solve status remain visible on each problem card.
- **📝 Learning notes:** After an accepted Smart Leetcode submission, **Save what I learned** pre-fills the accepted code. Save your approach, edge cases, language, time and space complexity, and an optional review schedule. In My Library, **Notes** opens a readable, read-only view; **Edit** opens the existing form to change the saved entry.
- **🔁 Revisit queue:** The profile groups scheduled questions into **Overdue**, **Due today**, and **Upcoming**. **Review now** opens the question, and **Mark reviewed** schedules its next review. A saved problem also has a **Review done** action in the library.
- **📈 Separate progress counts:** The library shows Total Solved, Easy, Medium, Hard, and Revisit Pending. The profile separates verified Smart Leetcode solves from self-reported external solves. Only accepted Smart Leetcode submissions contribute to competitive score.
- **⚔️ Home-page sparring:** **Challenge to Sparring** is available on the home page.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** TailwindCSS
- **Code Editor:** `@monaco-editor/react`
- **Routing:** React Router DOM
- **Real-time:** `socket.io-client`

### Backend
- **Server:** Node.js + Express
- **Real-time:** `socket.io`
- **AI Integration:** `@google/generative-ai` (Gemini 1.5 Flash)
- **Database:** Supabase (PostgreSQL)
- **Code Execution:** Local child processes (Python/GCC via Docker)

---

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/arpitsharma2028/SmartLeetcode.git
cd SmartLeetcode
```

Use a recent Node.js version with npm. The code runner also needs the language runtimes or compilers for the languages you intend to execute.

### 2. Configure Supabase and the database

Create a `.env` file in `frontend/`:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create a `.env` file in `backend/` if you run the servers manually or want separate backend settings:

```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

The frontend and backend must use the **same Supabase project**. `start.bat` can read `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `frontend/.env` when `backend/.env` does not exist. Set `GEMINI_API_KEY` in `backend/.env` if you want to use AI hints.

Run the database SQL described in the Database Setup section below before using My Library.

### 3. Start on Windows

Double-click `start.bat` in the project root, or run:

```bat
start.bat
```

It installs missing dependencies with `npm ci`, opens separate backend and frontend terminals, and opens `http://127.0.0.1:5173/`. Close the two server terminals to stop the project. Run `start.bat --check` to run its startup prechecks without launching the servers.

### 4. Start manually (any platform)

In one terminal, from the project root:

```bash
cd backend
npm install
npm run dev
```

In another terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

The backend defaults to `http://localhost:3000` and Vite to `http://localhost:5173`.

---

## 🗄️ Database Setup (Supabase)

In the Supabase SQL Editor for the project configured above:

1. For a **new database**, set up the original Smart Leetcode tables with `database/schema.sql`, then `database/triggers.sql`. Run `database/seed.sql` if you want the included questions. The original schema creates `users`, `user_stats`, `topics`, `questions`, `submissions`, `matches`, and `question_sessions`.
2. For both a new database and an **existing Smart Leetcode database**, run [database/library_migration.sql](database/library_migration.sql) after the original `questions` table exists. This adds `library_folders` and `library_items`, their indexes, authenticated-user grants, and row-level security policies. If you already ran this migration against the same Supabase project, the recent library layout and Notes/Edit UI changes need no extra SQL.

Library folders and items are stored in Supabase under the signed-in user's ID and loaded again on sign-in. The library API uses the user's Supabase session token, and the migration policies restrict each user to their own rows. The six starter folders are created for each user when they first load My Library; there is no separate folder seed script. External solve status is self-reported and stays separate from verified submissions.

The migration is written to preserve existing library data when rerun. `CREATE TABLE IF NOT EXISTS` does **not** add missing columns to an older table with the same name, so check an older custom library schema before relying on a rerun to update it.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check our [issues page](https://github.com/arpitsharma2028/smartLeetcode/issues) if you want to contribute.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
