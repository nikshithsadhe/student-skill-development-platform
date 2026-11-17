import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Archive,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table';
import ConfirmDialog from '../../components/ConfirmDialog';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';

export default function ModuleManage() {
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Create/Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [saving, setSaving] = useState(false);

  // Archive Confirm Dialog
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Beginner');
  const [formMinutes, setFormMinutes] = useState(45);
  const [formPoints, setFormPoints] = useState(60);
  const [formObjectives, setFormObjectives] = useState(['']);
  const [formLessons, setFormLessons] = useState([
    {
      id: 'l1',
      title: 'Introduction & Foundations',
      content: 'Core principles of this soft skill...',
      estimated_minutes: 15,
      examples: ['Workplace example here...'],
      practical_exercises: ['Daily reflection practice...'],
      knowledge_checks: [],
    },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchModules();
  }, [search, filterStatus]);

  const fetchInitialData = async () => {
    try {
      const res = await api.get('/modules/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
        if (res.data.data.length > 0 && !formCategory) {
          setFormCategory(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterStatus !== 'all') params.module_status = filterStatus;

      const res = await api.get('/modules', { params });
      if (res.data?.success) {
        setModules(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load modules list.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingModule(null);
    setFormTitle('');
    setFormDescription('');
    setFormDifficulty('Beginner');
    setFormMinutes(45);
    setFormPoints(60);
    setFormObjectives(['Understand core principles', 'Apply frameworks in teams']);
    setFormLessons([
      {
        id: `l-${Date.now()}`,
        title: 'Core Fundamentals & Mindset',
        content: 'Overview of foundational techniques...',
        estimated_minutes: 15,
        examples: ['Example dialogue...'],
        practical_exercises: ['5-minute daily exercise...'],
        knowledge_checks: [],
      },
    ]);
    if (categories.length > 0) setFormCategory(categories[0].id);
    setModalOpen(true);
  };

  const openEditModal = (mod) => {
    setEditingModule(mod);
    setFormTitle(mod.title);
    setFormCategory(mod.category_id);
    setFormDescription(mod.description);
    setFormDifficulty(mod.difficulty);
    setFormMinutes(mod.estimated_minutes);
    setFormPoints(mod.points_reward || 50);
    setFormObjectives(mod.learning_objectives || ['']);
    setFormLessons(mod.lessons || []);
    setModalOpen(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      toast.error('Please enter module title and description.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        category_id: formCategory,
        description: formDescription.trim(),
        difficulty: formDifficulty,
        estimated_minutes: parseInt(formMinutes, 10),
        points_reward: parseInt(formPoints, 10),
        learning_objectives: formObjectives.filter((o) => o.trim()),
        lessons: formLessons,
        status: 'published',
      };

      if (editingModule) {
        await api.patch(`/modules/${editingModule.id}`, payload);
        toast.success('Module successfully updated!');
      } else {
        await api.post('/modules', payload);
        toast.success('New module successfully created & published!');
      }

      setModalOpen(false);
      fetchModules();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save module.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await api.delete(`/modules/${archiveTarget.id}`);
      toast.success('Module archived successfully.');
      setArchiveTarget(null);
      fetchModules();
    } catch (err) {
      toast.error('Failed to archive module.');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Learning Modules Management</h1>
          <p className="text-sm text-text-muted mt-1">
            Create, update, and manage soft-skills learning tracks and lessons.
          </p>
        </div>
        <Button onClick={openCreateModal} icon={Plus}>
          Author New Module
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-card border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['all', 'published', 'draft', 'archived'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                filterStatus === st
                  ? 'bg-primary border-primary text-white shadow-md'
                  : 'bg-surface-card border-border text-text-muted hover:text-text'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" label="Loading curriculum directory..." />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Title</TableHead>
                <TableHead>Discipline</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-semibold text-text-heading">
                    {mod.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="purple" size="sm">
                      {mod.category_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {mod.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {mod.lessons?.length || 0} lessons
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {mod.estimated_minutes}m
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={mod.status === 'published' ? 'success' : mod.status === 'archived' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {mod.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <button
                      onClick={() => openEditModal(mod)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter transition-all"
                      title="Edit Module"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {mod.status !== 'archived' && (
                      <button
                        onClick={() => setArchiveTarget(mod)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-accent-rose hover:bg-surface-lighter transition-all"
                        title="Archive Module"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingModule ? 'Edit Soft-Skills Module' : 'Author New Soft-Skills Module'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
          <div>
            <label className="block text-text-muted font-medium mb-1">Module Title</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Masterful Active Listening"
              className="w-full bg-surface-card border border-border rounded-xl p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-text-muted font-medium mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-surface-card border border-border rounded-xl p-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-muted font-medium mb-1">Difficulty</label>
              <select
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value)}
                className="w-full bg-surface-card border border-border rounded-xl p-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-text-muted font-medium mb-1">Points Reward</label>
              <input
                type="number"
                min={10}
                max={500}
                value={formPoints}
                onChange={(e) => setFormPoints(e.target.value)}
                className="w-full bg-surface-card border border-border rounded-xl p-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-muted font-medium mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Overview of syllabus, behavioral targets, and workplace value..."
              className="w-full bg-surface-card border border-border rounded-xl p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Lessons list summary */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text-heading">Lessons ({formLessons.length})</span>
              <button
                type="button"
                onClick={() =>
                  setFormLessons([
                    ...formLessons,
                    {
                      id: `l-${Date.now()}`,
                      title: `Lesson ${formLessons.length + 1}`,
                      content: 'Write lesson educational guide...',
                      estimated_minutes: 15,
                      examples: [],
                      practical_exercises: [],
                      knowledge_checks: [],
                    },
                  ])
                }
                className="text-primary-light hover:underline font-semibold"
              >
                + Add Lesson
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {formLessons.map((l, i) => (
                <div key={l.id} className="p-2.5 bg-surface-card border border-border rounded-xl flex items-center justify-between">
                  <span className="truncate flex-1 font-medium text-text">{l.title}</span>
                  <span className="text-text-dim text-[11px] ml-2">{l.estimated_minutes}m</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {editingModule ? 'Save Changes' : 'Publish Module'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        loading={archiving}
        title="Archive Learning Module"
        message={`Are you sure you want to archive '${archiveTarget?.title}'? Existing learner records and completion histories will be safely preserved.`}
        confirmText="Archive Module"
      />
    </div>
  );
}
