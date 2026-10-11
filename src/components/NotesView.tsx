import React, { useState } from 'react';
import { NoteItem } from '../types';
import { Plus, Trash2, Pin, Tag, FileText, CheckCircle2 } from 'lucide-react';

interface NotesViewProps {
  notes: NoteItem[];
  onAddNote: (title: string, content: string, category: string) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onDeleteNote,
  onTogglePin,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddNote(newTitle, newContent, newCategory);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Notes & Tasks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice-commandable notes synchronized with JARVIS
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Creation form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Note Title or Task..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Code">Code</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <textarea
            placeholder="Details or checklist items..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
          />

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
              className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No notes yet. Ask JARVIS: <span className="text-cyan-400">"Create a note to buy coffee"</span> or click "New Note".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                note.pinned
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold text-slate-100 break-words flex-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => onTogglePin(note.id)}
                      className={`p-1 rounded hover:bg-slate-800 ${
                        note.pinned ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                      title={note.pinned ? 'Unpin' : 'Pin note'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded hover:bg-slate-800 hover:text-red-400"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {note.content && (
                  <p className="text-xs text-slate-300 whitespace-pre-wrap mb-2 line-clamp-4">
                    {note.content}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 mt-2 font-mono">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {note.category}
                </span>
                <span>
                  {new Date(note.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
