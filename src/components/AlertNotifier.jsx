'use client';

import { useEffect, useRef, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';

export default function AlertNotifier() {
  const { addNotification } = useNotification();

  // Ref for the timeout to auto-dismiss the alert
  const alertTimeoutRef = useRef(null);

  // State to control the DaisyUI alert popup
  const [visibleAlert, setVisibleAlert] = useState(null);

  // 3 predefined notifications that will be cycled through on each interval
  const predefinedNotifications = [
    { message: 'Predefined Alert 1: High Priority Alert' },
    { message: 'Predefined Alert 2: System Warning' },
    { message: 'Predefined Alert 3: Maintenance Reminder' },
  ];

  // A ref to keep track of which notification to display next
  const notificationIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Get the current predefined notification
      const current = predefinedNotifications[notificationIndex.current % predefinedNotifications.length];

      // Create a new notification object with an id and timestamp
      const newNotification = {
        id: Date.now(),
        message: current.message,
        timestamp: new Date().toLocaleTimeString(),
      };

      // Instead of a browser alert, show a DaisyUI alert popup by setting local state
      setVisibleAlert(newNotification);

      // Clear any existing dismiss timer so that only one is active at a time.
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }

      // Auto-dismiss the alert after 5 seconds
      alertTimeoutRef.current = setTimeout(() => {
        setVisibleAlert(null);
      }, 5000);

      // Store the notification in the notifications tab via context
      addNotification(newNotification);

      // Increment the index to use the next predefined notification
      notificationIndex.current++;
    }, 12000); 

    return () => clearInterval(interval);
  }, [addNotification, predefinedNotifications]);

  return (
    <>
      {visibleAlert && (
        <div
          role="alert"
          className="alert alert-info fixed top-4 right-4 z-[10000] shadow-lg w-40 flex items-center justify-between rounded-lg p-2"
        >
          <div className="flex items-center space-x-1 overflow-hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info h-6 w-6 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {visibleAlert.message}
            </span>
          </div>
          <button
            onClick={() => setVisibleAlert(null)}
            className="btn btn-xs btn-circle"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
} 