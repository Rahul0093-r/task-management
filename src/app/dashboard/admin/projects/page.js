'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCookie } from '@/lib/cookies';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function ProjectsPage() {
  const [adminSession, setAdminSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const session = getCookie('adminSession');
    if (!session) {
      router.push('/admin');
      return;
    }
    try {
      setAdminSession(JSON.parse(session));
    } catch (error) {
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({ name: project.name, description: project.description });
    } else {
      setEditingProject(null);
      setFormData({ name: '', description: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);

    // Timeout logic: 15 seconds
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out. Please check if Firestore is enabled and rules allow writes.')), 15000)
    );

    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        updatedAt: serverTimestamp() || new Date(),
      };

      let operation;
      if (editingProject) {
        // Update existing project
        const projectRef = doc(db, 'projects', editingProject.id);
        operation = updateDoc(projectRef, projectData);
      } else {
        // Create new project
        projectData.createdAt = serverTimestamp() || new Date();
        operation = addDoc(collection(db, 'projects'), projectData);
      }

      // Race the operation against the timeout
      await Promise.race([operation, timeout]);

      // If we reach here, it succeeded
      setModalOpen(false);
      setFormData({ name: '', description: '' });
      setEditingProject(null);

      // Refresh list
      await fetchProjects();
    } catch (error) {
      console.error("Detailed Firestore Error:", error);
      let message = "Error saving project. ";

      if (error.message.includes('permission-denied')) {
        message += "Permission denied. Please check your Firestore rules.";
      } else if (error.message.includes('timed out')) {
        message = error.message;
      } else {
        message += error.message;
      }

      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteDoc(doc(db, 'projects', id));
        fetchProjects();
      } catch (error) {
        console.error("Error deleting project: ", error);
      }
    }
  };

  if (!adminSession) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} />

      <div className="flex-1 lg:ml-64 transition-all duration-300">
        <Navbar 
          session={adminSession} 
          onSidebarToggle={handleToggleSidebar} 
          sidebarOpen={sidebarOpen} 
          role="Administrator"
        />

        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Projects</h1>
              <p className="text-gray-600 mt-2">Create and monitor your company projects.</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-indigo-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Project</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-8">Get started by creating your first project.</p>
              <button
                onClick={() => handleOpenModal()}
                className="text-indigo-600 font-semibold hover:text-indigo-800"
              >
                + Add New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(project)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{project.name}</h3>
                  <p className="text-gray-600 line-clamp-3 text-sm leading-relaxed mb-4">
                    {project.description}
                  </p>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Created: {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the details below.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="e.g. Website Redesign"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                  placeholder="Describe the project goals and scope..."
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
