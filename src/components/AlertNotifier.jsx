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
    { message: 'ALERT: Wildfire detected 2 miles north of your location.' },
    { message: 'WARNING: High fire danger today. Red flag conditions with strong winds.' },
    { message: 'NOTICE: Planned controlled burn in your area tomorrow. No action needed.' },
  ];

  // A ref to keep track of which notification to display next
  const notificationIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Stop after showing all 3 notifications
      if (notificationIndex.current >= predefinedNotifications.length) {
        clearInterval(interval);
        return;
      }

      // notitfication object
      const current = predefinedNotifications[notificationIndex.current];
      const newNotification = {
        id: Date.now(),
        message: current.message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setVisibleAlert(newNotification);

      // clear any existing dismiss timer
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

  if (!visibleAlert) return null;

  // Add this check to prevent server/client mismatch
  if (typeof window === 'undefined') return null;

  return (
    <div
      role="alert"
      className={`alert alert-${visibleAlert.type} fixed text-white bg-gray-900 top-4 right-4 z-[10000] shadow-lg 
        w-64 flex items-center justify-between rounded-lg min-h-[70px] py-5`}
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-info h-8 w-8 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span className="text-base whitespace-normal overflow-auto">
          {visibleAlert.message}
        </span>
      </div>
      <button
        onClick={() => setVisibleAlert(null)}
        className="btn btn-sm btn-circle ml-2"
      >
        ✕
      </button>
    </div>
  );
}