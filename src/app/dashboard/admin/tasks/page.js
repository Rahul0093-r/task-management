'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/cookies';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

export default function AdminTasksMonitor() {
  const [adminSession, setAdminSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEmail, setSelectedEmail] = useState('');

  const router = useRouter();

  useEffect(() => {
    const session = getCookie('adminSession');
    if (!session) {
      router.push('/admin');
      return;
    }
    setAdminSession(JSON.parse(session));
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Listeners
  useEffect(() => {
    setLoading(true);

    // 1. Employees Listener
    const employeesQuery = collection(db, 'employees');
    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const empList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(empList);
    });

    // 2. Tasks Listener
    const tasksQuery = query(collection(db, 'employee_tasks'), orderBy('updatedAt', 'desc'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      console.error("Error in tasks listener:", error);
      setLoading(false);
    });

    return () => {
      unsubEmployees();
      unsubTasks();
    };
  }, []);

  const calculateLiveTime = (task) => {
    const baseSeconds = parseInt(task.accumulatedSeconds) || 0;
    if (task.status === 'In Progress' && task.startTime) {
      const start = task.startTime instanceof Timestamp ? task.startTime.toDate() : new Date(task.startTime);
      const sessionSeconds = Math.max(0, Math.floor((currentTime - start) / 1000));
      return baseSeconds + sessionSeconds;
    }
    return baseSeconds;
  };

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!adminSession) return null;

  const filteredTasks = selectedEmail ? tasks.filter(t => t.employeeEmail === selectedEmail) : tasks;
  const selectedEmpData = employees.find(e => e.email === selectedEmail);

  const stats = {
    ongoing: filteredTasks.filter(t => t.status === 'In Progress').length,
    pending: filteredTasks.filter(t => t.status === 'ToDo').length,
    completed: filteredTasks.filter(t => {
      if (t.status !== 'Done') return false;
      const endTime = t.endTime?.toDate ? t.endTime.toDate() : (t.endTime ? new Date(t.endTime) : null);
      if (!endTime) return false;
      const today = new Date();
      return endTime.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <Navbar session={adminSession} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} role="Administrator" />

        <main className="p-6 md:p-8 flex-1">
          <div className="">
            {/* Header with Search and Selection */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Task Tracking Center</h1>
                <p className="text-gray-600 font-medium text-base tracking-tight">Real-time overview of organizational productivity and tasks.</p>
              </div>

              <div className="flex items-center bg-white p-3 rounded-[1.5rem] shadow-xl shadow-indigo-100/30 border border-gray-100 w-full lg:w-auto">
                <div className="px-5 py-1 border-r border-gray-100 flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Employee Filter</span>
                </div>
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-base font-semibold text-gray-800 pr-10 pl-6 cursor-pointer uppercase tracking-tight"
                >
                  <option value="">All Employee View</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.email}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Transition - Show Global Overview or Deep Dive */}
            {!selectedEmail ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all">
                  <p className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-2">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tighter">{tasks.length}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-2">Across all departments</p>
                </div>
                <div className="bg-indigo-600 p-6 rounded-[1.5rem] text-white shadow-xl shadow-indigo-200 flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-1 transition-all">
                  <p className="text-indigo-100 font-semibold text-xs uppercase tracking-wider mb-2">Active Tasks</p>
                  <p className="text-3xl font-bold tracking-tighter">{stats.ongoing}</p>
                  <p className="text-xs font-semibold mt-2 opacity-80">Currently in progress</p>
                </div>
                <div className="bg-emerald-500 p-6 rounded-[1.5rem] text-white shadow-xl shadow-emerald-200 flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-1 transition-all">
                  <p className="text-emerald-50 font-semibold text-xs uppercase tracking-wider mb-2">Completed Tasks</p>
                  <p className="text-3xl font-bold tracking-tighter">{stats.completed}</p>
                  <p className="text-xs font-semibold mt-2 opacity-80">Successfully delivered</p>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-900 rounded-[1.5rem] p-6 mb-8 text-white relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-white rounded-[1.5rem] flex items-center justify-center text-indigo-900 text-4xl font-bold shadow-2xl">
                      {selectedEmpData?.fullName?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{selectedEmpData?.fullName}</h2>
                      <p className="text-indigo-200 font-semibold uppercase tracking-wider text-sm">Employee Task Overview</p>
                      <div className="mt-4 flex space-x-3">
                        <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-semibold tracking-wider uppercase">{selectedEmpData?.role || 'Member'}</span>
                        <span className="px-4 py-2 bg-emerald-400 text-emerald-900 rounded-full text-xs font-bold tracking-wider uppercase">Active Connection</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 min-w-[120px]">
                      <p className="text-3xl font-bold text-amber-400 mb-0.5">{stats.pending}</p>
                      <p className="text-[10px] font-semibold text-indigo-100 uppercase tracking-widest">To Do</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 min-w-[120px]">
                      <p className="text-3xl font-bold text-indigo-300 mb-0.5">{stats.ongoing}</p>
                      <p className="text-[10px] font-semibold text-indigo-100 uppercase tracking-widest">In Progress</p>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-2xl border border-white/20 min-w-[120px] shadow-2xl">
                      <p className="text-3xl font-bold text-emerald-400 mb-0.5">{stats.completed}</p>
                      <p className="text-[10px] font-semibold text-white uppercase tracking-widest">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monitoring Grid */}
            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEmail ? `${selectedEmpData?.fullName?.split(' ')[0]}'s Task List` : 'All Employee Tasks'}
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Live Sync Active</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      {!selectedEmail && <th className="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Member</th>}
                      <th className="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Assignment</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan="4" className="py-20 text-center animate-pulse text-gray-400 font-semibold text-sm uppercase tracking-widest">Loading Task Data...</td></tr>
                    ) : filteredTasks.length === 0 ? (
                      <tr><td colSpan="4" className="py-20 text-center text-gray-500 font-medium text-lg">No tasks found.</td></tr>
                    ) : (
                      filteredTasks
                        .filter(task => {
                          if (task.status !== 'Done') return true;
                          const endTime = task.endTime?.toDate ? task.endTime.toDate() : (task.endTime ? new Date(task.endTime) : null);
                          if (!endTime) return false;
                          const today = new Date();
                          return endTime.toDateString() === today.toDateString();
                        })
                        .map((task) => {
                        const totalSecs = calculateLiveTime(task);
                        const isLive = task.status === 'In Progress' && task.startTime;
                        return (
                          <tr key={task.id} className="group hover:bg-slate-50 transition-all">
                            {!selectedEmail && (
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-semibold text-gray-600">
                                    {employees.find(e => e.email === task.employeeEmail)?.fullName?.charAt(0) || '?'}
                                  </div>
                                  <p className="text-sm font-semibold text-gray-900">{employees.find(e => e.email === task.employeeEmail)?.fullName.split(' ')[0]}</p>
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <p className="text-base font-semibold text-gray-800 mb-0.5">{task.title}</p>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{task.projectName}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase ${task.status === 'Done' ? 'bg-emerald-50 text-emerald-600' :
                                task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                {task.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-xl tracking-tighter tabular-nums text-gray-900">
                              <span className={isLive ? 'text-indigo-600' : 'text-gray-500'}>
                                {formatDuration(totalSecs)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
