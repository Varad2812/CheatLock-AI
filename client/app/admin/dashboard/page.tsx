'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, User, Class } from '../../../utils/supabase';
import toast from 'react-hot-toast';
import { Users, Settings, Shield, Edit, Trash2, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'classes'>('overview');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as 'admin' | 'teacher' | 'examiner' | 'student',
    class_id: '',
  });
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      router.push('/');
    }
  }

  async function loadData() {
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData);

      // Load classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Load system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (settingsError) throw settingsError;
      setSystemSettings(settingsData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings(field: string, value: any, immediate: boolean = false) {
    // Update local state immediately for smooth UI
    setSystemSettings((prev: any) => ({ ...prev, [field]: value }));

    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    // Debounce database update (or update immediately if specified)
    const delay = immediate ? 0 : 500;
    
    const timeout = setTimeout(async () => {
      try {
        const updates = { [field]: value };
        
        const { error } = await supabase
          .from('system_settings')
          .update(updates)
          .eq('id', systemSettings.id);

        if (error) throw error;

        console.log(`Setting ${field} updated to:`, value);
        toast.success('Setting updated!', { duration: 1000 });
      } catch (error: any) {
        toast.error(error.message);
      }
    }, delay);

    setUpdateTimeout(timeout);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          class_id: newUser.class_id || null,
        });

      if (profileError) throw profileError;

      toast.success('User created successfully!');
      setShowCreateUser(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'student', class_id: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          class_id: editingUser.class_id || null,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('User updated!');
      setShowEditUser(false);
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;

      toast.success('User deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase.from('classes').insert(newClass);

      if (error) throw error;

      toast.success('Class created!');
      setShowCreateClass(false);
      setNewClass({ name: '', description: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleEditClass(e: React.FormEvent) {
    e.preventDefault();
    if (!editingClass) return;

    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: editingClass.name,
          description: editingClass.description,
        })
        .eq('id', editingClass.id);

      if (error) throw error;

      toast.success('Class updated!');
      setEditingClass(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDeleteClass(classId: string) {
    if (!confirm('Delete this class? Users in this class will be unassigned.')) return;

    try {
      const { error } = await supabase.from('classes').delete().eq('id', classId);

      if (error) throw error;

      toast.success('Class deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const usersByRole = {
    admin: users.filter((u) => u.role === 'admin').length,
    teacher: users.filter((u) => u.role === 'teacher').length,
    examiner: users.filter((u) => u.role === 'examiner').length,
    student: users.filter((u) => u.role === 'student').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'classes'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Classes
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Teachers</p>
                <p className="text-3xl font-bold">{usersByRole.teacher}</p>
              </div>
              <Shield className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Examiners</p>
                <p className="text-3xl font-bold">{usersByRole.examiner}</p>
              </div>
              <Shield className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Students</p>
                <p className="text-3xl font-bold">{usersByRole.student}</p>
              </div>
              <Users className="w-12 h-12 text-orange-600" />
            </div>
          </div>
        </div>

        {/* System Settings */}
        {systemSettings && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              System Settings
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Violation Threshold: {systemSettings.violation_threshold}
                </label>
                <input
                  type="number"
                  value={systemSettings.violation_threshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      updateSettings('violation_threshold', val, true);
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of violations before exam auto-ends
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Gaze Sensitivity: {(systemSettings.gaze_sensitivity * 100).toFixed(0)}%
                  {systemSettings.gaze_sensitivity === 0 && <span className="text-red-600 ml-2">(DISABLED)</span>}
                </label>
                <input
                  type="range"
                  value={systemSettings.gaze_sensitivity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSystemSettings({ ...systemSettings, gaze_sensitivity: val });
                    updateSettings('gaze_sensitivity', val);
                  }}
                  className="w-full"
                  min="0"
                  max="1"
                  step="0.05"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Disabled</span>
                  <span>Lenient</span>
                  <span>Normal</span>
                  <span>Strict</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Audio Sensitivity: {(systemSettings.audio_sensitivity * 100).toFixed(0)}%
                  {systemSettings.audio_sensitivity === 0 && <span className="text-red-600 ml-2">(DISABLED)</span>}
                </label>
                <input
                  type="range"
                  value={systemSettings.audio_sensitivity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSystemSettings({ ...systemSettings, audio_sensitivity: val });
                    updateSettings('audio_sensitivity', val);
                  }}
                  className="w-full"
                  min="0"
                  max="1"
                  step="0.05"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Disabled</span>
                  <span>Lenient</span>
                  <span>Normal</span>
                  <span>Strict</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Face Missing Timeout: {systemSettings.face_missing_timeout}s
                </label>
                <input
                  type="number"
                  value={systemSettings.face_missing_timeout}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      updateSettings('face_missing_timeout', val, true);
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Seconds before face missing triggers violation
                </p>
              </div>
            </div>
          </div>
        )}

          </>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
              >
                + Create User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{user.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'teacher'
                              ? 'bg-green-100 text-green-800'
                              : user.role === 'examiner'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.class_id ? classes.find(c => c.id === user.class_id)?.name || '-' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditUser(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes Management Tab */}
        {activeTab === 'classes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Class Management</h2>
              <button
                onClick={() => setShowCreateClass(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold"
              >
                + Create Class
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingClass(cls)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{cls.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{cls.description || 'No description'}</p>
                  <div className="text-sm text-gray-500">
                    {users.filter(u => u.class_id === cls.id).length} students
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="col-span-3 text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first class to organize students</p>
                  <button
                    onClick={() => setShowCreateClass(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold"
                  >
                    Create First Class
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


      </main>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">Create New User</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="examiner">Examiner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Class (Optional)</label>
                <select
                  value={newUser.class_id}
                  onChange={(e) => setNewUser({ ...newUser, class_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">Edit User</h2>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="examiner">Examiner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Class</label>
                <select
                  value={editingUser.class_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, class_id: e.target.value || undefined })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Class</h2>
            
            <form onSubmit={handleEditClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Class Name</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingClass.description || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">Create New Class</h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Class Name</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="e.g., Grade 10A, CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
