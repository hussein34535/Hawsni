# 🛍️ Hawsni E-Commerce Application

**Hawsni** is a premium, modern e-commerce mobile application built with **Flutter**, designed to provide a luxury shopping experience similar to high-end fashion apps (like Nike or Farfetch). It features a "Legendary" UI design, robust state management, and a scalable backend.

---

## 🚀 Technology Stack

### **Frontend (Mobile App)**
-   **Framework:** Flutter (Dark/Light mode capable, currently optimized for "Legendary" Light Theme).
-   **State Management:** `flutter_bloc` (Clean Architecture & Separated Logic).
-   **Architecture:** Feature-based Clean Architecture (`features/`, `core/`, `data/`).
-   **Key Libraries:** `http`, `flutter_secure_storage` (Auth), `provider` (Wishlist), `animate_do` (Animations).

### **Backend (API & Database)**
-   **Runtime:** Node.js + Express.js.
-   **Database:** Supabase (PostgreSQL).
-   **Deployment:** Vercel (Live Server).
-   **Location:** Code stored in `hawsni_backend/` folder.

---

## ✨ Key Features

### **1. Authentic Shopping Experience**
-   **Dynamic Home Screen:** Horizontal categories with circular avatars, full-width hero banners, and "New Arrivals" sections.
-   **Product Discovery:** Advanced filtering, sorting, and search with suggestions.
-   **Product Details:** Full-screen image galleries, size/color variant selection with real-time validation, and stock checking.

### **2. "Legendary" Review System**
-   **Interactive UI:** Custom-built bottom sheet for adding reviews with animated Gold Stars.
-   **Smart Logic:**
    -   Users can only review a product *once*.
    -   Users can *delete* their own reviews.
    -   Real-time updates without refreshing the page.

### **3. Smart Cart & Wishlist**
-   **Cart:**
    -   Swipe-to-delete functionality.
    -   Real-time price calculation (Subtotal, Shipping, Total).
    -   Coupon code application.
    -   Stocks reserved upon checkout.
-   **Wishlist:**
    -   Cloud-synced with user account (persists across devices).
    -   Instant "Heart" toggle on product cards.

### **4. Secure Authentication & Profile**
-   **Auth:** JWT-based Login and Registration.
-   **Profile:** Manage personal details, view order history, tracking, and save addresses.
-   **Admins:** Special Admin Dashboard to manage products, images (Drag & Drop), and orders.

---

## 📂 Project Structure

```
lib/
├── core/                # Shared utilities, themes, constants, widgets
├── features/            # Business feature modules
│   ├── auth/            # Login, Signup
│   ├── cart/            # Cart Bloc, Services, Screens
│   ├── home/            # Home Banner, Product Lists
│   ├── products/        # Product Details, Reviews, Search
│   ├── reviews/         # Review Logic & UI
│   ├── wishlist/        # Wishlist Logic
│   └── ...
├── main.dart            # App Entry Point & Providers
```

---

## 🛠️ Setup & Running Guide

### **1. Backend (Server)**
You have two options to run the backend:

*   **Option A: Live Server (Recommended)**
    *   The app is pre-configured to use the live Vercel server (`https://hawsnibackend.vercel.app`).
    *   No action needed.

*   **Option B: Local Server (For Development)**
    1.  Open terminal: `cd hawsni_backend`
    2.  Run: `npm run dev` (Starts on port 5000).
    3.  **Important:** Update `lib/core/config/dev_config.dart` with your IP (e.g., `10.0.2.2` for Emulator).

### **2. Frontend (Mobile App)**
1.  **Dependencies:** Run `flutter pub get`.
2.  **Configuration:** Open `lib/main.dart` and check line 20-21:
    ```dart
    // Use ProdConfig() for Live Server (Default)
    // Use DevConfig() for Local Server
    AppConfig config = ProdConfig(); 
    ApiService.initialize(config);
    ```
3.  **Run:** Press `F5` or run `flutter run`.

---

## 🔮 Future Roadmap
-   [ ] Payment Gateway Integration (Stripe/PayPal).
-   [ ] Push Notifications (Firebase).
-   [ ] Dark Mode Toggle.

---

**Developed with ❤️ by Hawsni Team**
