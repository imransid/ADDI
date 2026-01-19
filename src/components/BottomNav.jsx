import React from 'react';
import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/', icon: HomeIcon },
  { label: 'Product', path: '/product', icon: ProductIcon },
  { label: 'Prize', path: '/prize', icon: PrizeIcon },
  { label: 'Me', path: '/user', icon: UserIcon },
];

function BottomNav({ currentPath }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm z-50">
      <ul className="flex justify-around text-xs">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <li key={item.path} className="flex-1">
              <Link
                to={item.path}
                className={
                  'flex flex-col items-center py-2 ' +
                  (isActive ? 'text-primary font-medium' : 'text-gray-500 hover:text-primary')
                }
              >
                <item.icon active={isActive} />
                <span className="mt-1 text-[10px] capitalize">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Icon components. Using simple SVGs to avoid external dependencies. Each icon accepts an 'active' prop.
 */
function HomeIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke={active ? 'currentColor' : 'currentColor'}
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10l9-7 9 7v10a1 1 0 01-1 1h-5a1 1 0 01-1-1V14H9v6a1 1 0 01-1 1H3a1 1 0 01-1-1V10z"
      />
    </svg>
  );
}

function ProductIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke={active ? 'currentColor' : 'currentColor'}
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12H4"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v16"
      />
    </svg>
  );
}

function CashbackIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke={active ? 'currentColor' : 'currentColor'}
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 1.79-3 4s1.343 4 3 4 3-1.79 3-4-1.343-4-3-4z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4h4l3 6v6l-3 6H3M21 4h-4l-3 6v6l3 6h4"
      />
    </svg>
  );
}

function PrizeIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke={active ? 'currentColor' : 'currentColor'}
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v13M5 8v13m14-13v13M3 8h18M4 4h16l-2 4H6L4 4z"
      />
    </svg>
  );
}

function UserIcon({ active }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke={active ? 'currentColor' : 'currentColor'}
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 14a4 4 0 01-8 0M12 8a4 4 0 110-8 4 4 0 010 8zM8 14h8"
      />
    </svg>
  );
}

export default BottomNav;