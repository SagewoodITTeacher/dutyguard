import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export function Toaster() {
  const [toasts, setToasts] = useState<any[]>([]);

  // Simple toast provider shim
  useEffect(() => {
    (window as any).toast = (msg: string, type: 'success' | 'error' = 'success') => {
      const id = Math.random().toString(36);
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-center gap-3 min-w-[200px] ${
              t.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-bold text-sm">{t.msg}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
              className="ml-auto p-1 hover:bg-stone-50 rounded"
            >
              <X className="h-4 w-4 text-stone-300" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
