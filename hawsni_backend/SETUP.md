# Hawsni Backend API

## Installation

```bash
npm install
```

## Setup

1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

2. Update `.env` with your settings:
- PORT: Server port (default: 5000)
- MONGODB_URI: MongoDB connection string
- JWT_SECRET: Secret key for JWT tokens

## Running the Server

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user (Protected)

### Products
- GET `/api/products` - Get all products
- GET `/api/products/featured` - Get featured products
- GET `/api/products/:id` - Get product by ID
- POST `/api/products` - Create product (Admin)
- PUT `/api/products/:id` - Update product (Admin)
- DELETE `/api/products/:id` - Delete product (Admin)

### Categories
- GET `/api/categories` - Get all categories
- GET `/api/categories/:id` - Get category by ID
- POST `/api/categories` - Create category (Admin)
- PUT `/api/categories/:id` - Update category (Admin)
- DELETE `/api/categories/:id` - Delete category (Admin)

### Cart
- GET `/api/cart` - Get user cart (Protected)
- POST `/api/cart/items` - Add item to cart (Protected)
- PUT `/api/cart/items/:itemId` - Update cart item (Protected)
- DELETE `/api/cart/items/:itemId` - Remove item from cart (Protected)
- DELETE `/api/cart` - Clear cart (Protected)

### Orders
- GET `/api/orders` - Get user orders (Protected)
- GET `/api/orders/:id` - Get order by ID (Protected)
- POST `/api/orders` - Create order (Protected)
- PUT `/api/orders/:id/status` - Update order status (Admin)
- PUT `/api/orders/:id/cancel` - Cancel order (Protected)

### Coupons
- GET `/api/coupons` - Get all coupons (Admin)
- POST `/api/coupons/validate` - Validate coupon (Protected)
- POST `/api/coupons` - Create coupon (Admin)
- PUT `/api/coupons/:id` - Update coupon (Admin)
- DELETE `/api/coupons/:id` - Delete coupon (Admin)

### Wishlist
- GET `/api/wishlist` - Get user wishlist (Protected)
- POST `/api/wishlist/products/:productId` - Add to wishlist (Protected)
- DELETE `/api/wishlist/products/:productId` - Remove from wishlist (Protected)

### Reviews
- GET `/api/reviews/product/:productId` - Get product reviews
- POST `/api/reviews` - Create review (Protected)
- PUT `/api/reviews/:id` - Update review (Protected)
- DELETE `/api/reviews/:id` - Delete review (Protected)

### Users
- GET `/api/users/profile` - Get user profile (Protected)
- PUT `/api/users/profile` - Update user profile (Protected)
- POST `/api/users/addresses` - Add address (Protected)
- PUT `/api/users/addresses/:addressId` - Update address (Protected)
- DELETE `/api/users/addresses/:addressId` - Delete address (Protected)

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Project Structure

```
hawsni_backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── server.js        # Main server file
├── package.json     # Dependencies
└── .env            # Environment variables
```
