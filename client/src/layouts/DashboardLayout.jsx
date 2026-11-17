import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Compass,
  Mic,
  BarChart2,
  Trophy,
  Users,
  FolderKanban,
  FileText,
  UserCheck,
  Activity,
  Sliders,
  Keyboard,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckCheck,
  Sun,
  Moon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

// ─── Shared class helpers ────────────────────────────────────────────────────
const sidebar =
  'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60';
const topbar =
  'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/60 backdrop-blur-md';
const navActive =
  'bg-indigo-600 text-white shadow-md shadow-indigo-600/20';
const navInactive =
  'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800';
const cardBg =
  'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60';
const textHeading = 'text-slate-900 dark:text-slate-100';
const textMuted   = 'text-slate-500 dark:text-slate-400';
const textDim     = 'text-slate-400 dark:text-slate-600';
const inputBg     = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700';
const dropdownBg  = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';

export default function DashboardLayout({ title = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen]     = useState(false);
  const [notifications, setNotifications]     = useState([]);
  const [unreadCount, setUnreadCount]         = useState(0);

  const profileRef     = useRef(null);
  const notificationRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target))
        setNotificationOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.items || []);
        setUnreadCount(res.data.data.unread_count || 0);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (_) {}
  };

  const markSingleNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setNotificationOpen(false);
        setProfileMenuOpen(false);
        return;
      }
      const tag = e.target.tagName?.toLowerCase();
      if (['input','textarea','select'].includes(tag) || e.target.isContentEditable) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      const key = e.key.toUpperCase();
      const shortcuts = user?.role === 'admin' ? {
        D: { path: '/admin',              name: 'Admin Dashboard' },
        U: { path: '/admin/users',        name: 'User Directory' },
        A: { path: '/admin/assignments',  name: 'Student Allocation' },
        M: { path: '/admin/modules',      name: 'Modules & Categories' },
        P: { path: '/admin/analytics',    name: 'Platform Analytics' },
        L: { path: '/admin/audit-logs',   name: 'Audit Logs' },
        S: { path: '/admin/settings',     name: 'Platform Settings' },
      } : user?.role === 'student' ? {
        D: { path: '/student',                    name: 'Student Dashboard' },
        M: { path: '/student/modules',            name: 'Soft-Skill Modules' },
        A: { path: '/student/assessments',        name: 'Skill Assessments' },
        I: { path: '/student/interviews',         name: 'Mock Interview Lab' },
        L: { path: '/student/learning-path',      name: 'Personalized Path' },
        R: { path: '/student/progress',           name: 'Progress & PDF Reports' },
        H: { path: '/student/achievements',       name: 'Achievements & Ranks' },
      } : {};
      if (shortcuts[key]) {
        e.preventDefault();
        const target = shortcuts[key];
        if (location.pathname !== target.path) {
          navigate(target.path);
          toast.success(`[${key}] ${target.name}`, {
            id: `nav-shortcut-${key}`, duration: 1800, icon: '⚡',
          });
        }
      };
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, location.pathname, navigate]);

  // Nav items
  const getNavItems = () => {
    if (!user) return [];
    if (user.role === 'admin') return [
      { label: 'Admin Dashboard',     path: '/admin',             icon: LayoutDashboard, shortcut: 'D' },
      { label: 'User Directory',      path: '/admin/users',       icon: Users,           shortcut: 'U' },
      { label: 'Student Allocation',  path: '/admin/assignments', icon: UserCheck,       shortcut: 'A' },
      { label: 'Modules & Categories',path: '/admin/modules',     icon: FolderKanban,     shortcut: 'M' },
      { label: 'Platform Analytics',  path: '/admin/analytics',   icon: Activity,         shortcut: 'P' },
      { label: 'Audit Logs',          path: '/admin/audit-logs',  icon: FileText,         shortcut: 'L' },
      { label: 'Platform Settings',   path: '/admin/settings',    icon: Sliders,          shortcut: 'S' },
    ];
    return [
      { label: 'Student Dashboard',    path: '/student',               icon: LayoutDashboard, shortcut: 'D' },
      { label: 'Soft-Skill Modules',   path: '/student/modules',       icon: BookOpen,        shortcut: 'M' },
      { label: 'Skill Assessments',    path: '/student/assessments',   icon: Award,           shortcut: 'A' },
      { label: 'Mock Interview Lab',   path: '/student/interviews',    icon: Mic,             shortcut: 'I' },
      { label: 'Personalized Path',    path: '/student/learning-path', icon: Compass,         shortcut: 'L' },
      { label: 'Progress & PDF Reports',path:'/student/progress',      icon: BarChart2,       shortcut: 'R' },
      { label: 'Achievements & Ranks', path: '/student/achievements',  icon: Trophy,          shortcut: 'H' },
    ];
  };

  const navItems = getNavItems();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col border-r ${sidebar} transition-all duration-300 z-30 sticky top-0 h-screen ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>

        {/* Brand */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-600/30 shrink-0">
              SSDP
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <span className={`font-bold text-sm block leading-none ${textHeading}`}>SSDP Portal</span>
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${textDim}`}>
                  {user?.role} view
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1 rounded-lg ${textMuted} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all`}
          >
            {sidebarCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft  className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== `/${user?.role}` && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive ? navActive : navInactive}`}
                title={sidebarCollapsed ? (item.shortcut ? `${item.label} [${item.shortcut}]` : item.label) : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500'}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                        isActive
                          ? 'bg-white/20 border-white/30 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 border-slate-200 dark:border-slate-600 group-hover:border-indigo-400'
                      }`}>
                        {item.shortcut}
                      </kbd>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* User card */}
        {!sidebarCollapsed ? (
          <div className="p-3 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-700/50">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate flex-1">
                <p className={`text-xs font-semibold truncate ${textHeading}`}>{user?.full_name}</p>
                <p className={`text-[10px] truncate ${textDim}`}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all border border-slate-200 dark:border-slate-600"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-200 dark:border-slate-700/60 flex justify-center">
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* ── Mobile Drawer ─────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={`relative w-72 max-w-[80vw] ${sidebar} border-r h-full flex flex-col z-10 p-4`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-sm">
                  SSDP
                </div>
                <span className={`font-bold text-sm ${textHeading}`}>Student Skill Platform</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className={`p-1.5 ${textMuted} rounded-lg`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? navActive : navInactive}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'bg-white/20 border-white/30 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 border-slate-200 dark:border-slate-600'
                      }`}>
                        {item.shortcut}
                      </kbd>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className={`h-16 border-b ${topbar} sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`md:hidden p-2 rounded-xl ${textMuted} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className={`text-base sm:text-lg font-bold truncate ${textHeading}`}>{title}</h1>
          </div>

          {/* Quick Portal Jump */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className={`text-[11px] font-semibold mr-1 ${textDim}`}>Jump:</span>
            {[
              { label: 'Student', path: '/student', active: 'bg-indigo-600 text-white' },
              { label: 'Admin', path: '/admin', active: 'bg-slate-700 dark:bg-slate-500 text-white' },
            ].map(({ label, path, active }) => (
              <Link
                key={path}
                to={path}
                className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                  location.pathname.startsWith(path)
                    ? active
                    : `${textMuted} hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700`
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/"
              className={`px-2 py-1 rounded-lg ${textDim} hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all`}
            >
              Website
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* ── Theme Toggle ── */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2 rounded-xl ${textMuted} hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all`}
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun  className="w-5 h-5" />
                : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className={`p-2 rounded-xl ${textMuted} hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative`}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className={`absolute right-0 mt-2 w-80 sm:w-96 ${dropdownBg} border rounded-2xl shadow-2xl p-4 z-50`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${textHeading}`}>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className={`text-xs ${textMuted} text-center py-6`}>No notifications at this time.</p>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => !item.is_read && markSingleNotificationRead(item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            item.is_read
                              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70'
                              : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-xs font-semibold ${textHeading}`}>{item.title}</h4>
                            {!item.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                          </div>
                          <p className={`text-xs ${textMuted} mt-1 leading-relaxed`}>{item.message}</p>
                          <span className={`text-[10px] ${textDim} block mt-1.5`}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile pill */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-700/50">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className={`text-xs font-semibold leading-tight truncate max-w-[120px] ${textHeading}`}>
                    {user?.full_name}
                  </p>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${textDim}`}>
                    {user?.role}
                  </p>
                </div>
              </button>

              {profileMenuOpen && (
                <div className={`absolute right-0 mt-2 w-56 ${dropdownBg} border rounded-2xl shadow-2xl p-2 z-50`}>
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 mb-1">
                    <p className={`text-xs font-semibold truncate ${textHeading}`}>{user?.full_name}</p>
                    <p className={`text-[10px] truncate ${textDim}`}>{user?.email}</p>
                    {user?.student_id && (
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono mt-0.5">
                        ID: {user.student_id}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Keyboard Shortcuts Modal ──────────────────────────────── */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-md"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className={`${cardBg} rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center border border-indigo-200 dark:border-indigo-700/50">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${textHeading}`}>
                    Keyboard Shortcuts
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                      Active
                    </span>
                  </h3>
                  <p className={`text-xs ${textMuted}`}>Instant single-key navigation across your platform</p>
                </div>
              </div>
              <button
                onClick={() => setShortcutsOpen(false)}
                className={`p-1.5 rounded-lg ${textMuted} hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {(user?.role === 'admin' ? [
                { key: 'D', name: 'Admin Dashboard',     path: '/admin',             desc: 'System overview & KPIs' },
                { key: 'U', name: 'User Directory',      path: '/admin/users',       desc: 'Users, roles & status' },
                { key: 'A', name: 'Student Allocation',  path: '/admin/assignments', desc: 'Faculty mentorship pairing' },
                { key: 'M', name: 'Modules & Categories',path: '/admin/modules',     desc: 'Curriculum organization' },
                { key: 'P', name: 'Platform Analytics',  path: '/admin/analytics',   desc: 'Platform telemetry & trends' },
                { key: 'L', name: 'Audit Logs',          path: '/admin/audit-logs',  desc: 'Security & action history' },
                { key: 'S', name: 'Platform Settings',   path: '/admin/settings',    desc: 'Scoring weights & controls' },
              ] : [
                { key: 'D', name: 'Student Dashboard',    path: '/student',               desc: 'Home workspace & KPIs' },
                { key: 'M', name: 'Soft-Skill Modules',   path: '/student/modules',       desc: '12 tracks, 24+ courses' },
                { key: 'A', name: 'Skill Assessments',    path: '/student/assessments',   desc: 'Diagnostic & evaluations' },
                { key: 'I', name: 'Mock Interview Lab',   path: '/student/interviews',    desc: 'STAR behavioral simulations' },
                { key: 'L', name: 'Personalized Path',    path: '/student/learning-path', desc: 'Diagnostic skill roadmap' },
                { key: 'R', name: 'Progress & PDF Reports',path:'/student/progress',      desc: 'Analytics & certificate download' },
                { key: 'H', name: 'Achievements & Ranks', path: '/student/achievements',  desc: 'Badges & leaderboards' },
              ]).map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setShortcutsOpen(false); navigate(item.path); }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-left group"
                >
                  <div className="min-w-0 pr-2">
                    <span className={`block text-xs font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate ${textHeading}`}>
                      {item.name}
                    </span>
                    <span className={`block text-[10px] truncate ${textDim}`}>{item.desc}</span>
                  </div>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                    {item.key}
                  </kbd>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className={`flex items-center gap-1.5 ${textDim}`}>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 rounded border border-slate-200 dark:border-slate-600">?</kbd>
                Press anytime to open this helper
              </span>
              <span className={`flex items-center gap-1.5 ${textDim}`}>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">Esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
