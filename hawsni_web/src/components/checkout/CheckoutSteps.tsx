'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

const CheckoutSteps = () => {
  const { t, isRTL } = useLanguage();
  return (
    <div>{isRTL ? 'خطوات الدفع' : 'Checkout Steps'}</div>
  );
};

export default CheckoutSteps;
