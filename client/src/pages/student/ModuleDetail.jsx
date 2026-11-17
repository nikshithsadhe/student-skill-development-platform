import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Award,
  BookOpen,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Lightbulb,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';

export default function ModuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [completing, setCompleting] = useState(false);

  // Quiz state for current lesson: { [quizIndex]: selectedOptionIndex }
  const [quizAnswers, setQuizAnswers] = useState({});

  useEffect(() => {
    fetchModuleDetail();
  }, [id]);

  const fetchModuleDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/modules/${id}`);
      if (res.data?.success) {
        const mod = res.data.data;
        setModule(mod);
        const completed = mod.student_progress?.completed_lesson_ids || [];
        setCompletedLessonIds(completed);

        // Find first incomplete lesson to default active
        const firstIncompleteIdx = mod.lessons?.findIndex(
          (l) => !completed.includes(l.id)
        );
        if (firstIncompleteIdx !== -1 && firstIncompleteIdx !== undefined) {
          setActiveLessonIndex(firstIncompleteIdx);
        }
      }
    } catch (err) {
      toast.error('Failed to load module details.');
      navigate('/student/modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    setCompleting(true);
    try {
      const res = await api.post(`/modules/${id}/lessons/${lessonId}/complete`);
      if (res.data?.success) {
        const { points_awarded, completed_lesson_ids, status } = res.data.data;
        setCompletedLessonIds(completed_lesson_ids);

        if (points_awarded > 0) {
          toast.success(`Lesson completed! +${points_awarded} points earned!`);
        } else {
          toast.success('Lesson marked complete.');
        }

        if (status === 'completed') {
          toast.success('🎉 Congratulations! You completed the entire module!');
        }

        // Auto advance to next lesson if available
        if (activeLessonIndex < (module.lessons?.length || 1) - 1) {
          setActiveLessonIndex(activeLessonIndex + 1);
          setQuizAnswers({});
        }
      }
    } catch (err) {
      toast.error('Failed to save lesson progress.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" label="Loading module content..." />
      </div>
    );
  }

  if (!module) return null;

  const lessons = module.lessons || [];
  const currentLesson = lessons[activeLessonIndex] || {};
  const isCurrentLessonComplete = completedLessonIds.includes(currentLesson.id);
  const totalLessons = lessons.length;
  const progressPct = Math.round((completedLessonIds.length / Math.max(1, totalLessons)) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top back navigation & module summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/student/modules"
            className="p-2 rounded-xl bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-light transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="purple" size="sm">
                {module.category_name}
              </Badge>
              <Badge variant="default" size="sm">
                {module.difficulty}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-heading">
              {module.title}
            </h1>
          </div>
        </div>

        {/* Progress pill */}
        <div className="bg-surface border border-border px-4 py-2 rounded-2xl flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-text-dim uppercase font-semibold">Progress</p>
            <p className="text-sm font-bold text-text-heading">
              {completedLessonIds.length}/{totalLessons} Lessons ({progressPct}%)
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center relative">
            <span className="text-xs font-bold text-primary-light">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Lessons Sidebar + Content Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lesson Syllabus Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3 px-2">
              Module Lessons
            </h3>
            <div className="space-y-1.5">
              {lessons.map((lesson, idx) => {
                const isComplete = completedLessonIds.includes(lesson.id);
                const isActive = idx === activeLessonIndex;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setActiveLessonIndex(idx);
                      setQuizAnswers({});
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs transition-all border ${
                      isActive
                        ? 'bg-primary/15 border-primary/40 text-text font-semibold shadow-sm'
                        : 'bg-surface-card border-transparent text-text-muted hover:text-text hover:bg-surface-light'
                    }`}
                  >
                    <div className="shrink-0">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                      ) : (
                        <Circle className="w-4 h-4 text-text-dim" />
                      )}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="truncate">{lesson.title}</p>
                      <span className="text-[10px] text-text-dim">
                        Lesson {idx + 1} • {lesson.estimated_minutes || 15} mins
                      </span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary-light shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Learning Objectives Card */}
          <Card className="p-5">
            <h4 className="text-xs font-semibold text-text-heading flex items-center gap-1.5 mb-3">
              <Lightbulb className="w-4 h-4 text-accent-amber" />
              Learning Objectives
            </h4>
            <ul className="space-y-2">
              {module.learning_objectives?.map((obj, i) => (
                <li key={i} className="text-xs text-text-muted flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-light mt-1.5 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right Column: Active Lesson Viewport */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 sm:p-8">
            {/* Lesson Title & Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-6">
              <div>
                <span className="text-xs text-primary-light font-semibold uppercase tracking-wider block mb-1">
                  Lesson {activeLessonIndex + 1} of {totalLessons}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-text-heading">
                  {currentLesson.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {isCurrentLessonComplete ? (
                  <Badge variant="success" size="md">
                    <Check className="w-3 h-3" /> Completed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    loading={completing}
                    onClick={() => handleCompleteLesson(currentLesson.id)}
                    icon={Check}
                  >
                    Mark as Complete
                  </Button>
                )}
              </div>
            </div>

            {/* Lesson Body Content */}
            <div className="prose prose-invert max-w-none text-text-muted text-sm leading-relaxed space-y-4 whitespace-pre-line mb-8">
              {currentLesson.content}
            </div>

            {/* Real-World Examples Box */}
            {currentLesson.examples && currentLesson.examples.length > 0 && (
              <div className="bg-surface-card border border-border rounded-xl p-5 mb-6">
                <h4 className="text-xs font-bold text-primary-light uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Real-World Workplace Application
                </h4>
                <div className="space-y-2">
                  {currentLesson.examples.map((ex, i) => (
                    <div key={i} className="text-xs text-text bg-surface-lighter p-3 rounded-lg border border-border/60 leading-relaxed">
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Exercises Box */}
            {currentLesson.practical_exercises && currentLesson.practical_exercises.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8">
                <h4 className="text-xs font-bold text-accent-cyan uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Actionable Exercise For Today
                </h4>
                <ul className="space-y-1.5">
                  {currentLesson.practical_exercises.map((pe, i) => (
                    <li key={i} className="text-xs text-text flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan mt-1.5 shrink-0" />
                      <span>{pe}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Knowledge Checks */}
            {currentLesson.knowledge_checks && currentLesson.knowledge_checks.length > 0 && (
              <div className="border-t border-border pt-6 mb-8">
                <h4 className="text-sm font-bold text-text-heading flex items-center gap-2 mb-4">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Knowledge Check
                </h4>
                <div className="space-y-6">
                  {currentLesson.knowledge_checks.map((kc, qIdx) => {
                    const selected = quizAnswers[qIdx];
                    const hasAnswered = selected !== undefined;
                    const isCorrect = selected === kc.correct_index;

                    return (
                      <div key={qIdx} className="bg-surface-card border border-border p-5 rounded-xl">
                        <p className="text-xs font-semibold text-text-heading mb-3">
                          {qIdx + 1}. {kc.question}
                        </p>
                        <div className="space-y-2">
                          {kc.options.map((opt, optIdx) => {
                            let optionClass = 'bg-surface-light border-border text-text hover:bg-surface-lighter';
                            if (hasAnswered) {
                              if (optIdx === kc.correct_index) {
                                optionClass = 'bg-accent-emerald/20 border-accent-emerald text-emerald-300 font-semibold';
                              } else if (optIdx === selected) {
                                optionClass = 'bg-accent-rose/20 border-accent-rose text-rose-300 font-semibold';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() =>
                                  !hasAnswered && setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx })
                                }
                                disabled={hasAnswered}
                                className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${optionClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation on answer */}
                        {hasAnswered && (
                          <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border ${
                            isCorrect
                              ? 'bg-accent-emerald/10 border-accent-emerald/30 text-emerald-300'
                              : 'bg-surface-lighter border-border text-text-muted'
                          }`}>
                            <strong className="block mb-0.5">
                              {isCorrect ? '✓ Correct!' : '✗ Feedback:'}
                            </strong>
                            {kc.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Lesson Navigation Footbar */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                disabled={activeLessonIndex === 0}
                onClick={() => {
                  setActiveLessonIndex(activeLessonIndex - 1);
                  setQuizAnswers({});
                }}
                icon={ChevronLeft}
              >
                Previous Lesson
              </Button>

              <div className="flex items-center gap-2">
                {!isCurrentLessonComplete && (
                  <Button
                    size="sm"
                    loading={completing}
                    onClick={() => handleCompleteLesson(currentLesson.id)}
                    icon={Check}
                  >
                    Complete & Continue
                  </Button>
                )}

                {activeLessonIndex < totalLessons - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveLessonIndex(activeLessonIndex + 1);
                      setQuizAnswers({});
                    }}
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    Next Lesson
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
