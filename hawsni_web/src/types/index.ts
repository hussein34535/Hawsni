export interface Category {
    _id: string;
    name: string;
    image: string;
}

export interface Banner {
    id?: string;
    _id?: string;
    imageUrl?: string;
    image?: string;
    heading?: string;
    title?: string;
    subheading?: string;
    description?: string;
    buttonText?: string;
}

export interface Product {
    _id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    category: string | Category;
    isFeatured: boolean;
    colors?: { color: string; image: string }[];
    sizes?: string[];
    rating?: number;
    reviews?: number;
}
