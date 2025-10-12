import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx"; // This will be your Host UI
import Guest from "./Guest.jsx"; // This is your Guest UI
import Chatting from './chatting'
// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Host route
  },
  {
    path: "/guestroom",
    element: <Guest />, // Guest route
  },
  {
    path:"/createchat",
    element:<Chatting/>
  }
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

