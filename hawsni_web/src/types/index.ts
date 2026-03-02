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
    image_url?: string;
    image?: string;
    heading?: string;
    heading_text?: string;
    heading_ar?: string;
    title?: string;
    title_ar?: string;
    subheading?: string;
    subheading_text?: string;
    subheading_ar?: string;
    description?: string;
    description_ar?: string;
    buttonText?: string;
    button_text?: string;
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
    colors?: any[];
    sizes?: string[];
    rating?: number;
    reviews?: number;
    size_guide?: string;
    stock?: number;
    countInStock?: number;
}
