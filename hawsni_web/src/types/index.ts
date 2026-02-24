export interface Category {
    _id: string;
    name: string;
    name_ar?: string;
    image: string;
}

export interface Banner {
    id?: string;
    _id?: string;
    imageUrl?: string;
    image?: string;
    heading?: string;
    heading_ar?: string;
    title?: string;
    title_ar?: string;
    subheading?: string;
    subheading_ar?: string;
    description?: string;
    description_ar?: string;
    buttonText?: string;
    buttonText_ar?: string;
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
    size_guide?: string;
}
