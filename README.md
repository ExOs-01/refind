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

