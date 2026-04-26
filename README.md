# ReFind — King's College Nepal Lost & Found Portal

A full-stack web application for reporting and finding lost items on the KCN campus.

**Team:** Abishank Rimal, Aashna Mukhia, Prajwal Shrestha  
**Course:** PRG 100 — System Analysis and Design  
**College:** King's College Nepal

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Bootstrap 5, JavaScript |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Storage | Supabase Storage (photos) |
| Hosting | Vercel (frontend + backend) |

---

## Project Structure

```
refind/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── supabase.js            # Supabase client setup
│   ├── schema.sql             # Database schema — run in Supabase
│   ├── package.json
│   ├── .env.example           # Copy this to .env and fill in values
│   ├── middleware/
│   │   └── auth.js            # JWT verify middleware
│   └── routes/
│       ├── auth.js            # POST /register, POST /login
│       ├── items.js           # CRUD for items
│       └── categories.js      # CRUD for categories
└── frontend/
    ├── index.html             # Homepage
    ├── listings.html          # Browse all items with filters
    ├── post-item.html         # Report a lost/found item
    ├── item.html              # Item detail page
    ├── auth.html              # Login / Signup
    ├── myposts.html           # User's own posts
    ├── admin.html             # Admin dashboard
    └── api.js                 # Shared API helper for all pages
```

---

## Setup Instructions

### Step 1 — Supabase setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, name it `refind`, choose a region close to Nepal
3. Once the project is created, go to **SQL Editor** > **New Query**
4. Paste the entire contents of `backend/schema.sql` and click **Run**
5. Go to **Settings** > **API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

### Step 2 — Backend setup

```bash
cd backend
cp .env.example .env
# Open .env and fill in your Supabase credentials and JWT secret
npm install
npm run dev
```

The server starts at `http://localhost:5000`

### Step 3 — Frontend setup

The frontend is plain HTML. You can open it directly:
- Open `frontend/index.html` in your browser, OR
- With the backend running, visit `http://localhost:5000` (backend serves the frontend too)

### Step 4 — Create admin account

After the backend is running, register a normal account first, then run this in **Supabase SQL Editor** to make it admin:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@here.com';
```

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login, get JWT |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/items | No | Get all items (with filters) |
| GET | /api/items/:id | No | Get single item |
| POST | /api/items | Yes | Post new item |
| PATCH | /api/items/:id/status | Yes | Update item status |
| DELETE | /api/items/:id | Admin | Delete item |
| GET | /api/items/user/my-posts | Yes | Get own posts |
| GET | /api/categories | No | Get all categories |
| POST | /api/categories | Admin | Add category |
| DELETE | /api/categories/:id | Admin | Delete category |

---

## Deployment on Vercel

1. Push the project to GitHub
2. Go to [vercel.com](https://vercel.com), import the repo
3. Set **Root Directory** to `backend`
4. Add all environment variables from `.env` in the Vercel dashboard
5. Deploy

---

## Database Tables

| Table | Description |
|-------|-------------|
| user | Registered users (student/admin) |
| item | Lost/found item records |
| post | Links user to item with timestamp |
| category | Item categories (Electronics, Bags, etc.) |
