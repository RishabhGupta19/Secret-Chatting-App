import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx"; // This will be your Host UI
import Guest from "./Guest.jsx"; // This is your Guest UI
import Chatting from './chatting'
// Define routes
import { HashRouter as Router, Routes, Route } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/guestroom" element={<Guest />} />
        <Route path="/createchat" element={<Chatting />} />
      </Routes>
    </Router>
  </StrictMode>
);


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

