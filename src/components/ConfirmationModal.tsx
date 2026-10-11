import React from 'react';
import { PendingAction } from '../types';
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';

interface ConfirmationModalProps {
  action: PendingAction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  action,
  onConfirm,
  onCancel,
}) => {
  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl p-6 text-slate-100 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Authorization Protocol Required
            </div>
            <h3 className="text-base font-semibold text-slate-100 mt-0.5">
              Confirm Consequential Action
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          JARVIS is requesting clearance to execute the following operation:
        </p>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
          <div className="text-cyan-300 font-semibold">{action.toolName}</div>
          <div className="text-slate-300">{action.description}</div>
          {action.params && (
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-900 truncate">
              Parameters: {JSON.stringify(action.params)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4 text-slate-400" />
            Deny & Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Check className="w-4 h-4 text-slate-950" />
            Authorize Execution
          </button>
        </div>
      </div>
    </div>
  );
};
