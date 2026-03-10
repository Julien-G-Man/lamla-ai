'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';
import { Sun, Moon, Bell } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
}

const AppHeader = ({ title, breadcrumb }: AppHeaderProps) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-6 gap-4 shrink-0">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {breadcrumb ? (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications placeholder */}
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors relative">
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <Link href="/profile" className="ml-1">
          {user?.profile_image ? (
            <Image
              src={user.profile_image}
              alt="Profile"
              width={28}
              height={28}
              className="rounded-full object-cover ring-2 ring-border hover:ring-primary transition-all"
            />
          ) : (
            <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white hover:glow-blue-sm transition-all">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
};

export default AppHeader;
