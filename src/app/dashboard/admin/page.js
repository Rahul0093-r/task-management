'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCookie } from '@/lib/cookies';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function AdminDashboard() {
  const [adminSession, setAdminSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Check if admin session exists in cookies
    const session = getCookie('adminSession');
    if (!session) {
      router.push('/admin');
      return;
    }

    try {
      const parsedSession = JSON.parse(session);
      setAdminSession(parsedSession);
      fetchDashboardData();
    } catch (error) {
      router.push('/admin');
    }
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch Employees
      const empQuery = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const empSnapshot = await getDocs(empQuery);
      const empList = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch Projects
      const projSnapshot = await getDocs(collection(db, 'projects'));

      // Fetch Tasks
      const tasksSnapshot = await getDocs(collection(db, 'employee_tasks'));
      const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setStats({
        totalEmployees: empSnapshot.size,
        totalProjects: projSnapshot.size,
        activeTasks: allTasks.filter(t => t.status === 'In Progress' || t.status === 'ToDo').length,
        completedTasks: allTasks.filter(t => t.status === 'Done').length
      });

      setEmployees(empList.slice(0, 5)); // Show latest 5 employees
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeTasks = async (employeeId) => {
    try {
      const tasksQuery = query(collection(db, 'employee_tasks'), where('employeeEmail', '==', employeeId));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployeeTasks(tasks);
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      fetchEmployeeTasks(employee.email);
    } else {
      setEmployeeTasks([]);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!adminSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="lg:ml-64 flex-1 flex flex-col transition-all duration-300">
        <Navbar
          session={adminSession}
          onSidebarToggle={toggleSidebar}
          sidebarOpen={sidebarOpen}
          role="Administrator"
        />

        <main className="flex-1 p-6 md:p-10">
          <div className="">
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Employees', value: stats.totalEmployees, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'indigo' },
                { label: 'Total Projects', value: stats.totalProjects, icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', color: 'purple' },
                { label: 'Active Tasks', value: stats.activeTasks, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'red' },
                { label: 'Completed', value: stats.completedTasks, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'green' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center transition-colors`}>
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-3xl font-black text-gray-900 transition-all duration-300">{loading ? '...' : item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Employee Directory Preview */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 leading-none">Employee Directory</h2>
                    <p className="text-gray-400 text-sm mt-2 font-medium">Recently joined team members</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/admin/employees')}
                    className="text-indigo-600 font-bold text-sm hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="p-0">
                  {loading ? (
                    <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Loading members...</div>
                  ) : employees.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 font-bold italic italic">No employees found yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50">
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {employees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-5">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                    {emp.fullName?.charAt(0) || 'E'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-gray-900">{emp.fullName}</p>
                                    <p className="text-xs text-gray-400 font-medium">{emp.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase">
                                  Active
                                </span>
                              </td>
                              <td className="px-8 py-5 text-gray-400 text-xs font-bold">
                                {emp.createdAt?.toDate ? emp.createdAt.toDate().toLocaleDateString() : 'Recent'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions & Recent Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-gray-900 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => router.push('/dashboard/admin/projects')}
                      className="flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 rounded-2xl text-indigo-700 transition-all font-bold group"
                    >
                      <span>Create New Project</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl text-purple-700 transition-all font-bold group"
                    >
                      <span>Add New Employee</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <h3 className="text-xl font-black mb-2">Pro Tip</h3>
                  <p className="text-indigo-200 text-sm font-medium leading-relaxed">
                    Check the "Manage Projects" section to assign tasks to your employees and track their daily progress in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
