'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/cookies';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

export default function EmployeesPage() {
  const [adminSession, setAdminSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const session = getCookie('adminSession');
    if (!session) {
      router.push('/admin');
      return;
    }
    setAdminSession(JSON.parse(session));
    fetchEmployees();
  }, [router]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(list);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee record?")) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  if (!adminSession) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <Navbar
          session={adminSession}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          role="Administrator"
        />

        <main className="p-8 md:p-12 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Employees</h1>
                <p className="text-gray-500 mt-2 font-medium">View and manage your organization's workforce.</p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loading ? (
                <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest text-xs">Fetching Staff Records...</div>
              ) : employees.length === 0 ? (
                <div className="p-20 text-center text-gray-400">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="font-bold text-gray-500">No employees found.</p>
                  <p className="text-sm text-gray-400 mt-2">Registers through the employee portal to see them here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Profile</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Join Date</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">
                                {emp.fullName?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900">{emp.fullName || 'Anonymous'}</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-green-100 text-green-700 uppercase mt-1">
                                  Online
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                            {emp.email}
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg uppercase">
                              {emp.role || 'Member'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-gray-400 text-xs font-bold">
                            {emp.createdAt?.toDate ? emp.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'}
                          </td>
                          <td className="px-8 py-6">
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
