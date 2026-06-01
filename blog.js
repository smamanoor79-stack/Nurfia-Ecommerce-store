import blogs from './api/blogs.json';

// Blog listing
const grid = document.getElementById('blogListingGrid');
if (grid) {
  blogs.forEach(blog => {
    grid.innerHTML += `
      <a href="blog-detail.html?slug=${blog.slug}" class="blog-list-card">
        <div class="blog-list-img">
          <img src="${blog.image}" alt="${blog.title}" />
        </div>
        <div class="blog-list-info">
          <h2 class="blog-list-title">${blog.title}</h2>
          <p class="blog-list-excerpt">${blog.excerpt || ''}</p>
          <span class="blog-list-readmore">READ MORE</span>
          <p class="blog-list-meta">${blog.date} &nbsp;|&nbsp; ${blog.category}</p>
        </div>
      </a>
    `;
  });
}

// Sidebar recent posts
const sidebarEl = document.getElementById('sidebarRecentPosts');
if (sidebarEl) {
  blogs.slice(0, 3).forEach(post => {
    sidebarEl.innerHTML += `
      <a href="blog-detail.html?slug=${post.slug}" class="sidebar-post">
        <img src="${post.image}" alt="${post.title}" />
        <div>
          <p class="sidebar-post-title">${post.title}</p>
          <p class="sidebar-post-date">${post.date}</p>
        </div>
      </a>
    `;
  });
}