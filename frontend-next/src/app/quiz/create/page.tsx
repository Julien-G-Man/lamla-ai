'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import djangoApi from '@/services/api';
import { materialsService } from '@/services/materials';
import { getApiErrorMessage } from '@/services/api';
import { FileText, Sliders, Sparkles, AlertCircle } from 'lucide-react';

export default function CreateQuizPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [inputText, setInputText] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      materialsService.getMine().then(setMaterials).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    try {
      const payload: any = { num_questions: numQuestions };
      if (selectedMaterialId) {
        payload.material_id = selectedMaterialId;
      } else if (inputText.trim()) {
        payload.text = inputText.trim();
      } else {
        setError('Please enter text or select a material.');
        setGenerating(false);
        return;
      }
      const res = await djangoApi.post('/quiz/generate/', payload);
      localStorage.setItem('current_quiz', JSON.stringify(res.data));
      router.push('/quiz/play');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to generate quiz.'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout title="Create Quiz" breadcrumb={[{ label: 'Quiz', href: '/quiz/create' }, { label: 'Create' }]}>
      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Create a Quiz</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your study material or select an uploaded file to generate questions.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          {/* Material input */}
          <div className="glass rounded-xl p-5 flex flex-col gap-4">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <FileText size={15} className="text-primary" /> Study Material
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Paste your notes</label>
              <textarea
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setSelectedMaterialId(null); }}
                rows={7}
                placeholder="Paste lecture notes, textbook passages, or any study material here..."
                className="px-4 py-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none placeholder:text-muted-foreground"
              />
            </div>

            {materials.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">Or select an uploaded file</label>
                <select
                  value={selectedMaterialId || ''}
                  onChange={(e) => { setSelectedMaterialId(e.target.value || null); setInputText(''); }}
                  className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                >
                  <option value="">— None selected —</option>
                  {materials.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="glass rounded-xl p-5 flex flex-col gap-4">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Sliders size={15} className="text-primary" /> Settings
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground">Number of questions</label>
                <span className="text-sm font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10">{numQuestions}</span>
              </div>
              <input
                type="range" min={5} max={30}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full accent-primary h-1.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span><span>30 max</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 glow-blue-sm"
          >
            {generating ? (
              <>
                <Sparkles size={16} className="animate-pulse" /> Generating Quiz…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Quiz
              </>
            )}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
