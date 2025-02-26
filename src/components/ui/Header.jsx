'use client';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../../firebase/config';

export function Header() {
  const router = useRouter();
  const { notifications } = useNotification();

  const handleNavigation = (path) => {
    router.push(path);
  };
  const handleLoginNavigation = () => {
    router.push('/');
  };
  return (
    <div className="navbar bg-gray-800">
      {/* Toggle button inside nav bar*/}
      <div className="navbar-start">
        <div className="drawer z-[10000]">
          <input id="my-drawer" type="checkbox" className="drawer-toggle" />
          {/* Toggle button outside nav bar */}
          <div className="drawer-content">
            <label htmlFor="my-drawer" className="btn btn-ghost text-white bg-sky-500">
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
            </label>
          </div>
          {/* Nav bar */}
          <div className="drawer-side">
            {/* Close nav bar if clicking outside */}
            <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
            <ul className="menu bg-gray-800 text-white min-h-full w-80 p-4">
              <li>
                <label htmlFor="my-drawer" className="btn btn-ghost text-white bg-sky-500">
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
                </label>
              </li>
              {/* Nav bar page buttons below the toggle */}
              <li>
                <button onClick={handleLoginNavigation}>
                  Login
                </button>
              </li>
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
              <li>
                <button
                  onClick={() => handleNavigation('/about')}
                  className="hover:bg-blue-600"
                >
                  About
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="navbar-center">
        <button onClick={() => handleNavigation('/')} className="btn btn-ghost text-xl text-gray-100">BuzzLine</button>
      </div>
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} role="button" className="btn btn-ghost  bg-sky-500 text-white">
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