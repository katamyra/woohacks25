'use client';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';

export function Header() {
  const router = useRouter();
  const { notifications } = useNotification();

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <div className="navbar bg-gray-900">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost text-white bg-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content text-white bg-gray-900 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li>
              <button onClick={() => handleNavigation('/address')}>
                Address
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation('/preferences')}>
                Preferences
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation('/review')}>
                Review Information
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation('/recommendations')}>
                Recommendations
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="navbar-center">
        <button onClick={() => handleNavigation('/')} className="btn btn-ghost text-xl text-gray-100">Emergency Assistant</button>
      </div>
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} role="button" className="btn btn-ghost  bg-blue-500 text-white">
            <div className="indicator">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="badge badge-xs badge-primary indicator-item">
                  {notifications.length}
                </span>
              )}
            </div>
          </label>
          <div tabIndex={0} className="dropdown-content z-[9999] menu p-2 shadow bg-gray-900 rounded-box w-64 absolute right-0">
            <div className="card-body p-2">
              {notifications.length === 0 ? (
                <span className="text-gray-100">No notifications</span>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="text-gray-100 border-b border-gray-800 pb-2 mb-2 last:border-0 last:mb-0">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-400">{notification.timestamp}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 