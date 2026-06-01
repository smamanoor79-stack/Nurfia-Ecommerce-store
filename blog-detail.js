import blogs from './api/blogs.json';

const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');
const blog = blogs.find(b => b.slug === slug);

if (!blog) {
  document.querySelector('.detail-main').innerHTML = '<p style="padding:60px">Blog not found.</p>';
} else {
  document.title = `${blog.title} – Nurfia`;
  document.getElementById('detailTitle').textContent = blog.title;
  document.getElementById('detailDate').textContent = blog.date;
  document.getElementById('detailCategory').textContent = blog.category;
  document.getElementById('detailAuthor').textContent = blog.author;
  document.getElementById('detailHeroImg').src = blog.image;
  document.getElementById('detailHeroImg').alt = blog.title;

  // Content blocks
  const contentEl = document.getElementById('detailContent');
  blog.content.forEach(block => {
    if (block.type === 'paragraph') {
      contentEl.innerHTML += `<p>${block.text}</p>`;
    } else if (block.type === 'heading') {
      contentEl.innerHTML += `<h2>${block.text}</h2>`;
    } else if (block.type === 'image') {
      contentEl.innerHTML += `<img src="${block.src}" alt="${block.alt}" class="content-img" />`;
    }
  });

  // Comments
  if (blog.comments && blog.comments.length > 0) {
    const commentsEl = document.getElementById('commentsSection');
    commentsEl.innerHTML = `<h3 class="comments-title">${blog.comments.length} thoughts on "${blog.title}"</h3>`;
    blog.comments.forEach(c => {
      commentsEl.innerHTML += `
        <div class="comment">
          <img src="${c.avatar || '/images/testimonial-01.webp'}" alt="${c.name}" class="comment-avatar" />
          <div class="comment-body">
            <div class="comment-header">
              <strong>${c.name}</strong>
              <span>${c.date}</span>
            </div>
            <p>${c.text}</p>
            <a href="#" class="comment-reply">Reply</a>
          </div>
        </div>
      `;
    });
  }

  // Sidebar posts
  const others = blogs.filter(b => b.slug !== slug).slice(0, 3);
  const sidebarEl = document.getElementById('sidebarPosts');
  others.forEach(post => {
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