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

type CheckoutStep = 'address' | 'shipping' | 'payment';

import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
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
                                {currentStep === 'address' && (
                                    <AddressStep
                                        onNext={handleNextStep}
                                        addresses={addresses}
                                        selectedId={selectedAddressId}
                                        onSelect={setSelectedAddressId}
                                    />
                                )}
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
function AddressStep({
    onNext,
    addresses,
    selectedId,
    onSelect
}: {
    onNext: () => void,
    addresses: Address[],
    selectedId: string | null,
    onSelect: (id: string) => void
}) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="font-bold text-gray-900">Select Shipping Address</h3>
                <button
                    onClick={() => window.location.href = '/profile/addresses'}
                    className="flex items-center gap-2 text-[var(--color-brand-primary)] font-bold text-sm"
                >
                    <Plus size={18} />
                    <span>Manage</span>
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="bg-white p-10 rounded-[2rem] text-center border-2 border-dashed border-gray-100">
                    <MapPin size={40} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-bold mb-4">No addresses saved yet</p>
                    <button
                        onClick={() => window.location.href = '/profile/addresses'}
                        className="px-6 py-2 bg-[var(--color-brand-primary)] text-white rounded-full font-bold text-sm"
                    >
                        Add Address
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
                                ${selectedId === addr._id ? 'border-[var(--color-brand-primary)] shadow-md' : 'border-transparent hover:border-gray-100'}
                            `}
                        >
                            {selectedId === addr._id && (
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="w-6 h-6 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center">
                                        <Check size={14} />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-4">
                                <div className={`
                                    w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                                    ${selectedId === addr._id ? 'bg-emerald-50 text-[var(--color-brand-primary)]' : 'bg-gray-50 text-gray-400'}
                                `}>
                                    {addr.type === 'home' ? <Home size={22} /> : <Briefcase size={22} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`
                                        font-black uppercase text-xs tracking-wider mb-2
                                        ${selectedId === addr._id ? 'text-gray-900' : 'text-gray-400'}
                                    `}>
                                        {addr.type}
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

            <button
                onClick={onNext}
                disabled={!selectedId}
                className={`
                    w-full mt-4 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all
                    ${selectedId ? 'bg-gray-900 text-white shadow-black/10 hover:bg-black' : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'}
                `}
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
