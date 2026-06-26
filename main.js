import { loginUser, registerUser, logoutUser, getUser, isLoggedIn, getAllProducts, getBackendCart, getImageUrl } from './api.js';
import { syncCartToBackend } from './cart.js';
import { fetchAndUpdateWishlistBadge, syncWishlistToBackend } from './wishlist.js';
import blogs from './api/blogs.json';
import { renderProducts } from './renderProducts';
import { filterProducts } from './filterProducts';
import './cart.js';

// ===== HEADER SCROLL =====
const header = document.getElementById("header");
if (header) {
  const hasHero = document.querySelector('.hero');
  if (!hasHero) header.classList.add("scrolled");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) header.classList.add("scrolled");
    else if (hasHero) header.classList.remove("scrolled");
  });
}

// ===== SLIDER =====
function initSlider(section, productsGrid, sliderDots, filterBtns, products) {
  const cardsPerSlide = 4;
  let currentSlide = 0;

  renderProducts(products, productsGrid);
  setTimeout(() => createDots(), 100);

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filtered = filterProducts(products, btn.dataset.filter);
      renderProducts(filtered, productsGrid);
      currentSlide = 0;
      setTimeout(() => { createDots(); moveSlider(); }, 100);
    });
  });

  function createDots() {
    const totalCards = productsGrid.querySelectorAll(".product-card").length;
    const totalSlides = Math.ceil(totalCards / cardsPerSlide);
    sliderDots.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => { currentSlide = i; moveSlider(); });
      sliderDots.appendChild(dot);
    }
  }

  function moveSlider() {
    const wrapperWidth = productsGrid.parentElement.offsetWidth;
    productsGrid.style.transform = `translateX(-${currentSlide * wrapperWidth}px)`;
    sliderDots.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
    });
  }

  window.addEventListener("resize", () => { currentSlide = 0; moveSlider(); });
}

// ===== INIT HOME SLIDERS =====
async function initHomePage() {
  try {
    const products = await getAllProducts();
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const allSections = document.querySelectorAll(".featured-section");
    allSections.forEach((section) => {
      const productsGrid = section.querySelector(".products-grid");
      const sliderDots = section.querySelector(".slider-dots");
      const filterBtns = section.querySelectorAll(".filter-btn");
      if (productsGrid && sliderDots) {
        initSlider(section, productsGrid, sliderDots, filterBtns, products);
      }
    });
  } catch (err) {
    console.error('Home products load nahi hue:', err);
  }
}
initHomePage();

// ===== TESTIMONIAL SLIDER =====
const track = document.getElementById("testimonialTrack");
const prevBtn = document.getElementById("testimonialPrev");
const nextBtn = document.getElementById("testimonialNext");
const slides = document.querySelectorAll(".testimonial-slide");

if (track && prevBtn && nextBtn && slides.length > 0) {
  let current = 0;
  const total = slides.length;
  const moveTestimonial = (index) => {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
  };
  nextBtn.addEventListener("click", () => moveTestimonial(current + 1));
  prevBtn.addEventListener("click", () => moveTestimonial(current - 1));
  setInterval(() => moveTestimonial(current + 1), 3000);
}

// ===== BLOG SECTION =====
const blogGrid = document.getElementById('blogGrid');
if (blogGrid && blogs && blogs.length > 0) {
  blogs.slice(0, 4).forEach(blog => {
    blogGrid.innerHTML += `
      <a href="blog-detail.html?slug=${blog.slug}" class="blog-listing-card">
        <div class="blog-listing-img">
          <img src="${blog.image}" alt="${blog.title}" />
        </div>
        <p class="blog-listing-category">${blog.category}</p>
        <h2 class="blog-listing-title">${blog.title}</h2>
        <p class="blog-listing-meta">by ${blog.author} &nbsp; ${blog.date}</p>
      </a>
    `;
  });
}

// ===== SEARCH =====
let allProducts = [];

async function loadProducts() {
  try {
    allProducts = await getAllProducts();
  } catch (err) {
    console.error('Could not load products:', err);
  }
}

const searchTrigger = document.getElementById('searchTrigger');
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchClose = document.getElementById('searchClose');
const suggestions = document.getElementById('searchSuggestions');

if (searchTrigger) {
  loadProducts();
  searchTrigger.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    setTimeout(() => searchInput.focus(), 300);
  });
  searchClose.addEventListener('click', closeSearch);
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 1) { suggestions.innerHTML = ''; return; }
    const results = allProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.subCategory.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    ).slice(0, 6);
    renderSuggestions(results, query);
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && searchOverlay) closeSearch();
});

function closeSearch() {
  searchOverlay.classList.remove('active');
  searchInput.value = '';
  suggestions.innerHTML = '';
}

function renderSuggestions(results, query) {
  if (results.length === 0) {
    suggestions.innerHTML = `<p class="suggestion-no-results">No products found for "<strong>${escapeHtml(query)}</strong>"</p>`;
    return;
  }
  suggestions.innerHTML = results.map(product => {
    const highlightedName = highlightMatch(product.name, query);
    const hasSale = product.salePrice && product.salePrice < product.price;
    return `
      <div class="suggestion-item" data-id="${product._id}" onclick="goToProduct('${product._id}')">
        <div class="suggestion-left">
          ${product.image && product.image.endsWith('.mp4')
        ? `<video class="suggestion-thumb" src="${getImageUrl(product.image)}" muted preload="metadata"></video>`
        : `<img class="suggestion-thumb" src="${getImageUrl(product.image)}" alt="${escapeHtml(product.name)}" />`
      }
          <span class="suggestion-name">${highlightedName}</span>
        </div>
        <div class="suggestion-prices">
          ${hasSale
        ? `<span class="suggestion-original">$${product.price.toFixed(2)}</span>
               <span class="suggestion-sale">$${product.salePrice.toFixed(2)}</span>`
        : `<span class="suggestion-sale">$${product.price.toFixed(2)}</span>`
      }
        </div>
      </div>
    `;
  }).join('');
}

window.goToProduct = function (id) {
  closeSearch();
  window.location.href = `product.html?id=${id}`;
};

function highlightMatch(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== AUTH MODAL =====
const authModal = document.getElementById('authModal');
const authOverlay = document.getElementById('authModalOverlay');
const authModalClose = document.getElementById('authModalClose');

const userIconEl = document.querySelector('.fa-regular.fa-user');
if (userIconEl) {
  const trigger = userIconEl.closest('a, button, span') || userIconEl;
  trigger.style.cursor = 'pointer';
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    openAuthModal(isLoggedIn() ? 'profile' : 'login');
  });
}

function openAuthModal(tab = 'login') {
  if (!authModal) return;
  authModal.classList.add('active');
  authOverlay.classList.add('active');
  document.body.classList.add('modal-open');
  switchTab(tab);
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.remove('active');
  authOverlay.classList.remove('active');
  document.body.classList.remove('modal-open');
}

authModalClose?.addEventListener('click', closeAuthModal);
authOverlay?.addEventListener('click', closeAuthModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAuthModal();
});

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});
document.querySelectorAll('.auth-switch-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(link.dataset.target);
  });
});

function switchTab(tabName) {
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.auth-panel').forEach(p => {
    p.classList.toggle('active', p.id === tabName + 'Panel');
  });
}

document.getElementById('registerBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('registerName')?.value.trim();
  const email = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value;
  const btn = document.getElementById('registerBtn');
  clearAuthMessages('registerPanel');
  if (!name || !email || !password) { showAuthError('registerPanel', 'Please fill in all fields.'); return; }
  if (password.length < 6) { showAuthError('registerPanel', 'Password must be at least 6 characters.'); return; }
  btn.disabled = true; btn.textContent = 'Registering...';
  try {
    const user = await registerUser(name, email, password);
    showAuthSuccess('registerPanel', `Welcome, ${user.name}! Account created.`);
    setTimeout(async () => {
      clearAuthMessages('registerPanel');
      updateUserIcon();

      // ✅ Checkout page par ho to reload karo taake init() fresh chale
      if (window.location.pathname.includes('checkout.html')) {
        window.location.reload();
        return;
      }

      switchTab('profile');
      // ✅ Register ke baad bhi sync karo
      await syncCartToBackend();
      await syncWishlistToBackend();
      fetchAndUpdateWishlistBadge();
    }, 1000);
  } catch (err) {
    showAuthError('registerPanel', err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'REGISTER';
  }
});

document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const btn = document.getElementById('loginBtn');
  clearAuthMessages('loginPanel');
  if (!email || !password) { showAuthError('loginPanel', 'Please fill in all fields.'); return; }
  btn.disabled = true; btn.textContent = 'Logging in...';
  try {
    const user = await loginUser(email, password);
    showAuthSuccess('loginPanel', `Welcome back, ${user.name}!`);
    setTimeout(async () => {
      clearAuthMessages('loginPanel');
      updateUserIcon();
      closeAuthModal();

      //  Checkout page par ho to reload karo taake init() fresh chale
      if (window.location.pathname.includes('checkout.html')) {
        window.location.reload();
        return;
      }

      //  Login ke baad localStorage → backend sync
      await syncCartToBackend();
      await syncWishlistToBackend();
      fetchAndUpdateWishlistBadge();
      getBackendCart().then(data => {
        const count = (data.cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
        document.querySelectorAll('.cart-count:not(.wishlist-count)').forEach(b => b.textContent = count);
      }).catch(() => { });
    }, 1000);
  } catch (err) {
    showAuthError('loginPanel', err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'LOG IN';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  logoutUser();
  updateUserIcon();
  switchTab('login');
  closeAuthModal();
  // ✅ Logout pe badges reset — localStorage counts dikhao
  const localCart = JSON.parse(localStorage.getItem('nurfia_cart') || '[]');
  const localWishlist = JSON.parse(localStorage.getItem('nurfia_wishlist') || '[]');
  const cartCount = localCart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('.cart-count:not(.wishlist-count)').forEach(b => b.textContent = cartCount);
  document.querySelectorAll('.wishlist-count').forEach(b => b.textContent = localWishlist.length);
});

function updateUserIcon() {
  const user = getUser();
  const userIcon = document.querySelector('.fa-regular.fa-user');
  if (!userIcon) return;
  if (user) {
    userIcon.setAttribute('title', `Hi, ${user.name}`);
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileAvatar) profileAvatar.textContent = user.name.charAt(0).toUpperCase();
  } else {
    userIcon.removeAttribute('title');
  }

  // Orders icon sirf logged in users ke liye dikhao
  const ordersLink = document.getElementById('ordersIconLink');
  if (ordersLink) {
    ordersLink.style.display = user ? 'inline-block' : 'none';
  }
}
updateUserIcon();

// ===== BADGES ON PAGE LOAD =====
if (isLoggedIn()) {
  // Logged in — backend se badges
  fetchAndUpdateWishlistBadge();
  getBackendCart().then(data => {
    const count = (data.cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('.cart-count:not(.wishlist-count)').forEach(b => b.textContent = count);
  }).catch(() => { });
} else {
  // Guest — localStorage se badges
  const localCart = JSON.parse(localStorage.getItem('nurfia_cart') || '[]');
  const localWishlist = JSON.parse(localStorage.getItem('nurfia_wishlist') || '[]');
  const cartCount = localCart.reduce((sum, item) => sum + (item.qty || 1), 0);
  document.querySelectorAll('.cart-count:not(.wishlist-count)').forEach(b => b.textContent = cartCount);
  document.querySelectorAll('.wishlist-count').forEach(b => b.textContent = localWishlist.length);
}

function showAuthError(panelId, message) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const el = document.createElement('p');
  el.className = 'auth-message auth-error';
  el.textContent = message;
  panel.insertBefore(el, panel.querySelector('.auth-field'));
}
function showAuthSuccess(panelId, message) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const el = document.createElement('p');
  el.className = 'auth-message auth-success';
  el.textContent = message;
  panel.insertBefore(el, panel.querySelector('.auth-field'));
}
function clearAuthMessages(panelId) {
  document.getElementById(panelId)?.querySelectorAll('.auth-message').forEach(el => el.remove());
}

// ===== SIDE MENU =====
const sideMenu = document.getElementById('sideMenu');
const sideMenuOverlay = document.getElementById('sideMenuOverlay');
const sideMenuClose = document.getElementById('sideMenuClose');
const menuIcon = document.querySelector('.menu-icon');

function openSideMenu() {
  sideMenu?.classList.add('active');
  sideMenuOverlay?.classList.add('active');
  document.body.classList.add('drawer-open');
}
function closeSideMenu() {
  sideMenu?.classList.remove('active');
  sideMenuOverlay?.classList.remove('active');
  document.body.classList.remove('drawer-open');
}
menuIcon?.addEventListener('click', openSideMenu);
sideMenuClose?.addEventListener('click', closeSideMenu);
sideMenuOverlay?.addEventListener('click', closeSideMenu);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSideMenu();
});