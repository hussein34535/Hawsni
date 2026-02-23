'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    MapPin,
    Truck,
    CreditCard,
    CheckCircle2,
    ChevronRight,
    Home,
    Briefcase,
    Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';

type CheckoutStep = 'address' | 'shipping' | 'payment';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal } = useCartStore();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
    const [isProcessing, setIsProcessing] = useState(false);

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0 && !isProcessing) {
            router.push('/cart');
        }
    }, [items, router]);

    const steps: { id: CheckoutStep; label: string; icon: any }[] = [
        { id: 'address', label: 'Address', icon: MapPin },
        { id: 'shipping', label: 'Shipping', icon: Truck },
        { id: 'payment', label: 'Payment', icon: CreditCard },
    ];

    const subtotal = getTotal();
    const shippingFee = 50; // Mock shipping fee
    const total = subtotal + shippingFee;

    const handleNextStep = () => {
        if (currentStep === 'address') setCurrentStep('shipping');
        else if (currentStep === 'shipping') setCurrentStep('payment');
    };

    const handlePrevStep = () => {
        if (currentStep === 'shipping') setCurrentStep('address');
        else if (currentStep === 'payment') setCurrentStep('shipping');
        else router.back();
    };

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        // Mock order processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsProcessing(false);
        // Redirect to success or order confirmation
        alert('Order placed successfully! (Mock)');
        // useCartStore.getState().clearCart();
        // router.push('/profile/orders');
    };

    if (items.length === 0 && !isProcessing) return null;

    return (
        <div className="w-full">
            <div className="px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Header & Back Button */}
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={handlePrevStep}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900 hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Checkout</h1>
                        </div>

                        {/* Custom Stepper */}
                        <div className="flex items-center justify-between mb-12 bg-white p-6 rounded-[2rem] shadow-sm">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.id;
                                const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

                                return (
                                    <div key={step.id} className="flex flex-col items-center flex-1 relative">
                                        {/* Connector Line */}
                                        {index < steps.length - 1 && (
                                            <div className="absolute top-5 left-1/2 w-full h-[2px] bg-gray-100 -z-0">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: isCompleted ? '100%' : '0%' }}
                                                    className="h-full bg-[var(--color-brand-primary)]"
                                                />
                                            </div>
                                        )}

                                        <div className={`
                                            relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                                            ${isActive ? 'bg-[var(--color-brand-primary)] text-white shadow-lg shadow-emerald-900/20 scale-110' :
                                                isCompleted ? 'bg-emerald-50 text-[var(--color-brand-primary)]' : 'bg-gray-50 text-gray-300'}
                                        `}>
                                            {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                        </div>
                                        <span className={`
                                            text-[10px] font-black uppercase tracking-widest mt-3 transition-colors duration-300
                                            ${isActive ? 'text-gray-900' : 'text-gray-400'}
                                        `}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Step Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="min-h-[400px]"
                            >
                                {currentStep === 'address' && <AddressStep onNext={handleNextStep} />}
                                {currentStep === 'shipping' && <ShippingStep onNext={handleNextStep} />}
                                {currentStep === 'payment' && <PaymentStep onPlaceOrder={handlePlaceOrder} isProcessing={isProcessing} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Order Summary (Sidebar) */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-24 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5">
                                <h2 className="text-xl font-black text-gray-900 uppercase mb-6 tracking-tight">Order Summary</h2>

                                <div className="space-y-4 mb-8">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                    Qty {item.quantity} • {item.size} • {item.color}
                                                </p>
                                                <p className="text-sm font-black text-[var(--color-brand-primary)] mt-1">
                                                    {(item.price * item.quantity).toLocaleString()} EGP
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-px bg-gray-50 mb-6" />

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span>Subtotal</span>
                                        <span>{subtotal.toLocaleString()} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span>Shipping</span>
                                        <span>{shippingFee.toLocaleString()} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-900 font-black text-xl pt-2">
                                        <span>Total</span>
                                        <span className="text-[var(--color-brand-primary)]">{total.toLocaleString()} EGP</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badge */}
                            <div className="bg-emerald-50 rounded-3xl p-6 flex items-center gap-4 text-emerald-900">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="font-black uppercase text-[10px] tracking-widest text-emerald-600 mb-1">Guaranteed</p>
                                    <p className="font-bold text-sm">Secure & Private Checkout</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-components as placeholders for now
function AddressStep({ onNext }: { onNext: () => void }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="font-bold text-gray-900">Select Shipping Address</h3>
                <button className="flex items-center gap-2 text-[var(--color-brand-primary)] font-bold text-sm">
                    <Plus size={18} />
                    <span>Add New</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mock Addresses */}
                <div className="bg-white p-6 rounded-[2rem] border-2 border-[var(--color-brand-primary)] shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="w-6 h-6 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center">
                            <MapPin size={14} />
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[var(--color-brand-primary)]">
                            <Home size={22} />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-wider mb-2">Home</h4>
                            <p className="text-sm font-bold text-gray-500 leading-relaxed">
                                123 Street Name, Area City<br />
                                Cairo, Egypt
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-gray-100 transition-all cursor-pointer">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                            <Briefcase size={22} />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-400 uppercase text-xs tracking-wider mb-2">Office</h4>
                            <p className="text-sm font-bold text-gray-400 leading-relaxed">
                                456 Business Road, Tech Park<br />
                                New Cairo, Egypt
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={onNext}
                className="w-full mt-4 py-5 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-black/10 hover:bg-black transition-all"
            >
                <span>Continue to Shipping</span>
                <ArrowRight size={20} />
            </button>
        </div>
    );
}

function ShippingStep({ onNext }: { onNext: () => void }) {
    return (
        <div className="space-y-6">
            <h3 className="font-bold text-gray-900 px-2">Delivery Method</h3>

            <div className="space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[var(--color-brand-primary)] shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[var(--color-brand-primary)]">
                            <Truck size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Standard Delivery</h4>
                            <p className="text-xs font-medium text-gray-500">2-4 Business Days</p>
                        </div>
                    </div>
                    <span className="font-black text-gray-900">50 EGP</span>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-transparent hover:border-gray-100 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                            <Truck size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-400">Express Delivery</h4>
                            <p className="text-xs font-medium text-gray-400">Next Day Delivery</p>
                        </div>
                    </div>
                    <span className="font-black text-gray-400">100 EGP</span>
                </div>
            </div>

            <button
                onClick={onNext}
                className="w-full mt-4 py-5 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl"
            >
                <span>Continue to Payment</span>
                <ArrowRight size={20} />
            </button>
        </div>
    );
}

function PaymentStep({ onPlaceOrder, isProcessing }: { onPlaceOrder: () => void, isProcessing: boolean }) {
    return (
        <div className="space-y-6">
            <h3 className="font-bold text-gray-900 px-2">Payment Method</h3>

            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-[var(--color-brand-primary)] shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[var(--color-brand-primary)]">
                        <Plus size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Cash on Delivery</h4>
                        <p className="text-xs font-medium text-gray-500">Pay when you receive your order</p>
                    </div>
                </div>
                <div className="w-6 h-6 border-4 border-[var(--color-brand-primary)] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-[var(--color-brand-primary)] rounded-full" />
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-sm font-bold text-gray-500 italic">
                    "Card payments are coming soon. For now, we only support COD."
                </p>
            </div>

            <button
                onClick={onPlaceOrder}
                disabled={isProcessing}
                className={`
                    w-full mt-4 py-5 bg-[var(--color-brand-primary)] text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 transition-all
                    ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-98'}
                `}
            >
                {isProcessing ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <span>Place Order</span>
                        <CheckCircle2 size={20} />
                    </>
                )}
            </button>
        </div>
    );
}
