'use client';

import { useState } from 'react';
import { generateContent } from '@/services/gemini';

export default function GeminiTest() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testGemini = async () => {
    setLoading(true);
    try {
      const result = await generateContent("Write a short greeting");
      setResponse(result);
    } catch (error) {
      setResponse("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={testGemini}
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Test Gemini API'}
      </button>
      {response && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
} 