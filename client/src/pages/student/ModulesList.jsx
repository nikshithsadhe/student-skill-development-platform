import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Clock,
  Award,
  CheckCircle2,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function ModulesList() {
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchModules();
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/modules/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category_id = selectedCategory;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/modules', { params });
      if (res.data?.success) {
        setModules(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyVariant = (diff) => {
    if (diff === 'Advanced') return 'danger';
    if (diff === 'Intermediate') return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Soft-Skills Modules</h1>
          <p className="text-sm text-text-muted mt-1">
            Structured curriculum across 12 human-centric behavioral disciplines.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            selectedCategory === 'all'
              ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
              : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-light'
          }`}
        >
          All Disciplines
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface border-border text-text-muted hover:text-text hover:bg-surface-light'
            }`}
          >
            {cat.name} ({cat.module_count || 0})
          </button>
        ))}
      </div>

      {/* Difficulty Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-dim flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Difficulty:
        </span>
        {['all', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
          <button
            key={diff}
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedDifficulty === diff
                ? 'bg-surface-lighter text-primary-light font-semibold border border-primary/30'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {diff === 'all' ? 'Any' : diff}
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" label="Loading soft-skills curriculum..." />
        </div>
      ) : modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No modules match your criteria"
          description="Try selecting a different category or clearing your search filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedCategory('all');
            setSelectedDifficulty('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const progress = mod.student_progress?.progress_percentage || 0;
            const isCompleted = mod.student_progress?.status === 'completed';
            const inProgress = progress > 0 && !isCompleted;

            return (
              <Card key={mod.id} hover className="flex flex-col justify-between group">
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="purple" size="sm">
                      {mod.category_name}
                    </Badge>
                    <Badge variant={getDifficultyVariant(mod.difficulty)} size="sm">
                      {mod.difficulty}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-text-heading group-hover:text-primary-light transition-colors line-clamp-1 mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-4">
                    {mod.description}
                  </p>

                  {/* Meta items */}
                  <div className="flex items-center gap-4 text-xs text-text-dim mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {mod.estimated_minutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {mod.lessons?.length || 0} lessons
                    </span>
                    <span className="flex items-center gap-1 text-accent-amber">
                      <Award className="w-3.5 h-3.5" />
                      +{mod.points_reward} pts
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-text-dim">
                        {isCompleted
                          ? 'Completed'
                          : inProgress
                          ? `${progress}% in progress`
                          : 'Not started'}
                      </span>
                      {isCompleted && (
                        <span className="text-accent-emerald flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted
                            ? 'bg-accent-emerald'
                            : inProgress
                            ? 'bg-primary'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <Link
                  to={`/student/modules/${mod.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-light hover:bg-primary text-text hover:text-white text-xs font-semibold transition-all border border-border hover:border-primary flex items-center justify-center gap-2 mt-2 shadow-sm"
                >
                  <span>{isCompleted ? 'Review Module' : inProgress ? 'Continue Learning' : 'Start Module'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
