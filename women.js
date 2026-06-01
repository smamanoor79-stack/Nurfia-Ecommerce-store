import products from './api/products.json';
import { addToCart } from './cart.js';

// ===== WOMEN ONLY =====
const womenProducts = products.filter(p => p.category === 'Women');

// Color name map
const colorNames = {
  '#000000': 'Black', '#FFFFFF': 'White', '#808080': 'Gray',
  '#FF0000': 'Red', '#0000FF': 'Blue', '#90EE90': 'Green',
  '#8B4513': 'Brown', '#FFA500': 'Orange', '#FFD700': 'Yellow',
  '#87CEEB': 'Blue', '#556B2F': 'Green', '#8B008B': 'Purple',
  '#F5DEB3': 'Beige', '#AED6F1': 'Blue', '#FFB6C1': 'Pink',
  '#8B0000': 'Red', '#FFFACD': 'Yellow', '#E8A090': 'Pink'
};

// State
let filtered = [...womenProducts];
let currentPage = 1;
let itemsPerPage = 12;
let activeCategory = 'all';
let activeColors = [];
let activeSizes = [];
let maxPrice = 150;
let sortBy = 'default';

// ===== BUILD FILTERS =====

const subCategories = ['all', ...new Set(womenProducts.map(p => p.subCategory))];
const categoryList = document.getElementById('categoryList');
subCategories.forEach(cat => {
  const li = document.createElement('li');
  const count = cat === 'all'
    ? womenProducts.length
    : womenProducts.filter(p => p.subCategory === cat).length;
  li.innerHTML = `<a href="#" data-cat="${cat}" class="${cat === 'all' ? 'active' : ''}">${cat === 'all' ? 'All' : cat} <span>${count}</span></a>`;
  li.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    activeCategory = cat;
    categoryList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    e.target.classList.add('active');
    currentPage = 1;
    applyFilters();
  });
  categoryList.appendChild(li);
});

const allColors = [...new Set(womenProducts.flatMap(p => p.colors))];
const colorList = document.getElementById('colorList');
allColors.forEach(color => {
  const name = colorNames[color] || color;
  const count = womenProducts.filter(p => p.colors.includes(color)).length;
  const li = document.createElement('li');
  li.innerHTML = `
    <label>
      <input type="checkbox" value="${color}" />
      <span class="color-dot" style="background:${color}; border: 1px solid #ddd"></span>
      ${name} <span>(${count})</span>
    </label>`;
  li.querySelector('input').addEventListener('change', (e) => {
    if (e.target.checked) activeColors.push(color);
    else activeColors = activeColors.filter(c => c !== color);
    currentPage = 1;
    applyFilters();
  });
  colorList.appendChild(li);
});

const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const sizeList = document.getElementById('sizeList');
allSizes.forEach(size => {
  const count = womenProducts.filter(p => p.sizes.includes(size)).length;
  const li = document.createElement('li');
  li.innerHTML = `
    <label>
      <input type="checkbox" value="${size}" />
      ${size} <span>(${count})</span>
    </label>`;
  li.querySelector('input').addEventListener('change', (e) => {
    if (e.target.checked) activeSizes.push(size);
    else activeSizes = activeSizes.filter(s => s !== size);
    currentPage = 1;
    applyFilters();
  });
  sizeList.appendChild(li);
});

const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const womenMaxPrice = Math.ceil(Math.max(...womenProducts.map(p => p.salePrice || p.price)));
priceRange.max = womenMaxPrice;
priceRange.value = womenMaxPrice;
priceValue.textContent = womenMaxPrice;
maxPrice = womenMaxPrice;

priceRange.addEventListener('input', () => {
  priceValue.textContent = priceRange.value;
});
document.getElementById('applyPrice').addEventListener('click', () => {
  maxPrice = parseInt(priceRange.value);
  currentPage = 1;
  applyFilters();
});

document.getElementById('sortSelect').addEventListener('change', (e) => {
  sortBy = e.target.value;
  applyFilters();
});

document.getElementById('itemsSelect').addEventListener('change', (e) => {
  itemsPerPage = parseInt(e.target.value);
  currentPage = 1;
  applyFilters();
});

document.getElementById('gridView').addEventListener('click', () => {
  document.getElementById('shopGrid').classList.remove('list-view');
  document.getElementById('gridView').classList.add('active');
  document.getElementById('listView').classList.remove('active');
});
document.getElementById('listView').addEventListener('click', () => {
  document.getElementById('shopGrid').classList.add('list-view');
  document.getElementById('listView').classList.add('active');
  document.getElementById('gridView').classList.remove('active');
});

// ===== APPLY FILTERS =====
function applyFilters() {
  filtered = womenProducts.filter(p => {
    const catMatch = activeCategory === 'all' || p.subCategory === activeCategory;
    const colorMatch = activeColors.length === 0 || activeColors.some(c => p.colors.includes(c));
    const sizeMatch = activeSizes.length === 0 || activeSizes.some(s => p.sizes.includes(s));
    const priceMatch = (p.salePrice || p.price) <= maxPrice;
    return catMatch && colorMatch && sizeMatch && priceMatch;
  });

  if (sortBy === 'price-low') filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  else if (sortBy === 'price-high') filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
  else if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'discount') filtered.sort((a, b) => b.discount - a.discount);

  renderProducts();
  renderPagination();
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const grid = document.getElementById('shopGrid');
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filtered.slice(start, end);

  document.getElementById('resultCount').textContent =
    `Showing ${start + 1}–${Math.min(end, filtered.length)} of ${filtered.length} results`;

  grid.innerHTML = '';

  paginated.forEach(p => {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.style.cursor = 'pointer'; // Visual pointer update for clickable cards
    
    card.innerHTML = `
      <div class="shop-card-img">
        ${p.discount ? `<span class="shop-badge">${p.discount}%</span>` : ''}
        ${p.video
          ? `<video src="${p.video}" autoplay muted loop playsinline></video>`
          : `<img src="${p.image}" alt="${p.name}" />`
        }
        <div class="shop-card-actions">
          <button class="shop-action-btn shop-wishlist-btn" title="Wishlist"><i class="fa-regular fa-heart"></i></button>
          <button class="shop-action-btn shop-compare-btn" title="Compare"><i class="fa-solid fa-arrow-right-arrow-left"></i></button>
          <button class="shop-action-btn shop-view-btn" title="Quick View"><i class="fa-regular fa-eye"></i></button>
        </div>
        <button class="shop-add-cart">ADD TO CART</button>
      </div>
      <div class="shop-card-info">
        <p class="shop-card-name">${p.name}</p>
        <div class="shop-card-prices">
          <span class="shop-sale-price">$${(p.salePrice || p.price).toFixed(2)}</span>
          ${p.price ? `<span class="shop-original-price">$${p.price.toFixed(2)}</span>` : ''}
        </div>
        <div class="shop-card-rating">
          <span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span>
          <span>(${p.reviews})</span>
        </div>
      </div>
    `;

    // 1. Full Card Redirect Execution
    card.addEventListener('click', () => {
      window.location.href = `product.html?id=${p.id}`;
    });

    // 2. Add To Cart handling with click capture block
    card.querySelector('.shop-add-cart').addEventListener('click', (e) => {
      e.stopPropagation(); 
      addToCart(p.id);
    });

    // 3. Independent Action buttons behavior block
    card.querySelectorAll('.shop-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        // Wishlist element local state toggle logic
        if (btn.classList.contains('shop-wishlist-btn')) {
          const icon = btn.querySelector('i');
          icon.classList.toggle('fa-regular');
          icon.classList.toggle('fa-solid');
          btn.style.color = icon.classList.contains('fa-solid') ? '#e00' : '';
        }
      });
    });

    grid.appendChild(card);
  });
}

// ===== PAGINATION =====
function renderPagination() {
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagination = document.getElementById('shopPagination');

  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} id="prevPage">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">›</button>`;
  pagination.innerHTML = html;

  pagination.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      applyFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; applyFilters(); }
  });
  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; applyFilters(); }
  });
}

// Init
applyFilters();