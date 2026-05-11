'use client';

import { useToastStore } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Info, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useToastStore();
    const { isRTL } = useLanguage();

    return (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4`}>
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        className={`
                            flex items-center justify-between gap-3 p-4 rounded-[1.5rem] shadow-2xl backdrop-blur-md border
                            ${toast.type === 'success' ? 'bg-[#0E4435] text-white border-white/10' :
                                toast.type === 'error' ? 'bg-red-600 text-white border-red-500/20' :
                                    'bg-gray-900 text-white border-gray-800'}
                        `}
                    >
                        <div className="flex items-center gap-3 flex-1">
                            {toast.type === 'success' && (
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                            )}
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                            <span className="text-sm font-bold font-cairo letter-spacing-tight">{toast.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
