// ===== CONTACT FORM =====
document.getElementById('sendBtn').addEventListener('click', () => {
  const name    = document.getElementById('contactName').value.trim();
  const email   = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  const success = document.getElementById('formSuccess');

  if (!name || !email || !subject) {
    alert('Please fill in all required fields.');
    return;
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  // Show success message
  success.classList.add('show');

  // Reset form
  document.getElementById('contactName').value    = '';
  document.getElementById('contactEmail').value   = '';
  document.getElementById('contactSubject').value = '';
  document.getElementById('contactMessage').value = '';

  // Hide after 4 seconds
  setTimeout(() => success.classList.remove('show'), 4000);
});