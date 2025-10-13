# 🔐 Secret Chatting App

A real-time **peer-to-peer secret chat application** that allows users to create or join private chat rooms using a unique 4-digit code.  
The messages are **instant**, **private**, and persist locally until the user manually disconnects — ensuring both speed and privacy.  

---

## 🚀 Features

- 🧩 **Room-based chatting** — Host creates a 4-digit secret room code.  
- 🔗 **Instant connection** — Guests join using the same code.  
- 💬 **Real-time messaging** powered by **Socket.IO**.  
- 🔁 **Auto-reconnect** support (graceful refresh recovery).  
- 🧠 **Persistent chat** using `localStorage` (messages stay after refresh).  
- 📱 **Responsive design** — optimized for mobile screens.  
- 🛑 **Manual disconnect** feature that cleanly closes rooms.  
- ⚡ **Lightweight & fast** — built with modern React and Express.

---

## 🧠 Tech Stack

### **Frontend**
- ⚛️ React (Vite)
- 🎨 Tailwind CSS
- 🔌 Socket.IO Client

### **Backend**
- 🟩 Node.js
- 🚀 Express.js
- 🔊 Socket.IO (Server)

---

## 🏗️ Project Setup

### 🔹 1. Clone this repository
```bash
git clone https://github.com/<your-username>/Secret-Chatting-App.git
cd Secret-Chatting-App
🔹 2. Install frontend dependencies

cd frontend
npm install
🔹 3. Install backend dependencies

cd ../backend
npm install
🔹 4. Run the backend server

npm run dev
Server will start at: http://localhost:5000

🔹 5. Run the frontend

cd ../frontend
npm run dev
Frontend will run at: http://localhost:5173

🗂️ Project Structure
pgsql

Secret-Chatting-App/
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.css
│   └── package.json
│
├── backend/                 # Node.js + Express backend
│   ├── server.js
│   └── package.json
│
└── README.md
