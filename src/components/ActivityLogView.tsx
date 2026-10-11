import React from 'react';
import { ActivityLogItem } from '../types';
import { ShieldCheck, CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLogItem[];
  onClearLogs: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Security & Tool Activity Audit
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time verification log of all tool invocations and external actions
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 font-mono"
          >
            Clear Log
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No tool activity logged yet. Issue voice commands like{' '}
          <span className="text-cyan-400">"YouTube open koro"</span> or{' '}
          <span className="text-cyan-400">"Weather bolo"</span> to populate audit logs.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs"
            >
              <div className="mt-0.5">
                {log.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : log.status === 'denied' ? (
                  <XCircle className="w-4 h-4 text-amber-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono font-semibold text-cyan-300">
                    {log.tool}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="text-slate-300 mb-1">
                  <span className="text-slate-500 font-mono">Input: </span>
                  "{log.command}"
                </div>

                <div className="p-2 rounded bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-400 break-words">
                  <span className="text-slate-500">Output: </span>
                  {log.output}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
