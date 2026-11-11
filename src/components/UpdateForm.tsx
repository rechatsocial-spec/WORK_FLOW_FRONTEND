import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, errMsg } from '@/lib/api';
import { Button, Field, Select, Textarea } from './ui/primitives';

export interface OpenTask {
  _id: string;
  title: string;
  progress: number;
  status: string;
}

export default function UpdateForm({ tasks, disabledReason, onDone }: { tasks: OpenTask[]; disabledReason?: string; onDone: () => void }) {
  const [taskId, setTaskId] = useState('');
  const [completedWork, setCompleted] = useState('');
  const [progress, setProgress] = useState(0);
  const [pendingWork, setPending] = useState('');
  const [challenges, setChallenges] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // pick the first in-progress task by default and mirror its current progress
  useEffect(() => {
    if (!taskId && tasks.length) {
      const t = tasks.find((x) => x.status === 'in_progress') ?? tasks[0];
      setTaskId(t._id);
      setProgress(t.progress);
    }
  }, [tasks, taskId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/updates', { taskId: taskId || undefined, completedWork, progress, pendingWork, challenges });
      toast.success('Work update submitted');
      setCompleted('');
      setPending('');
      setChallenges('');
      onDone();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {disabledReason && <div className="rounded-md bg-warning/15 px-3 py-2 text-sm text-warning">{disabledReason}</div>}
      {error && <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <Field label="Task you worked on">
        <Select
          value={taskId}
          onChange={(e) => {
            setTaskId(e.target.value);
            const t = tasks.find((x) => x._id === e.target.value);
            if (t) setProgress(t.progress);
          }}
        >
          <option value="">General work (no specific task)</option>
          {tasks.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Work completed in the last 2 hours">
        <Textarea value={completedWork} onChange={(e) => setCompleted(e.target.value)} required minLength={5} placeholder="What did you finish?" />
      </Field>
      <Field label={`Current progress — ${progress}%`}>
        <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" aria-label="Progress percentage" />
      </Field>
      <Field label="Pending work">
        <Textarea value={pendingWork} onChange={(e) => setPending(e.target.value)} required minLength={2} placeholder="What remains?" />
      </Field>
      <Field label="Challenges or issues (optional)">
        <Textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} placeholder="Anything blocking you?" className="min-h-[64px]" />
      </Field>
      <Button type="submit" loading={busy} disabled={!!disabledReason || completedWork.trim().length < 5 || pendingWork.trim().length < 2} className="w-full">
        Submit update
      </Button>
    </form>
  );
}
