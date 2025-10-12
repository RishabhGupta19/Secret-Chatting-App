


// Host.jsx
import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import "./Host.css";
import Delete from "./Delete.jsx";

const socket = io("https://secret-chatting-app.onrender.com");

export default function Host() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [joinAlert, setJoinAlert] = useState(null);
  const [showCreateChat, setCreateChat] = useState(true);
  const [Code, setCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const myRole = "Host";

  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const chatBoxRef = useRef(null);
  const textareaRef = useRef(null);

  // --- Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [chatMessage]);

  // --- Auto-scroll
  useEffect(() => {
    if (chatBoxRef.current)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages]);

  // --- Restore previous chat & connection on mount
  useEffect(() => {
    // Use HOST-SPECIFIC localStorage keys
    const savedCode = localStorage.getItem("host_chat_code");
    
    console.log("🔍 Host Component mounted. Saved code:", savedCode);
    
    if (savedCode) {
      console.log("🔄 Initiating rejoin for Host, room:", savedCode);
      setIsRejoining(true);
      setCode(savedCode);
      setShowDeleteButton(true);
      setCreateChat(false);
      
      // Load saved messages immediately
      const saved = localStorage.getItem(`host_chat_${savedCode}`);
      if (saved) {
        try {
          const savedMessages = JSON.parse(saved);
          setMessages(savedMessages);
          console.log("📥 Loaded", savedMessages.length, "messages from localStorage");
        } catch (e) {
          console.error("❌ Error parsing saved messages:", e);
        }
      }
      
      // Function to attempt rejoin
      const attemptRejoin = () => {
        console.log("📡 Emitting rejoinRoom for Host, code:", savedCode);
        socket.emit("rejoinRoom", { code: savedCode, role: "Host" });
      };
      
      // If socket is already connected, rejoin immediately
      if (socket.connected) {
        console.log("✅ Socket already connected, rejoining now");
        attemptRejoin();
      } else {
        // Wait for socket to connect
        console.log("⏳ Socket not connected yet, waiting...");
        const connectHandler = () => {
          console.log("✅ Socket connected, now rejoining");
          attemptRejoin();
        };
        
        socket.once("connect", connectHandler);
        
        // Cleanup function
        return () => {
          socket.off("connect", connectHandler);
        };
      }
    } else {
      console.log("ℹ️ No saved Host session found, starting fresh");
    }
  }, []);

  // --- Persist messages (excluding temporary system messages)
  useEffect(() => {
    if (!Code || messages.length === 0) return;
    
    // Only persist non-system messages or important system messages
    const messagesToSave = messages.filter(
      (m) => m.sender !== "System" || 
             m.message === "Guest joined the room"||
             m.message==="Guest Left the room"
    );
    
    localStorage.setItem(`host_chat_${Code}`, JSON.stringify(messagesToSave));
    console.log("💾 Saved", messagesToSave.length, "messages to localStorage");
  }, [messages, Code]);

  // --- Listen for rejoin success/failure
  useEffect(() => {
    const handleRejoinSuccess = (code) => {
      console.log("✅ Successfully rejoined room", code);
      setConnected(true);
      setIsRejoining(false);
      // Join the socket.io room
      socket.emit("joinRoom", code);
    };

    const handleInvalidCode = () => {
      console.log("❌ Room not found on server — clearing local data");
      setConnected(false);
      setIsRejoining(false);
      setShowDeleteButton(false);
      setCreateChat(true);
      
      // Clear invalid room data
      const savedCode = localStorage.getItem("host_chat_code");
      if (savedCode) {
        localStorage.removeItem(`host_chat_${savedCode}`);
      }
      localStorage.removeItem("host_chat_code");
      setCode("");
      setMessages([]);
    };

    socket.on("rejoinSuccess", handleRejoinSuccess);
    socket.on("invalidCode", handleInvalidCode);

    return () => {
      socket.off("rejoinSuccess", handleRejoinSuccess);
      socket.off("invalidCode", handleInvalidCode);
    };
  }, []);

  // --- Listen for join alerts and room closure
  useEffect(() => {
    const handleJoinAlert = ({ guestId, code }) => {
      console.log("🔔 Guest wants to join:", guestId);
      setJoinAlert({ guestId, code });
    };

    const handleRoomClosed = () => {
      console.log("🚪 Room closed by server");
      setMessages((p) => [
        ...p,
        { sender: "System", message: "Room was closed" },
      ]);
      // Clean up after room is closed
      setTimeout(() => {
        localStorage.removeItem("host_chat_code");
        if (Code) {
          localStorage.removeItem(`host_chat_${Code}`);
        }
        setCode("");
        setConnected(false);
        setShowDeleteButton(false);
        setCreateChat(true);
      }, 2000);
    };

    socket.on("joinAlert", handleJoinAlert);
    socket.on("roomClosed", handleRoomClosed);
    
    return () => {
      socket.off("joinAlert", handleJoinAlert);
      socket.off("roomClosed", handleRoomClosed);
    };
  }, [Code]);

  // --- Room created by server
  useEffect(() => {
    const handleRoomCreated = (roomCode) => {
      if (roomCode) {
        console.log("🏠 Room created with code:", roomCode);
        setShowDeleteButton(true);
        setCode(roomCode);
        setConnected(true);
        setCreateChat(false);
        localStorage.setItem("host_chat_code", roomCode);
        socket.emit("joinRoom", roomCode);
      }
    };

    socket.on("roomCreated", handleRoomCreated);
    return () => socket.off("roomCreated", handleRoomCreated);
  }, []);

  // --- Receive messages
  useEffect(() => {
    const handleReceiveMessage = ({ sender, message }) => {
      console.log("💬 Received message from", sender);
      setMessages((p) => [...p, { sender, message }]);
    };

    const handleGuestJoined = () => {
      console.log("👤 Guest joined the room");
      setMessages((p) => [
        ...p,
        { sender: "System", message: "Guest joined the room" },
      ]);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("guestJoined", handleGuestJoined);
    
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("guestJoined", handleGuestJoined);
    };
  }, []);

  // --- Create room
  const handleCreateRoom = () => {
    console.log("🆕 Creating new room");
    socket.emit("createRoom");
  };

  // --- Approve / Deny guest
  const handleApprove = () => {
    if (!joinAlert) return;
    console.log("✅ Approving guest:", joinAlert.guestId);
    socket.emit("approveJoin", {
      guestId: joinAlert.guestId,
      code: joinAlert.code,
    });
    setJoinAlert(null);
  };

  const handleDeny = () => {
    if (!joinAlert) return;
    console.log("❌ Denying guest:", joinAlert.guestId);
    socket.emit("denyJoin", joinAlert.guestId);
    setJoinAlert(null);
  };

  // --- Send message
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    
    const newMessage = { sender: myRole, message: chatMessage };
    setMessages((p) => [...p, newMessage]);
    socket.emit("sendMessage", {
      roomCode: Code,
      sender: myRole,
      message: chatMessage,
    });
    setChatMessage("");
  };

  // --- Handle keydown for Enter/Shift+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Disconnect room manually
  const handleDelete = () => {
    console.log("🚪 Manually disconnecting from room", Code);
    socket.emit("leaveRoom", Code);
    
    // Show system message locally (not persisted)
    setMessages((p) => [
      ...p,
      { sender: "System", message: "Room closed by Host" },
    ]);
    
    // Clean storage after a brief delay to show the message
    setTimeout(() => {
      localStorage.removeItem(`host_chat_${Code}`);
      localStorage.removeItem("host_chat_code");
      setCode("");
      setMessages([]);
      setShowDeleteButton(false);
      setCreateChat(true);
      setShowDeleteModal(false);
      setConnected(false);
    }, 1500);
  };

  // --- UI
  return (
    <>
    {joinAlert && (
        <div className="bg-gray-800 p-4 rounded">
          <p className="mb-2">Someone wants to join your chat!</p>
          <div className="flex gap-4">
            <button
              onClick={handleApprove}
              className="bg-green-600 px-3 py-1 rounded"
            >
              Allow
            </button>
            <button
              onClick={handleDeny}
              className="bg-red-600 px-3 py-1 rounded"
            >
              Deny
            </button>
          </div>
        </div>
      )}
      <div>
        <h1 className="Title">Your Secret Chat Room</h1>
      </div>
      <div className="chat-container">
        <div className="chat-header">
          💬 Your Code - {Code || "----"}
          {isRejoining && <span className="text-yellow-400 text-sm ml-2">(Reconnecting...)</span>}
          {!connected && Code && !isRejoining && (
            <span className="text-red-400 text-sm ml-2">(Disconnected)</span>
          )}
        </div>

        <div id="chatBox" className="chat-box" ref={chatBoxRef}>
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center mt-3">No messages yet...</p>
          ) : (
            messages.map((msg, i) => (
              <p
                key={i}
                className={
                  msg.sender === myRole
                    ? "text-right text-green-400"
                    : msg.sender === "System"
                    ? "text-center text-gray-400 italic"
                    : "text-left text-blue-400"
                }
              >
                <strong>
                  {msg.sender === myRole
                    ? "You"
                    : msg.sender === "System"
                    ? ""
                    : msg.sender}
                  {msg.sender !== "System" && ":"}{" "}
                </strong>
                {msg.message}
              </p>
            ))
          )}
        </div>

        {connected && (
          <div className="input-area">
            <textarea
              ref={textareaRef}
              id="message"
              placeholder="Type your message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ 
                resize: 'none',
                minHeight: '24px',
                maxHeight: '120px',
                overflowY: 'auto'
              }}
            />
            <button id="btn" onClick={() => handleSendMessage()}>
              Send
            </button>
          </div>
        )}
      </div>

      <br />

      {showCreateChat && (
        <button onClick={handleCreateRoom} className="spaced-button">
          Create Chat
        </button>
      )}

      {showDeleteButton && (
        <button
          onClick={() => setShowDeleteModal(true)}
          className="spaced-button"
        >
          Disconnect
        </button>
      )}

      

      {showDeleteModal && (
        <Delete
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
