'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { dashboardService } from '@/services/dashboard';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading, getUserRole } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isLoading && isAuthenticated && getUserRole() !== 'admin') router.push('/dashboard');
  }, [isLoading, isAuthenticated, router, getUserRole]);

  useEffect(() => {
    if (!params.id) return;
    dashboardService.getAdminUserDetails(params.id as string)
      .then(setUserData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleRemove = async () => {
    if (!confirm('Remove this user? This action cannot be undone.')) return;
    setRemoving(true);
    try {
      await dashboardService.removeUser(params.id as string);
      router.push('/admin-dashboard');
    } catch (err) {
      alert('Failed to remove user.');
      setRemoving(false);
    }
  };

  if (isLoading || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/admin-dashboard" className="p-2 rounded-md border border-border hover:bg-accent transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>

        {userData ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Username</p><p className="font-medium">{userData.user?.username || userData.username}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{userData.user?.email || userData.email}</p></div>
                <div><p className="text-muted-foreground">Role</p><p className="font-medium">{userData.user?.is_admin ? 'Admin' : 'Student'}</p></div>
                <div><p className="text-muted-foreground">Joined</p><p className="font-medium">{userData.user?.date_joined ? new Date(userData.user.date_joined).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-muted-foreground">Total Quizzes</p><p className="font-medium">{userData.stats?.total_quizzes ?? '—'}</p></div>
                <div><p className="text-muted-foreground">Avg. Score</p><p className="font-medium">{userData.stats?.average_score != null ? `${userData.stats.average_score}%` : '—'}</p></div>
              </div>
            </div>

            <button
              onClick={handleRemove}
              disabled={removing}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60"
            >
              <Trash2 size={14} /> {removing ? 'Removing...' : 'Remove User'}
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">User not found.</p>
        )}
      </main>
    </div>
  );
}
