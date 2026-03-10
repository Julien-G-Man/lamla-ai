'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { markEmailVerified } = useAuth();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    if (uid && token) {
      verifyEmail(uid, token);
    }
  }, [uid, token]);

  const verifyEmail = async (uid: string, token: string) => {
    setStatus('loading');
    try {
      const data = await authService.verifyEmail(uid, token);
      if (data.user) markEmailVerified(data.user);
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setStatus('error');
      setMessage(typeof err === 'string' ? err : 'Verification failed. The link may be expired.');
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendVerificationEmail();
      setResendStatus('Verification email sent! Please check your inbox.');
    } catch {
      setResendStatus('Failed to resend. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">Email Verification</h1>

        {status === 'idle' && !uid && (
          <>
            <p className="text-muted-foreground">
              A verification link has been sent to your email address. Please check your inbox.
            </p>
            <button
              onClick={handleResend}
              className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Resend Verification Email
            </button>
            {resendStatus && <p className="text-sm text-muted-foreground">{resendStatus}</p>}
          </>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={48} className="text-primary animate-spin" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle size={48} className="text-green-500" />
            <p className="text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle size={48} className="text-destructive" />
            <p className="text-destructive">{message}</p>
            <button
              onClick={handleResend}
              className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Resend Verification Email
            </button>
            {resendStatus && <p className="text-sm text-muted-foreground">{resendStatus}</p>}
          </div>
        )}

        <Link href="/auth/login" className="text-sm text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
