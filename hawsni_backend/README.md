# 🦅 hwasi Backend

This is the server-side application for the hwasi E-Commerce App. It provides the REST API that the Flutter app communicates with.

## 🛠️ Tech Stack
-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** Supabase (PostgreSQL)
-   **Authentication:** JWT (JSON Web Tokens)
-   **Image Storage:** Supabase Storage
-   **Hosting:** Vercel

---

## 📂 Project Structure

```
hwasi_backend/
├── config/             # Configuration (Supabase, DB)
├── controllers/        # Logic for handling requests
│   ├── api/            # API Controllers (used by Mobile App)
│   └── admin/          # Admin Dashboard Controllers
├── routes/             # API Route Definitions
│   ├── products.js     # /api/products
│   ├── auth.js         # /api/auth
│   └── ...
├── services/           # Business Logic & DB Queries
├── models/             # Database Models (Legacy/Reference)
└── server.js           # Entry Point
```

---

## 🚀 How to Run Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Server:**
    ```bash
    npm run dev
    ```
    -   Runs on `http://localhost:5000`.
    -   **Note:** If you face `fetch failed` errors (Node v18+ issues), we have included a fix. Ensure you use `npm run dev` and not just `node server.js`.

3.  **Environment Variables (`.env`):**
    Ensure you have a `.env` file with:
    -   `SUPABASE_URL`
    -   `SUPABASE_ANON_KEY`
    -   `SUPABASE_SERVICE_ROLE_KEY`
    -   `JWT_SECRET`

---

## 🌐 Deployment (Vercel)

The backend is configured to be deployed on **Vercel**.

1.  Install Vercel CLI: `npm i -g vercel`
2.  Deploy: `vercel --prod`
3.  **Important:** Add the `.env` variables in the Vercel Project Settings > Environment Variables.

---

## 🔌 Key API Endpoints

-   `GET /api/products` - List all products
-   `GET /api/products/featured` - Featured carousel products
-   `POST /api/auth/login` - User login
-   `POST /api/auth/register` - New user signup
-   `GET /api/cart` - Get user cart
-   `POST /api/orders` - Place a new order

---

**© 2025 hwasi Team**
