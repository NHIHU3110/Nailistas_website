// ==========================
// Fade-in nội dung trang khi load
// ==========================
window.addEventListener('load', () => {
  document.body.classList.add('fade-in');
  updateAuthUI();
});

// ==========================
// Overlay & Page Transition
// ==========================
function showOverlayAndRedirect(url, delay = 800) {
  const overlay = document.getElementById('transition-overlay');
  if (!overlay) {
    window.location.href = url;
    return;
  }
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  setTimeout(() => { window.location.href = url; }, delay);
}

// ==========================
// Logout (⚡ FIXED VERSION)
// ==========================
function logout() {
  try {
    const Auth = window.AuthUtils;
    Auth?.logout?.();

    // ✅ XÓA sessionStorage để overlay hiển thị lại
    sessionStorage.removeItem('overlayShown');

    // ✅ Ẩn avatar và chữ "Tài khoản"
    const accountText = document.querySelector('.account-text');
    const accountAvatar = document.querySelector('.account-avatar');
    if (accountText) accountText.style.display = 'none';
    if (accountAvatar) accountAvatar.style.display = 'none';

    // ✅ Ẩn nút đăng xuất, hiện lại nút đăng nhập
    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
    loginLinks.forEach(link => (link.style.display = 'block'));
    logoutLinks.forEach(link => (link.style.display = 'none'));

    // Hiển thị overlay transition
    const overlay = document.getElementById('transition-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }

    // Chuyển về homepage sau 800ms
    setTimeout(() => {
      window.location.href = "../Homepage/ck.html";
    }, 800);
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.removeItem('overlayShown');
    window.location.href = "../Homepage/ck.html";
  }
}


// ==========================
// Update UI theo trạng thái đăng nhập
// ==========================
function forceUpdateAuthUI(isLoggedIn) {
  const loginLinks = document.querySelectorAll('a[href*="login.html"]');
  const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
  const accountAvatar = document.querySelector('.account-avatar');
  const accountText = document.querySelector('.account-text');

  if (isLoggedIn) {
    loginLinks.forEach(l => {
      l.style.display = 'none';
      l.style.visibility = 'hidden';
    });
    logoutLinks.forEach(l => {
      l.style.display = 'inline-block';
      l.style.visibility = 'visible';
    });
    if (accountAvatar) {
      accountAvatar.style.display = 'flex';
      accountAvatar.style.visibility = 'visible';
    }
    if (accountText) {
      accountText.style.display = 'none';
      accountText.style.visibility = 'hidden';
    }
  } else {
    loginLinks.forEach(l => {
      l.style.display = 'inline-block';
      l.style.visibility = 'visible';
    });
    logoutLinks.forEach(l => {
      l.style.display = 'none';
      l.style.visibility = 'hidden';
    });
    if (accountAvatar) {
      accountAvatar.style.display = 'none';
      accountAvatar.style.visibility = 'hidden';
    }
    if (accountText) {
      accountText.style.display = 'inline-block';
      accountText.style.visibility = 'visible';
    }
  }
}

function updateAuthUI() {
  try {
    const Auth = window.AuthUtils;
    const user = Auth?.getCurrentUser?.();

    if (user) {
      forceUpdateAuthUI(true);
      const accountAvatar = document.querySelector('.account-avatar');
      if (accountAvatar)
        accountAvatar.textContent = user.name ? user.name[0].toUpperCase() : 'U';
    } else {
      forceUpdateAuthUI(false);
    }
  } catch (error) {
    console.error('Error updating auth UI:', error);
    forceUpdateAuthUI(false);
  }
}

// ==========================
// Login link: overlay + redirect
// ==========================
document.querySelectorAll('a[href*="login.html"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetUrl = link.getAttribute('href');
    showOverlayAndRedirect(targetUrl, 800);
  });
});

// ==========================
// Header links khác: overlay + redirect
// ==========================
document.querySelectorAll('a[data-transition]').forEach(link => {
  link.addEventListener('click', e => {
    const targetUrl = link.getAttribute('href');
    if (!targetUrl || targetUrl.startsWith('#')) return;
    e.preventDefault();
    showOverlayAndRedirect(targetUrl, 800);
  });
});

// ==========================
// Read more button
// ==========================
document.querySelectorAll('.read-more-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const link = btn.dataset.link;
    if (!link) return;
    showOverlayAndRedirect(link, 800);
  });
});

// ==========================
// Go Home
// ==========================
function goHome() {
  showOverlayAndRedirect("../Homepage/ck.html", 800);
}

// ==========================
// Tawk.to chat
// ==========================
// Tawk embed removed from this file to avoid duplicate initialization (kept in Homepage/ck.js)
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/68fd00ab603401195169ddbc/1j8e4l8i4';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
// ==========================
// ===== CART POP UP =====
// ==========================
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const PAYMENT_URL =
      document.querySelector('meta[name="payment-url"]')?.content || '../Product/html/payment.html';

    const overlay = document.getElementById('overlay');
    const drawer = document.getElementById('cart-popup');
    const contentEl = document.getElementById('cart-content');
    const totalEl = document.getElementById('cart-total-amount');
    const countTitle = document.getElementById('cart-count-title');
    const badgeEl = document.getElementById('cart-count');
    const checkout = document.getElementById('checkout-btn');
    const headerCartLink = document.getElementById('cart-link');

    if (!overlay || !drawer || !contentEl || !totalEl || !checkout || !headerCartLink) {
      console.warn('[NailistasCart] Thiếu HTML fragment.');
      return;
    }

    const toNumber = (v) => Number(String(v).replace(/[^\d.-]/g, '')) || 0;
    const VND = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' VND';
    const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
    const setCart = (c) => localStorage.setItem('cart', JSON.stringify(c));
    const countCart = (c = getCart()) => c.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const totalCart = (c = getCart()) =>
      c.reduce((s, it) => s + toNumber(it.price) * (Number(it.quantity) || 0), 0);

    function renderBadge() {
      const c = countCart();
      if (badgeEl) badgeEl.textContent = c > 99 ? '99+' : String(c);
      if (countTitle) countTitle.textContent = String(c);
    }

    function openCart() {
      renderPopup();
      overlay.classList.add('show');
      drawer.classList.add('open');
    }

    function closeCart() {
      drawer.classList.remove('open');
      overlay.classList.remove('show');
    }

    function renderPopup() {
      const cart = getCart();
      contentEl.innerHTML = '';

      if (!cart.length) {
        contentEl.innerHTML = '<p style="padding:12px 24px;color:#666;">Giỏ hàng trống.</p>';
        totalEl.textContent = VND(0);
        if (checkout) checkout.disabled = true;
        renderBadge();
        return;
      }

      if (checkout) checkout.disabled = false;

      // Helper: normalize image paths stored in cart so they resolve correctly
      // when rendering from pages outside the Product/html folder (like Blog/).
      function resolveCartImage(src) {
        if (!src) return '';
        // absolute URLs or root-relative paths are fine
        if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
        // Common case: product JSON uses "../images/.." relative to Product/html.
        // From Blog/ pages we need to point to ../Product/images/...
        if (src.startsWith('../images/')) return '../Product/images/' + src.slice('../images/'.length);
        if (src.startsWith('./images/')) return '../Product/images/' + src.slice('./images/'.length);
        // fallback: return as-is
        return src;
      }

      cart.forEach((it) => {
        const imgSrc = resolveCartImage(it.img || '');
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <img src="${imgSrc}" alt="${it.name || ''}">
          <div class="cart-item-info">
            <h4>${it.name || ''}</h4>
            <div class="bottom-row">
              <div class="quantity-box" data-id="${it.id}">
                <button class="qty-btn" data-action="dec">−</button>
                <input type="number" class="qty-input" value="${Number(it.quantity) || 1}" readonly />
                <button class="qty-btn" data-action="inc">+</button>
              </div>
              <p>${VND(it.price)}</p>
            </div>
          </div>
          <button class="remove-btn" title="Xóa" aria-label="Xóa" data-action="remove" data-id="${it.id}">×</button>
        `;
        contentEl.appendChild(row);
      });

      totalEl.textContent = VND(totalCart(cart));
      renderBadge();
    }

    overlay.addEventListener('click', closeCart);
    drawer.querySelector('.close-btn')?.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });
    headerCartLink.addEventListener('click', (e) => { e.preventDefault(); openCart(); });

    contentEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id') || btn.parentElement?.getAttribute('data-id');
      if (!id) return;
      const cart = getCart();
      const idx = cart.findIndex((x) => String(x.id) === String(id));
      if (idx === -1) return;
      if (action === 'inc') cart[idx].quantity++;
      if (action === 'dec') cart[idx].quantity = Math.max(1, Number(cart[idx].quantity || 1) - 1);
      if (action === 'remove') cart.splice(idx, 1);
      setCart(cart);
      renderPopup();
    });

    checkout.addEventListener('click', (e) => {
      e.preventDefault();
      const cart = getCart();
      if (!cart.length) return alert('Giỏ hàng trống!');
      const items = cart.map(({ id, name, price, quantity, img }) => ({
        id,
        name,
        unitPrice: toNumber(price),
        quantity: Number(quantity) || 1,
        imageSrc: img || ''
      }));
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const shipping = 15000;
      const total = subtotal + shipping;
      const payload = { items, subtotal, shipping, total, currency:'VND', locale:'vi-VN', savedAt:new Date().toISOString() };
      sessionStorage.setItem('checkoutData', JSON.stringify(payload));
      sessionStorage.setItem('paymentOrigin', location.href);
      window.location.href = PAYMENT_URL;
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-add-to-cart');
      if (!btn) return;
      const id = btn.dataset.id;
      const name = btn.dataset.name || '';
      const price = toNumber(btn.dataset.price || 0);
      const img = btn.dataset.img || '';
      if (!id) return console.warn('[NailistasCart] Thiếu data-id');
      addToCart({ id, name, price, img }, 1, { open: true });
    });

    function addToCart(prod, qty = 1, opts = { open: true }) {
      const cart = getCart();
      const idx = cart.findIndex((it) => String(it.id) === String(prod.id));
      if (idx !== -1) cart[idx].quantity += Number(qty || 1);
      else cart.push({ id: prod.id, name: prod.name||'', price: toNumber(prod.price||0), img: prod.img||'', quantity:Number(qty||1) });
      setCart(cart);
      renderBadge();
      if (opts.open) openCart();
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'cart') { renderBadge(); if(drawer.classList.contains('open')) renderPopup(); }
    });

    function reopenIfNeeded() {
      if (sessionStorage.getItem('reopenCart') === '1') {
        sessionStorage.removeItem('reopenCart');
        openCart();
      }
    }

    window.addEventListener('pageshow', reopenIfNeeded);
    if (document.readyState === 'complete' || document.readyState === 'interactive') reopenIfNeeded();

    window.NailistasCart = { open: openCart, close: closeCart, add: addToCart, count: () => countCart(), total: () => totalCart() };
    renderBadge();
  });
})();


//CẬP NHẬT AVT//
function updateAuthUI() {
  const loginLinks  = document.querySelectorAll('a[href*="login.html"]');
  const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
  const accountAvatar = document.querySelector('.account-avatar');
  const accountText = document.querySelector('.account-text');

  const user = window.AuthUtils?.getCurrentUser?.();

  if (user) {
    loginLinks.forEach(link => link.style.display = 'none');
    logoutLinks.forEach(link => link.style.display = 'block');

    const avatarData = localStorage.getItem('user_avatar');
    if (accountAvatar) {
      if (avatarData) {
        accountAvatar.style.display = 'flex';
        accountAvatar.style.backgroundImage = `url(${avatarData})`;
        accountAvatar.textContent = '';
      } else {
        // fallback: hiển thị ký tự đầu tên
        const firstChar = (user.name || user.email || '?')[0].toUpperCase();
        accountAvatar.style.display = 'flex';
        accountAvatar.style.backgroundImage = '';
        accountAvatar.textContent = firstChar;
      }
    }
    if (accountText) accountText.style.display = 'none';
  } else {
    loginLinks.forEach(link => link.style.display = 'block');
    logoutLinks.forEach(link => link.style.display = 'none');
    if (accountAvatar) accountAvatar.style.display = 'none';
    if (accountText) accountText.style.display = 'inline';
  }
}

// Gọi khi load trang
window.addEventListener('pageshow', updateAuthUI);
document.addEventListener('DOMContentLoaded', updateAuthUI);



//CONFIRM LOGOUT
//  Khởi tạo logout popup khi trang load
window.addEventListener('load', () => {
  initLogoutPopup();
});

function initLogoutPopup() {
  // Nếu popup đã tồn tại thì không cần tạo lại
  if (document.getElementById('logout-popup')) return;
  
  //  Tạo phần tử overlay
  const popup = document.createElement('div');
  popup.id = 'logout-popup';
  popup.className = 'logout-popup';
  popup.innerHTML = `
    <div class="logout-popup-content">
      <h3>Bạn có chắc muốn đăng xuất?</h3>
      <div class="logout-popup-buttons">
        <button id="confirmLogout" class="btn-confirm">Đăng xuất</button>
        <button id="cancelLogout" class="btn-cancel">Hủy</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  //  Thêm CSS trực tiếp bằng JS
  const style = document.createElement('style');
  style.textContent = `
    .logout-popup {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      display: none;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    }
    .logout-popup-content {
      background: #fff;
      padding: 25px 35px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
      animation: popupFadeIn 0.3s ease;
    }
    .logout-popup-content h3 {
      margin-bottom: 15px;
      font-size: 18px;
      color: #333;
    }
    .logout-popup-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    .btn-confirm {
      background-color: #e53935;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-cancel {
      background-color: #ccc;
      color: #000;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-confirm:hover { background-color: #c62828; }
    .btn-cancel:hover { background-color: #b0b0b0; }
    @keyframes popupFadeIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  //  Gắn sự kiện cho nút
  document.getElementById('cancelLogout').addEventListener('click', () => {
    popup.style.display = 'none';
  });

  document.getElementById('confirmLogout').addEventListener('click', () => {
    confirmLogout();
  });
}

function confirmLogout() {
  const popup = document.getElementById('logout-popup');
  popup.style.display = 'none';

  try {
    const Auth = window.AuthUtils;
    Auth?.logout?.();

    sessionStorage.removeItem('overlayShown');

    const accountText = document.querySelector('.account-text');
    const accountAvatar = document.querySelector('.account-avatar');
    if (accountText) accountText.style.display = 'none';
    if (accountAvatar) accountAvatar.style.display = 'none';const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
    loginLinks.forEach(link => (link.style.display = 'block'));
    logoutLinks.forEach(link => (link.style.display = 'none'));

    const overlay = document.getElementById('transition-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }

    setTimeout(() => {
      window.location.href = "../Homepage/ck.html";
    }, 800);
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.removeItem('overlayShown');
    window.location.href = "../Homepage/ck.html";
  }
}

//  Xử lý click trên nút logout
document.addEventListener('click', (e) => {
  const logoutBtn = e.target.closest('a[data-auth="logout"]');
  if (!logoutBtn) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const popup = document.getElementById('logout-popup');
  popup.style.display = 'flex';
}, true);

//  Áp dụng hiệu ứng overlay cho TẤT CẢ các thẻ <a> (TRỪ logout)
document.querySelectorAll('a[href]').forEach(link => {
  link.addEventListener('click', function(e) {
    const targetUrl = this.getAttribute('href');
    
    //  BỎ QUA nút đăng xuất
    if (this.hasAttribute('data-auth') && this.getAttribute('data-auth') === 'logout') {
      return;
    }
    
    // Bỏ qua nếu là liên kết # hoặc tel/mailto
    if (!targetUrl || targetUrl.startsWith('#') || targetUrl.startsWith('mailto:') || targetUrl.startsWith('tel:')) return;

    e.preventDefault();
    const overlay = document.getElementById('transition-overlay');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 800);
  });
});

//bài//
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tarotContainer");
  const wrapper = container.querySelector(".cards-wrapper");
  const messageDisplay = document.getElementById("cardMessageDisplay");
  const shuffleBtn = document.getElementById("shuffleBtn");

  const cardWidth = 200;
  const cardHeight = 240;
  const scale = 1.3;
  const gap = 40;
  const totalCardWidth = cardWidth + gap;

  let baseCards = Array.from(wrapper.querySelectorAll(".card-slot"));
  const baseCount = baseCards.length;
  const containerWidth = container.offsetWidth;
  const visibleCount = Math.ceil(containerWidth / totalCardWidth) + 10;

  // Clone card để đủ carousel
  for (let i = baseCount; i < visibleCount; i++) {
    const clone = baseCards[i % baseCount].cloneNode(true);
    wrapper.appendChild(clone);
  }

  const slots = Array.from(wrapper.querySelectorAll(".card-slot"));
  const cards = slots.map(slot => slot.querySelector(".card-inner"));

  // Tính positions ban đầu, căn giữa lá giữa
  let positions = [];
  const middleIndexInit = Math.floor(slots.length / 2);
  const center = container.offsetWidth / 2;
  for (let i = 0; i < slots.length; i++) {
    positions[i] = center - cardWidth / 2 + (i - middleIndexInit) * totalCardWidth;
    slots[i].style.transform = `translateX(${positions[i]}px)`;
  }

  let speed = 0;
  let middleIndex = 0;
  let isShuffling = false;
  const initialSpeed = 15;

  function updateMiddleCard() {
    const center = container.offsetWidth / 2;
    let minDist = Infinity;
    let newMiddle = 0;

    positions.forEach((pos, i) => {
      const cardCenter = pos + cardWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < minDist) {
        minDist = dist;
        newMiddle = i;
      }
    });

    if (newMiddle !== middleIndex) {
      cards.forEach(card => card.classList.remove("middle"));
      cards[newMiddle].classList.add("middle");
      middleIndex = newMiddle;
      bindMiddleClick();
    }
  }

  function bindMiddleClick() {
    const card = cards[middleIndex];
    const newCard = card.cloneNode(true);
    card.replaceWith(newCard);
    cards[middleIndex] = newCard;

    newCard.addEventListener("click", () => {
      if (speed === 0) {
        newCard.classList.toggle("flipped");
        messageDisplay.textContent = newCard.dataset.message || "";
      }
    });
  }

  function animate() {
    if (speed > 0) {
      for (let i = 0; i < slots.length; i++) {
        positions[i] -= speed;
        if (positions[i] < -totalCardWidth) {
          const maxPos = Math.max(...positions);
          positions[i] = maxPos + totalCardWidth;
        }
        slots[i].style.transform = `translateX(${positions[i]}px)`;
      }
    }

    updateMiddleCard();

    cards.forEach((card, i) => {
      if (i === middleIndex) {
        card.style.transform = card.classList.contains("flipped")
          ? `rotateY(180deg) scale(${scale})`
          : `scale(${scale})`;
      } else {
        card.style.transform = card.classList.contains("flipped")
          ? "rotateY(180deg) scale(1)"
          : "scale(1)";
      }
    });

    if (!isShuffling && speed === 0) {
      const center = container.offsetWidth / 2;
      const middleCardLeft = positions[middleIndex];
      const shift = center - (middleCardLeft + cardWidth / 2);
      if (Math.abs(shift) > 0.5) {
        for (let i = 0; i < positions.length; i++) {
          positions[i] += shift;
          slots[i].style.transform = `translateX(${positions[i]}px)`;
        }
      }
    }

    if (isShuffling && speed > 0.2) speed *= 0.96;
    else if (isShuffling && speed <= 0.2) {
      speed = 0;
      isShuffling = false;
      bindMiddleClick();
    }

    requestAnimationFrame(animate);
  }

  animate();

  shuffleBtn.addEventListener("click", () => {
    cards.forEach(card => card.classList.remove("flipped"));
    messageDisplay.textContent = "Ấn vào lá bài để xem thông điệp";
    speed = initialSpeed + Math.random() * 50;
    isShuffling = true;
  });

  updateMiddleCard();
  bindMiddleClick();

  window.addEventListener("resize", () => {
    const containerWidth = container.offsetWidth;
    const center = containerWidth / 2;
    const middleIndexInit = Math.floor(slots.length / 2);
    for (let i = 0; i < slots.length; i++) {
      positions[i] = center - cardWidth / 2 + (i - middleIndexInit) * totalCardWidth;
      slots[i].style.transform = `translateX(${positions[i]}px)`;
    }
    updateMiddleCard();
  });
});