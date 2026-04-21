'use client';

import { motion } from 'framer-motion';
import { Check, User, MapPin, CreditCard } from 'lucide-react';

interface CheckoutStepsProps {
    currentStep: number;
    steps: {
        id: number;
        label: string;
        labelAr: string;
        icon: any;
    }[];
}

export default function CheckoutSteps({ currentStep, steps }: CheckoutStepsProps) {
    return (
        <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
                {/* Connecting Line Progress */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 z-0" />
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    className="absolute top-1/2 left-0 h-[2px] bg-[#0E4435] -translate-y-1/2 z-0 transition-all duration-500"
                />

                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isCompleted || isActive ? '#0E4435' : '#FFFFFF',
                                    borderColor: isCompleted || isActive ? '#0E4435' : '#E5E7EB',
                                    scale: isActive ? 1.1 : 1,
                                }}
                                className={`
                                    w-10 h-10 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                    ${isCompleted || isActive ? 'text-white shadow-lg shadow-emerald-950/20' : 'text-gray-400'}
                                `}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" />
                                ) : (
                                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                                )}
                            </motion.div>
                            <div className="absolute top-full mt-3 text-center whitespace-nowrap">
                                <span className={`text-[10px] md:text-sm font-black font-cairo ${isActive ? 'text-[#0E4435]' : 'text-gray-400'}`}>
                                    {step.labelAr}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
