'use client';

import React from 'react';
import { LucideIcon, LogOut } from 'lucide-react';
import Image from 'next/image';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface User {
  username?: string;
  email?: string;
  profile_image?: string;
}

interface SidebarProps {
  user?: User | null;
  navItems: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  showMobileLogout?: boolean;
  variant?: 'user' | 'admin';
}

const Sidebar = ({
  user,
  navItems,
  activeId,
  onNavigate,
  onLogout,
  showMobileLogout = false,
  variant = 'user',
}: SidebarProps) => {
  const accentClass = variant === 'admin' ? 'text-blue-500' : 'text-primary';
  const badgeClass =
    variant === 'admin'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-primary/10 text-primary';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border bg-card p-4 gap-4 shrink-0">
        {/* User Info */}
        <div className="flex flex-col items-center gap-2 py-4 border-b border-border">
          {user?.profile_image ? (
            <Image
              src={user.profile_image}
              alt="avatar"
              width={64}
              height={64}
              className="rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-primary/10 ${accentClass}`}>
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <h3 className="font-semibold text-foreground">{user?.username}</h3>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
            {variant === 'admin' ? 'Admin' : 'Student'}
          </span>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                activeId === id
                  ? `bg-primary/10 ${accentClass}`
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-30 bg-background border-t border-border flex">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={`mobile-${id}`}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs transition-colors ${
              activeId === id ? accentClass : 'text-muted-foreground'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
        {showMobileLogout && (
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs text-destructive"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default Sidebar;
