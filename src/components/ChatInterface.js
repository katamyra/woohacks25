'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { authService } from '@/firebase/services/auth';
import { firestoreService } from '@/firebase/services/firestore';

// Persistent container outside component
let chatContainer;

export default function ChatInterface({ defaultExpanded = false }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [container, setContainer] = useState(null);

  useEffect(() => {
    if (!chatContainer) {
      chatContainer = document.createElement('div');
      document.body.appendChild(chatContainer);
    }
    setContainer(chatContainer);

    return () => {
      // Don't remove container - keep it mounted between page changes
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'REDIRECT') {
        router.push(event.data.path);
      }
      // Detect medical assistance requests
      if (event.data.type === 'CHAT_MESSAGE') {
        const messageText = event.data.text.toLowerCase();
        // Expanded list of medical emergency keywords
        const medicalKeywords = [
          'medical emergency',
          'need doctor',
          'heart attack',
          'bleeding',
          'unconscious',
          'can\'t breathe',
          'hospital'
        ];
        
        if (medicalKeywords.some(keyword => messageText.includes(keyword))) {
          handleMedicalEmergency();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  const handleMedicalEmergency = async () => {
    try {
      const user = authService.currentUser;
      if (user) {
        console.log('Medical emergency detected - updating user status');
        await firestoreService.updateUser(user.uid, {
          'status.medicalEmergency': true,
          'status.lastUpdated': new Date().toISOString(),
          'status.notes': 'User needs medical assistance ASAP'
        });
        console.log('Status updated - redirecting to recommendations');
        router.push('/recommendations');
      } else {
        console.warn('No user logged in for medical emergency');
        router.push('/login'); // Redirect to login if not authenticated
      }
    } catch (error) {
      console.error('Failed to update medical emergency status:', error);
      // Show error to user
      alert('Failed to process emergency request. Please try again.');
    }
  };

  if (!container) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50">
      <div className="chat-iframe-container">
        <iframe
          src="/chatbot.html"
          style={{ width: '100%', height: '600px', border: 'none' }}
          title="Dialogflow Chat"
        />
      </div>
    </div>,
    container
  );
} 