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
    Check,
    ChevronRight,
    Home,
    Briefcase,
    Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useLanguage } from '@/context/LanguageContext';

type CheckoutStep = 'address' | 'shipping' | 'payment';

import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { isRTL, t } = useLanguage();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
    const [isProcessing, setIsProcessing] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const data = await addressService.getAddresses();
                const addrs = data.addresses || [];
                setAddresses(addrs);
                if (addrs.length > 0) {
                    const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
                    setSelectedAddressId(defaultAddr._id);
                }
            } catch (error) {
                console.error('Failed to load addresses:', error);
            }
        };
        fetchAddresses();
    }, []);

    const subtotal = getTotal();
    const shippingFee = 50; // Keep static for now or fetch from API if available
    const total = subtotal + shippingFee;

    useEffect(() => {
        if (items.length === 0 && !isProcessing) {
            router.push('/cart');
        }
    }, [items, router, isProcessing]);

    const steps: { id: CheckoutStep; label: string; icon: any }[] = [
        { id: 'address', label: 'Address', icon: MapPin },
        { id: 'shipping', label: 'Shipping', icon: Truck },
        { id: 'payment', label: 'Payment', icon: CreditCard },
    ];

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
        if (!selectedAddressId) {
            alert('Please select a shipping address');
            setCurrentStep('address');
            return;
        }

        setIsProcessing(true);
        try {
            const orderData: OrderData = {
                items: items.map(item => ({
                    productId: item.productId || (item as any)._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size || undefined,
                    color: item.color || undefined,
                    imageUrl: item.imageUrl
                })),
                shippingAddress: selectedAddressId,
                paymentMethod: 'cod',
                totalAmount: total,
                shippingFee: shippingFee
            };

            const result = await checkoutService.placeOrder(orderData);
            if (result.success) {
                clearCart();
                router.push('/profile/orders');
            }
        } catch (error: any) {
            alert(error || 'Failed to place order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0 && !isProcessing) return null;

    return (
        <div className="w-full min-h-screen bg-[#FAFAFA]">
            <div className="px-4 sm:px-6 lg:px-8 pb-40">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Header & Back Button */}
                        <div className="flex items-center gap-4 mb-8 mt-6">
                            <button
                                onClick={handlePrevStep}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-900 hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                            </button>
                            <h1 className="text-2xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'إتمام الشراء' : 'Checkout'}
                            </h1>
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
                                            ${isActive ? 'text-gray-900' : 'text-gray-400 font-cairo'}
                                        `}>
                                            {isRTL ? (step.id === 'address' ? 'العنوان' : step.id === 'shipping' ? 'الشحن' : 'الدفع') : step.label}
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
                                className="min-h-[300px]"
                            >
                                {currentStep === 'address' && (
                                    <AddressStep
                                        addresses={addresses}
                                        selectedId={selectedAddressId}
                                        onSelect={setSelectedAddressId}
                                    />
                                )}
                                {currentStep === 'shipping' && <ShippingStep />}
                                {currentStep === 'payment' && <PaymentStep />}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Order Summary (Sidebar) */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-24 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-black/5">
                                <h2 className="text-xl font-black text-gray-900 uppercase mb-6 tracking-tight font-cairo">
                                    {isRTL ? 'ملخص الطلب' : 'Order Summary'}
                                </h2>

                                <div className="space-y-4 mb-8">
                                    {items.map((item) => (
                                        <div key={item.id} className={`flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                    {item.quantity} x {item.size} • {item.color}
                                                </p>
                                                <p className="text-sm font-black text-[var(--color-brand-primary)] mt-1">
                                                    {(item.price * item.quantity).toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-px bg-gray-50 mb-6" />

                                <div className="space-y-3 font-cairo text-sm font-bold">
                                    <div className="flex justify-between items-center text-gray-400">
                                        <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                        <span className="text-gray-900">{subtotal.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-400">
                                        <span>{isRTL ? 'الشحن' : 'Shipping'}</span>
                                        <span className="text-gray-900">{shippingFee.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-900 font-black text-xl pt-2 border-t border-gray-50">
                                        <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                                        <span className="text-[#0E4435]">{total.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badge */}
                            <div className={`bg-emerald-50 rounded-3xl p-6 flex items-center gap-4 text-emerald-900 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="font-black uppercase text-[10px] tracking-widest text-emerald-600 mb-1">{isRTL ? 'مضمونة' : 'Guaranteed'}</p>
                                    <p className="font-bold text-sm">{isRTL ? 'دفع آمن وخصوصية تامة' : 'Secure & Private Checkout'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-6 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-2xl mx-auto">
                    {currentStep === 'address' && (
                        <button
                            onClick={handleNextStep}
                            disabled={!selectedAddressId}
                            className={`
                                w-full py-5 rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-3 transition-all
                                ${selectedAddressId ? 'bg-black text-white shadow-xl shadow-black/10' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                            `}
                        >
                            <span>{isRTL ? 'المتابعة للشحن' : 'Continue to Shipping'}</span>
                            <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
                        </button>
                    )}
                    {currentStep === 'shipping' && (
                        <button
                            onClick={handleNextStep}
                            className="w-full py-5 bg-black text-white rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all"
                        >
                            <span>{isRTL ? 'المتابعة للدفع' : 'Continue to Payment'}</span>
                            <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''} />
                        </button>
                    )}
                    {currentStep === 'payment' && (
                        <button
                            onClick={handlePlaceOrder}
                            disabled={isProcessing}
                            className={`
                                w-full py-5 bg-[#0E4435] text-white rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/20 transition-all
                                ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01] active:scale-[0.98]'}
                            `}
                        >
                            {isProcessing ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isRTL ? 'إتمام الطلب' : 'Place Order'}</span>
                                    <CheckCircle2 size={20} />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-components
function AddressStep({
    addresses,
    selectedId,
    onSelect
}: {
    addresses: Address[],
    selectedId: string | null,
    onSelect: (id: string) => void
}) {
    const { isRTL } = useLanguage();
    return (
        <div className="space-y-6">
            <div className={`flex justify-between items-center px-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="font-bold text-gray-900 font-cairo">{isRTL ? 'اختر عنوان الشحن' : 'Select Shipping Address'}</h3>
                <button
                    onClick={() => window.location.href = '/profile/addresses'}
                    className="flex items-center gap-2 text-[#0E4435] font-bold text-sm"
                >
                    <Plus size={18} />
                    <span>{isRTL ? 'إدارة' : 'Manage'}</span>
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="bg-white p-10 rounded-[2rem] text-center border-2 border-dashed border-gray-100">
                    <MapPin size={40} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-bold mb-4 font-cairo">{isRTL ? 'لا توجد عناوين مسجلة' : 'No addresses saved yet'}</p>
                    <button
                        onClick={() => window.location.href = '/profile/addresses'}
                        className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm"
                    >
                        {isRTL ? 'إضافة عنوان' : 'Add Address'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div
                            key={addr._id}
                            onClick={() => onSelect(addr._id)}
                            className={`
                                cursor-pointer bg-white p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group
                                ${selectedId === addr._id ? 'border-[#0E4435] shadow-md' : 'border-transparent hover:border-gray-100'}
                            `}
                        >
                            {selectedId === addr._id && (
                                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} p-4`}>
                                    <div className="w-6 h-6 bg-[#0E4435] text-white rounded-full flex items-center justify-center">
                                        <Check size={14} />
                                    </div>
                                </div>
                            )}
                            <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                                <div className={`
                                    w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                                    ${selectedId === addr._id ? 'bg-emerald-50 text-[#0E4435]' : 'bg-gray-50 text-gray-400'}
                                `}>
                                    {addr.type === 'home' ? <Home size={22} /> : <Briefcase size={22} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`
                                        font-black uppercase text-[10px] tracking-wider mb-2
                                        ${selectedId === addr._id ? 'text-gray-900' : 'text-gray-400'}
                                    `}>
                                        {isRTL ? (addr.type === 'home' ? 'منزل' : 'عمل') : addr.type}
                                    </h4>
                                    <p className={`
                                        text-sm font-bold leading-relaxed truncate
                                        ${selectedId === addr._id ? 'text-gray-500' : 'text-gray-400'}
                                    `}>
                                        {addr.street}
                                    </p>
                                    <p className={`
                                        text-sm font-bold leading-relaxed
                                        ${selectedId === addr._id ? 'text-gray-400' : 'text-gray-300'}
                                    `}>
                                        {addr.city}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ShippingStep() {
    const { isRTL } = useLanguage();
    return (
        <div className="space-y-6">
            <h3 className={`font-bold text-gray-900 px-2 font-cairo ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? 'طريقة الشحن' : 'Delivery Method'}
            </h3>

            <div className="space-y-4">
                <div className={`bg-white p-6 rounded-[2.5rem] border-2 border-[#0E4435] shadow-md flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#0E4435]">
                            <Truck size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">{isRTL ? 'شحن قياسي' : 'Standard Delivery'}</h4>
                            <p className="text-xs font-medium text-gray-500">{isRTL ? '2-4 أيام عمل' : '2-4 Business Days'}</p>
                        </div>
                    </div>
                    <span className="font-black text-gray-900">50 {isRTL ? 'ج.م' : 'EGP'}</span>
                </div>

                <div className={`bg-white p-6 rounded-[2.5rem] border-2 border-transparent hover:border-gray-100 flex items-center justify-between opacity-50 cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                            <Truck size={22} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-400">{isRTL ? 'شحن سريع' : 'Express Delivery'}</h4>
                            <p className="text-xs font-medium text-gray-400">{isRTL ? 'توصيل في اليوم التالي' : 'Next Day Delivery'}</p>
                        </div>
                    </div>
                    <span className="font-black text-gray-400">100 {isRTL ? 'ج.م' : 'EGP'}</span>
                </div>
            </div>
        </div>
    );
}

function PaymentStep() {
    const { isRTL } = useLanguage();
    return (
        <div className="space-y-6">
            <h3 className={`font-bold text-gray-900 px-2 font-cairo ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? 'طريقة الدفع' : 'Payment Method'}
            </h3>

            <div className={`bg-white p-6 rounded-[2.5rem] border-2 border-[#0E4435] shadow-md flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#0E4435]">
                        <Plus size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</h4>
                        <p className="text-xs font-medium text-gray-500">{isRTL ? 'ادفع عند استلام طلبك' : 'Pay when you receive your order'}</p>
                    </div>
                </div>
                <div className="w-6 h-6 border-4 border-[#0E4435] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#0E4435] rounded-full" />
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-sm font-bold text-gray-500 italic font-cairo">
                    {isRTL ? '"الدفع بالبطاقة قريباً. حالياً ندعم الدفع عند الاستلام فقط."' : '"Card payments are coming soon. For now, we only support COD."'}
                </p>
            </div>
        </div>
    );
}
