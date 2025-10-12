import React, { useState } from "react";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

function JoinRoom({ onJoinSuccess }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleJoin = () => {
    if (code.trim().length !== 4) {
      setMessage("Enter valid 4-digit code");
      return;
    }
    socket.emit("joinRequest", code);
  };

  socket.on("invalidCode", (msg) => setMessage(msg));
  socket.on("joinDenied", (msg) => setMessage(msg));
  socket.on("joinSuccess", (code) => {
    onJoinSuccess(code);
  });

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Join a Secret Chat</h1>
      <input
        type="text"
        placeholder="Enter 4-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border p-2 text-black rounded mb-3"
      />
      <button
        onClick={handleJoin}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
      >
        Join Chat
      </button>
      {message && <p className="mt-3 text-red-400">{message}</p>}
    </div>
  );
}

export default JoinRoom;
