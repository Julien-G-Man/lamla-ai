'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { dashboardService } from '@/services/dashboard';
import { LayoutDashboard, Users, Activity, Star, Settings, User } from 'lucide-react';
import Link from 'next/link';

const NAV_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'activity', icon: Activity, label: 'Activity' },
  { id: 'ratings', icon: Star, label: 'Ratings' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, getUserRole } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isLoading && isAuthenticated && getUserRole() !== 'admin') router.push('/dashboard');
  }, [isLoading, isAuthenticated, router, getUserRole]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;
    setLoadingData(true);
    Promise.all([
      dashboardService.getAdminStats().catch(() => null),
      dashboardService.getAdminUsers().catch(() => []),
    ])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData || []);
      })
      .finally(() => setLoadingData(false));
  }, [isAuthenticated, getUserRole]);

  const handleLogout = async () => { await logout(); router.push('/'); };
  const handleNavigate = (id: string) => {
    if (id === 'activity') { router.push('/admin-dashboard/activity'); return; }
    if (id === 'ratings') { router.push('/admin-dashboard/ratings'); return; }
    if (id === 'profile') { router.push('/profile'); return; }
    setActiveTab(id);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const statCards = stats ? [
    { label: 'Total Users', value: stats.total_users ?? '—' },
    { label: 'Total Quizzes', value: stats.total_quizzes ?? '—' },
    { label: 'Active Today', value: stats.active_today ?? '—' },
    { label: 'Avg. Score', value: stats.average_score ? `${stats.average_score}%` : '—' },
  ] : [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar user={user} navItems={NAV_ITEMS} activeId={activeTab} onNavigate={handleNavigate} onLogout={handleLogout} variant="admin" showMobileLogout />

        <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl">
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">System overview and management.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingData
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-border bg-card p-4 h-20 animate-pulse bg-muted" />
                    ))
                  : statCards.map(({ label, value }) => (
                      <div key={label} className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <h3 className="text-2xl font-bold mt-1">{value}</h3>
                      </div>
                    ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="font-semibold mb-4">Quick Links</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Link href="/admin-dashboard/activity" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium">
                    <Activity size={16} /> Activity Logs
                  </Link>
                  <Link href="/admin-dashboard/ratings" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm font-medium">
                    <Star size={16} /> Quiz Ratings
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="flex flex-col gap-6">
              <h1 className="text-2xl font-bold">User Management</h1>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {loadingData ? (
                  <p className="text-muted-foreground p-4">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-muted-foreground p-4">No users found.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="font-medium text-sm">{u.username}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_admin ? 'bg-blue-100 text-blue-700' : 'bg-primary/10 text-primary'}`}>
                            {u.is_admin ? 'Admin' : 'Student'}
                          </span>
                          <Link href={`/admin-dashboard/user/${u.id}`} className="text-xs px-3 py-1 rounded-md border border-border hover:bg-accent transition-colors">
                            Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
