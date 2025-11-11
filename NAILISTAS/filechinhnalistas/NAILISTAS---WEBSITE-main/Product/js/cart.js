// cart.js (drop-in): giữ nguyên cho cart.html, thêm hỗ trợ basic_tools.html (mini cart)
(function(){
  const $ = sel => document.querySelector(sel);
  const has = id => !!document.getElementById(id);
  // Phát hiện môi trường: overlay (cart.html) hay mini (basic_tools.html)
  const ENV = has('cart-popup') ? 'overlay' : (has('miniCartPanel') ? 'mini' : null);

  // ----- Toggle / Open popup -----
  function toggleCartPopup(){
    if (ENV !== 'overlay'){ // Ở basic_tools.html → ủy quyền qua mini cart
      if (ENV === 'mini') {
        if (window.renderMiniCart) window.renderMiniCart();
        if (window.openMiniCart) window.openMiniCart();
        else document.getElementById('miniCartPanel').classList.add('show');
      }
      return;
    }
    const cartPopup = document.getElementById('cart-popup');
    const overlay = document.getElementById('overlay');
    const isOpen = cartPopup.classList.contains('open');
    if (!isOpen) { cartPopup.classList.add('open'); overlay.classList.add('show'); }
    else { cartPopup.classList.remove('open'); overlay.classList.remove('show'); }
  }
  window.toggleCartPopup = toggleCartPopup;

  function openCartPopup(){
    if (ENV === 'overlay') {
      const cartPopup = $('#cart-popup'), overlay = $('#overlay');
      if (!cartPopup || !overlay) return;
      cartPopup.classList.add('open'); overlay.classList.add('show');
      return;
    }
    if (ENV === 'mini') {
      if (window.renderMiniCart) window.renderMiniCart();
      if (window.openMiniCart) window.openMiniCart();
      else document.getElementById('miniCartPanel').classList.add('show');
    }
  }
  window.openCartPopup = openCartPopup;

  // ----- Các hàm DOM-based cho cart.html (giữ nguyên ý) -----
  function updateQuantity(action, productId) {
    if (ENV !== 'overlay') return; // mini cart tự xử lý trong basic_tools.html
    const item = document.querySelector(`#cart-popup .cart-item:nth-child(${productId})`);
    if(!item) return;
    const qtyInput = item.querySelector('.qty-input');
    let qty = parseInt(qtyInput.value);
    if (action === 'increment') qty++;
    else if (action === 'decrement' && qty > 1) qty--;
    qtyInput.value = qty;
    updateCartTotal();
  }
  window.updateQuantity = updateQuantity;

  function updateCartTotal() {
    if (ENV !== 'overlay') return;
    let total = 0;
    document.querySelectorAll('#cart-popup .cart-item').forEach(item => {
      const price = parseInt(item.querySelector('.cart-item-info p').textContent.replace('₫', '').replace(/\./g, '').trim());
      const qty = parseInt(item.querySelector('.qty-input').value);
      total += price * qty;
    });
    const totalEl = document.getElementById('cart-total-amount');
    if (totalEl) totalEl.textContent = total.toLocaleString() + '₫';
    updateCartCount();
  }
  window.updateCartTotal = updateCartTotal;

  function removeItem(productId) {
    if (ENV !== 'overlay') return;
    const item = document.querySelector(`#cart-popup .cart-item:nth-child(${productId})`);
    if (item) item.remove();
    updateCartTotal();
  }
  window.removeItem = removeItem;

  function updateCartCount() {
    if (ENV !== 'overlay') return;
    const count = document.querySelectorAll('#cart-popup .cart-item').length;
    const countEl = document.getElementById('cart-count');
    const titleEl = document.getElementById('cart-count-title');
    if (countEl) countEl.textContent = count;
    if (titleEl) titleEl.textContent = count;
  }
  window.updateCartCount = updateCartCount;

  function checkout() { window.location.href = "payment.html"; }
  window.checkout = checkout;

  // ----- UX: giữ nguyên fade/overlay nếu có transition-overlay -----
  window.addEventListener('load', () => {
    document.body.classList.add('fade-in');
    const tOverlay = document.getElementById('transition-overlay');
    if (tOverlay){ tOverlay.style.opacity = '0'; setTimeout(() => { tOverlay.style.display = 'none'; }, 800); }
  });

  // ----- Mở popup khi bấm Giỏ hàng trên header (ghi đè điều hướng) -----
  const headerCartLink = document.getElementById('cart-link');
  if (headerCartLink){
    headerCartLink.addEventListener('click', (e)=>{
      e.preventDefault();
      openCartPopup();
    });
  }
})();

function goHome() {
  const overlay = document.getElementById('transition-overlay');
  overlay.style.display = 'flex'; // Show the overlay
  overlay.style.opacity = '1';    // Make the overlay visible
  setTimeout(() => {
    window.location.href = "../../Homepage/ck.html";  // Redirect to the desired page after 800ms
  }, 800); // Wait for 800ms to let the overlay transition
}

// Hiệu ứng load trang khi mới vào
window.addEventListener('load', () => {
  document.body.classList.add('fade-in');
});