'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';

export default function TaskHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'ontime', 'overdue'

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
      return;
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user?.email) return;
    try {
      const q = query(
        collection(db, 'employee_tasks'),
        where('employeeEmail', '==', user.email),
        where('status', '==', 'Done'),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const taskList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskList);
    } catch (error) {
      console.error("Error fetching history: ", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'ontime') return !task.isOverdue;
    if (statusFilter === 'overdue') return task.isOverdue;
    return true;
  });

  const formatTime = (totalSeconds) => {
    const seconds = parseInt(totalSeconds) || 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (!user || !mounted) {
    return <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <EmployeeSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Navbar
          session={user}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          role="Employee"
        />

        <main className="flex-1 p-6 md:p-8 flex flex-col">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Task History</h1>
            <p className="text-gray-500 mt-2 font-medium">Detailed log of all your completed accomplishments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xl shadow-indigo-100/50' : 'bg-white border-gray-200 text-gray-900 hover:border-indigo-200'}`} onClick={() => setStatusFilter('all')}>
              <p className={`${statusFilter === 'all' ? 'text-indigo-500' : 'text-gray-400'} text-xs font-black uppercase tracking-widest mb-1`}>Total Completed</p>
              <h3 className="text-3xl font-black">{tasks.length}</h3>
            </div>
            <div className={`p-6 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'ontime' ? 'bg-green-50 text-green-700 border-green-200 shadow-xl shadow-green-100/50' : 'bg-white border-gray-200 text-gray-900 hover:border-green-200'}`} onClick={() => setStatusFilter('ontime')}>
              <p className={`${statusFilter === 'ontime' ? 'text-green-500' : 'text-gray-400'} text-xs font-black uppercase tracking-widest mb-1`}>On Time</p>
              <h3 className="text-3xl font-black">{tasks.filter(t => !t.isOverdue).length}</h3>
            </div>
            <div className={`p-6 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'overdue' ? 'bg-red-50 text-red-700 border-red-200 shadow-xl shadow-red-100/50' : 'bg-white border-gray-200 text-gray-900 hover:border-red-200'}`} onClick={() => setStatusFilter('overdue')}>
              <p className={`${statusFilter === 'overdue' ? 'text-red-500' : 'text-gray-400'} text-xs font-black uppercase tracking-widest mb-1`}>Overdue</p>
              <h3 className="text-3xl font-black">{tasks.filter(t => t.isOverdue).length}</h3>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20 text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Fetching records...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No {statusFilter !== 'all' ? statusFilter : ''} tasks found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                      {task.projectName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      {task.updatedAt?.toDate ? task.updatedAt.toDate().toLocaleDateString() : 'Today'}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-gray-900 mb-1 leading-tight">{task.title}</h4>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">{task.description}</p>

                  <div className="space-y-3 pt-3 border-t border-gray-50">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Total Time</span>
                      <span className="text-gray-900 font-mono tracking-normal">{formatTime(task.accumulatedSeconds)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <span>Estimate</span>
                      <span className="text-gray-600 tracking-normal">{task.estimateHours}h {task.estimateMinutes}m</span>
                    </div>

                    <div className="pt-1">
                      <div className={`p-3 rounded-xl flex flex-col gap-0.5 ${task.isOverdue ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${task.isOverdue ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <span className={`text-[10px] font-black tracking-widest ${task.isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                            {task.isOverdue ? 'OVERDUE' : 'ON TIME'}
                          </span>
                        </div>
                        {task.isOverdue && task.overdueDeltaMessage && (
                          <p className="text-[9px] text-red-500/70 font-bold italic pl-3">
                            {task.overdueDeltaMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
