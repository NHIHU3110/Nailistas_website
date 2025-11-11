 // Hiệu ứng load trang
 window.addEventListener('load', () => {
    document.body.classList.add('fade-in');
  });

  // Nút quay lại có hiệu ứng
  function goBack() {
    const overlay = document.getElementById('transition-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
      history.back();
    }, 800);
  }

  // Overlay khi nhấn link trên header
  document.querySelectorAll('a[data-transition]').forEach(link => {
    link.addEventListener('click', function(e) {
      const targetUrl = this.getAttribute('href');
      if (!targetUrl || targetUrl.startsWith('#')) return; // Không chuyển cho anchor
      e.preventDefault();
      const overlay = document.getElementById('transition-overlay');
      overlay.style.display = 'flex';          // Hiện overlay
      overlay.style.opacity = '1';             // Reset opacity
      setTimeout(() => {
        window.location.href = targetUrl;      // Chuyển trang sau 800ms
      }, 800);
    });
  });

  // Hiệu ứng khi reload / quay lại trang
  window.addEventListener('pageshow', () => {
    const overlay = document.getElementById('transition-overlay');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => { 
        overlay.style.display = 'none'; 
        overlay.style.opacity = '1'; 
      }, 800);
    }, 400);
     updateAuthUI();
  });

      // Function to go to a specific page (goHome) with transition effect
function goHome() {
  const overlay = document.getElementById('transition-overlay');
  overlay.style.display = 'flex'; // Show the overlay
  overlay.style.opacity = '1';    // Make the overlay visible
  setTimeout(() => {
    window.location.href = "../Homepage/ck.html";  // Redirect to the desired page after 800ms
  }, 800); // Wait for 800ms to let the overlay transition
}

// Tawk embed removed from this file to avoid duplicate initialization (kept in Homepage/ck.js)
// 🔑 Cập nhật giao diện sau khi DOM + auth đã sẵn sàng
  


// ========= AUTH UI =========
function updateAuthUI() {
  try {
    const Auth = window.AuthUtils;
    const user = Auth?.getCurrentUser?.();

    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');

    if (user) {
      // ĐÃ đăng nhập -> Ẩn "Đăng nhập", hiện "Đăng xuất"
      loginLinks.forEach(link => {
        if (link.closest('header')) link.style.display = 'none';
      });
      logoutLinks.forEach(link => link.style.display = 'block');
      console.log('User logged in:', user.name || user.email);
    } else {
      // CHƯA đăng nhập -> Hiện "Đăng nhập", Ẩn "Đăng xuất"
      loginLinks.forEach(link => {
        if (link.closest('header')) link.style.display = 'block';
      });
      logoutLinks.forEach(link => link.style.display = 'none');
      console.log('User not logged in');
    }
  } catch (error) {
    console.error('Error updating auth UI:', error);
    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
    loginLinks.forEach(link => (link.style.display = 'block'));
    logoutLinks.forEach(link => (link.style.display = 'none'));
  }
}

function logout() {
  try {
    const Auth = window.AuthUtils;

    // Đăng xuất trong auth.js (xóa đúng key sv_current_user)
    if (Auth?.logout) Auth.logout();

    // Phòng ngừa: xóa thêm các key có thể dùng
    sessionStorage.removeItem('overlayShown');
    localStorage.removeItem('sv_current_user'); // đúng key của auth.js
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');

    // Cập nhật UI ngay
    updateAuthUI();

    // Hiệu ứng + điều hướng
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
    localStorage.removeItem('sv_current_user');
    updateAuthUI();
    window.location.href = "../Homepage/ck.html";
  }
}

(()=> {
  // ===== Config =====
  const PAYMENT_URL =
    document.querySelector('meta[name="payment-url"]')?.content || '../Product/html/payment.html';

  const overlay   = document.getElementById('overlay');
  const drawer    = document.getElementById('cart-popup');
  const contentEl = document.getElementById('cart-content');
  const totalEl   = document.getElementById('cart-total-amount');
  const countTitle= document.getElementById('cart-count-title');
  const badgeEl   = document.getElementById('cart-count');
  const checkout  = document.getElementById('checkout-btn');
  const headerCartLink = document.getElementById('cart-link');

  if (!overlay || !drawer || !contentEl || !totalEl || !checkout) {
    console.warn('[NailistasCart] Thiếu HTML fragment. Hãy include nailistas-cart.html ở cuối <body>.');
    return;
  }

  // ===== Utils =====
  const toNumber = (v)=> Number(String(v).replace(/[^\d.-]/g,'')) || 0;
  const VND      = (n)=> (Number(n)||0).toLocaleString('vi-VN')+' VND';
  const getCart  = ()=> JSON.parse(localStorage.getItem('cart') || '[]');
  const setCart  = (c)=> localStorage.setItem('cart', JSON.stringify(c));
  const countCart= (c=getCart())=> c.reduce((s,it)=> s + (Number(it.quantity)||0), 0);
  const totalCart= (c=getCart())=> c.reduce((s,it)=> s + toNumber(it.price) * (Number(it.quantity)||0), 0);

  function renderBadge(){
    const c = countCart();
    if (badgeEl) badgeEl.textContent = c > 99 ? '99+' : String(c);
    if (countTitle) countTitle.textContent = String(c);
  }

  function openCart(){
    renderPopup();
    overlay.classList.add('show');
    drawer.classList.add('open');
  }
  function closeCart(){
    drawer.classList.remove('open');
    overlay.classList.remove('show');
  }

  function renderPopup() {
      const cart = getCart();
      contentEl.innerHTML = '';

      if (!cart.length) {
        contentEl.innerHTML =
          '<p style="padding:12px 24px;color:#666;">Giỏ hàng trống.</p>';
        totalEl.textContent = VND(0);
        if (checkout) checkout.disabled = true;
        renderBadge();
        return;
      }

      if (checkout) checkout.disabled = false;
      // Normalize image paths so images stored relative to Product pages still
      // resolve correctly when rendering cart from other directories (Service page).
      function resolveCartImage(src) {
        if (!src) return '';
        if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
        if (src.startsWith('../images/')) return '../Product/images/' + src.slice('../images/'.length);
        if (src.startsWith('./images/')) return '../Product/images/' + src.slice('./images/'.length);
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
  // ===== Events: open/close =====
  overlay.addEventListener('click', closeCart);
  drawer.querySelector('.close-btn')?.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeCart(); });

  // Header link → open popup (không rời trang)
  headerCartLink?.addEventListener('click', (e)=>{
    e.preventDefault(); e.stopPropagation(); openCart();
  }, true);

  // ===== Events: inc/dec/remove =====
  contentEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id') || btn.parentElement?.getAttribute('data-id');
    if (!id) return;

    const cart = getCart();
    const idx = cart.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return;

    if (action === 'inc') cart[idx].quantity++;
    if (action === 'dec') cart[idx].quantity = Math.max(1, Number(cart[idx].quantity||1) - 1);
    if (action === 'remove') cart.splice(idx,1);

    setCart(cart);
    renderPopup();
  });

  // ===== Checkout → sang payment (ghi checkoutData + origin) =====
  checkout?.addEventListener('click', (e)=>{
    e.preventDefault();
    const cart = getCart();
    if (!cart.length){ alert('Giỏ hàng trống!'); return; }

    const items = cart.map(({id,name,price,quantity,img})=>({
      id, name, unitPrice: toNumber(price),
      quantity: Number(quantity)||1, imageSrc: img||''
    }));
    const subtotal = items.reduce((s,i)=> s + i.unitPrice * i.quantity, 0);
    const shipping = 15000; // payment sẽ tự tính lại nếu cần
    const total = subtotal + shipping;

    const payload = {
      items, subtotal, shipping, total,
      currency:'VND', locale:'vi-VN', savedAt:new Date().toISOString()
    };

    sessionStorage.setItem('checkoutData', JSON.stringify(payload));
    sessionStorage.setItem('paymentOrigin', location.href);

    window.location.href = PAYMENT_URL;
  });

  // ===== Global "add-to-cart" hỗ trợ cho MỌI trang =====
  // Cách 1 (không cần code): đặt data-* trên nút: class="btn-add-to-cart"
  // data-id, data-name, data-price, data-img
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn-add-to-cart');
    if (!btn) return;

    const id   = btn.dataset.id;
    const name = btn.dataset.name || '';
    const price= toNumber(btn.dataset.price || 0);
    const img  = btn.dataset.img || '';

    if (!id){ console.warn('[NailistasCart] Thiếu data-id'); return; }

    addToCart({id, name, price, img}, 1, {open:true});
  });

  // Cách 2 (code): window.NailistasCart.add({ id, name, price, img }, qty, {open:true})
  function addToCart(prod, qty=1, opts={open:true}){
    const cart = getCart();
    const k = cart.findIndex(it=> String(it.id) === String(prod.id));if (k !== -1) cart[k].quantity = Number(cart[k].quantity||0) + Number(qty||1);
    else cart.push({ id: prod.id, name: prod.name||'', price: toNumber(prod.price||0), img: prod.img||'', quantity: Number(qty||1) });

    setCart(cart);
    renderBadge();
    if (opts.open) openCart();
  }

  // ===== Sync nhiều tab & Reopen cart khi quay từ payment =====
  window.addEventListener('storage', (e)=>{
    if (e.key === 'cart'){ renderBadge(); if (drawer.classList.contains('open')) renderPopup(); }
  });

  function reopenIfNeeded(){
    if (sessionStorage.getItem('reopenCart') === '1'){
      sessionStorage.removeItem('reopenCart');
      // mở drawer theo template hiện tại
      openCart();
    }
  }
  window.addEventListener('pageshow', reopenIfNeeded);
  if (document.readyState === 'complete' || document.readyState === 'interactive') reopenIfNeeded();
  else document.addEventListener('DOMContentLoaded', reopenIfNeeded, {once:true});

  // ===== Expose minimal API =====
  window.NailistasCart = {
    open: openCart,
    close: closeCart,
    add: addToCart,
    count: ()=>countCart(),
    total: ()=>totalCart()
  };

  // ===== Boot =====
  renderBadge(); // hiển thị số lượng ngay khi vào trang
})();


//CART POP UP//
document.addEventListener('DOMContentLoaded', () => {
  const overlay   = document.getElementById('overlay');
  const drawer    = document.getElementById('cart-popup');
  const contentEl = document.getElementById('cart-content');
  const totalEl   = document.getElementById('cart-total-amount');
  const countTitle= document.getElementById('cart-count-title');
  const badgeEl   = document.getElementById('cart-count');
  const checkout  = document.getElementById('checkout-btn');
  const headerCartLink = document.getElementById('cart-link');

  if (!overlay || !drawer || !contentEl || !totalEl || !checkout || !headerCartLink) {
    console.warn('[NailistasCart] Thiếu HTML fragment.');
    return;
  }

  // ----- Utils -----
  const toNumber = v => Number(String(v).replace(/[^\d.-]/g,'')) || 0;
  const VND      = n => (Number(n)||0).toLocaleString('vi-VN')+' VND';
  const getCart  = () => JSON.parse(localStorage.getItem('cart') || '[]');
  const setCart  = c => localStorage.setItem('cart', JSON.stringify(c));
  const countCart= c => (c||getCart()).reduce((s,it)=> s + (Number(it.quantity)||0), 0);
  const totalCart= c => (c||getCart()).reduce((s,it)=> s + toNumber(it.price)*(Number(it.quantity)||0), 0);

  function renderBadge() {
    const c = countCart();
    if (badgeEl) badgeEl.textContent = c > 99 ? '99+' : String(c);
    if (countTitle) countTitle.textContent = String(c);
  }

  function renderPopup(){
    const cart = getCart();
    contentEl.innerHTML = '';
    if (!cart.length){
      contentEl.innerHTML = '<p style="padding:12px 24px;color:#666;">Giỏ hàng trống.</p>';
      totalEl.textContent = VND(0);
      if (checkout) checkout.disabled = true;
      renderBadge();
      return;
    }
    if (checkout) checkout.disabled = false;

    // Normalize image paths so cart images resolve correctly from Homepage pages
    function resolveCartImage(src){
      if(!src) return '';
      if(/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
      if(src.startsWith('../images/')) return '../Product/images/' + src.slice('../images/'.length);
      if(src.startsWith('./images/')) return '../Product/images/' + src.slice('./images/'.length);
      return src;
    }

    cart.forEach(it=>{
      const imgSrc = resolveCartImage(it.img || '');
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${imgSrc}" alt="${it.name||''}">
        <div class="cart-item-info">
          <h4>${it.name||''}</h4>
          <div class="bottom-row">
            <div class="quantity-box" data-id="${it.id}">
              <button class="qty-btn" data-action="dec">−</button>
              <input type="number" class="qty-input" value="${Number(it.quantity)||1}" readonly />
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


  // ----- Open/Close -----
  function openCart() {
    renderPopup();
    overlay.classList.add('show');
    drawer.classList.add('open');
  }
  function closeCart() {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
  }

  overlay.addEventListener('click', closeCart);
  drawer.querySelector('.close-btn')?.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeCart(); });

  // ----- Header link click -----
  headerCartLink.addEventListener('click', e => {
    e.preventDefault();
    openCart();
  });

  // ----- Quantity / Remove -----
  contentEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id') || btn.parentElement?.getAttribute('data-id');
    if (!id) return;

    const cart = getCart();
    const idx = cart.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return;

    if (action === 'inc') cart[idx].quantity++;
    if (action === 'dec') cart[idx].quantity = Math.max(1, Number(cart[idx].quantity||1)-1);
    if (action === 'remove') cart.splice(idx,1);

    setCart(cart);
    renderPopup();
  });

  // ----- Checkout -----
  checkout.addEventListener('click', e => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) { alert('Giỏ hàng trống!'); return; }

    const items = cart.map(({id,name,price,quantity,img})=>({
      id,name,unitPrice: toNumber(price),quantity:Number(quantity)||1,imageSrc:img||''
    }));
    const subtotal = items.reduce((s,i)=> s+i.unitPrice*i.quantity,0);
    const shipping = 15000;
    const total = subtotal + shipping;

    const payload = { items, subtotal, shipping, total, currency:'VND', locale:'vi-VN', savedAt:new Date().toISOString() };
    sessionStorage.setItem('checkoutData', JSON.stringify(payload));
    sessionStorage.setItem('paymentOrigin', location.href);

    const PAYMENT_URL = document.querySelector('meta[name="payment-url"]')?.content || '../html/payment.html';
    window.location.href = PAYMENT_URL;
  });

  // ----- Global add-to-cart support -----
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add-to-cart');
    if (!btn) return;

    const id   = btn.dataset.id;
    const name = btn.dataset.name||'';
    const price= toNumber(btn.dataset.price||0);
    const img  = btn.dataset.img||'';
    if (!id) { console.warn('[NailistasCart] Thiếu data-id'); return; }

    const cart = getCart();
    const k = cart.findIndex(it => String(it.id) === String(id));
    if (k!==-1) cart[k].quantity +=1;
    else cart.push({id,name,price,img,quantity:1});
    setCart(cart);
    renderBadge();
    openCart();
  });

  // ----- Sync multiple tabs -----
  window.addEventListener('storage', e => {
    if(e.key==='cart') renderBadge();
  });

  // ----- Initial -----
  renderBadge();
});

function updateAuthUI() {
  try {
    const Auth = window.AuthUtils;
    const user = Auth?.getCurrentUser?.();

    const loginLinks  = document.querySelectorAll('a[href*="login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
    const accountText = document.querySelector('.account-text');
    const accountAvatar = document.querySelector('.account-avatar');

    if (user) {
      // Ẩn login, hiện logout
      loginLinks.forEach(link => { if (link.closest('header')) link.style.display = 'none'; });
      logoutLinks.forEach(link => link.style.display = 'block');

      // Hiển thị avatar
      if (accountAvatar) {
        accountAvatar.style.display = 'flex';
        const firstChar = (user.name || user.email || '?')[0].toUpperCase();
        accountAvatar.textContent = firstChar;
      }
      if (accountText) accountText.style.display = 'none';

      console.log('User logged in:', user.name || user.email);
    } else {
      // Chưa login -> hiện login, ẩn logout
      loginLinks.forEach(link => { if (link.closest('header')) link.style.display = 'block'; });
      logoutLinks.forEach(link => link.style.display = 'none');

      // Ẩn avatar, hiện text
      if (accountAvatar) accountAvatar.style.display = 'none';
      if (accountText) accountText.style.display = 'inline';

      console.log('User not logged in');
    }
  } catch (error) {
    console.error('Error updating auth UI:', error);
    const loginLinks  = document.querySelectorAll('a[href*="login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
    loginLinks.forEach(link => (link.style.display = 'block'));
    logoutLinks.forEach(link => (link.style.display = 'none'));
    const accountText = document.querySelector('.account-text');
    const accountAvatar = document.querySelector('.account-avatar');
    if(accountText) accountText.style.display = 'inline';
    if(accountAvatar) accountAvatar.style.display = 'none';
  }
}

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

var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/68fd00ab603401195169ddbc/1j8e4l8i4';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();