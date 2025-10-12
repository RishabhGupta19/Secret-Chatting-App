

import ReactDOM from "react-dom";
import { useState } from "react";
import { socket } from "./socket"; // ✅ Import same socket from shared file (see below)

const Join = ({ onConfirm, onCancel }) => {
  const [message, setMessage] = useState("");
  const [Code, setCode] = useState("");

  const handleJoin = () => {
    if (Code.trim().length !== 4) {
      setMessage("Enter valid 4-digit code");
      return;
    }

    // ✅ Emit join request to backend
    socket.emit("joinRequest", Code);

    if (onConfirm) onConfirm();
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Enter Your Code</h2>
        <p>Please enter the 4-digit code below:</p>
        <br />
        <input
          type="number"
          name="Code"
          id="Code"
          placeholder="Enter your code..."
          value={Code}
          onChange={(e) => setCode(e.target.value)}
        />
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="delete-btn" onClick={handleJoin}>
            Connect
          </button>
        </div>
        {message && <p className="mt-3 text-red-400">{message}</p>}
      </div>
    </div>,
    document.body
  );
};

export default Join;
