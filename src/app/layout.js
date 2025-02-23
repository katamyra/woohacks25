'use client';

import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import AlertNotifier from '@/components/AlertNotifier';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const steps = [
    { name: 'Login', path: '/' },
    { name: 'Address', path: '/address' },
    { name: 'Preferences', path: '/preferences' },
    { name: 'Review', path: '/review' },
    { name: 'Recommendations', path: '/recommendations' },
  ];

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AlertNotifier />
          <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="container mx-auto px-4 py-8">
              <div className="flex justify-between items-center mb-8">
                <ul className="steps steps-neutral flex-1">
                  {steps.map((step, index) => {
                    const isActive = pathname === step.path;
                    const isCompleted = steps.findIndex(s => s.path === pathname) > index;
                    
                    return (
                      <li
                        key={step.name}
                        className={`step ${isActive ? 'step-primary' : ''} ${isCompleted ? 'step-primary' : ''}`}
                        data-content={isCompleted ? '✓' : ''}
                      >
                        {step.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
              
              {children}
            </div>
          </div>
          
          <Script 
            src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
            strategy="lazyOnload"
          />
          <df-messenger
             project-id={process.env.NEXT_PUBLIC_PROJECT_ID}
             agent-id={process.env.NEXT_PUBLIC_AGENT_ID}
             language-code="en"
             chat-title="Emergency Assistant"
            style={{ 
              width: '100%',
              maxWidth: '400px',
              height: '500px',
              position: 'fixed',
              bottom: '20px',
              right: '20px'
            }}
          ></df-messenger>
        </AuthProvider>
      </body>
    </html>
  );
}
