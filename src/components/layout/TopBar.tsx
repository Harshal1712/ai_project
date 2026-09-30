import React, { useEffect, useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  User,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  X,
  Plus,
  LogOut
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { ContentIQApiClient } from '../../services/api';

const ACTION_TITLES: Record<string, string> = {
  PROJECT_CREATED: 'Project Created',
  OUTPUT_GENERATED: 'Outputs Generated',
  VERIFICATION_RUN: 'Verification Run',
  QA_ASKED: 'Question Asked',
  PROJECT_DELETED: 'Project Deleted',
  USER_LOGIN: 'Logged In',
  USER_REGISTERED: 'Account Registered',
  PASSWORD_CHANGED: 'Password Changed',
  PASSWORD_RESET: 'Password Reset',
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  GOOGLE_LOGIN: 'Signed In with Google',
  FLASHCARDS_GENERATED: 'Flashcards Generated',
  QUIZ_ATTEMPTED: 'Quiz Completed',
  OUTPUT_TRANSLATED: 'Output Translated',
};

interface TopBarProps {
  sidebarCollapsed: boolean;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenHelp: () => void;
  onOpenNewTransformation: () => void;
  user: { name: string; email: string } | null;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  sidebarCollapsed,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenHelp,
  onOpenNewTransformation,
  user,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string; type: 'success' | 'warning' | 'info' }>>([]);

  useEffect(() => {
    ContentIQApiClient.getHistory()
      .then(({ logs }) => {
        setNotifications(
          logs.slice(0, 5).map((log: any) => ({
            id: log._id,
            title: ACTION_TITLES[log.action] || log.action,
            desc: log.detail,
            time: new Date(log.createdAt).toLocaleString(),
            type: log.action === 'VERIFICATION_RUN' ? 'warning' : log.action === 'OUTPUT_GENERATED' ? 'success' : 'info',
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <header 
      className={`fixed top-0 right-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex items-center justify-between px-6 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, source documents, transcripts, outputs..."
            className="w-full pl-10 pr-16 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-slate-400 shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Quick CTA & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Create Transformation Quick Button */}
        <button
          onClick={onOpenNewTransformation}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Transformation</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-600 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Recent Activity</h4>
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                      {notifications.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No activity yet — create your first transformation.</p>
                )}
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl border transition-colors bg-slate-50/50 dark:bg-slate-850/40 border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-start gap-2.5">
                      {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                      {n.type === 'info' && <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.desc}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    setActiveTab('history');
                  }}
                  className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
                >
                  View transformation history →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Guide Modal Trigger */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="SIH Platform Guide & Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Vertical Separator */}
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700">
              {(user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-400 font-medium">ContentIQ Member</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || ''}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setActiveTab('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Account & AI Model Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setActiveTab('analytics');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Usage & API Analytics
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenHelp();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between"
                >
                  <span>SIH26154 Documentation</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-2 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
