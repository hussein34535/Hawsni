const supabase = require('./config/supabase');

const sampleBanners = [
    {
        image_url: 'https://images.unsplash.com/photo-1547996663-0b555e5e3385?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        title: 'Luxury Gold Collection',
        link: '/products?category=luxury',
        is_active: true,
        sort_order: 1
    },
    {
        image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        title: 'New Season Fashion',
        link: '/products?category=fashion',
        is_active: true,
        sort_order: 2
    },
    {
        image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        title: 'Latest Electronics',
        link: '/products?category=electronics',
        is_active: true,
        sort_order: 3
    }
];

async function addBanners() {
    console.log('🚀 Adding sample banners...');

    try {
        // Optional: Clear existing banners if you want a fresh start
        // await supabase.from('banners').delete().neq('id', 0); 

        const { data, error } = await supabase
            .from('banners')
            .insert(sampleBanners)
            .select();

        if (error) {
            console.error('❌ Error adding banners:', error.message);
        } else {
            console.log('✅ Successfully added banners:', data.length);
            console.log(data);
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

addBanners();
