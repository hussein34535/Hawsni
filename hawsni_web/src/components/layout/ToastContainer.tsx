'use client';

import { useToastStore } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useToastStore();
    const { isRTL } = useLanguage();

    return (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4`}>
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`
                            flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md border
                            ${toast.type === 'success' ? 'bg-[#1B4D3E] text-white border-[#1B4D3E]/20' :
                                toast.type === 'error' ? 'bg-red-600 text-white border-red-500/20' :
                                    'bg-gray-900 text-white border-gray-800'}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle2 size={20} />}
                        {toast.type === 'error' && <AlertCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}

                        <p className="flex-1 font-bold text-sm">
                            {toast.message}
                        </p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-white/10 rounded-full"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
