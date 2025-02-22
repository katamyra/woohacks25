'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatInterface() {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'REDIRECT') {
        router.push(event.data.path);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return (
    <div className="chat-iframe-container">
      <iframe
        src="/chatbot.html"
        style={{ width: '100%', height: '600px', border: 'none' }}
        title="Dialogflow Chat"
      />
    </div>
  );
} 