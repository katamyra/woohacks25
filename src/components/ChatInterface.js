'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatInterface() {
  const router = useRouter();
  // State for storing messages and the current user input
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Function to send a message
  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Log the user message and update state
    console.log('User message:', trimmedInput);
    const userMessage = { sender: 'user', content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);

    // Check for emergency keywords (case insensitive)
    const lowerInput = trimmedInput.toLowerCase();
    const emergencyKeywords = [
      'medical emergency',
      'emergency',
      'ambulance',
      'heart attack',
      'stroke',
      'bleeding',
      'unconscious',
      'not breathing'
    ];

    if (emergencyKeywords.some(keyword => lowerInput.includes(keyword))) {
      console.log('Emergency detected!');
      const emergencyMessage = {
        sender: 'assistant',
        content: '⚠️ This appears to be a medical emergency. Redirecting you to emergency resources...'
      };
      setMessages(prev => [...prev, emergencyMessage]);

      // Redirect after a short delay so the emergency message can be seen
      setTimeout(() => {
        router.push('/recommendations');
      }, 1500);
    }

    // Clear the input field
    setInput('');
  };

  // Send message on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="card w-80 bg-base-100 shadow-xl fixed bottom-4 right-4 z-50">
      <div className="card-body">
        <h3 className="card-title mb-4">Chat</h3>
        {/* Message history container */}
        <div className="overflow-y-auto h-52 p-2 border border-gray-200 rounded mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={msg.sender === 'user' ? "text-blue-500 mb-2" : "text-green-500 mb-2"}
            >
              <strong>{msg.sender}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <div className="input-group">
          <input
            type="text"
            placeholder="Type a message..."
            className="input input-bordered flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={sendMessage} className="btn btn-primary">
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 