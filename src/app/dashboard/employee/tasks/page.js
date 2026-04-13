'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = [
  { id: 'ToDo', title: 'To Do', color: 'bg-yellow-500' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'Done', title: 'Done', color: 'bg-green-500' }
];

export default function EmployeeTasksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', hours: '', minutes: '', projectId: '' });
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTasks();
    fetchAvailableProjects();
  }, [user]);

  // Derived Active Task logic
  const activeTask = tasks.find(t => t.status === 'In Progress');

  // Real-time Timer Effect
  useEffect(() => {
    if (activeTask) {
      if (timerRef.current) clearInterval(timerRef.current);

      if (activeTask.startTime) {
        // Timer is running - calculate current session time + accumulated time
        const start = activeTask.startTime instanceof Timestamp
          ? activeTask.startTime.toDate()
          : new Date(activeTask.startTime);

        const baseSeconds = activeTask.accumulatedSeconds || 0;

        // Update immediately
        const initialDiff = Math.floor((new Date() - start) / 1000);
        setElapsedSeconds((initialDiff > 0 ? initialDiff : 0) + baseSeconds);

        // Start ticking
        timerRef.current = setInterval(() => {
          const now = new Date();
          const diff = Math.floor((now - start) / 1000);
          setElapsedSeconds((diff > 0 ? diff : 0) + baseSeconds);
        }, 1000);
      } else {
        // Timer is paused - show only accumulated time
        const accumulated = parseInt(activeTask.accumulatedSeconds) || 0;
        setElapsedSeconds(accumulated);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTask, tasks]);

  const fetchAvailableProjects = async () => {
    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const projectList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setAvailableProjects(projectList);
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

  const formatTime = (totalSeconds) => {
    const seconds = parseInt(totalSeconds) || 0;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerToggle = async (task) => {
    if (!task) return;

    try {
      const isCurrentlyRunning = task.startTime !== null;
      let updatePayload = {
        updatedAt: serverTimestamp()
      };

      if (isCurrentlyRunning) {
        // Stop the timer but keep task in In Progress
        const now = new Date();
        const start = task.startTime?.toDate ? task.startTime.toDate() : new Date(task.startTime);
        const sessionSeconds = Math.floor((now - start) / 1000);
        const newAccumulated = (parseInt(task.accumulatedSeconds) || 0) + sessionSeconds;

        updatePayload = {
          ...updatePayload,
          accumulatedSeconds: newAccumulated,
          startTime: null
        };

        // Update local state immediately
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === task.id
              ? { ...t, accumulatedSeconds: newAccumulated, startTime: null }
              : t
          )
        );
      } else {
        // Start the timer
        updatePayload = {
          ...updatePayload,
          startTime: serverTimestamp()
        };

        // Update local state immediately
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === task.id
              ? { ...t, startTime: new Date() }
              : t
          )
        );
      }

      const taskRef = doc(db, 'employee_tasks', task.id);
      await updateDoc(taskRef, updatePayload);
    } catch (error) {
      console.error("Error toggling timer: ", error);
      fetchTasks(); // Revert on error
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // --- WORKFLOW VALIDATIONS ---
    if (destStatus === 'In Progress') {
      const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
      if (inProgressCount >= 1 && sourceStatus !== 'In Progress') {
        setErrorMessage("First complete your 'In Progress' task before starting a new one!");
        setTimeout(() => setErrorMessage(''), 4000);
        return;
      }
    }

    if (sourceStatus === 'ToDo' && destStatus === 'Done') {
      setErrorMessage("Tasks must move to 'In Progress' first to start the timer!");
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    if (destStatus === 'Done' && sourceStatus !== 'In Progress') {
      setErrorMessage("Only tasks currently 'In Progress' can be marked as Done.");
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    // --- DATA PREPARATION ---
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex(t => t.id === draggableId);
    const task = { ...updatedTasks[taskIndex] };

    const updatePayload = {
      status: destStatus,
      updatedAt: serverTimestamp() || new Date()
    };

    const now = new Date();

    if (sourceStatus === 'In Progress') {
      let currentAccumulated = parseInt(task.accumulatedSeconds) || 0;
      let newAccumulated = currentAccumulated;

      if (task.startTime) {
        const start = task.startTime?.toDate ? task.startTime.toDate() : new Date(task.startTime);
        const sessionSeconds = Math.floor((now - start) / 1000);
        newAccumulated = currentAccumulated + (sessionSeconds > 0 ? sessionSeconds : 0);
      }

      updatePayload.accumulatedSeconds = newAccumulated;
      updatePayload.startTime = null;

      task.accumulatedSeconds = newAccumulated;
      task.startTime = null;
    }

    if (destStatus === 'In Progress') {
      updatePayload.startTime = serverTimestamp() || now;
      task.startTime = now;
    }

    if (destStatus === 'Done') {
      updatePayload.endTime = serverTimestamp() || now;
      const totalSeconds = parseInt(task.accumulatedSeconds) || 0;
      const estimatedSeconds = ((parseInt(task.estimateHours || 0) * 3600) + (parseInt(task.estimateMinutes || 0) * 60));

      const actualMinutes = Math.floor(totalSeconds / 60);
      updatePayload.actualMinutes = actualMinutes;

      const isOverdue = totalSeconds > estimatedSeconds;
      updatePayload.isOverdue = isOverdue;

      if (isOverdue) {
        const deltaSeconds = totalSeconds - estimatedSeconds;
        let msg = "";
        if (deltaSeconds >= 3600) {
          const h = Math.floor(deltaSeconds / 3600);
          const m = Math.floor((deltaSeconds % 3600) / 60);
          msg = `${h}h ${m}m overdue`;
        } else if (deltaSeconds >= 60) {
          const m = Math.floor(deltaSeconds / 60);
          const s = deltaSeconds % 60;
          msg = `${m}m ${s}s overdue`;
        } else {
          msg = `${deltaSeconds} seconds overdue`;
        }
        updatePayload.overdueDeltaMessage = msg;
        task.overdueDeltaMessage = msg;
      }

      task.endTime = now;
      task.actualMinutes = actualMinutes;
      task.isOverdue = isOverdue;
    }

    // Upate state list (this triggers the derived activeTask and timer effect immediately)
    task.status = destStatus;
    updatedTasks[taskIndex] = task;
    setTasks(updatedTasks);


    // Update in Firestore
    try {
      const taskRef = doc(db, 'employee_tasks', draggableId);
      await updateDoc(taskRef, updatePayload);
    } catch (error) {
      console.error("Error updating task status: ", error);
      fetchTasks(); // Revert on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) {
      alert("Please enter a title and select a project.");
      return;
    }
    setSubmitting(true);

    try {
      const selectedProject = availableProjects.find(p => p.id === formData.projectId);

      await addDoc(collection(db, 'employee_tasks'), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        estimateHours: formData.hours || '0',
        estimateMinutes: formData.minutes || '0',
        projectId: formData.projectId,
        projectName: selectedProject ? selectedProject.name : 'Unassigned',
        status: 'ToDo',
        employeeEmail: user.email,
        employeeId: user.uid,
        createdAt: serverTimestamp() || new Date(),
        updatedAt: serverTimestamp() || new Date()
      });

      setModalOpen(false);
      setFormData({ title: '', description: '', hours: '', minutes: '', projectId: '' });
      fetchTasks();
    } catch (error) {
      console.error("Error adding task: ", error);
    } finally {
      setSubmitting(false);
    }
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

        <main className="flex-1 p-6 md:p-8 flex flex-col relative">

          {/* Error Feedback Overlay */}
          {errorMessage && (
            <div className="fixed top-20 right-6 z-[110] animate-in slide-in-from-right duration-300">
              <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-bold">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Active Timer Header (Only show if task is actually IN PROGRESS) */}
          {activeTask && activeTask.status === 'In Progress' && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-indigo-600 rounded-[1.5rem] p-6 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="z-10">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">Active Assignment</span>
                    <span className="text-white/70 text-sm font-medium leading-none">{activeTask.projectName}</span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">{activeTask.title}</h2>
                  <p className="text-indigo-100 text-base mt-2 max-w-md line-clamp-1 opacity-90">{activeTask.description}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20 text-center z-10 min-w-[200px] shadow-2xl">
                  <p className="text-indigo-100 text-xs font-semibold uppercase tracking-widest mb-1">Time Progress</p>
                  <p className={`text-4xl font-mono font-bold tabular-nums tracking-tighter transition-colors duration-500 ${elapsedSeconds > ((parseInt(activeTask.estimateHours || 0) * 3600) + (parseInt(activeTask.estimateMinutes || 0) * 60))
                    ? 'text-red-300 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]'
                    : 'text-white'
                    }`}>
                    {formatTime(elapsedSeconds)}
                  </p>
                  <div className="flex gap-2 mt-3 justify-center">
                    <button
                      onClick={() => handleTimerToggle(activeTask)}
                      className={`w-full ${activeTask.startTime
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        } px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 border border-white/10`}
                    >
                      {activeTask.startTime ? (
                        <>
                          <div className="flex space-x-1 items-center mr-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-75"></div>
                          </div>
                          <span>Pause Session</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          <span>Resume Work</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Task Board</h1>
              <p className="text-gray-500 mt-1 text-sm font-medium">Manage and track your workflow efficiency.</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-[1rem] font-bold transition-all shadow-xl shadow-indigo-100 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Log Task</span>
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col lg:flex-row gap-4 flex-1 items-start">
              {COLUMNS.map(column => (
                <div key={column.id} className="flex-1 w-full lg:min-w-[300px] bg-gray-100/50 rounded-2xl p-3 border border-gray-200/60 flex flex-col min-h-[500px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                      <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">{column.title}</h3>
                      <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {tasks.filter(t => {
                          if (column.id !== 'Done') return t.status === column.id;
                          const isDone = t.status === 'Done';
                          if (!isDone) return false;
                          const endTime = t.endTime?.toDate ? t.endTime.toDate() : (t.endTime ? new Date(t.endTime) : null);
                          if (!endTime) return false;
                          const today = new Date();
                          return endTime.toDateString() === today.toDateString();
                        }).length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 rounded-xl transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-indigo-50/50 ring-2 ring-indigo-200 ring-dashed' : ''}`}
                      >
                        {tasks
                          .filter(task => {
                            if (column.id !== 'Done') return task.status === column.id;
                            const isDone = task.status === 'Done';
                            if (!isDone) return false;
                            const endTime = task.endTime?.toDate ? task.endTime.toDate() : (task.endTime ? new Date(task.endTime) : null);
                            if (!endTime) return false;
                            const today = new Date();
                            return endTime.toDateString() === today.toDateString();
                          })
                          .map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={task.status === 'Done'}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-4 transition-all ${task.status === 'Done'
                                    ? 'opacity-80 grayscale-[0.2] border-gray-100 cursor-not-allowed'
                                    : 'hover:shadow-lg active:scale-95'
                                    } group ${snapshot.isDragging ? 'rotate-2 shadow-2xl scale-105 z-50 ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900 line-clamp-2">{task.title}</h4>
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-bold">
                                      {task.projectName}
                                    </span>
                                  </div>
                                  <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">{task.description}</p>

                                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Est. {task.estimateHours}h {task.estimateMinutes}m</span>
                                      </div>

                                      {/* Show Paused Time Badge in ToDo column */}
                                      {task.status === 'ToDo' && task.accumulatedSeconds > 0 && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-tight">
                                            Paused @ {formatTime(task.accumulatedSeconds)}
                                          </span>
                                        </div>
                                      )}

                                      {task.status === 'Done' && (
                                        <div className="flex flex-col space-y-1">
                                          <div className="flex items-center space-x-2">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${task.isOverdue ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                              {task.isOverdue ? 'Overdue' : 'On Time'}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">{task.actualMinutes}m taken</span>
                                          </div>
                                          {task.isOverdue && task.overdueDeltaMessage && (
                                            <p className="text-xs text-red-500 font-semibold leading-none pl-1 italic">
                                              {task.overdueDeltaMessage}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                      {task.createdAt?.toDate ? task.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>

        </main>
      </div>

      {/* Log Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-none">Log Activity</h2>
                <p className="text-gray-500 text-xs mt-1.5 font-medium">Set your goals and estimates.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">Project Assignment</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-semibold text-sm"
                >
                  <option value="">Select a project...</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 pl-1">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-semibold text-sm"
                  placeholder="What's the goal?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Estimated Duration</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      className="w-full pl-5 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">Hrs</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={formData.minutes}
                      onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                      className="w-full pl-5 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">Min</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Details</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold resize-none"
                  placeholder="Task scope..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95 uppercase text-xs tracking-widest mt-2"
              >
                {submitting ? 'Processing...' : 'Start Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
