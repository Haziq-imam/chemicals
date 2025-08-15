// ---------- Config ----------
const CART_KEY = 'chempro.cart.v1';
const currency = n => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;
const qs  = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

// Replace with your WhatsApp number (no +, no spaces)
const businessNumber = '923172912216';

// ---------- State ----------
let PRODUCTS = [];

// ---------- Storage ----------
const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

// ---------- Cart ops ----------
function addToCart(itemId) {
  const cart = loadCart();
  const found = cart.find(i => i.id === itemId);
  if (found) found.qty += 1; else cart.push({ id: itemId, qty: 1 });
  saveCart(cart); renderCart(); renderCartBadges(); openCart();
}
function removeFromCart(itemId) {
  saveCart(loadCart().filter(i => i.id !== itemId));
  renderCart(); renderCartBadges();
}
function updateQty(itemId, qty) {
  const cart = loadCart();
  const it = cart.find(i => i.id === itemId);
  if (!it) return;
  it.qty = Math.max(1, parseInt(qty || 1));
  saveCart(cart); renderCart(); renderCartBadges();
}
function cartTotal() {
  return loadCart().reduce((sum, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return sum + (p?.price || 0) * i.qty;
  }, 0);
}

// ---------- Render ----------
function badgeForCategory(cat) {
  const map = { cleaner:'🧼 Cleaner', acid:'☣️ Acid', disinfectant:'🧴 Disinfectant' };
  return `<span class="rounded-full border border-slate-300 px-2 py-1 text-xs">${map[cat] || 'Product'}</span>`;
}
function renderProducts(list) {
  const grid = qs('#productGrid');
  grid.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl flex flex-col';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}" class="w-full h-44 object-cover" />
      <div class="p-4 flex-1 flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <h4 class="text-lg font-semibold">${p.name}</h4>
          <span class="text-brand-700 font-bold">${currency(p.price)}</span>
        </div>
        <p class="text-sm text-slate-600 mt-1 flex-1">${p.desc}</p>
        <div class="mt-4 flex items-center justify-between">
          <span class="inline-flex items-center gap-1 text-xs text-slate-500">
            ${badgeForCategory(p.category)}
          </span>
          <button data-id="${p.id}" class="addBtn rounded-xl bg-brand-600 text-white px-4 py-2 font-semibold hover:bg-brand-700">Add to Cart</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  qsa('.addBtn').forEach(b => b.addEventListener('click', e => addToCart(e.target.dataset.id)));
}
function renderMSDS() {
  const box = qs('#msdsList');
  box.innerHTML = PRODUCTS.map(p => `
    <a class="rounded-xl border border-slate-300 px-3 py-2 hover:bg-slate-50"
       href="${p.msds}" target="_blank" rel="noopener">${p.name} — MSDS</a>
  `).join('');
}
function renderCart() {
  const cart = loadCart();
  const makeRow = (ci) => {
    const p = PRODUCTS.find(pp => pp.id === ci.id);
    if (!p) return '';
    return `
      <div class="flex items-center gap-3">
        <img src="${p.img}" class="w-14 h-14 rounded-lg object-cover border" alt="${p.name}" />
        <div class="flex-1">
          <div class="font-medium">${p.name}</div>
          <div class="text-sm text-slate-500">${currency(p.price)} each</div>
          <div class="mt-2 inline-flex items-center gap-2">
            <button data-id="${p.id}" class="decQty rounded-lg border px-2">-</button>
            <input data-id="${p.id}" type="number" min="1" value="${ci.qty}" class="qtyInput w-14 rounded-lg border px-2 py-1" />
            <button data-id="${p.id}" class="incQty rounded-lg border px-2">+</button>
            <button data-id="${p.id}" class="removeItem text-red-600 ml-3">Remove</button>
          </div>
        </div>
        <div class="font-semibold">${currency(p.price * ci.qty)}</div>
      </div>`;
  };
  const html = cart.map(makeRow).join('') || '<div class="text-slate-500">Your cart is empty.</div>';
  qs('#cartItems').innerHTML = html;
  qs('#cartItemsDrawer').innerHTML = html;
  qs('#subtotal').textContent = currency(cartTotal());
  qs('#subtotalDrawer').textContent = currency(cartTotal());

  // Bind actions
  qsa('.removeItem').forEach(btn => btn.addEventListener('click', e => removeFromCart(e.target.dataset.id)));
  qsa('.incQty').forEach(btn => btn.addEventListener('click', e => {
    const id = e.target.dataset.id; const cart = loadCart();
    const it = cart.find(i => i.id === id); if (!it) return; it.qty += 1; saveCart(cart); renderCart(); renderCartBadges();
  }));
  qsa('.decQty').forEach(btn => btn.addEventListener('click', e => {
    const id = e.target.dataset.id; const cart = loadCart();
    const it = cart.find(i => i.id === id); if (!it) return; it.qty = Math.max(1, it.qty - 1); saveCart(cart); renderCart(); renderCartBadges();
  }));
  qsa('.qtyInput').forEach(inp => inp.addEventListener('change', e => updateQty(e.target.dataset.id, e.target.value)));
}
function renderCartBadges() {
  const count = loadCart().reduce((n, i) => n + i.qty, 0);
  qs('#cartCountBadge').textContent = count;
}

// ---------- Filters ----------
function applyFilters() {
  const q = qs('#searchInput').value.toLowerCase().trim();
  const cat = qs('#categoryFilter').value;
  const sort = qs('#sortSelect').value;

  let list = PRODUCTS.filter(p => (
    (cat === 'all' || p.category === cat) &&
    (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
  ));

  if (sort === 'price-asc')  list.sort((a,b)=>a.price-b.price);
  if (sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
  if (sort === 'alpha')      list.sort((a,b)=>a.name.localeCompare(b.name));

  renderProducts(list);
}

// ---------- WhatsApp ----------
function buildWhatsAppMessage(order, form) {
  const lines = [];
  lines.push('*New Order – ChemPro*','');
  lines.push('*Customer*');
  lines.push(`Name: ${form.name}`);
  lines.push(`Phone: ${form.phone}`);
  lines.push(`City: ${form.city}`);
  lines.push(`Address: ${form.address}`,'');
  lines.push('*Items*');
  order.forEach(ci => {
    const p = PRODUCTS.find(pp => pp.id === ci.id);
    if (!p) return;
    lines.push(`• ${p.name} x ${ci.qty} — ${currency(p.price * ci.qty)}`);
  });
  lines.push('',`Subtotal: ${currency(cartTotal())}`);
  lines.push('Note: Shipping will be confirmed based on location.');
  return encodeURIComponent(lines.join('\n'));
}
function openWhatsAppWithOrder(formValues) {
  const order = loadCart();
  if (order.length === 0) { alert('Your cart is empty. Add some products first.'); return; }
  if (!businessNumber || businessNumber.length < 10) { alert('Set your WhatsApp businessNumber in js/app.js'); return; }
  const message = buildWhatsAppMessage(order, formValues);
  const url = `https://wa.me/${businessNumber}?text=${message}`;
  window.open(url, '_blank');
}

// ---------- Bootstrap ----------
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/products.json');
    PRODUCTS = await res.json();
  } catch (e) {
    console.error('Failed to load products.json', e);
    PRODUCTS = [];
  }

  // Initial render
  renderProducts(PRODUCTS);
  renderMSDS();
  renderCart();
  renderCartBadges();

  // Filters & search
  qs('#searchInput').addEventListener('input', applyFilters);
  qs('#categoryFilter').addEventListener('change', applyFilters);
  qs('#sortSelect').addEventListener('change', applyFilters);
  window.addEventListener('keydown', (e)=>{ if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); qs('#searchInput').focus(); }});

  // Cart drawer
  const openCart = () => qs('#cartDrawer').classList.remove('hidden');
  const closeCart = () => qs('#cartDrawer').classList.add('hidden');
  window.openCart = openCart; // used by addToCart
  qs('#openCartBtn').addEventListener('click', openCart);
  qs('#closeCartBtn').addEventListener('click', closeCart);
  qs('#cartOverlay').addEventListener('click', closeCart);

  // Checkout
  qs('#waOrderBtn').addEventListener('click', () => {
    const form = Object.fromEntries(new FormData(qs('#orderForm')).entries());
    if (!form.name || !form.phone || !form.city || !form.address) {
      alert('Please fill all fields in the order form.');
      return;
    }
    openWhatsAppWithOrder(form);
  });

  // Clear cart
  qs('#clearCartBtn').addEventListener('click', () => { localStorage.setItem(CART_KEY, '[]'); renderCart(); renderCartBadges(); });

  // Go to checkout from drawer
  qs('#gotoCheckout').addEventListener('click', closeCart);
});
