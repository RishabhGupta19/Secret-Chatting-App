
// // server.js
// import express from "express";
// import http from "http";
// import cors from "cors";
// import { Server } from "socket.io";

// const app = express();
// const server = http.createServer(app);




// // ✅ FIXED: Correct CORS configuration
// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:3000",
//       "https://secret-chatting-app.vercel.app"
//     ],
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

// // Add CORS middleware for Express
// app.use(cors({
//   origin: [
//     "http://localhost:5173",
//     "http://localhost:3000",
//     "https://secret-chatting-app.vercel.app"
//   ],
//   credentials: true
// }));

// app.use(express.json());

// // Health check endpoint
// app.get("/", (req, res) => {
//   res.json({ status: "Server is running", rooms: Object.keys(rooms).length });
// });

// // rooms: map code -> { hostId: string, guests: Set<string>, hostTimeout?: NodeJS.Timeout }
// const rooms = {};

// // Grace period for reconnection (10 seconds)
// const RECONNECT_GRACE_PERIOD = 10000;

// io.on("connection", (socket) => {
//   console.log("✅ socket connected", socket.id);

//   // create room (host)
//   socket.on("createRoom", () => {
//     let code;
//     do {
//       code = String(Math.floor(1000 + Math.random() * 9000));
//     } while (rooms[code]); // ensure unique
//     rooms[code] = { hostId: socket.id, guests: new Set() };
//     socket.join(code);
//     socket.emit("roomCreated", code);
//     console.log("🏠 Created room", code, "host", socket.id);
//   });

//   // guest requests to join (host gets alert)
//   socket.on("joinRequest", (code) => {
//     if (rooms[code] && rooms[code].hostId) {
//       const hostId = rooms[code].hostId;
//       io.to(hostId).emit("joinAlert", { guestId: socket.id, code });
//       console.log("🔔 Join request from", socket.id, "for room", code);
//     } else {
//       socket.emit("invalidCode");
//       console.log("❌ Invalid code attempted:", code);
//     }
//   });

//   // host approves guest
//   socket.on("approveJoin", ({ guestId, code }) => {
//     const room = rooms[code];
//     if (!room) return;
//     room.guests.add(guestId);
//     // inform guest to join
//     io.to(guestId).emit("joinSuccess", code);
//     // notify host (optional)
//     io.to(room.hostId).emit("guestJoined", guestId);
//     console.log("✅ Approved guest", guestId, "for room", code);
//   });

//   // host denies guest
//   socket.on("denyJoin", (guestId) => {
//     io.to(guestId).emit("joinDenied");
//     console.log("❌ Denied guest", guestId);
//   });

//   // client asks server to join the socket.io room
//   socket.on("joinRoom", (code) => {
//     socket.join(code);
//     console.log(`🚪 ${socket.id} joined socket.io room ${code}`);
//   });

//   // rejoin after refresh: role is "Host" or "Guest"
//   socket.on("rejoinRoom", ({ code, role }) => {
//     console.log(`🔄 Rejoin request: ${role} for room ${code}, socket ${socket.id}`);
    
//     if (role === "Host") {
//       // Clear any pending timeout since host is back
//       if (rooms[code] && rooms[code].hostTimeout) {
//         clearTimeout(rooms[code].hostTimeout);
//         delete rooms[code].hostTimeout;
//         console.log("⏱️  Cleared timeout for room", code);
//       }
      
//       if (rooms[code]) {
//         // Update to new socket ID - THIS IS THE KEY FIX
//         const oldHostId = rooms[code].hostId;
//         rooms[code].hostId = socket.id;
//         socket.join(code);
//         socket.emit("rejoinSuccess", code);
//         console.log(`✅ Host rejoined room ${code}: ${oldHostId} → ${socket.id}`);
//       } else {
//         // Room doesn't exist anymore
//         socket.emit("invalidCode");
//         console.log("❌ Room", code, "not found for host rejoin");
//       }
//       return;
//     }

//     // Guest rejoin
//     if (role === "Guest") {
//       if (rooms[code] && rooms[code].hostId) {
//         rooms[code].guests.add(socket.id);
//         socket.join(code);
//         socket.emit("rejoinSuccess", code);
//         console.log("✅ Guest rejoined room", code, socket.id);
//       } else {
//         socket.emit("invalidCode");
//         console.log("❌ Room", code, "not found for guest rejoin");
//       }
//     }
//   });

//   // send message => broadcast to others in room
//   socket.on("sendMessage", ({ roomCode, sender, message }) => {
//     console.log(`💬 Message in room ${roomCode} from ${sender}: ${message}`);
//     socket.to(roomCode).emit("receiveMessage", { sender, message });
//   });

//   // guest/host leaves room manually (explicit disconnect)
//   socket.on("leaveRoom", (code) => {
//     socket.leave(code);
//     if (rooms[code]) {
//       // Check if this is the host leaving
//       if (rooms[code].hostId === socket.id) {
//         // Host manually left: immediately close room
//         console.log("🚪 Host manually disconnected from room", code);
        
//         // Clear any pending timeout
//         if (rooms[code].hostTimeout) {
//           clearTimeout(rooms[code].hostTimeout);
//         }
        
//         // Notify all guests
//         for (const g of rooms[code].guests) {
//           io.to(g).emit("roomClosed");
//           const s = io.sockets.sockets.get(g);
//           if (s) s.leave(code);
//         }
        
//         // Delete the room
//         delete rooms[code];
//         console.log("🗑️  Room closed and deleted", code);
//       } else {
//         // Guest left
//         rooms[code].guests.delete(socket.id);
//         io.to(rooms[code].hostId).emit("receiveMessage", {
//         sender: "System",
//         message: "Guest left the room",
//       });
//         console.log("👋 Guest left room", code);
//       }
//     }
//   });

//   // socket disconnect cleanup (could be refresh or actual disconnect)
//   socket.on("disconnect", () => {
//     console.log("🔌 Socket disconnected", socket.id);
    
//     // Check all rooms for this socket
//     for (const code of Object.keys(rooms)) {
//       if (rooms[code].hostId === socket.id) {
//         // Host disconnected - set a timeout before deleting room
//         console.log(`⏳ Host disconnected from room ${code}, starting ${RECONNECT_GRACE_PERIOD/1000}s grace period...`);
        
//         // Clear any existing timeout
//         if (rooms[code].hostTimeout) {
//           clearTimeout(rooms[code].hostTimeout);
//         }
        
//         // Set new timeout
//         rooms[code].hostTimeout = setTimeout(() => {
//           console.log(`⏱️  Grace period expired for room ${code}, closing room`);
          
//           // Notify all guests
//           for (const g of rooms[code].guests) {
//             io.to(g).emit("roomClosed");
//             const s = io.sockets.sockets.get(g);
//             if (s) s.leave(code);
//           }
          
//           // Delete the room
//           delete rooms[code];
//           console.log("🗑️  Room deleted:", code);
//         }, RECONNECT_GRACE_PERIOD);
        
//       } else if (rooms[code].guests.has(socket.id)) {
//         // Guest disconnected - give them grace period too
//         console.log(`👤 Guest ${socket.id} disconnected from room ${code}`);
//         // Don't immediately remove, they might reconnect
//       }
//     }
//   });
// });

// server.listen(5000, () => console.log("🚀 Server running on :5000"));


// server.js
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// MongoDB Schema
const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 4
  },
  hostId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

roomSchema.index({ code: 1 });
roomSchema.index({ status: 1 });

const Room = mongoose.model('Room', roomSchema);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

console.log("🔌 Attempting to connect to MongoDB...");
console.log("📍 URI:", MONGODB_URI.includes('@') ? 'MongoDB Atlas (credentials hidden)' : MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log("📦 Database name:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("⚠️  Server will continue running but database features will not work");
  });

// Monitor MongoDB connection status
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://secret-chatting-app.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://secret-chatting-app.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get("/", async (req, res) => {
  try {
    const activeRooms = await Room.countDocuments({ status: 'active' });
    res.json({ 
      status: "Server is running", 
      activeRooms: activeRooms,
      memoryRooms: Object.keys(rooms).length,
      mongoConnected: mongoose.connection.readyState === 1
    });
  } catch (error) {
    res.json({ 
      status: "Server is running", 
      error: "Database query failed",
      memoryRooms: Object.keys(rooms).length 
    });
  }
});

// rooms: map code -> { hostId: string, guests: Set<string>, hostTimeout?: NodeJS.Timeout }
const rooms = {};

// Grace period for reconnection (10 seconds)
const RECONNECT_GRACE_PERIOD = 10000;

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);
  console.log("📊 Total active connections:", io.engine.clientsCount);
  
  // Send connection confirmation
  socket.emit("connected", { socketId: socket.id });

  // Create room (host)
  socket.on("createRoom", async () => {
    console.log("📥 Received createRoom request from", socket.id);
    let code;
    let roomExists = true;
    
    try {
      // Generate unique code
      let attempts = 0;
      do {
        code = String(Math.floor(1000 + Math.random() * 9000));
        // Check both in-memory and database
        const dbRoom = await Room.findOne({ code, status: 'active' });
        roomExists = rooms[code] || dbRoom;
        attempts++;
        console.log(`🔍 Checking code ${code}, exists: ${roomExists}, attempt: ${attempts}`);
      } while (roomExists && attempts < 10);
      
      if (attempts >= 10) {
        console.error("❌ Could not generate unique code after 10 attempts");
        socket.emit("roomCreationFailed");
        return;
      }
      
      // Save to MongoDB
      const newRoom = new Room({
        code: code,
        hostId: socket.id,
        status: 'active'
      });
      await newRoom.save();
      console.log("💾 Room saved to MongoDB:", code);
      
      // Save to in-memory
      rooms[code] = { hostId: socket.id, guests: new Set() };
      socket.join(code);
      
      // Emit room created event
      socket.emit("roomCreated", code);
      console.log("✅ roomCreated event emitted to", socket.id, "with code:", code);
      console.log("🏠 Created room", code, "host", socket.id);
    } catch (error) {
      console.error("❌ Error creating room in DB:", error);
      console.error("Error details:", error.message);
      socket.emit("roomCreationFailed", { error: error.message });
    }
  });

  // Guest requests to join (host gets alert)
  socket.on("joinRequest", async (code) => {
    try {
      // Verify code exists in database
      const dbRoom = await Room.findOne({ code, status: 'active' });
      
      if (dbRoom && rooms[code] && rooms[code].hostId) {
        const hostId = rooms[code].hostId;
        io.to(hostId).emit("joinAlert", { guestId: socket.id, code });
        console.log("🔔 Join request from", socket.id, "for room", code);
      } else {
        socket.emit("invalidCode");
        console.log("❌ Invalid code attempted:", code);
      }
    } catch (error) {
      console.error("❌ Error verifying code:", error);
      socket.emit("invalidCode");
    }
  });

  // Host approves guest
  socket.on("approveJoin", ({ guestId, code }) => {
    const room = rooms[code];
    if (!room) return;
    room.guests.add(guestId);
    io.to(guestId).emit("joinSuccess", code);
    io.to(room.hostId).emit("guestJoined", guestId);
    console.log("✅ Approved guest", guestId, "for room", code);
  });

  // Host denies guest
  socket.on("denyJoin", (guestId) => {
    io.to(guestId).emit("joinDenied");
    console.log("❌ Denied guest", guestId);
  });

  // Client joins the socket.io room
  socket.on("joinRoom", (code) => {
    socket.join(code);
    console.log(`🚪 ${socket.id} joined socket.io room ${code}`);
  });

  // Rejoin after refresh: role is "Host" or "Guest"
  socket.on("rejoinRoom", async ({ code, role }) => {
    console.log(`🔄 Rejoin request: ${role} for room ${code}, socket ${socket.id}`);
    
    try {
      // Verify room exists in database
      const dbRoom = await Room.findOne({ code, status: 'active' });
      
      if (role === "Host") {
        // Clear any pending timeout since host is back
        if (rooms[code] && rooms[code].hostTimeout) {
          clearTimeout(rooms[code].hostTimeout);
          delete rooms[code].hostTimeout;
          console.log("⏱️  Cleared timeout for room", code);
        }
        
        if (rooms[code] && dbRoom) {
          // Update to new socket ID
          const oldHostId = rooms[code].hostId;
          rooms[code].hostId = socket.id;
          
          // Update hostId in database
          await Room.updateOne({ code }, { hostId: socket.id });
          
          socket.join(code);
          socket.emit("rejoinSuccess", code);
          console.log(`✅ Host rejoined room ${code}: ${oldHostId} → ${socket.id}`);
        } else {
          // Room doesn't exist anymore
          socket.emit("invalidCode");
          console.log("❌ Room", code, "not found for host rejoin");
        }
        return;
      }

      // Guest rejoin
      if (role === "Guest") {
        if (rooms[code] && rooms[code].hostId && dbRoom) {
          rooms[code].guests.add(socket.id);
          socket.join(code);
          socket.emit("rejoinSuccess", code);
          console.log("✅ Guest rejoined room", code, socket.id);
        } else {
          socket.emit("invalidCode");
          console.log("❌ Room", code, "not found for guest rejoin");
        }
      }
    } catch (error) {
      console.error("❌ Error during rejoin:", error);
      socket.emit("invalidCode");
    }
  });

  // Send message => broadcast to others in room
  socket.on("sendMessage", ({ roomCode, sender, message }) => {
    console.log(`💬 Message in room ${roomCode} from ${sender}`);
    socket.to(roomCode).emit("receiveMessage", { sender, message });
  });

  // Guest/host leaves room manually (explicit disconnect)
  socket.on("leaveRoom", async (code) => {
    socket.leave(code);
    if (rooms[code]) {
      // Check if this is the host leaving
      if (rooms[code].hostId === socket.id) {
        // Host manually left: immediately close room
        console.log("🚪 Host manually disconnected from room", code);
        
        // Clear any pending timeout
        if (rooms[code].hostTimeout) {
          clearTimeout(rooms[code].hostTimeout);
        }
        
        // Notify all guests
        for (const g of rooms[code].guests) {
          io.to(g).emit("roomClosed");
          const s = io.sockets.sockets.get(g);
          if (s) s.leave(code);
        }
        
        // Delete from database
        try {
          await Room.deleteOne({ code });
          console.log("🗑️  Room deleted from MongoDB:", code);
        } catch (error) {
          console.error("❌ Error deleting room from DB:", error);
        }
        
        // Delete from in-memory
        delete rooms[code];
        console.log("🗑️  Room closed and deleted from memory:", code);
      } else {
        // Guest left
        rooms[code].guests.delete(socket.id);
        io.to(rooms[code].hostId).emit("receiveMessage", {
          sender: "System",
          message: "Guest left the room",
        });
        console.log("👋 Guest left room", code);
      }
    }
  });

  // Socket disconnect cleanup (could be refresh or actual disconnect)
  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
    
    // Check all rooms for this socket
    for (const code of Object.keys(rooms)) {
      if (rooms[code].hostId === socket.id) {
        // Host disconnected - set a timeout before deleting room
        console.log(`⏳ Host disconnected from room ${code}, starting ${RECONNECT_GRACE_PERIOD/1000}s grace period...`);
        
        // Clear any existing timeout
        if (rooms[code].hostTimeout) {
          clearTimeout(rooms[code].hostTimeout);
        }
        
        // Set new timeout
        rooms[code].hostTimeout = setTimeout(async () => {
          console.log(`⏱️  Grace period expired for room ${code}, closing room`);
          
          // Notify all guests
          for (const g of rooms[code].guests) {
            io.to(g).emit("roomClosed");
            const s = io.sockets.sockets.get(g);
            if (s) s.leave(code);
          }
          
          // Delete from database
          try {
            await Room.deleteOne({ code });
            console.log("🗑️  Room deleted from MongoDB after timeout:", code);
          } catch (error) {
            console.error("❌ Error deleting room from DB:", error);
          }
          
          // Delete from in-memory
          delete rooms[code];
          console.log("🗑️  Room deleted from memory:", code);
        }, RECONNECT_GRACE_PERIOD);
        
      } else if (rooms[code].guests.has(socket.id)) {
        // Guest disconnected - give them grace period too
        console.log(`👤 Guest ${socket.id} disconnected from room ${code}`);
        // Don't immediately remove, they might reconnect
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI.includes('@') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
});
