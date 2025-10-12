import React from 'react';
// Import the necessary hook from react-router-dom
import { useNavigate } from 'react-router-dom'; 
import './Home.css'; 

// The main UI component for the Home page
const Home = () => {
    // Initialize the navigation function
    const navigate = useNavigate();

    // Handler function for the Create Chat button
    const handleCreateChat = () => {
        // Navigates to the route defined as "/createchat"
        navigate('/createchat');
    };

    // Handler function for the Join Chat button
    const handleJoinChat = () => {
        // Navigates to the route defined as "/guestroom" (Guest UI)
        navigate('/guestroom');
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <h1>Welcome to Secret Chat Room</h1>
                <p>Choose an option to start a conversation.</p>
            </header>
            
            <main className="options-panel">
                
                {/* Create Chat Button/Card */}
                <div className="option-card create-chat-card">
                    <h2>Start a New Chat</h2>
                    <p>Create a unique room and invite your friends.</p>
                    <button 
                        className="action-button create-button" 
                        onClick={handleCreateChat} // Updated click handler
                    >
                        Create Chat ➕
                    </button>
                </div>

                {/* Join Chat Button/Card */}
                <div className="option-card join-chat-card">
                    <h2>Join an Existing Chat</h2>
                    <p>Enter a room ID or link to join a conversation.</p>
                    <button 
                        className="action-button join-button" 
                        onClick={handleJoinChat} // Updated click handler
                    >
                        Join Chat 🤝
                    </button>
                </div>
            </main>

            <footer className="home-footer">
                <p>&copy; 2025 Chat App. Simple and fast messaging.</p>
            </footer>
        </div>
    );
};

export default Home;