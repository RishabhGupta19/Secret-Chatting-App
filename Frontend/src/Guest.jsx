
// Guest.jsx

import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import "./Guest.css";
import Delete from "./delete.jsx";

const socket = io("https://secret-chatting-app.onrender.com");

export default function Guest() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);

  // ✅ auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [chatMessage]);

  // ✅ auto scroll to bottom
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // ✅ on mount, restore code + messages (using GUEST-SPECIFIC keys)
  useEffect(() => {
    const savedCode = localStorage.getItem("guest_chat_code");
    const savedMessages = savedCode ? localStorage.getItem(`guest_chat_${savedCode}`) : null;

    console.log("🔍 Guest Component mounted. Saved code:", savedCode);

    if (savedCode) {
      setCode(savedCode);
      setConnected(true);
      setShowDeleteButton(true);

      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
          console.log("📥 Loaded messages from localStorage");
        } catch (e) {
          console.error("❌ Error parsing messages:", e);
        }
      }

      // ensure socket rejoins
      const attemptRejoin = () => {
        console.log("📡 Emitting rejoinRoom for Guest, code:", savedCode);
        socket.emit("rejoinRoom", { code: savedCode, role: "Guest" });
      };

      if (socket.connected) {
        console.log("✅ Socket already connected, rejoining now");
        attemptRejoin();
      } else {
        console.log("⏳ Waiting for socket to connect...");
        socket.once("connect", () => {
          console.log("✅ Socket connected, now rejoining");
          attemptRejoin();
        });
      }
    } else {
      console.log("ℹ️ No saved Guest session found");
    }
  }, []);

  // ✅ save messages for this room (using GUEST-SPECIFIC keys)
  useEffect(() => {
    if (code) {
      localStorage.setItem(`guest_chat_${code}`, JSON.stringify(messages));
      console.log("💾 Saved messages to localStorage");
    }
  }, [messages, code]);

  // ✅ message handlers
  useEffect(() => {
    socket.on("receiveMessage", ({ sender, message }) => {
      console.log("💬 Received message from", sender);
      setMessages((prev) => [...prev, { sender, message }]);
    });

    socket.on("roomClosed", () => {
      console.log("🚪 Room closed by host");
      setMessages((prev) => [...prev, { sender: "System", message: "Room closed by host" }]);
    });

    socket.on("invalidCode", () => {
      setMessage("❌ Invalid Code. Try again.");
      setWaiting(false);
      setConnected(false);
      console.log("❌ Invalid code response");
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("roomClosed");
      socket.off("invalidCode");
    };
  }, []);

  // ✅ joining logic
  const handleJoin = () => {
  if (code.trim().length !== 4) {
    setMessage("Enter a valid 4-digit code");
    return;
  }
  
  // 🆕 Clear old room messages if switching rooms
  const savedCode = localStorage.getItem("guest_chat_code");
  if (savedCode && savedCode !== code) {
    console.log("🔄 Switching rooms, clearing old messages");
    socket.emit("leaveRoom", savedCode);
    localStorage.removeItem(`guest_chat_${savedCode}`);
    setMessages([]);
  }
  
  console.log("🔔 Requesting to join room:", code);
  socket.emit("joinRequest", code);
  setWaiting(true);
  setMessage("Waiting for host approval...");
};

  // ✅ when approved by host
  useEffect(() => {
    socket.on("joinSuccess", (approvedCode) => {
  console.log("✅ Join approved for room:", approvedCode);
  
  // 🆕 Clear messages when joining a new room
  setMessages([]);
  
  setConnected(true);
  setWaiting(false);
  setShowDeleteButton(true);
  setMessage(`✅ Connected to room ${approvedCode}`);

  localStorage.setItem("guest_chat_code", approvedCode);

  socket.emit("joinRoom", approvedCode);
});

    socket.on("joinDenied", () => {
      console.log("❌ Join denied by host");
      setWaiting(false);
      setMessage("❌ Your request was denied by the host.");
    });

    socket.on("rejoinSuccess", (rejoinedCode) => {
      console.log("✅ Successfully rejoined room:", rejoinedCode);
      setConnected(true);
      socket.emit("joinRoom", rejoinedCode);
    });

    return () => {
      socket.off("joinSuccess");
      socket.off("joinDenied");
      socket.off("rejoinSuccess");
    };
  }, []);

  // ✅ sending message
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    console.log("📤 Sending message:");
    // always show "You" locally
    const newMsg = { sender: "You", message: chatMessage };
    setMessages((prev) => [...prev, newMsg]);

    // emit actual sender as Guest for the host to see
    socket.emit("sendMessage", { roomCode: code, sender: "Guest", message: chatMessage });

    setChatMessage("");
  };

  // ✅ handle keydown for Enter/Shift+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✅ disconnect logic
  const handleDelete = () => {
    console.log("🚪 Disconnecting from room:", code);
    socket.emit("leaveRoom", code);
    localStorage.removeItem(`guest_chat_${code}`);
    localStorage.removeItem("guest_chat_code");
    setMessages([]);
    setCode("");
    setShowDeleteButton(false);
    setShowDeleteModal(false);
    setConnected(false);
    setWaiting(false);
  };

  return (
  <>
   

      {!connected ? (
        <div className="join-container">
          <h2 className="chat-header">🔗 Join Chat</h2>
          <h4 className="enter">Enter your Code here</h4>
          <input
            type="number"
            placeholder="Enter 4-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-box"
          />
          {waiting && <p className="text-yellow-400 mt-3 mb-3">{message}</p>}
          {!waiting && message && <p className="text-red-400 mb-3 mt-3 ">{message}</p>}
          <button onClick={handleJoin} className="spaced-button">Join Room</button>
        </div>
      ) : (<>
        <h1 className="Title">Your Secret Chat Room</h1>
      <div className="chat-container">
        
          
          <h2 className="chat-header">💬 Connected to Room - {code}</h2>

          <div className="chat-box" ref={chatBoxRef}>
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center mt-3">No messages yet...</p>
            ) : (
              messages.map((m, i) => {
                const isYourMessage = m.sender === "Guest" || m.sender === "You";
                const isSystemMessage = m.sender === "System";
                
                return (
                  <p
                    key={i}
                    className={
                      isYourMessage
                        ? "text-right text-green-400"
                        : isSystemMessage
                        ? "text-center text-gray-400 italic"
                        : "text-left text-blue-400"
                    }
                  >
                    <strong>
                      {isYourMessage
                        ? "You"
                        : isSystemMessage
                        ? ""
                        : m.sender}
                      {!isSystemMessage && ":"}{" "}
                    </strong>
                    {m.message}
                  </p>
                );
              })
            )}
          </div>

          <div className="input-area">
            <textarea
              ref={textareaRef}
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              style={{ 
                resize: 'none',
                minHeight: '24px',
                maxHeight: '120px',
                overflowY: 'auto'
              }}
            />
            <button className="Button1" onClick={handleSendMessage}>Send</button>
          </div>

          {showDeleteModal && (
            <Delete onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />
          )}
        </div>
         {showDeleteButton && (
      <button onClick={() => setShowDeleteModal(true)} className="spaced-button1">
        Disconnect
      </button>
    )}
</>
      )}
    
   
  
  </>
);

  
}

