"use client";

import { useState, useEffect } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Script from "next/script";
import AlertNotifier from "@/components/AlertNotifier";
import { Header } from "@/components/ui/Header";
import { Roboto } from "next/font/google";
import StepsProgressWrapper from "@/components/StepsProgressWrapper";
import { usePathname } from "next/navigation";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pathname = usePathname();
  const steps = [
    { name: "Login", path: "/" },
    { name: "Address", path: "/address" },
    { name: "Preferences", path: "/preferences" },
    { name: "Review", path: "/review" },
    { name: "Recommendations", path: "/recommendations" },
  ];

  useEffect(() => {
    return () => {
      const dfMessenger = document.querySelector("df-messenger");
      if (dfMessenger) {
        dfMessenger.remove();
      }
    };
  }, []);

  return (
    <html lang="en" className={roboto.className}>
      <body className="flex flex-col min-h-screen">
        <Provider store={store}>
          <AuthProvider>
            <NotificationProvider>
              <div className="bg-white text-black">
                <AlertNotifier className="min-h-[50px]" />
              </div>

              <div className="bg-white text-black">
                <Header />
              </div>

              <main className="flex-grow bg-gray-800 text-gray-100 pb-4">
                <div className="container mx-auto px-4 py-4">
                  {pathname !== "/about" && (
                    <div className="flex justify-between items-center mb-4">
                      <StepsProgressWrapper steps={steps} currentPath={pathname} />
                    </div>
                  )}
                  {children}
                </div>
              </main>

              <footer className="bg-gray-800 text-gray-300 py-4">
                <div className="container mx-auto text-center">
                  &copy; {new Date().getFullYear()} Buzz Innovations. All rights reserved.
                </div>
              </footer>

              <Script
                src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
                strategy="lazyOnload"
                onLoad={() => setScriptLoaded(true)}
              />

              {scriptLoaded && (
                <div className="hidden md:block">
                  <df-messenger
                    project-id={process.env.NEXT_PUBLIC_PROJECT_ID}
                    agent-id={process.env.NEXT_PUBLIC_AGENT_ID}
                    language-code="en"
                    chat-title="Emergency Assistant"
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      height: "500px",
                      position: "fixed",
                      bottom: "20px",
                      right: "20px",
                    }}
                  ></df-messenger>
                </div>
              )}
            </NotificationProvider>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
