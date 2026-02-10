'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { vtoApi, productsApi, Product } from '@/lib/api';
import {
    Upload, Sparkles, RefreshCw, Download,
    Camera, ImageIcon, X, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function VTOPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productIdFromUrl = searchParams.get('product');

    // Auth check
    useEffect(() => {
        const token = localStorage.getItem('hwasi_token');
        if (!token) {
            const currentPath = window.location.pathname + window.location.search;
            router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [router, searchParams]);

    const [userImage, setUserImage] = useState<string | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'succeeded' | 'failed'>('idle');
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch product if ID provided in URL
    useEffect(() => {
        if (productIdFromUrl) {
            productsApi.getById(productIdFromUrl).then((res) => {
                if (res.data) setProduct(res.data);
            });
        }
    }, [productIdFromUrl]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUserImage(reader.result as string);
                setResultImage(null);
                setStatus('idle');
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!userImage || !product?.imageUrl) {
            setError('Please upload your photo and select a product');
            return;
        }

        setStatus('processing');
        setError(null);

        try {
            // Start generation
            const res = await vtoApi.generate({
                userImageUrl: userImage,
                productImageUrl: product.imageUrl,
            });

            if (res.error) {
                throw new Error(res.error);
            }

            if (res.data?.predictionId) {
                // Poll for status
                pollStatus(res.data.predictionId);
            }
        } catch (err) {
            setStatus('failed');
            setError(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    const pollStatus = async (predictionId: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await vtoApi.checkStatus(predictionId);

                if (res.data?.status === 'succeeded' && res.data.output) {
                    clearInterval(interval);
                    setResultImage(res.data.output);
                    setStatus('succeeded');
                } else if (res.data?.status === 'failed') {
                    clearInterval(interval);
                    setStatus('failed');
                    setError('Generation failed. Please try again.');
                }
            } catch {
                clearInterval(interval);
                setStatus('failed');
                setError('Failed to check status');
            }
        }, 3000);
    };

    const handleReset = () => {
        setUserImage(null);
        setResultImage(null);
        setStatus('idle');
        setError(null);
    };

    const handleDownload = () => {
        if (resultImage) {
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = 'hwasi-virtual-tryon.png';
            link.click();
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-[var(--primary)] mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Home
                </Link>

                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="vto-gradient p-3 rounded-full">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Virtual Try-On
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Upload your photo and see how our clothes look on you. Powered by AI magic.
                </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                    <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <h3 className="font-semibold mb-2">1. Upload Photo</h3>
                    <p className="text-sm text-gray-500">Upload a clear photo of yourself</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                    <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <h3 className="font-semibold mb-2">2. Select Product</h3>
                    <p className="text-sm text-gray-500">Choose a product to try on</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                    <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <h3 className="font-semibold mb-2">3. See Result</h3>
                    <p className="text-sm text-gray-500">AI generates your virtual try-on</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: User Photo Upload */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-semibold text-lg mb-4">Your Photo</h3>

                    {userImage ? (
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                            <Image
                                src={userImage}
                                alt="Your photo"
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => setUserImage(null)}
                                className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 hover:border-[var(--primary)] hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-700">Upload your photo</p>
                                <p className="text-sm text-gray-500 mt-1">Click to browse</p>
                            </div>
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>

                {/* Right: Result / Product */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-semibold text-lg mb-4">
                        {resultImage ? 'Result' : 'Product Preview'}
                    </h3>

                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                        {resultImage ? (
                            <Image
                                src={resultImage}
                                alt="Virtual try-on result"
                                fill
                                className="object-cover"
                            />
                        ) : product?.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                                <ImageIcon className="w-12 h-12" />
                                <p>Select a product from the catalog</p>
                            </div>
                        )}

                        {status === 'processing' && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                <p className="text-white font-medium">AI is working its magic...</p>
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    {product && !resultImage && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-[var(--primary)] font-bold">
                                {Math.floor(product.price)} ر.س
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
                {resultImage ? (
                    <>
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 border-2 border-gray-200 rounded-full font-medium flex items-center gap-2 hover:border-gray-300 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Another
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-6 py-3 bg-[var(--primary)] text-white rounded-full font-medium flex items-center gap-2 hover:bg-[var(--primary-dark)] transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Download
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleGenerate}
                        disabled={!userImage || !product || status === 'processing'}
                        className="vto-gradient px-8 py-4 text-white rounded-full font-semibold flex items-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-6 h-6" />
                        Generate Try-On
                    </button>
                )}
            </div>

            {/* Browse Products Link */}
            {!product && (
                <div className="text-center mt-8">
                    <Link
                        href="/products"
                        className="text-[var(--primary)] font-medium hover:underline"
                    >
                        Browse products to try on →
                    </Link>
                </div>
            )}
        </div>
    );
}
