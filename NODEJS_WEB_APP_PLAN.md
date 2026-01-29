# 🌐 Hawsni Web App - Node.js Build Plan

This document outlines the plan to build a **new web version** of Hawsni using **Node.js** and a modern frontend framework (React/Next.js).

---

## 🎯 Goal

Create a full-featured e-commerce web application that:
1.  **Reuses the existing Hawsni Backend API** (`hawsni_backend/`).
2.  Has a modern, responsive UI matching the mobile app's "Legendary" design.
3.  Supports all existing features: Products, Cart, Wishlist, Auth, VTO.

---

## 🛠️ Recommended Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 14 (App Router) | SSR, SEO, API Routes, Fast |
| **Styling** | Tailwind CSS | Utility-first, matches mobile design |
| **State** | Zustand or React Context | Simple, lightweight |
| **API** | Existing Express.js Backend | Already deployed on Vercel |
| **Auth** | JWT (same as mobile) | Consistent with current system |
| **Deployment** | Vercel | Same as backend, easy integration |

---

## 📂 Proposed Project Structure

```
hawsni-web/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home page
│   ├── products/
│   │   ├── page.tsx        # Product listing
│   │   └── [id]/page.tsx   # Product detail
│   ├── cart/page.tsx       # Cart
│   ├── checkout/page.tsx   # Checkout
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── profile/page.tsx
├── components/             # Reusable UI components
│   ├── ProductCard.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── CartSidebar.tsx
│   └── VTOModal.tsx        # Virtual Try-On
├── lib/                    # Utilities
│   ├── api.ts              # API client (fetch wrapper)
│   └── auth.ts             # JWT handling
├── styles/
│   └── globals.css         # Tailwind imports
├── public/                 # Static assets
└── package.json
```

---

## 🚀 Implementation Steps

### Phase 1: Project Setup
1.  Create Next.js project:
    ```bash
    npx create-next-app@latest hawsni-web --typescript --tailwind --app
    ```
2.  Configure Tailwind with custom Hawsni colors (Green theme).
3.  Set up API base URL pointing to existing backend.

### Phase 2: Core Features
| Feature | Priority | Complexity |
|---------|----------|------------|
| Home Page (Products Grid) | 🔴 High | Medium |
| Product Detail Page | 🔴 High | Medium |
| Cart (Add/Remove/Checkout) | 🔴 High | High |
| User Auth (Login/Signup) | 🔴 High | Medium |
| Wishlist | 🟡 Medium | Low |
| Search & Filters | 🟡 Medium | Medium |
| VTO (Virtual Try-On) | 🟢 Low | High |

### Phase 3: Polish & Deploy
1.  Responsive design for mobile/tablet/desktop.
2.  RTL (Arabic) support.
3.  SEO optimization (meta tags, sitemap).
4.  Deploy to Vercel.

---

## 🎨 UI Components Mapping

| Mobile (Flutter) | Web (React) |
|------------------|-------------|
| `ProductCard` widget | `<ProductCard />` component |
| `BottomNavigationBar` | `<Header />` with nav links |
| `SliverAppBar` | Sticky `<Header />` |
| Floating Bottom Bar | Fixed bottom `<AddToCartBar />` |
| BLoC State | Zustand Store / React Context |

---

## 🔌 API Endpoints (Already Available)

The existing backend provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List all products |
| `/api/products/:id` | GET | Product details |
| `/api/categories` | GET | List categories |
| `/api/cart` | GET/POST/DELETE | Cart operations |
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/wishlist` | GET/POST/DELETE | Wishlist operations |
| `/api/vto/generate` | POST | VTO image generation |

---

## ⏱️ Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Setup & Home | 2-3 days | Basic home page with products |
| Product & Cart | 3-4 days | Full shopping flow |
| Auth & Profile | 2 days | Login, signup, profile |
| Polish & Deploy | 2-3 days | RTL, responsive, SEO |
| **Total** | **~2 weeks** | Full web app |

---

## ❓ Questions Before Starting

1.  **Domain:** Do you have a domain for the web version?
2.  **Design:** Should it look exactly like the mobile app, or a fresh design?
3.  **VTO:** Should VTO be included in v1, or added later?
4.  **Admin Panel:** Separate admin web panel, or reuse existing?

---

## ✅ Next Steps

1.  **Approve this plan** or suggest changes.
2.  I will create the Next.js project structure.
3.  Start implementing Phase 1 (Home + Products).

---

*Let me know if you want me to start building!* 🚀
