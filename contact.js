import { BASE_URL } from './api.js';

// ===== CONTACT FORM =====
document.getElementById('sendBtn').addEventListener('click', async () => {
  const nameInput    = document.getElementById('contactName');
  const emailInput   = document.getElementById('contactEmail');
  const subjectInput = document.getElementById('contactSubject');
  const messageInput = document.getElementById('contactMessage');
  const success      = document.getElementById('formSuccess');
  const sendBtn       = document.getElementById('sendBtn');

  const name    = nameInput.value.trim();
  const email   = emailInput.value.trim();
  const subject = subjectInput.value.trim();
  const message = messageInput.value.trim();

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

  sendBtn.disabled = true;
  sendBtn.textContent = 'SENDING...';

  try {
    // ✅ Backend ko message bhejo
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send message.');
    }

    // Show success message
    success.classList.add('show');

    // Reset form
    nameInput.value    = '';
    emailInput.value   = '';
    subjectInput.value = '';
    messageInput.value = '';

    // Hide after 4 seconds
    setTimeout(() => success.classList.remove('show'), 4000);

  } catch (err) {
    console.error('Contact form error:', err);
    alert(err.message || 'Something went wrong. Please try again.');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'SEND MESSAGE';
  }
});