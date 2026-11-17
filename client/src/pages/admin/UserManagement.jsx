import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  Building,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Add Faculty Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.is_active;
    try {
      const res = await api.patch(`/admin/users/${user.id}/status`, {
        is_active: nextStatus,
      });
      if (res.data?.success) {
        toast.success(`User account ${nextStatus ? 'activated' : 'deactivated'}.`);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update user status');
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !department || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/admin/faculty', {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        department: department.trim(),
        password,
      });

      if (res.data?.success) {
        toast.success('Faculty member account created successfully!');
        setAddModalOpen(false);
        setFullName('');
        setEmail('');
        setDepartment('');
        setPassword('');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create faculty');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">User Directory & Provisioning</h1>
          <p className="text-sm text-text-muted mt-1">
            Oversee user accounts, toggle access permissions, and provision faculty mentors.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setAddModalOpen(true)}
          icon={UserPlus}
        >
          Add Faculty Member
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['all', 'student', 'faculty', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                roleFilter === role
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-surface border-border text-text-muted hover:text-text'
              }`}
            >
              {role}s
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" label="Loading directory..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs">
            No users found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-light text-text-dim">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Department / Branch</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const dept = u.profile?.branch || u.profile?.department || 'General';
                  return (
                    <tr key={u.id} className="hover:bg-surface-light/50 transition-colors">
                      <td className="p-4 font-bold text-text-heading flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-light font-bold text-xs flex items-center justify-center border border-primary/30">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span>{u.full_name}</span>
                          <span className="text-[10px] text-text-dim block">{u.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={u.role === 'admin' ? 'danger' : u.role === 'faculty' ? 'purple' : 'primary'}
                          size="sm"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-text-muted">{dept}</td>
                      <td className="p-4">
                        <Badge variant={u.is_active ? 'emerald' : 'secondary'} size="sm">
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant={u.is_active ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Faculty Modal */}
      {addModalOpen && (
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Provision New Faculty Mentor"
          size="md"
        >
          <form onSubmit={handleCreateFaculty} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-text-heading">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Sarah Jenkins"
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-heading">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@ssp.edu"
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-heading">Department / Discipline</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Humanities & Professional Ethics"
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-heading">Temporary Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-surface-light border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={creating}>
                Create Faculty Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
