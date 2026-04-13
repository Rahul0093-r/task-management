'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function EmployeeSidebar({ isOpen, onToggle }) {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState('dashboard');

  useEffect(() => {
    if (pathname === '/dashboard/employee') {
      setActiveItem('dashboard');
    } else if (pathname === '/dashboard/employee/tasks') {
      setActiveItem('tasks');
    } else if (pathname.includes('/dashboard/employee/tasks/history')) {
      setActiveItem('history');
    } else if (pathname.includes('/dashboard/employee/attendance')) {
      setActiveItem('attendance');
    } else if (pathname.includes('/dashboard/employee/profile')) {
      setActiveItem('profile');
    }
  }, [pathname]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'tasks', label: 'My Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'history', label: 'Task History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
    if (itemId === 'dashboard') {
      router.push('/dashboard/employee');
    } else if (itemId === 'tasks') {
      router.push('/dashboard/employee/tasks');
    } else if (itemId === 'history') {
      router.push('/dashboard/employee/tasks/history');
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:fixed lg:h-screen lg:z-40 lg:overflow-y-auto
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Employee Portal</span>
            </div>
            <button onClick={onToggle} className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                  ${activeItem === item.id
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                handleLogout();
                router.push('/');
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
