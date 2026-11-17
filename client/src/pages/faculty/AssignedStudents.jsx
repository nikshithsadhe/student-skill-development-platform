import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  FileCheck,
  TrendingUp,
  Download,
  BookOpen,
  Award,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

export default function AssignedStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [search, branchFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (branchFilter) params.branch = branchFilter;

      const res = await api.get('/faculty/students', { params });
      if (res.data?.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assigned students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (student) => {
    setSelectedStudent(student);
    setDetailLoading(true);
    try {
      const res = await api.get(`/faculty/students/${student.id}`);
      if (res.data?.success) {
        setStudentDetail(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load student progress record');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadPdf = async (studentId, studentName) => {
    try {
      const res = await api.get(`/progress/reports/${studentId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SSP_Report_${studentName.replace(' ', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded student portfolio report');
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Assigned Mentee Cohort</h1>
          <p className="text-sm text-text-muted mt-1">
            Monitor skill development profiles, assessment records, and portfolio PDF downloads.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Students Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" label="Loading students..." />
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs">
            No assigned students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-light text-text-dim">
                  <th className="p-4 font-semibold">Scholar</th>
                  <th className="p-4 font-semibold">Student ID</th>
                  <th className="p-4 font-semibold">Branch & Sem</th>
                  <th className="p-4 font-semibold text-center">Readiness Score</th>
                  <th className="p-4 font-semibold text-center">Skill Points</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((st) => {
                  const score = st.profile?.overall_skill_score || 0;
                  return (
                    <tr key={st.id} className="hover:bg-surface-light/50 transition-colors">
                      <td className="p-4 font-bold text-text-heading flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-light font-bold text-xs flex items-center justify-center border border-primary/30">
                          {st.full_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <span>{st.full_name}</span>
                          <span className="text-[10px] text-text-dim block">{st.email}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-text-muted">{st.student_id || 'N/A'}</td>
                      <td className="p-4 text-text-muted">
                        {st.profile?.branch || 'Engineering'}, Sem {st.profile?.semester || 1}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={score >= 70 ? 'emerald' : score >= 50 ? 'purple' : 'amber'}
                          size="sm"
                        >
                          {score}%
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-bold font-mono text-accent-amber">
                        {st.profile?.total_points || 0}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(st)}
                            className="p-1.5 rounded-lg bg-surface-lighter hover:bg-surface text-text-muted hover:text-text transition-all border border-border"
                            title="View Student Records"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(st.id, st.full_name)}
                            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary-light hover:text-white transition-all border border-primary/30"
                            title="Download PDF Skill Portfolio"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Modal
          isOpen={Boolean(selectedStudent)}
          onClose={() => {
            setSelectedStudent(null);
            setStudentDetail(null);
          }}
          title={`Student Portfolio: ${selectedStudent.full_name}`}
          size="lg"
        >
          {detailLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" label="Loading transcripts..." />
            </div>
          ) : (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-light border border-border">
                <div>
                  <span className="text-text-dim block">Department:</span>
                  <span className="font-bold text-text-heading">{studentDetail?.profile?.branch || 'Engineering'}</span>
                </div>
                <div>
                  <span className="text-text-dim block">Semester:</span>
                  <span className="font-bold text-text-heading">{studentDetail?.profile?.semester || 1}</span>
                </div>
                <div>
                  <span className="text-text-dim block">Overall Readiness:</span>
                  <span className="font-bold text-primary-light">{studentDetail?.profile?.overall_skill_score || 0}%</span>
                </div>
                <div>
                  <span className="text-text-dim block">Total Points:</span>
                  <span className="font-bold text-accent-amber">{studentDetail?.profile?.total_points || 0}</span>
                </div>
              </div>

              {/* Assessment Attempts */}
              <div className="space-y-2">
                <h4 className="font-bold text-text-heading">Assessment Attempts</h4>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {(studentDetail?.assessment_attempts || []).map((att) => (
                    <div key={att.id} className="p-3 flex items-center justify-between bg-surface">
                      <div>
                        <span className="font-semibold text-text-heading block">{att.assessment_title || 'Assessment'}</span>
                        <span className="text-[10px] text-text-dim">
                          {new Date(att.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant={att.total_score >= 60 ? 'emerald' : 'amber'} size="sm">
                        Scored {att.total_score}%
                      </Badge>
                    </div>
                  ))}
                  {(!studentDetail?.assessment_attempts || studentDetail.assessment_attempts.length === 0) && (
                    <div className="p-4 text-center text-text-muted">No assessment attempts on record.</div>
                  )}
                </div>
              </div>

              {/* Submissions */}
              <div className="space-y-2">
                <h4 className="font-bold text-text-heading">Activity Submissions</h4>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {(studentDetail?.submissions || []).map((sub) => (
                    <div key={sub.id} className="p-3 flex items-center justify-between bg-surface">
                      <div>
                        <span className="font-semibold text-text-heading block">{sub.activity_title}</span>
                        <span className="text-[10px] text-text-dim">Status: {sub.status.replace('_', ' ')}</span>
                      </div>
                      <span className="font-mono font-bold text-primary-light">
                        {sub.total_score !== undefined ? `${sub.total_score} pts` : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {(!studentDetail?.submissions || studentDetail.submissions.length === 0) && (
                    <div className="p-4 text-center text-text-muted">No practical submissions on record.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
