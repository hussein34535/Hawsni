# 🛍️ hwasi Project - Comprehensive Guide

Welcome to the **hwasi** project documentation. This file provides a complete overview of the application, its architecture, key features (including the new AI Virtual Try-On), and how to maintain it.

---

## 🌟 Project Overview

**hwasi** is a high-end e-commerce mobile application built with **Flutter**. It differentiates itself with:
1.  **"Legendary" UI Design:** Custom animations, floating UI elements, and a premium "Aurora" aesthetic.
2.  **AI Virtual Try-On (VTO):** Integrated AI feature allowing users to try clothes on their own photos.
3.  **Clean Architecture:** Built for scalability using the BLoC pattern.

---

## 🚀 Key Features

### 1. 🤖 AI Virtual Try-On (New!)
*   **Path:** `lib/features/vto/`
*   **Functionality:** Allows users to upload a photo of themselves and a clothing item to see how it looks.
*   **Tech:** Uses **Replicate API** (IDM-VTON model) for image generation.
*   **UI:** 
    *   **Responsive Screen:** Automatically adjusts to image aspect ratios.
    *   **Interactive Viewer:** Zoom/Pan results.
    *   **Polling System:** Real-time status updates (Processing -> Succeeded/Failed).

### 2. 🎨 "Legendary" UI Components
*   **Floating Bottom Bar:**
    *   **Location:** `ProductDetailScreen`
    *   **Design:** A floating glass-morphism bar containing the Price (Green), "Add to Cart" (Black Pill), and "Magic VTO" button (Purple/Pink Gradient).
*   **Product Cards:**
    *   **Design:** Clean, minimalist cards with no clutter.
    *   **Logic:** Favorite heart icon appears *only* when an item is liked (transparent & subtle).
    *   **Smart Typography:** No decimal prices (e.g., "$120" instead of "$120.00") and standard font weights.

### 3. ⭐ Advanced Review System
*   **Path:** `lib/features/reviews/`
*   **Features:**
    *   One review per user per product.
    *   Animated "Star Rain" effect upon submission.
    *   Ability to delete own reviews.

### 4. 🛒 Cart & Checkout
*   **Cart:** Real-time total calculation, swipe-to-dismiss items.
*   **Navigation:** Accessible via the main bottom nav or product screens.

---

## 📂 Project Structure (Map)

A quick guide to where everything is:

```text
lib/
├── core/                   # Global styles (AppTheme), utils, widgets
├── features/
│   ├── home/               # Home screen, Hero Banners, Product Listings
│   ├── products/           # Product Details, Product Card, Services
│   ├── vto/                # Virtual Try-On logic & UI (The AI Logic)
│   ├── cart/               # Cart Bloc & Screens
│   ├── reviews/            # Rating & Review Logic
│   └── ...
├── l10n/                   # Arabic/English Translations (.arb files)
└── main.dart               # App Entry Point
```

---

## 🛠️ Recent Changes & Changelog

### **Version 2.0 - "The AI Update"**
*   ✅ **Added VTO:** Integrated Replicate API for Virtual Try-On.
*   ✅ **UI Refinement:**
    *   **Bottom Bar:** Redesigned to be "Legendary" (Floating, Green/Black theme).
    *   **Product Card:** Cleaned up icons, removed persistent heart buttons (now conditional).
    *   **Typography:** Removed italic numbers, fixed price formatting.
    *   **Navigation:** Added explicit "Back" buttons to category screens.

---

## 🖥️ How to Run

### **Prerequisites**
*   Flutter SDK installed.
*   Emulator or Physical Device connected.

### **Running the App**
1.  **Get Dependencies:**
    ```bash
    flutter pub get
    ```
2.  **Run (Debug Mode):**
    ```bash
    flutter run
    ```
    *(Note: If changes don't appear, use Hot Restart `R` or fully stop and restart).*

### **Backend Note**
The app connects to a live backend (`hwasibackend.vercel.app`). No local backend setup is required unless you are developing server-side features.

---

## 💡 Troubleshooting Common Issues

*   **"Nothing Changed on Screen":**
    *   Flutter's "Hot Reload" sometimes doesn't catch deep widget tree changes (like structural changes to `Positioned` widgets).
    *   **Fix:** Stop the app and run it again (`flutter run`).

*   **"RenderFlex Overflow":**
    *   Usually happens on small screens if content is fixed size.
    *   **Fix:** We recently fixed the VTO screen by using `Expanded` widgets.

---

*Documentation created for hwasi Team.*
