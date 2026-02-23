export const en = {
    common: {
        search: "Search Products...",
        home: "Home",
        wishlist: "Wishlist",
        cart: "Cart",
        profile: "Profile",
        loading: "Loading...",
        view_all: "View All",
        apply: "Apply",
        clear: "Clear",
        cancel: "Cancel",
        save: "Save",
    },
    home: {
        new_arrivals: "New Arrivals",
        categories: "Categories",
    },
    search: {
        history: "Recent Searches",
        no_results: "No results found for",
        placeholder: "Search Products...",
        filters: "Filters",
        category: "Category",
        price_range: "Price Range",
        sort_by: "Sort By",
        sort_newest: "Newest",
        sort_price_asc: "Price: Low to High",
        sort_price_desc: "Price: High to Low",
        sort_rating: "Top Rated",
    },
    profile: {
        title: "My Profile",
        welcome_guest: "Welcome, Guest",
        guest_desc: "Log in to access your profile, track orders, and manage your wishlist.",
        login_signup: "Login / Signup",
        track_order: "Track Order",
        sections: {
            account: "Account",
            app_settings: "App Settings",
            activity: "My Activity",
        },
        items: {
            profile_details: "Profile Details",
            change_password: "Change Password",
            notifications: "Notifications",
            language: "Language",
            currency: "Currency",
            my_orders: "My Orders",
            wishlist: "Wishlist",
            addresses: "Addresses",
            coupons: "My Coupons",
            logout: "Logout",
        }
    },
    cart: {
        title: "Shopping Cart",
        empty: "Your cart is empty",
        checkout: "Checkout",
        total: "Total",
    }
};

export type LocaleType = typeof en;
