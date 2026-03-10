'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import { Camera, Moon, Sun, Shield, GraduationCap } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile, uploadProfileImage, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      await updateProfile(username, email);
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg(typeof err === 'string' ? err : 'Update failed.');
    } finally {
      setSaving(false);
      setTimeout(() => setProfileMsg(''), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg(typeof err === 'string' ? err : 'Password change failed.');
    } finally {
      setTimeout(() => setPasswordMsg(''), 3000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return; }
    try {
      await uploadProfileImage(file);
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Upload failed.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const isAdmin = user?.is_admin;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>

        {/* Avatar */}
        <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-6">
          <div className="relative">
            {user?.profile_image ? (
              <Image src={user.profile_image} alt="Profile" width={80} height={80} className="rounded-full object-cover ring-2 ring-border" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Camera size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div>
            <h2 className="font-semibold">{user?.username}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${
              isAdmin ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-primary/10 text-primary'
            }`}>
              {isAdmin ? <><Shield size={10} /> Admin</> : <><GraduationCap size={10} /> Student</>}
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSave} className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
          <h2 className="font-semibold">Account Information</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required
              className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" disabled={saving}
            className="self-start px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 text-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {profileMsg && <p className="text-sm text-muted-foreground">{profileMsg}</p>}
        </form>

        {/* Password Form */}
        <form onSubmit={handlePasswordChange} className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
          <h2 className="font-semibold">Change Password</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Current Password</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required
              className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
              className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit"
            className="self-start px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm">
            Change Password
          </button>
          {passwordMsg && <p className="text-sm text-muted-foreground">{passwordMsg}</p>}
        </form>

        {/* Theme */}
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Toggle between dark and light mode.</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-accent transition-colors text-sm font-medium"
          >
            {theme === 'dark' ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
          </button>
        </div>
      </main>
    </div>
  );
}
