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
    focal_x?: number;
    focal_y?: number;
    button_opacity?: number;
    image_blur?: number;
    button_color?: string;
    button_style?: string;
    button_size?: string;
    button_position?: string;
    button_link?: string;
    link?: string;
    is_active?: boolean;
    sort_order?: number;
}

export interface Product {
    id?: string;
    _id: string;
    name: string;
    price: number;
    discount?: number;
    description: string;
    images: string[];
    image?: string;
    category: string | Category;
    isFeatured: boolean;
    is_vto_enabled?: boolean;
    colors?: any[];
    sizes?: string[];
    rating?: number;
    num_reviews?: number;
    size_guide?: string;
    stock?: number;
    stock_count?: number;
    countInStock?: number;
    product_variants?: any[];
    accessories?: any[];
    video_url?: string;
}
