import React, { useState } from 'react';
import { ReminderItem } from '../types';
import { Calendar, Plus, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface RemindersViewProps {
  reminders: ReminderItem[];
  onAddReminder: (title: string, dueDate: string, dueTime: string, priority: 'low' | 'normal' | 'high') => void;
  onToggleComplete: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddReminder(title, date || 'Today', time || '12:00 PM', priority);
    setTitle('');
    setDate('');
    setTime('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Reminders & Schedule
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice-automated reminders and task timers
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Set Reminder</span>
        </button>
      </div>

      {/* Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
        >
          <input
            type="text"
            placeholder="What should JARVIS remind you of?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Date (e.g. Tomorrow, 2026-10-12)"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            />
            <input
              type="text"
              placeholder="Time (e.g. 09:00 AM)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-md font-medium"
            >
              Save Reminder
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {reminders.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No active reminders. Ask JARVIS: <span className="text-purple-400">"Amake kal shokal 9 tay reminder dio"</span> or click "Set Reminder".
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                rem.completed
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/70 border-slate-800 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => onToggleComplete(rem.id)}
                  className={`p-1 rounded-full transition-colors ${
                    rem.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-purple-400'
                  }`}
                  title={rem.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  <CheckCircle className="w-5 h-5" />
                </button>

                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-sm font-medium truncate ${
                      rem.completed ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {rem.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      {rem.dueDate} at {rem.dueTime}
                    </span>
                    <span>·</span>
                    <span
                      className={`text-[10px] ${
                        rem.priority === 'high'
                          ? 'text-red-400'
                          : rem.priority === 'normal'
                          ? 'text-yellow-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {rem.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteReminder(rem.id)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title="Delete reminder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
