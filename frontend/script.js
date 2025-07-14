let accessExpiry = null;
let refreshExpiry = null;
let countdownInterval = null;

function logStatus(msg) {
  console.log('[LOG]', msg);
  document.getElementById('status').textContent = msg;
}

function startTimers() {
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    const now = new Date();
    const a = Math.max(0, Math.floor((new Date(accessExpiry) - now) / 1000));
    const r = Math.max(0, Math.floor((new Date(refreshExpiry) - now) / 1000));
    document.getElementById('access-timer').textContent = `Access: ${a}s`;
    document.getElementById('refresh-timer').textContent = `Refresh: ${r}s`;
    if (a === 0) console.warn('[Token] Access expired');
    if (r === 0) console.warn('[Token] Refresh expired');
  }, 1000);
}

// 🔐 Get CSRF token from cookie
function getCSRFToken() {
  const value = document.cookie.split('; ').find(row => row.startsWith('csrf_token='));
  return value ? value.split('=')[1] : null;
}

// 📦 Common headers for protected requests
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-csrf-token': getCSRFToken()
  };
}

// 🚪 Login function
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch('https://localhost:3007/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    Swal.fire('Login Failed', data.error, 'error');
    return;
  }

  accessExpiry = data.accessExpiresAt;
  refreshExpiry = data.refreshExpiresAt;
  startTimers();

  Swal.fire('Login Successful', '', 'success');
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'block';
  getProducts();
}

// ♻️ Refresh access token
async function refreshToken() {
  const res = await fetch('https://localhost:3007/refresh', {
    method: 'POST',
    credentials: 'include'
  });

  const data = await res.json();
  if (!res.ok) {
    Swal.fire('Session Expired', 'Please log in again.', 'info');
    logout();
    return false;
  }

  accessExpiry = data.accessExpiresAt;
  startTimers();
  console.log('[Token] Access token refreshed');
  return true;
}

// 📥 Get products
async function getProducts() {
  const res = await fetch('https://localhost:3007/products', {
    method: 'GET',
    credentials: 'include'
  });

  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshToken();
    if (refreshed) return getProducts();
    return;
  }

  const products = await res.json();
  const list = document.getElementById('product-list');
  list.innerHTML = '';
  products.forEach(p => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.textContent = `${p.name} - $${p.price}`;

    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-danger';
    btn.textContent = 'Delete';
    btn.addEventListener('click', () => deleteProduct(p.id));

    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ➕ Add product
async function addProduct() {
  const name = document.getElementById('product-name').value;
  const price = document.getElementById('product-price').value;

  const res = await fetch('https://localhost:3007/products', {
    method: 'POST',
    credentials: 'include',
    headers: getHeaders(),
    body: JSON.stringify({ name, price })
  });

  if (!res.ok) {
    const refreshed = await refreshToken();
    if (refreshed) return addProduct();
    return;
  }

  Swal.fire('Product Added', '', 'success');
  document.getElementById('product-name').value = '';
  document.getElementById('product-price').value = '';
  getProducts();
}

// 🗑️ Delete product
async function deleteProduct(id) {
  const res = await fetch(`https://localhost:3007/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getHeaders()
  });

  if (!res.ok) {
    const refreshed = await refreshToken();
    if (refreshed) return deleteProduct(id);
    return;
  }

  Swal.fire('Deleted', 'Product has been removed.', 'success');
  getProducts();
}

// 🚪 Logout
async function logout() {
  await fetch('https://localhost:3007/logout', {
    method: 'POST',
    credentials: 'include'
  });

  clearInterval(countdownInterval);
  Swal.fire('Logged Out', '', 'info');
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('app-section').style.display = 'none';
  document.getElementById('product-list').innerHTML = '';
  logStatus('Session cleared');
}

// 📦 Bind UI events
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn')?.addEventListener('click', login);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
  document.getElementById('addProductBtn')?.addEventListener('click', addProduct);
});
