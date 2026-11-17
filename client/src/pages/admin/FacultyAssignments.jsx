import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Users,
  Search,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function FacultyAssignments() {
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.allSettled([
        api.get('/admin/users', { params: { role: 'faculty' } }),
        api.get('/admin/users', { params: { role: 'student' } }),
      ]);

      if (fRes.status === 'fulfilled' && fRes.value.data?.success) {
        setFacultyList(fRes.value.data.data);
        if (fRes.value.data.data.length > 0) {
          setSelectedFaculty(fRes.value.data.data[0].id);
        }
      }
      if (sRes.status === 'fulfilled' && sRes.value.data?.success) {
        setStudentList(sRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load users for assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  const handleAssign = async () => {
    if (!selectedFaculty) {
      toast.error('Please select a faculty member.');
      return;
    }
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student.');
      return;
    }

    setAssigning(true);
    try {
      const res = await api.post('/admin/assignments', {
        faculty_id: selectedFaculty,
        student_ids: selectedStudents,
      });

      if (res.data?.success) {
        toast.success(res.data.data?.message || 'Students successfully assigned to faculty mentor!');
        setSelectedStudents([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to assign students');
    } finally {
      setAssigning(false);
    }
  };

  const filteredStudents = studentList.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Loading faculty and student rosters..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Faculty Mentee Assignments</h1>
        <p className="text-sm text-text-muted mt-1">
          Pair students with faculty evaluators for personalized behavioral feedback and progress tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Select Faculty Column */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-text-heading flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-light" />
            1. Select Faculty Mentor
          </h3>
          <p className="text-xs text-text-muted">
            Choose an instructor to assign student mentees to.
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {facultyList.map((fac) => {
              const isSelected = selectedFaculty === fac.id;
              return (
                <button
                  key={fac.id}
                  onClick={() => setSelectedFaculty(fac.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-text-heading shadow-sm'
                      : 'bg-surface-light border-border text-text-muted hover:text-text'
                  }`}
                >
                  <div className="font-bold text-text-heading">{fac.full_name}</div>
                  <div className="text-[10px] text-text-dim">{fac.email}</div>
                  <div className="text-[10px] text-primary-light mt-1">
                    {fac.profile?.department || 'Faculty Mentor'}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Select Students Column */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text-heading flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-emerald" />
                2. Select Student Mentees ({selectedStudents.length} selected)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={assigning}
                onClick={handleAssign}
              >
                Confirm Assignment
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-light border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Student list checkboxes */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredStudents.map((st) => {
              const isChecked = selectedStudents.includes(st.id);
              return (
                <div
                  key={st.id}
                  onClick={() => toggleStudent(st.id)}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all select-none ${
                    isChecked
                      ? 'bg-accent-emerald/10 border-accent-emerald/40 text-text-heading'
                      : 'bg-surface-light border-border text-text-muted hover:text-text'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="rounded text-primary focus:ring-0 bg-surface border-border"
                    />
                    <div>
                      <span className="font-semibold text-text-heading block">{st.full_name}</span>
                      <span className="text-[10px] text-text-dim">{st.email} • {st.student_id || 'ID N/A'}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-primary-light">
                    {st.profile?.branch || 'Engineering'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
