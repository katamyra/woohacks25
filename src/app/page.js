'use client';

import { firestoreService } from '../firebase/services/firestore';
import { useState } from 'react';

export default function Home() {
  const [testResult, setTestResult] = useState('');

  const testFirebaseConnection = async () => {
    try {
      const result = await firestoreService.testConnection();
      setTestResult(`✅ Firebase is connected! Test document created with ID: ${result.docId}`);
    } catch (error) {
      setTestResult(`❌ Firebase connection failed: ${error.message}`);
      console.error("Firebase test error:", error);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1>Name of Project</h1>
      
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={testFirebaseConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Test Firebase Connection
        </button>
        
        {testResult && (
          <p className="mt-4 p-4 rounded bg-gray-100 dark:bg-gray-800">
            {testResult}
          </p>
        )}
      </div>
    </div>
  );
}
