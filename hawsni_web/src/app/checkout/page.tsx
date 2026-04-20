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
    Plus,
    X,
    Phone,
    User,
    Mail,
    Tag,
    Receipt,
    User as PersonStanding
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useLanguage } from '@/context/LanguageContext';
import { addressService, Address } from '@/services/addressService';
import { checkoutService, OrderData } from '@/services/checkoutService';
import { couponService } from '@/services/couponService';
import { trackEvent } from '@/components/analytics/FacebookPixel';
import { trackGAEvent } from '@/components/analytics/GoogleAnalytics';
import { authService } from '@/services/authService';

const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
    'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'سوهاج', 'الساحل الشمالي'
];

// Subconscious UX Components
const CheckoutInput = ({ 
    icon: Icon, 
    placeholder, 
    value, 
    onChange, 
    type = 'text', 
    isValid = false, 
    id,
    disabled = false
}: { 
    icon: any, 
    placeholder: string, 
    value: string, 
    onChange: (e: any) => void, 
    type?: string, 
    isValid?: boolean, 
    id?: string,
    disabled?: boolean
}) => {
    const { isRTL } = useLanguage();
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
        >
            <div className={`absolute inset-y-0 ${isRTL ? 'right-4 md:right-5' : 'left-4 md:left-5'} flex items-center pointer-events-none group-focus-within:text-[#0E4435] transition-colors text-gray-400`}>
                <Icon className="w-5 h-5" />
            </div>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                className={`
                    w-full ${isRTL ? 'pr-11 md:pr-14 pl-10' : 'pl-11 md:pl-14 pr-10'} py-3 md:py-4 bg-gray-50 border-2 rounded-xl md:rounded-2xl 
                    font-bold text-[13px] md:text-sm outline-none transition-all duration-300
                    ${value ? 'border-emerald-100 bg-white' : 'border-transparent'}
                    focus:border-[#0E4435] focus:bg-white focus:ring-4 focus:ring-[#0E4435]/5
                `}
            />
            <AnimatePresence>
                {isValid && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={`absolute inset-y-0 ${isRTL ? 'left-5' : 'right-5'} flex items-center`}
                    >
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotal, clearCart } = useCartStore();
    const { isRTL, t } = useLanguage();
    const { showToast } = useToastStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Address & Shipping State
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [shippingSettings, setShippingSettings] = useState<any>(null);
    const [freeDeliveryActive, setFreeDeliveryActive] = useState(false);
    const [selectedGov, setSelectedGov] = useState('');
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [newAddress, setNewAddress] = useState<{ street: string; city: string; type: 'home' | 'office' | 'other'; alternativePhone?: string }>({ street: '', city: '', type: 'home', alternativePhone: '' });

    // Guest Info
    const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', phone2: '', email: '', street: '', city: '' });

    // Coupon states
    const [couponCode, setCouponCode] = useState('');
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
    const [notes, setNotes] = useState('');

    // Bosta Cascaded States
    const [governorates, setGovernorates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [selectedGovId, setSelectedGovId] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);

        const fetchData = async () => {
            try {
                const settingsRes = await checkoutService.getShippingSettings();
                setShippingSettings(settingsRes.settings);

                // Check if free delivery is enabled globally
                try {
                    const pubRes = await import('@/lib/axios').then(m => m.default.get('/settings/public'));
                    setFreeDeliveryActive(!!pubRes.data?.data?.free_delivery_enabled);
                } catch { }

                if (token) {
                    // Fetch user profile to auto-fill email
                    try {
                        const profile = await authService.getProfile();
                        if (profile.success && profile.user) {
                            setGuestInfo(prev => ({ ...prev, email: profile.user.email || '' }));
                        }
                    } catch (err) {
                        console.error('Failed to auto-fill email:', err);
                    }

                    const addrRes = await addressService.getAddresses();
                    const addrs = addrRes.addresses || [];
                    setAddresses(addrs);
                    if (addrs.length > 0) {
                        const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
                        setSelectedAddressId(defaultAddr._id);
                        setSelectedGov(defaultAddr.state || '');
                        setIsAddingNewAddress(false);
                    } else {
                        setIsAddingNewAddress(true);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();

    }, []);

    // Fetch Bosta Cities
    useEffect(() => {
        const fetchGovs = async () => {
            try {
                const axios = (await import('@/lib/axios')).default;
                const res = await axios.get('/shipping/cities');
                if (res.data.success) {
                    setGovernorates(res.data.cities || []);
                }
            } catch (err) {
                console.error('Failed to fetch governorates:', err);
            }
        };
        fetchGovs();
    }, []);

    // Fetch Bosta Districts when city changes
    useEffect(() => {
        if (!selectedGovId) {
            setDistricts([]);
            setSelectedDistrictId('');
            return;
        }
        const fetchDistricts = async () => {
            try {
                const axios = (await import('@/lib/axios')).default;
                const res = await axios.get(`/shipping/districts/${selectedGovId}`);
                if (res.data.success) {
                    setDistricts(res.data.districts || []);
                }
            } catch (err) {
                console.error('Failed to fetch districts:', err);
            }
        };
        fetchDistricts();
    }, [selectedGovId]);

    const subtotal = getTotal();

    const calculateShipping = () => {
        // Free delivery is fully on — skip all calculations
        if (freeDeliveryActive) return { cost: 0, min: 1, max: 2 };

        if (!shippingSettings) return { cost: 0, min: 3, max: 7 };
        const threshold = shippingSettings.free_shipping_threshold || 0;

        const govSettings = shippingSettings.governorate_settings || {};
        
        let currentGov = null;
        if (selectedGov) {
            currentGov = govSettings[selectedGov];
            if (!currentGov) {
                const searchKey = Object.keys(govSettings).find(k => 
                   k.trim() === selectedGov.trim() || k.includes(selectedGov) || selectedGov.includes(k)
                );
                if (searchKey) currentGov = govSettings[searchKey];
            }
        }

        if (!selectedGov) return { cost: 0, min: 1, max: 3 };

        const cost = (threshold > 0 && subtotal >= threshold)
            ? 0
            : (currentGov ? currentGov.cost : (shippingSettings.delivery_cost || 50));

        const min = currentGov ? currentGov.days_min : (shippingSettings.default_days_min || 3);
        const max = currentGov ? currentGov.days_max : (shippingSettings.default_days_max || 7);

        return { cost, min, max };
    };

    const { cost: shippingFee, min: deliveryMin, max: deliveryMax } = calculateShipping();
    const total = subtotal - couponDiscount + shippingFee;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        try {
            const res = await couponService.validateCoupon(couponCode);
            if (res.success && res.coupon) {
                setIsCouponApplied(true);
                const discount = res.coupon.discountAmount;
                setCouponType(res.coupon.discountType);
                if (res.coupon.discountType === 'percentage') {
                    setCouponDiscount(subtotal * (discount / 100));
                } else {
                    setCouponDiscount(discount);
                }
            }
        } catch (error: any) {
            alert(error || 'Invalid coupon');
        }
    };

    const handleRemoveCoupon = () => {
        setIsCouponApplied(false);
        setCouponCode('');
        setCouponDiscount(0);
    };

    const handlePlaceOrder = async () => {
        // Advanced Custom Validation
        if (!isAuthenticated) {
            if (!guestInfo.name || guestInfo.name.length < 3) {
                showToast(isRTL ? 'الاسم قصير جداً! يرجى إدخال اسمك بشكل واضح (3 حروف على الأقل)' : 'Please enter a valid name (at least 3 characters)', 'error');
                document.getElementById('guest-name')?.focus();
                return;
            }
            if (!guestInfo.phone) {
                showToast(isRTL ? 'يا ريت تكتب رقم تليفونك عشان نكلمك وقت التسليم' : 'Please enter your phone number', 'error');
                document.getElementById('guest-phone')?.focus();
                return;
            }
            const phoneCleaner = guestInfo.phone.replace(/[\s\-+]/g, '');
            if (!/^2?(010|011|012|015)\d{8}$/.test(phoneCleaner)) {
                showToast(isRTL ? 'تأكد من رقم الموبايل! لازم يكون 11 رقم ويبدأ بـ 01' : 'Please enter a valid 11-digit Egyptian phone number', 'error');
                document.getElementById('guest-phone')?.focus();
                return;
            }

            if (guestInfo.phone2) {
                const phone2Cleaner = guestInfo.phone2.replace(/[\s\-+]/g, '');
                if (!/^2?(010|011|012|015)\d{8}$/.test(phone2Cleaner)) {
                    showToast(isRTL ? 'برجاء التأكد من رقم الموبايل الإضافي (11 رقم)' : 'Invalid alternative phone number', 'error');
                    document.getElementById('guest-phone2')?.focus();
                    return;
                }
            }

            if (!selectedGovId) {
                showToast(isRTL ? 'اختر محافظتك عشان نحسبلك مصاريف الشحن وتفاصيل التوصيل صح' : 'Please select a governorate', 'error');
                return;
            }
            if (!selectedDistrictId) {
                showToast(isRTL ? 'محتاجين المنطقة بتاعتك عشان التوصيل يوصل بسرعة' : 'Please select a district', 'error');
                return;
            }
            if (!guestInfo.street || guestInfo.street.length < 5) {
                showToast(isRTL ? 'اكتب عنوانك بالتفصيل الواضح (اسم الشارع، رقم العمارة، الشقة)' : 'Please enter a detailed street address', 'error');
                document.getElementById('guest-street')?.focus();
                return;
            }
        } else {
            if (!selectedAddressId && !isAddingNewAddress) {
                showToast(isRTL ? 'يرجى اختيار عنوان التوصيل!' : 'Please select a shipping address', 'error');
                return;
            }
            if (isAddingNewAddress) {
                if (!selectedGovId) {
                    showToast(isRTL ? 'اختار المحافظة لعنوانك الجديد' : 'Please select a governorate for the new address', 'error');
                    return;
                }
                if (!selectedDistrictId) {
                    showToast(isRTL ? 'اختار المنطقة لعنوانك الجديد' : 'Please select a district for the new address', 'error');
                    return;
                }
                if (!newAddress.street || newAddress.street.length < 5) {
                    showToast(isRTL ? 'اكتب عنوانك بالتفصيل للعنوان الجديد' : 'Please enter a detailed street address', 'error');
                    document.getElementById('new-street')?.focus();
                    return;
                }
            }
        }

        setIsProcessing(true);
        try {
            let addressId = selectedAddressId;

            // If user is logged in and entered a new address, save it first
            if (isAuthenticated && isAddingNewAddress) {
                const saveAddrRes = await addressService.addAddress({
                    street: newAddress.street,
                    city: newAddress.city,
                    state: selectedGov,
                    country: 'Egypt',
                    type: newAddress.type,
                    isDefault: addresses.length === 0
                });
                if (saveAddrRes.success) {
                    addressId = saveAddrRes.address._id;
                }
            }

            const orderData: OrderData = {
                items: items.map(item => ({
                    product: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.imageUrl,
                    size: item.size || undefined,
                    color: item.color || undefined,
                    accessories: item.accessories || undefined
                })),
                shippingAddress: isAuthenticated && addressId
                    ? {
                        ...addresses.find(a => a._id === addressId),
                        id: addressId,
                        state: selectedGov,
                        districtId: selectedDistrictId || undefined,
                        address: addresses.find(a => a._id === addressId)?.street || ''
                    }
                    : {
                        street: guestInfo.street,
                        city: guestInfo.city,
                        state: selectedGov,
                        districtId: selectedDistrictId || undefined,
                        address: `${guestInfo.street}, ${guestInfo.city}, ${selectedGov}`
                    },
                paymentMethod: 'Cash on Delivery',
                subtotal,
                shippingFee,
                discount: couponDiscount,
                totalAmount: total,
                couponCode: isCouponApplied ? couponCode : undefined,
                ...(!isAuthenticated ? {
                    guestName: guestInfo.name,
                    guestPhone: guestInfo.phone,
                    guestAlternativePhone: guestInfo.phone2,
                    guestEmail: guestInfo.email
                } : {
                    guestAlternativePhone: newAddress.alternativePhone,
                    guestEmail: guestInfo.email // Always include email if we have it
                }),
                notes: notes || undefined
            };

            const result = await checkoutService.placeOrder(orderData);
            if (result.success) {
                clearCart();
                router.push(`/order-success/${result.order.id || result.order._id}`);
            }
        } catch (error: any) {
            showToast(error.message || error || 'Failed to place order', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (items.length === 0 && !isProcessing) return null;

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-24 text-right font-cairo" dir="ltr">


            {/* Main Content */}

            <main className="max-w-5xl mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">

                {/* Details Column */}
                <div className="lg:col-span-7 space-y-4 md:space-y-8">

                    {/* Guest Information */}
                    {!isAuthenticated && (
                        <section>
                            <div className="flex items-center gap-2 mb-3 md:mb-5">
                                <PersonStanding className="w-5 h-5 md:w-7 md:h-7 text-[#0E4435]" />
                                <h2 className="text-base md:text-xl font-black text-gray-900 font-cairo">
                                    {isRTL ? 'بيانات العميل' : 'Guest Information'}
                                </h2>
                            </div>
                            <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100 space-y-3">
                                <CheckoutInput 
                                    id="guest-name"
                                    icon={User}
                                    placeholder={isRTL ? 'الاسم بالكامل' : 'Full Name'}
                                    value={guestInfo.name}
                                    onChange={e => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                    isValid={guestInfo.name.length >= 3}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <CheckoutInput 
                                        id="guest-phone"
                                        type="tel"
                                        icon={Phone}
                                        placeholder={isRTL ? 'رقم الهاتف' : 'Phone'}
                                        value={guestInfo.phone}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setGuestInfo({ ...guestInfo, phone: val });
                                            if (val.length === 11 && /^01[0125]\d{8}$/.test(val)) {
                                                document.getElementById('guest-phone2')?.focus();
                                            }
                                        }}
                                        isValid={/^01[0125]\d{8}$/.test(guestInfo.phone)}
                                    />
                                    <CheckoutInput 
                                        id="guest-phone2"
                                        type="tel"
                                        icon={Phone}
                                        placeholder={isRTL ? 'رقم بديل' : 'Alt. Phone'}
                                        value={guestInfo.phone2}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setGuestInfo({ ...guestInfo, phone2: val });
                                            if (val.length === 11 && /^01[0125]\d{8}$/.test(val)) {
                                                document.getElementById('guest-email')?.focus();
                                            }
                                        }}
                                        isValid={guestInfo.phone2 ? /^01[0125]\d{8}$/.test(guestInfo.phone2) : false}
                                    />
                                </div>

                                <CheckoutInput 
                                    id="guest-email"
                                    type="email"
                                    icon={Mail}
                                    placeholder={isRTL ? 'البريد الإلكتروني (ننصح به)' : 'Email (Recommended)'}
                                    value={guestInfo.email}
                                    onChange={e => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                    isValid={!!guestInfo.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)}
                                />
                            </div>
                        </section>
                    )}

                    {/* Shipping Address */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 md:mb-5">
                            <MapPin className="w-5 h-5 md:w-7 md:h-7 text-[#0E4435]" />
                            <h2 className="text-base md:text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'عنوان التوصيل' : 'Shipping Address'}
                            </h2>
                        </div>
                        <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100">
                            {isAuthenticated ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr._id}
                                            onClick={() => {
                                                setSelectedAddressId(addr._id);
                                                setSelectedGov(addr.state || '');
                                                setIsAddingNewAddress(false);
                                            }}
                                            className={`
                                                cursor-pointer p-6 rounded-3xl border-2 transition-all relative flex items-center gap-4
                                                ${selectedAddressId === addr._id && !isAddingNewAddress ? 'border-[#0E4435] bg-emerald-50/20' : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                                            `}
                                        >
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0E4435] shadow-sm">
                                                {addr.type === 'home' ? <Home size={18} /> : <Briefcase size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                                                    {isRTL ? (addr.type === 'home' ? 'منزل' : 'عمل') : addr.type}
                                                </h4>
                                                <p className="text-sm font-bold text-gray-900 truncate">{addr.street}</p>
                                            </div>
                                            {selectedAddressId === addr._id && !isAddingNewAddress && <CheckCircle2 className="text-[#0E4435]" size={20} />}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsAddingNewAddress(true)}
                                        className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-center gap-2 hover:bg-gray-100 ${isAddingNewAddress ? 'border-[#0E4435] bg-emerald-50/20 text-[#0E4435]' : 'border-dashed border-gray-200 text-gray-400'}`}
                                    >
                                        <Plus size={20} /> <span className="font-bold text-sm">{isRTL ? 'إضافة عنوان جديد' : 'Add New Address'}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <CheckoutInput 
                                        id="guest-street"
                                        icon={MapPin}
                                        placeholder={isRTL ? 'الشارع / رقم العقار / الشقة' : 'Street, Building, Apartment'}
                                        value={guestInfo.street}
                                        onChange={e => setGuestInfo({ ...guestInfo, street: e.target.value })}
                                        isValid={guestInfo.street.length >= 5}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <select
                                                value={selectedGovId} 
                                                onChange={e => {
                                                    const gov = governorates.find(g => g.id === e.target.value);
                                                    setSelectedGovId(e.target.value);
                                                    setSelectedDistrictId('');
                                                    setSelectedGov(gov ? gov.arabicName : '');
                                                }}
                                                className={`w-full bg-gray-50 border-2 rounded-xl px-3 py-3 md:px-4 md:py-4 focus:border-[#0E4435] focus:bg-white outline-none font-bold text-[13px] md:text-sm transition-all appearance-none cursor-pointer ${ selectedGovId ? 'border-emerald-100 bg-white text-gray-900' : 'border-transparent text-gray-500'}`}
                                            >
                                                <option value="">{isRTL ? '📍 المحافظة' : '📍 Governorate'}</option>
                                                {governorates.map(gov => (
                                                    <option key={gov.id} value={gov.id}>
                                                        {isRTL ? gov.arabicName : gov.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center`}>
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={selectedDistrictId}
                                                onChange={e => {
                                                    const dist = districts.find(d => d.id === e.target.value);
                                                    setSelectedDistrictId(e.target.value);
                                                    setGuestInfo({ ...guestInfo, city: dist ? dist.arabicName : '' });
                                                }}
                                                disabled={!selectedGovId}
                                                className={`w-full bg-gray-50 border-2 rounded-xl px-3 py-3 md:px-4 md:py-4 focus:border-[#0E4435] focus:bg-white outline-none font-bold text-[13px] md:text-sm transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${ selectedDistrictId ? 'border-emerald-100 bg-white text-gray-900' : 'border-transparent text-gray-500'}`}
                                            >
                                                <option value="">{isRTL ? '🏘️ المنطقة / الحي' : '🏘️ District'}</option>
                                                {districts.map(dist => (
                                                    <option key={dist.id} value={dist.id}>
                                                        {isRTL ? dist.arabicName : dist.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center`}>
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* New Address Form for Authenticated Users */}
                            {isAuthenticated && isAddingNewAddress && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="pt-4 mt-4 border-t border-gray-100 space-y-3"
                                >
                                    <CheckoutInput 
                                        id="new-street"
                                        icon={MapPin}
                                        placeholder={isRTL ? 'الشارع / رقم العقار / الشقة' : 'Street, Building, Apt'}
                                        value={newAddress.street}
                                        onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                        isValid={newAddress.street.length >= 5}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <select
                                                value={selectedGovId} 
                                                onChange={e => {
                                                    const gov = governorates.find(g => g.id === e.target.value);
                                                    setSelectedGovId(e.target.value);
                                                    setSelectedDistrictId('');
                                                    setSelectedGov(gov ? gov.arabicName : '');
                                                }}
                                                className={`w-full bg-gray-50 border-2 rounded-xl px-3 py-3 focus:border-[#0E4435] focus:bg-white outline-none font-bold text-[13px] transition-all appearance-none cursor-pointer ${ selectedGovId ? 'border-emerald-100 bg-white text-gray-900' : 'border-transparent text-gray-500'}`}
                                            >
                                                <option value="">{isRTL ? '📍 المحافظة' : '📍 Gov.'}</option>
                                                {governorates.map(gov => (
                                                    <option key={gov.id} value={gov.id}>
                                                        {isRTL ? gov.arabicName : gov.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-2' : 'right-2'} flex items-center`}>
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={selectedDistrictId}
                                                onChange={e => {
                                                    const dist = districts.find(d => d.id === e.target.value);
                                                    setSelectedDistrictId(e.target.value);
                                                    setNewAddress({ ...newAddress, city: dist ? dist.arabicName : '' });
                                                }}
                                                disabled={!selectedGovId}
                                                className={`w-full bg-gray-50 border-2 rounded-xl px-3 py-3 focus:border-[#0E4435] focus:bg-white outline-none font-bold text-[13px] transition-all appearance-none cursor-pointer disabled:opacity-40 ${ selectedDistrictId ? 'border-emerald-100 bg-white text-gray-900' : 'border-transparent text-gray-500'}`}
                                            >
                                                <option value="">{isRTL ? '🏘️ المنطقة' : '🏘️ Area'}</option>
                                                {districts.map(dist => (
                                                    <option key={dist.id} value={dist.id}>
                                                        {isRTL ? dist.arabicName : dist.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className={`pointer-events-none absolute inset-y-0 ${isRTL ? 'left-2' : 'right-2'} flex items-center`}>
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {(['home', 'office', 'other'] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewAddress({ ...newAddress, type })}
                                                className={`flex-1 py-2.5 md:py-3 rounded-xl font-black text-[11px] uppercase tracking-wide transition-all ${newAddress.type === type ? 'bg-[#0E4435] text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                {isRTL ? (type === 'home' ? '🏠 منزل' : type === 'office' ? '🏢 مكتب' : '📌 آخر') : type}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </section>

                    {/* Payment Method */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 md:mb-5">
                            <CreditCard className="w-5 h-5 md:w-7 md:h-7 text-[#0E4435]" />
                            <h2 className="text-base md:text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'طريقة الدفع' : 'Payment Method'}
                            </h2>
                        </div>
                        <div className="bg-emerald-50/60 rounded-2xl md:rounded-[2.5rem] p-3.5 md:p-6 border border-[#0E4435]/15 flex items-center gap-3 md:gap-5">
                            <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-lg md:text-2xl shrink-0">
                                💵
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-gray-900 font-cairo text-sm md:text-base">
                                    {isRTL ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                                </h3>
                                <p className="text-[11px] md:text-sm font-bold text-gray-400 mt-0.5">
                                    {isRTL ? 'ادفع عند استلام طلبك' : 'Pay when you receive'}
                                </p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7 text-[#0E4435] shrink-0" />
                        </div>
                    </section>

                    {/* Promo Code */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 md:mb-5">
                            <Tag className="w-5 h-5 md:w-7 md:h-7 text-[#0E4435]" />
                            <h2 className="text-base md:text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'كود الخصم' : 'Promo Code'}
                            </h2>
                        </div>
                        <div className={`bg-white rounded-2xl md:rounded-[2.5rem] p-3.5 md:p-8 shadow-sm border ${isCouponApplied ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'}`}>
                            <div className="flex gap-2 md:gap-4">
                                <div className="relative flex-1">
                                    <div className={`absolute inset-y-0 ${isRTL ? 'right-3 md:right-5' : 'left-3 md:left-5'} flex items-center pointer-events-none`}>
                                        <Tag className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${isCouponApplied ? 'text-[#0E4435]' : 'text-gray-400'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'كود الخصم...' : 'Promo code'}
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={isCouponApplied}
                                        className={`w-full ${isRTL ? 'pr-9 md:pr-14 pl-3' : 'pl-9 md:pl-14 pr-3'} py-3 md:py-4 rounded-xl md:rounded-2xl outline-none border-2 font-bold text-[13px] md:text-sm transition-all focus:border-[#0E4435] ${isCouponApplied ? 'bg-white border-[#0E4435]/20 text-[#0E4435]' : 'bg-gray-50 border-transparent focus:bg-white'}`}
                                    />
                                </div>
                                {isCouponApplied ? (
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="py-3 md:py-4 px-4 md:px-6 bg-red-50 text-red-600 font-black rounded-xl md:rounded-2xl flex items-center gap-1.5 hover:bg-red-100 transition-colors text-sm"
                                    >
                                        <X size={15} /> {isRTL ? 'إلغاء' : 'Remove'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleApplyCoupon}
                                        className="py-3 md:py-4 px-5 md:px-8 bg-gray-950 text-white font-black rounded-xl md:rounded-2xl hover:bg-gray-800 transition-colors text-sm active:scale-95"
                                    >
                                        {isRTL ? 'تطبيق' : 'Apply'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
 
                    {/* Order Notes */}
                    <section>
                        <div className="flex items-center gap-2 mb-3 md:mb-5">
                            <Plus className="w-5 h-5 md:w-7 md:h-7 text-[#0E4435]" />
                            <h2 className="text-base md:text-xl font-black text-gray-900 font-cairo">
                                {isRTL ? 'ملاحظات إضافية' : 'Order Notes'}
                            </h2>
                        </div>
                        <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-3.5 md:p-8 shadow-sm border border-gray-100">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={isRTL ? 'مثال: بجوار مسجد كذا، الدور التاني شمال...' : 'Example: near mosque, 2nd floor left...'}
                                className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl px-3 md:px-5 py-3 md:py-5 focus:border-[#0E4435] focus:bg-white outline-none font-bold text-[13px] md:text-sm min-h-[80px] md:min-h-[120px] resize-none transition-all"
                            />
                        </div>
                    </section>
                </div>

                {/* Summary Column */}
                <div className="lg:col-span-5 space-y-4 md:space-y-6">
                    <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm md:shadow-xl shadow-black/[0.02] border border-gray-100 lg:sticky lg:top-28">
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8 border-b border-gray-50 pb-4">
                            <Receipt className="w-5 h-5 md:w-6 md:h-6 text-[#0E4435]" />
                            <h2 className="text-base md:text-xl font-black text-gray-900 font-cairo uppercase tracking-tight">
                                {isRTL ? 'ملخص الطلب' : 'Order Summary'}
                            </h2>
                        </div>

                        <div className="space-y-3 font-cairo text-[13px] md:text-sm font-bold">
                            <div className="flex justify-between items-center text-gray-400">
                                <span>{isRTL ? 'المجموع' : 'Subtotal'}</span>
                                <span className="text-gray-900">{subtotal.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                            </div>
                            {isCouponApplied && (
                                <div className="flex justify-between items-center text-[#0E4435]">
                                    <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                                    <span>-{couponDiscount.toLocaleString()} {isRTL ? 'ج.م' : 'EGP'}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-start text-gray-400">
                                <span>{isRTL ? 'الشحن' : 'Shipping'}</span>
                                <div className="text-end">
                                    <span className="text-gray-900 block font-black">
                                        {!selectedGov 
                                            ? (isRTL ? 'يُحسب بعد اختيار المحافظة' : 'Select gov. first') 
                                            : (shippingFee === 0 ? (isRTL ? '🎉 مجاني' : '🎉 Free') : `${shippingFee.toLocaleString()} ${isRTL ? 'ج.م' : 'EGP'}`)}
                                    </span>
                                    {selectedGov && (
                                        <span className="text-[10px] text-[#0E4435] font-bold mt-0.5 block">
                                            {isRTL ? `⚡ ${deliveryMin}-${deliveryMax} أيام` : `⚡ ${deliveryMin}-${deliveryMax} days`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="pt-4 md:pt-6 border-t border-gray-100 mt-4 flex justify-between items-center">
                                <span className="text-base md:text-lg font-black text-gray-900">{isRTL ? 'الإجمالي' : 'Total'}</span>
                                <span className="text-2xl md:text-3xl font-black text-[#0E4435]">
                                    {total.toLocaleString()} <span className="text-xs">{isRTL ? 'ج.م' : 'EGP'}</span>
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={isProcessing}
                            className={`w-full mt-5 md:mt-10 py-4 md:py-6 bg-[#0E4435] text-white rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl flex items-center justify-center gap-3 shadow-lg md:shadow-2xl shadow-emerald-950/20 transition-all ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                        >
                            {isProcessing ? (
                                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isRTL ? 'تأكيد الطلب' : 'Place Order'}</span>
                                    {isRTL ? <ArrowLeft className="w-6 h-6 rotate-180" /> : <ArrowRight className="w-6 h-6" />}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
