'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MathRenderer from '@/components/MathRenderer';
import djangoApi from '@/services/api';
import {
  Flag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Brain,
  AlertTriangle,
  Save,
  Gauge,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

interface Question {
  question: string;
  options?: string[];
  type?: string;
}

interface QuizData {
  id?: string | number;
  subject?: string;
  quiz_time?: number | string;
  time_limit?: number | string;
  mcq_questions?: Question[];
  short_questions?: Question[];
  questions?: Question[];
}

interface SavedQuizProgress {
  userAnswers: Record<number, string>;
  draftAnswers: Record<number, string>;
  flaggedQuestions: Record<number, boolean>;
  currentIndex: number;
  startTime: number;
  endTime: number;
}

type QuestionFilter = 'all' | 'answered' | 'unanswered' | 'flagged' | 'draft';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

const QUESTION_FILTERS: Array<{ key: QuestionFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'answered', label: 'Answered' },
  { key: 'unanswered', label: 'Unanswered' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'draft', label: 'Drafts' },
];

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isMcqQuestion = (question?: Question) =>
  Array.isArray(question?.options) && question.options.length > 0;

const hasTextValue = (value?: string) =>
  typeof value === 'string' && value.trim().length > 0;

export default function QuizPlayPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('all');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const autoSubmittedRef = useRef(false);
  const storageKey = useRef('lamla_quiz_temp');
  const submittedKey = useRef('lamla_quiz_submitted_temp');
  const pendingActionRef = useRef<(() => void) | null>(null);
  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);

  const reviewModalRef = useRef<HTMLDivElement>(null);
  const submitModalRef = useRef<HTMLDivElement>(null);
  const leaveModalRef = useRef<HTMLDivElement>(null);
  const unsavedModalRef = useRef<HTMLDivElement>(null);
  const submittingModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isLoading || !isAuthenticated) return;

    const stored = localStorage.getItem('current_quiz');
    if (!stored) {
      router.replace('/quiz/create');
      return;
    }

    let data: QuizData;
    try {
      data = JSON.parse(stored) as QuizData;
    } catch {
      router.replace('/quiz/create');
      return;
    }

    submittedKey.current = `lamla_quiz_submitted_${data.id || 'temp'}`;
    if (localStorage.getItem(submittedKey.current) === '1') {
      if (localStorage.getItem('quiz_results')) {
        router.replace('/quiz/results');
      } else {
        router.replace('/quiz/create');
      }
      return;
    }

    setQuizData(data);
    storageKey.current = `lamla_quiz_${data.id || 'temp'}`;

    const allQ: Question[] = [
      ...(data.mcq_questions || []),
      ...(data.short_questions || []),
      ...(data.questions || []),
    ];
    setQuestions(allQ);

    const minutes = parseInt(String(data.time_limit ?? data.quiz_time ?? '10'), 10);
    const totalSeconds = (isNaN(minutes) || minutes <= 0 ? 10 : minutes) * 60;
    setTotalDurationSec(totalSeconds);

    let restoredAnswers: Record<number, string> = {};
    let restoredDrafts: Record<number, string> = {};
    let restoredFlagged: Record<number, boolean> = {};
    let restoredIndex = 0;
    let startTime = Date.now();
    let endTime = startTime + totalSeconds * 1000;

    const saved = localStorage.getItem(storageKey.current);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<SavedQuizProgress>;
        restoredAnswers = parsed.userAnswers || {};
        restoredDrafts = parsed.draftAnswers || {};
        restoredFlagged = parsed.flaggedQuestions || {};
        restoredIndex = typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0;

        if (typeof parsed.endTime === 'number' && Number.isFinite(parsed.endTime)) {
          endTime = parsed.endTime;
        }
        if (typeof parsed.startTime === 'number' && Number.isFinite(parsed.startTime)) {
          startTime = parsed.startTime;
        } else {
          startTime = endTime - totalSeconds * 1000;
        }
      } catch {
        // Ignore corrupted local progress
      }
    }

    const boundedIndex = Math.min(Math.max(restoredIndex, 0), Math.max(allQ.length - 1, 0));
    setAnswers(restoredAnswers);
    setDraftAnswers(restoredDrafts);
    setFlagged(restoredFlagged);
    setCurrentIndex(boundedIndex);

    startTimeRef.current = startTime;
    endTimeRef.current = endTime;
    setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    setTimerReady(true);
  }, [isLoading, isAuthenticated, router]);

  const hasSavedAnswerAt = useCallback(
    (index: number) => {
      const value = answers[index];
      return hasTextValue(value);
    },
    [answers]
  );

  const hasUnsavedDraftAt = useCallback(
    (index: number) => {
      if (isMcqQuestion(questions[index])) return false;
      const draft = draftAnswers[index];
      if (draft === undefined) return false;
      return draft !== (answers[index] ?? '');
    },
    [questions, draftAnswers, answers]
  );

  const mergeDraftAnswers = useCallback(
    (baseAnswers: Record<number, string>) => {
      const merged: Record<number, string> = { ...baseAnswers };
      for (const [rawIndex, draftValue] of Object.entries(draftAnswers)) {
        const index = Number(rawIndex);
        if (Number.isNaN(index) || isMcqQuestion(questions[index])) continue;
        const trimmed = draftValue.trim();
        if (trimmed) {
          merged[index] = trimmed;
        } else {
          delete merged[index];
        }
      }
      return merged;
    },
    [draftAnswers, questions]
  );

  const saveDraftAtIndex = useCallback(
    (index: number, silent = false) => {
      if (!(index in draftAnswers)) return;
      const draftValue = draftAnswers[index] ?? '';
      const trimmed = draftValue.trim();

      setAnswers(prev => {
        const next = { ...prev };
        if (trimmed) next[index] = trimmed;
        else delete next[index];
        return next;
      });

      setDraftAnswers(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });

      if (!silent) toast.success('Answer saved.');
    },
    [draftAnswers]
  );

  const clearAnswerAtIndex = useCallback((index: number, silent = false) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setDraftAnswers(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    if (!silent) toast.info('Answer cleared.');
  }, []);

  const saveAllDrafts = useCallback(
    (silent = false) => {
      if (Object.keys(draftAnswers).length === 0) return;
      setAnswers(prev => mergeDraftAnswers(prev));
      setDraftAnswers({});
      if (!silent) toast.success('All drafts saved.');
    },
    [draftAnswers, mergeDraftAnswers]
  );

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const finalAnswers = mergeDraftAnswers(answers);
      if (Object.keys(draftAnswers).length > 0) {
        setAnswers(finalAnswers);
        setDraftAnswers({});
      }

      const res = await djangoApi.post('/quiz/submit/', {
        quiz_id: quizData?.id,
        quiz_data: quizData,
        user_answers: finalAnswers,
        total_questions: questions.length,
      });

      localStorage.setItem(submittedKey.current, '1');
      localStorage.removeItem(storageKey.current);
      localStorage.removeItem('current_quiz');
      localStorage.setItem('quiz_results', JSON.stringify(res.data));
      router.replace('/quiz/results');
    } catch (err: unknown) {
      const maybeErr = err as { response?: { data?: { error?: string } } };
      toast.error(
        maybeErr?.response?.data?.error || 'Failed to submit quiz. Please check your connection.'
      );
      setSubmitting(false);
    }
  }, [submitting, mergeDraftAnswers, answers, draftAnswers, quizData, questions.length, router]);

  const closeSubmitModal = useCallback(() => {
    if (submitting) return;
    setSubmitModalOpen(false);
  }, [submitting]);

  const closeReviewModal = useCallback(() => {
    if (submitting) return;
    setReviewModalOpen(false);
  }, [submitting]);

  const closeLeaveModal = useCallback(() => {
    if (submitting) return;
    setLeaveModalOpen(false);
  }, [submitting]);

  const closeUnsavedModal = useCallback(() => {
    if (submitting) return;
    pendingActionRef.current = null;
    setUnsavedModalOpen(false);
  }, [submitting]);

  const runPendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  }, []);

  const guardUnsavedThen = useCallback(
    (action: () => void) => {
      if (submitting) return;
      if (hasUnsavedDraftAt(currentIndex)) {
        pendingActionRef.current = action;
        setUnsavedModalOpen(true);
        return;
      }
      action();
    },
    [submitting, currentIndex, hasUnsavedDraftAt]
  );

  const goToQuestion = useCallback(
    (nextIndex: number) => {
      const bounded = Math.min(Math.max(nextIndex, 0), questions.length - 1);
      guardUnsavedThen(() => setCurrentIndex(bounded));
    },
    [questions.length, guardUnsavedThen]
  );

  const openSubmitModal = useCallback(() => {
    guardUnsavedThen(() => setReviewModalOpen(true));
  }, [guardUnsavedThen]);

  const proceedToSubmitConfirm = useCallback(() => {
    if (submitting) return;
    if (Object.keys(draftAnswers).length > 0) {
      saveAllDrafts(true);
    }
    setReviewModalOpen(false);
    setSubmitModalOpen(true);
  }, [submitting, draftAnswers, saveAllDrafts]);

  const confirmSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitModalOpen(false);
    setReviewModalOpen(false);
    await handleSubmit();
  }, [submitting, handleSubmit]);

  const submitFromLeaveModal = useCallback(async () => {
    if (submitting) return;
    setLeaveModalOpen(false);
    await handleSubmit();
  }, [submitting, handleSubmit]);

  const saveDraftAndContinue = useCallback(() => {
    saveDraftAtIndex(currentIndex, true);
    setUnsavedModalOpen(false);
    runPendingAction();
  }, [saveDraftAtIndex, currentIndex, runPendingAction]);

  const discardDraftAndContinue = useCallback(() => {
    clearAnswerAtIndex(currentIndex, true);
    setUnsavedModalOpen(false);
    runPendingAction();
  }, [clearAnswerAtIndex, currentIndex, runPendingAction]);

  const sessionActive = Boolean(quizData && timerReady && !submitting && questions.length > 0);

  useEffect(() => {
    if (!timerReady) return;

    const syncTimeLeft = () => {
      const remaining = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    syncTimeLeft();
    const timer = window.setInterval(syncTimeLeft, 1000);
    return () => window.clearInterval(timer);
  }, [timerReady]);

  useEffect(() => {
    if (timerReady && timeLeft === 0 && !autoSubmittedRef.current && !submitting) {
      autoSubmittedRef.current = true;
      toast.info("Time's up! Submitting your answers.");
      void handleSubmit();
    }
  }, [timeLeft, timerReady, submitting, handleSubmit]);

  useEffect(() => {
    if (!quizData || !timerReady || submitting || questions.length === 0) return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      const state: SavedQuizProgress = {
        userAnswers: answers,
        draftAnswers,
        flaggedQuestions: flagged,
        currentIndex,
        startTime: startTimeRef.current,
        endTime: endTimeRef.current,
      };
      localStorage.setItem(storageKey.current, JSON.stringify(state));
      setLastSavedAt(Date.now());
      setSaveState('saved');
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [answers, draftAnswers, flagged, currentIndex, quizData, timerReady, submitting, questions.length]);

  useEffect(() => {
    if (!sessionActive) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [sessionActive]);

  useEffect(() => {
    if (!sessionActive) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const currentUrl = new URL(window.location.href);
      const nextUrl = new URL(anchor.href, currentUrl.href);
      const samePage =
        nextUrl.origin === currentUrl.origin &&
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash;
      if (samePage) return;

      event.preventDefault();
      event.stopPropagation();
      setLeaveModalOpen(true);
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, [sessionActive]);

  useEffect(() => {
    if (!sessionActive) return;

    const state = { quizSessionGuard: true };
    window.history.pushState(state, '', window.location.href);

    const onPopState = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.pushState(state, '', window.location.href);
      setLeaveModalOpen(true);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [sessionActive]);

  const filteredQuestionIndexes = useMemo(
    () =>
      questions
        .map((_, index) => index)
        .filter(index => {
          if (questionFilter === 'all') return true;
          if (questionFilter === 'answered') return hasSavedAnswerAt(index);
          if (questionFilter === 'unanswered') {
            return !hasSavedAnswerAt(index) && !hasUnsavedDraftAt(index);
          }
          if (questionFilter === 'flagged') return Boolean(flagged[index]);
          return hasUnsavedDraftAt(index);
        }),
    [questions, questionFilter, hasSavedAnswerAt, hasUnsavedDraftAt, flagged]
  );

  const answeredCount = useMemo(
    () => questions.reduce((total, _, index) => total + (hasSavedAnswerAt(index) ? 1 : 0), 0),
    [questions, hasSavedAnswerAt]
  );

  const draftCount = useMemo(
    () => questions.reduce((total, _, index) => total + (hasUnsavedDraftAt(index) ? 1 : 0), 0),
    [questions, hasUnsavedDraftAt]
  );

  const unansweredCount = Math.max(questions.length - answeredCount, 0);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeModalKey: 'unsaved' | 'review' | 'submit' | 'leave' | 'submitting' | null =
    unsavedModalOpen
      ? 'unsaved'
      : reviewModalOpen
      ? 'review'
      : submitModalOpen
      ? 'submit'
      : leaveModalOpen
      ? 'leave'
      : submitting
      ? 'submitting'
      : null;

  const closeTopmostModal = useCallback(() => {
    if (submitting) return;
    if (unsavedModalOpen) {
      closeUnsavedModal();
      return;
    }
    if (submitModalOpen) {
      closeSubmitModal();
      return;
    }
    if (reviewModalOpen) {
      closeReviewModal();
      return;
    }
    if (leaveModalOpen) {
      closeLeaveModal();
      return;
    }
    if (panelOpen) {
      setPanelOpen(false);
    }
  }, [
    submitting,
    unsavedModalOpen,
    submitModalOpen,
    reviewModalOpen,
    leaveModalOpen,
    panelOpen,
    closeUnsavedModal,
    closeSubmitModal,
    closeReviewModal,
    closeLeaveModal,
  ]);

  useEffect(() => {
    if (!activeModalKey) return;

    const modalMap = {
      unsaved: unsavedModalRef.current,
      review: reviewModalRef.current,
      submit: submitModalRef.current,
      leave: leaveModalRef.current,
      submitting: submittingModalRef.current,
    };

    const activeModal = modalMap[activeModalKey];
    if (!activeModal) return;

    const previousFocusedElement = document.activeElement as HTMLElement | null;
    const focusables = Array.from(activeModal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const initialFocus = focusables[0] || activeModal;
    window.setTimeout(() => initialFocus.focus(), 0);

    const onModalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeModalKey !== 'submitting') {
        event.preventDefault();
        closeTopmostModal();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = Array.from(activeModal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) {
        event.preventDefault();
        activeModal.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const focused = document.activeElement as HTMLElement | null;

      if (event.shiftKey && focused === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && focused === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onModalKeyDown);
    return () => {
      document.removeEventListener('keydown', onModalKeyDown);
      previousFocusedElement?.focus();
    };
  }, [activeModalKey, closeTopmostModal]);

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isMcq = isMcqQuestion(q);
  const isAnswered = hasSavedAnswerAt(currentIndex);
  const currentHasUnsavedDraft = hasUnsavedDraftAt(currentIndex);
  const shortAnswerValue = draftAnswers[currentIndex] ?? answers[currentIndex] ?? '';
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const elapsedSeconds = Math.max(totalDurationSec - timeLeft, 0);
  const expectedAnswered =
    totalDurationSec > 0
      ? Math.min(
          questions.length,
          Math.max(0, Math.round((elapsedSeconds / totalDurationSec) * questions.length))
        )
      : 0;
  const paceDelta = answeredCount - expectedAnswered;
  const paceLabel = paceDelta >= 2 ? 'Ahead' : paceDelta >= 0 ? 'On Track' : 'Behind';
  const paceClass =
    paceDelta >= 2
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : paceDelta >= 0
      ? 'bg-primary/10 text-primary border-primary/30'
      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';

  const autosaveText =
    saveState === 'saving'
      ? 'Saving...'
      : lastSavedAt
      ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`
      : 'Autosave ready';

  const autosaveClass =
    saveState === 'saving'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

  const questionButtonClass = (index: number, compact = false) =>
    cn(
      compact
        ? 'h-9 rounded-md text-xs font-semibold transition-all'
        : 'w-8 h-8 rounded-md text-xs font-semibold transition-all',
      index === currentIndex
        ? 'gradient-bg text-white glow-blue-sm'
        : hasUnsavedDraftAt(index)
        ? 'bg-amber-500/15 border border-amber-500/70 text-amber-600 dark:text-amber-300'
        : flagged[index]
        ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-500'
        : hasSavedAnswerAt(index)
        ? 'bg-primary/20 text-primary border border-primary/30'
        : 'border border-border hover:bg-surface-hover text-muted-foreground'
    );

  useEffect(() => {
    if (!quizData || !timerReady || questions.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.key === 'Escape') {
        if (activeModalKey || panelOpen) {
          event.preventDefault();
          closeTopmostModal();
        }
        return;
      }

      if (activeModalKey || submitting) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const typingInField =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (typingInField) {
        if (!isMcq && event.key === 'Enter' && event.shiftKey) {
          event.preventDefault();
          saveDraftAtIndex(currentIndex);
        }
        return;
      }

      if (key === 'arrowleft') {
        event.preventDefault();
        goToQuestion(currentIndex - 1);
        return;
      }

      if (key === 'arrowright') {
        event.preventDefault();
        if (isLast) openSubmitModal();
        else goToQuestion(currentIndex + 1);
        return;
      }

      if (key === 'f') {
        event.preventDefault();
        setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
        return;
      }

      if (key === 's') {
        event.preventDefault();
        openSubmitModal();
        return;
      }

      if (key === 'p') {
        event.preventDefault();
        setPanelOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    quizData,
    timerReady,
    questions.length,
    activeModalKey,
    panelOpen,
    closeTopmostModal,
    submitting,
    isMcq,
    currentIndex,
    isLast,
    goToQuestion,
    openSubmitModal,
    saveDraftAtIndex,
  ]);

  if (!quizData || !timerReady) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 size={18} className="animate-spin text-primary" />
            Loading quiz...
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            No questions found.{' '}
            <a href="/quiz/create" className="text-primary underline">
              Create a new quiz
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Quiz sub-header */}
      <header className="fixed top-16 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="h-0.5 gradient-bg transition-all duration-500" style={{ width: `${progress}%` }} />
        <div className="max-w-4xl mx-auto px-4 py-2.5 min-h-[78px] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              <Brain size={11} className="text-primary shrink-0" />
              <span>Quiz Mode</span>
              <span className="opacity-40">/</span>
              <span className="text-foreground font-medium truncate max-w-44">
                {quizData.subject || 'Quiz'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium', paceClass)}>
                <Gauge size={11} />
                Pace {paceLabel}
              </span>
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium', autosaveClass)}>
                <Save size={11} />
                {autosaveText}
              </span>
              {draftCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  {draftCount} draft{draftCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowTimer(t => !t)}
              className={cn(
                'flex min-w-[172px] justify-center items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold border transition-colors',
                timeLeft < 120
                  ? 'timer-border-red text-destructive bg-destructive/10'
                  : 'timer-border-green text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15'
              )}
            >
              <Clock size={12} />
              {showTimer ? formatTime(timeLeft) : '--:--:--'}
            </button>
            <button
              onClick={openSubmitModal}
              disabled={submitting}
              className="px-4 py-1.5 rounded-md bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-44 pb-10 flex flex-col gap-5">
        {/* Navigator grid + filters */}
        <div className="glass rounded-xl p-3.5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {QUESTION_FILTERS.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setQuestionFilter(filter.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                    questionFilter === filter.key
                      ? 'bg-primary/15 text-primary border-primary/40'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredQuestionIndexes.length} shown
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filteredQuestionIndexes.map(index => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={questionButtonClass(index)}
              >
                {index + 1}
              </button>
            ))}
            {filteredQuestionIndexes.length === 0 && (
              <p className="text-xs text-muted-foreground px-1 py-1">
                No questions match this filter.
              </p>
            )}
          </div>
        </div>

        {/* Question card */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary/70 tracking-wide uppercase">
                  Question {currentIndex + 1}
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    currentHasUnsavedDraft
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
                      : isAnswered
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {currentHasUnsavedDraft ? 'Draft' : isAnswered ? 'Answered' : 'Not answered'}
                </span>
              </div>
              <div className="text-base font-medium leading-relaxed">
                <MathRenderer text={q.question} />
              </div>
            </div>
            <button
              onClick={() => setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
              className={cn(
                'p-2 rounded-md transition-colors shrink-0',
                flagged[currentIndex]
                  ? 'text-yellow-400 bg-yellow-400/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              )}
              title={flagged[currentIndex] ? 'Unflag' : 'Flag for review'}
              aria-label={flagged[currentIndex] ? 'Unflag question' : 'Flag question for review'}
            >
              <Flag size={16} />
            </button>
          </div>

          {/* MCQ options */}
          {isMcq ? (
            <div className="flex flex-col gap-2.5">
              {q.options!.map((option, index) => {
                const letter = LETTERS[index];
                const selected = answers[currentIndex] === letter;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [currentIndex]: letter }))}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                      selected
                        ? 'border-primary bg-primary/10 glow-blue-sm'
                        : 'border-border hover:border-primary/40 hover:bg-surface-hover'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                        selected
                          ? 'gradient-bg text-white'
                          : 'bg-surface text-muted-foreground border border-border'
                      )}
                    >
                      {letter}
                    </div>
                    <span className="text-sm">
                      <MathRenderer text={option} />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Your answer</label>
              <input
                type="text"
                value={shortAnswerValue}
                onChange={event =>
                  setDraftAnswers(prev => ({ ...prev, [currentIndex]: event.target.value }))
                }
                onKeyDown={event => {
                  if (event.key === 'Enter' && event.shiftKey) {
                    event.preventDefault();
                    saveDraftAtIndex(currentIndex);
                  }
                }}
                placeholder="Type your short answer here..."
                className="px-4 py-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                  className={cn(
                    'text-xs',
                    currentHasUnsavedDraft
                      ? 'text-amber-600 dark:text-amber-300'
                      : 'text-muted-foreground'
                  )}
                >
                  {currentHasUnsavedDraft
                    ? 'Unsaved draft. Save before moving to another question.'
                    : 'Saved answers are included in submission.'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => clearAnswerAtIndex(currentIndex)}
                    className="px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-surface-hover transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => saveDraftAtIndex(currentIndex)}
                    disabled={!currentHasUnsavedDraft}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard size={12} className="text-primary" />
          <span>Shortcuts: Left/Right navigate, F flag, S submit, P panel, Shift+Enter saves short answer.</span>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <button
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors text-sm font-medium disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {isLast ? (
            <button
              onClick={openSubmitModal}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Finish & Submit'}
            </button>
          ) : (
            <button
              onClick={() => goToQuestion(currentIndex + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </main>

      {/* Floating panel toggle */}
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-8 right-6 z-40 px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold shadow-lg glow-blue-sm hover:opacity-90 transition-opacity md:hidden"
      >
        {answeredCount}/{questions.length}
      </button>

      {/* Side navigator panel */}
      {panelOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/35 dark:bg-black/55 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
          />
          <aside className="fixed top-0 right-0 bottom-0 z-[60] w-72 bg-background border-l border-border flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
              <h3 className="font-semibold text-sm">Questions</h3>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                aria-label="Close questions panel"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUESTION_FILTERS.map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setQuestionFilter(filter.key)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] font-medium border transition-colors',
                      questionFilter === filter.key
                        ? 'bg-primary/15 text-primary border-primary/40'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {filteredQuestionIndexes.map(index => (
                  <button
                    key={index}
                    onClick={() =>
                      guardUnsavedThen(() => {
                        setCurrentIndex(index);
                        setPanelOpen(false);
                      })
                    }
                    className={questionButtonClass(index, true)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              {filteredQuestionIndexes.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  No questions match this filter.
                </p>
              )}
              <div className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20 border border-primary/30" /> Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500/15 border border-amber-500/70" /> Draft
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400/20 border border-yellow-400" /> Flagged
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border" /> Unanswered
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
      {/* Unsaved draft modal */}
      {unsavedModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[78] bg-black/45 dark:bg-black/60 backdrop-blur-sm"
            onClick={closeUnsavedModal}
          />
          <div className="fixed inset-0 z-[79] flex items-center justify-center p-4">
            <div
              ref={unsavedModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="unsaved-draft-title"
              aria-describedby="unsaved-draft-description"
              tabIndex={-1}
              className="w-full max-w-md rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-5 shadow-2xl"
            >
              <h3 id="unsaved-draft-title" className="text-lg font-semibold text-foreground">
                Unsaved short answer
              </h3>
              <p id="unsaved-draft-description" className="mt-2 text-sm text-muted-foreground">
                Save your draft before leaving this question?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeUnsavedModal}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={discardDraftAndContinue}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={saveDraftAndContinue}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Review-before-submit modal */}
      {reviewModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/45 dark:bg-black/60 backdrop-blur-sm"
            onClick={closeReviewModal}
          />
          <div className="fixed inset-0 z-[81] flex items-center justify-center p-4">
            <div
              ref={reviewModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-quiz-title"
              aria-describedby="review-quiz-description"
              tabIndex={-1}
              className="w-full max-w-lg rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-5 shadow-2xl"
            >
              <h3 id="review-quiz-title" className="text-lg font-semibold text-foreground">
                Review before submit
              </h3>
              <p id="review-quiz-description" className="mt-2 text-sm text-muted-foreground">
                Quick jump to any question before final submission.
              </p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg border border-border p-2.5 bg-surface">
                  <p className="text-muted-foreground">Answered</p>
                  <p className="font-semibold text-foreground">{answeredCount}</p>
                </div>
                <div className="rounded-lg border border-border p-2.5 bg-surface">
                  <p className="text-muted-foreground">Unanswered</p>
                  <p className="font-semibold text-foreground">{unansweredCount}</p>
                </div>
                <div className="rounded-lg border border-border p-2.5 bg-surface">
                  <p className="text-muted-foreground">Flagged</p>
                  <p className="font-semibold text-foreground">
                    {Object.values(flagged).filter(Boolean).length}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-2.5 bg-surface">
                  <p className="text-muted-foreground">Drafts</p>
                  <p className="font-semibold text-foreground">{draftCount}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Quick jump</p>
                <div className="mt-2 max-h-56 overflow-y-auto pr-1 grid grid-cols-7 gap-1.5">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setReviewModalOpen(false);
                        setCurrentIndex(index);
                      }}
                      className={questionButtonClass(index, true)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {draftCount > 0 && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
                  Unsaved drafts will be auto-saved before final submit.
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeReviewModal}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Back to quiz
                </button>
                <button
                  onClick={proceedToSubmitConfirm}
                  className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Submit confirmation modal */}
      {submitModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[84] bg-black/45 dark:bg-black/60 backdrop-blur-sm"
            onClick={closeSubmitModal}
          />
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <div
              ref={submitModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="submit-quiz-title"
              aria-describedby="submit-quiz-description"
              tabIndex={-1}
              className="w-full max-w-md rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-5 shadow-2xl"
            >
              <h3 id="submit-quiz-title" className="text-lg font-semibold text-foreground">
                Submit quiz now?
              </h3>
              <p id="submit-quiz-description" className="mt-2 text-sm text-muted-foreground">
                You have answered <span className="font-medium text-foreground">{answeredCount}</span> of{' '}
                <span className="font-medium text-foreground">{questions.length}</span> questions.
              </p>
              {unansweredCount > 0 && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
                  {unansweredCount} question{unansweredCount === 1 ? '' : 's'} still unanswered.
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeSubmitModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Leave-page guard modal */}
      {leaveModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[88] bg-black/45 dark:bg-black/60 backdrop-blur-sm"
            onClick={closeLeaveModal}
          />
          <div className="fixed inset-0 z-[89] flex items-center justify-center p-4">
            <div
              ref={leaveModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-quiz-title"
              aria-describedby="leave-quiz-description"
              tabIndex={-1}
              className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-background/95 backdrop-blur-xl p-5 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 id="leave-quiz-title" className="text-lg font-semibold text-foreground">
                    Quiz is in session
                  </h3>
                  <p id="leave-quiz-description" className="mt-1 text-sm text-muted-foreground">
                    You cannot leave this page while the quiz is active.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-300">
                Submit now, or cancel to keep answering.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeLeaveModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFromLeaveModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Submitting modal */}
      {submitting && (
        <>
          <div className="fixed inset-0 z-[92] bg-black/45 dark:bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[93] flex items-center justify-center p-4">
            <div
              ref={submittingModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="submitting-quiz-title"
              aria-describedby="submitting-quiz-description"
              aria-busy="true"
              tabIndex={-1}
              className="w-full max-w-sm bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <h3 id="submitting-quiz-title" className="text-base font-semibold text-foreground">
                  Submitting Quiz
                </h3>
              </div>
              <p id="submitting-quiz-description" className="text-sm text-muted-foreground">
                Submitting your answers. Please wait...
              </p>
              <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mt-4" aria-hidden="true">
                <div className="h-full bg-destructive rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
