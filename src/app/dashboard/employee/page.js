'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export default function EmployeeDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const projectList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectList);
    } catch (error) {
      console.error("Error fetching projects: ", error);
    }
  };

  const fetchTasks = async () => {
    if (!user?.email) return;
    try {
      const q = query(
        collection(db, 'employee_tasks'),
        where('employeeEmail', '==', user.email),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const taskList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    todo: tasks.filter(t => t.status === 'ToDo').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    completed: tasks.filter(t => t.status === 'Done').length,
    total: tasks.length,
    totalProjects: projects.length
  };

  if (!user) {
    return <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</div>;
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

        <main className="p-8 flex-1">
          {/* Welcome Header */}
          <div className="mb-12">
            <h1 className="text-2xl font-black text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-2 font-medium">Clear visibility of your total workload and progress.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Total Tasks</p>
                <p className="text-3xl font-black text-gray-900 leading-none">{stats.total}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-purple-100/50 transition-all group">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Total Projects</p>
                <p className="text-3xl font-black text-gray-900 leading-none">{stats.totalProjects}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-yellow-100/50 transition-all group">
              <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">To Do Task</p>
                <p className="text-3xl font-black text-gray-900 leading-none">{stats.todo}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl hover:shadow-green-100/50 transition-all group">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Completed</p>
                <p className="text-3xl font-black text-gray-900 leading-none">{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Project List Section */}
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Projects Catalog</h2>
            </div>
            {projects.length === 0 ? (
              <p className="text-gray-400 font-bold italic">No projects found.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {projects.map(project => (
                  <div key={project.id} className="bg-gray-50 border border-gray-100 px-6 py-3 rounded-2xl flex items-center space-x-3 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all cursor-default group">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-indigo-600 transition-colors"></div>
                    <span className="text-gray-700 font-bold tracking-tight">{project.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
