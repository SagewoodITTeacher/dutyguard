import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  progress: string[];
  isCompleted: boolean;
  title: string;
}

export function ProgressPopup({ isOpen, onClose, onCancel, progress, isCompleted, title }: ProgressPopupProps) {
  const lastMessage = progress[progress.length - 1] || 'Initializing...';
  
  // Calculate percentage based on stages in messages
  const getProgressPercentage = () => {
    if (isCompleted) return 100;
    if (progress.some(m => m.includes('Stage 4'))) return 90;
    if (progress.some(m => m.includes('Stage 3'))) return 60;
    if (progress.some(m => m.includes('Stage 2'))) return 40;
    if (progress.some(m => m.includes('Stage 1'))) return 20;
    return 10;
  };

  const percentage = getProgressPercentage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 50 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 50 }} 
            className="relative w-full max-w-2xl bg-white rounded-[4rem] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className={cn(
              "p-12 text-white flex justify-between items-center transition-colors duration-500",
              isCompleted ? "bg-emerald-600" : "bg-indigo-600"
            )}>
              <div className="flex items-center gap-8">
                {isCompleted ? (
                   <CheckCircle2 className="h-10 w-10 text-white" />
                ) : (
                   <Zap className="h-10 w-10 text-white animate-pulse" />
                )}
                <div>
                   <h4 className="text-3xl font-black italic uppercase tracking-tight">{title}</h4>
                   <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-1">
                     {isCompleted ? 'Deployment Matrix Complete' : 'Active Optimization Protocol'}
                   </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
              >
                <X className="h-8 w-8 text-white" />
              </button>
            </div>

            <div className="p-12 space-y-10">
              {/* Progress Bar */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Progress Status</p>
                  <p className="text-2xl font-black text-slate-900 italic">{percentage}%</p>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors duration-500",
                      isCompleted ? "bg-emerald-500" : "bg-indigo-500 shadow-[0_0_15px_-3px_#6366f1]"
                    )}
                  />
                </div>
              </div>

              {/* Message List */}
              <div className="bg-slate-50/50 rounded-[3rem] border border-slate-100 p-8 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <div className="space-y-4">
                  {progress.map((msg, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex items-center gap-4 py-3 border-b border-slate-100 last:border-0",
                        i === progress.length - 1 ? "opacity-100" : "opacity-40"
                      )}
                    >
                      {i === progress.length - 1 && !isCompleted ? (
                        <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
                      ) : (
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          isCompleted ? "bg-emerald-500" : "bg-indigo-500"
                        )} />
                      )}
                      <p className="text-xs font-bold text-slate-700 font-mono tracking-tight">{msg}</p>
                    </motion.div>
                  )).reverse()}
                </div>
              </div>

              {/* Current Stage Highlight */}
              <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 text-white group shadow-2xl">
                 <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                       <ChevronRight className="h-6 w-6 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Active Signal</p>
                       <p className="text-sm font-black uppercase text-white font-mono tracking-tight truncate max-w-md">
                         {isCompleted ? 'All systems within optimal parameters' : lastMessage}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-4">
                {!isCompleted ? (
                  <button 
                    onClick={onCancel} 
                    className="w-full py-6 bg-slate-50 text-slate-400 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-slate-100 hover:bg-slate-100 transition-all active:scale-95"
                  >
                    Abort Execution
                  </button>
                ) : (
                  <button 
                    onClick={onClose} 
                    className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-900/20 active:scale-95"
                  >
                    Return to Bridge [FINALIZE]
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
