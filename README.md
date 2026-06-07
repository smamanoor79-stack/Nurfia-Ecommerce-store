# 🛍️ Nurfia — Fashion E-Commerce Frontend

A modern, multi-page fashion e-commerce website built with HTML, CSS, and JavaScript.

---

## 🚀 Features

- **Multi-page layout** — Home, Shop, Men, Women, Product Detail, Cart, Wishlist, Checkout, Blog, Contact
- **Dynamic product rendering** — Products loaded from a local JSON API (`api/products.json`)
- **Shopping cart** — Add, remove, and update quantities with persistent state
- **Wishlist** — Save favourite items across sessions
- **Filter & search** — Filter products by category on shop pages
- **Responsive design** — Mobile-friendly layout across all pages
- **Blog section** — Blog listing and detail pages
- **Contact form** — Styled contact page with form validation
- **Custom fonts** — Cormorant & Instrument Sans via Google Fonts
- **Icons** — Font Awesome 6.5 icon library

---

## 🗂️ Project Structure

```
Nurfia/
├── api/
│   ├── products.json        # Product data source
│   └── blogs.json           # Blog data source
├── public/                  # Static assets
├── dist/                    # Build output
├── index.html               # Homepage
├── shop.html                # All products shop page
├── men.html                 # Men's category page
├── women.html               # Women's shop page
├── product.html             # Single product detail page
├── cart.html                # Shopping cart
├── wishlist.html            # Wishlist page
├── checkout.html            # Checkout page
├── blog.html                # Blog listing
├── blog-detail.html         # Single blog post
├── contact.html             # Contact page
├── style.css                # Global styles
├── cart.css                 # Cart page styles
├── shop.css                 # Shop page styles
├── product.css              # Product page styles
├── checkout.css             # Checkout styles
├── contact.css              # Contact page styles
├── main.js                  # Core JS logic
├── cart.js                  # Cart functionality
├── shop.js                  # Shop & filter logic
├── filterProducts.js        # Product filtering utilities
├── renderProducts.js        # Product rendering helpers
├── wishlist.js              # Wishlist logic
├── men.js                   # Men's page logic
├── women.js                 # Women's page logic
├── product.js               # Product detail logic
├── contact.js               # Contact form handling
├── nurfia.test.js           # Vitest test suite
├── package.json
└── package-lock.json
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure & markup |
| CSS3 | Styling & responsive layout |
| Vanilla JavaScript | Interactivity & DOM manipulation |
| JSON | Local product & blog data |
| Font Awesome 6.5 | Icons |
| Google Fonts | Typography (Cormorant, Instrument Sans) |
| Node.js / npm | Dev server (live reload) |
| Vitest | Unit & integration testing |

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/smamanoor79-stack/nurfia.git
cd nurfia
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. Open your browser and visit `http://localhost:3000` (or the port shown in your terminal).

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server with live reload |
| `npm run build` | Build project for production (outputs to `dist/`) |
| `npm test` | Run test suite (55 tests) |

---

## 🧪 Testing

This project includes a comprehensive test suite built with **Vitest**.

| | |
|---|---|
| Test Framework | Vitest + jsdom |
| Total Tests | **55 passing** |

**Coverage includes:**
- ✅ Cart — add, remove, update quantity
- ✅ Wishlist — localStorage persistence
- ✅ Shipping — flat rate & free shipping threshold
- ✅ Integration scenarios
- ✅ Edge cases

```bash
npm test
```

---

## 📄 Pages Overview

| Page | File | Description |
|---|---|---|
| Home | `index.html` | Landing page with hero, featured products |
| Shop | `shop.html` | Full product catalogue with filters |
| Men | `men.html` | Men's category products |
| Women | `women.html` | Women's category products |
| Product | `product.html` | Single product detail & add to cart |
| Cart | `cart.html` | Shopping cart with quantity controls |
| Wishlist | `wishlist.html` | Saved/favourite products |
| Checkout | `checkout.html` | Order summary & checkout form |
| Blog | `blog.html` | Blog post listing |
| Blog Detail | `blog-detail.html` | Individual blog post |
| Contact | `contact.html` | Contact form & info |

---

## 🎨 Design Credit

The visual design and UI layout of this project is inspired by a **premium ThemeForest theme**.
All HTML, CSS, and JavaScript code has been written **from scratch by the author**.

---

## 🤝 Contributing

This is a personal portfolio project. Contributions are not open at this time.

---

## 📝 License

**All Rights Reserved**

This project and its source code are the intellectual property of the author.
No part of this code may be copied, modified, distributed, or used without explicit written permission.

---

## 👤 Author

**Smama Noor** — [GitHub Profile](https://github.com/smamanoor79-stack)

---