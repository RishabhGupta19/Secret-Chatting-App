
import { io } from "socket.io-client";

export const socket = io("https://secret-chatting-app.onrender.com", {
  transports: ["websocket"], // ensures stable connection
});
