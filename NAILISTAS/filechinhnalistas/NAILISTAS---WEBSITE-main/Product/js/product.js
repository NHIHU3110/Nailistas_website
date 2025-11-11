
// Overlay chuyển trang + Home
// ==========================
// ==========================
// Overlay chuyển trang + Home
// ==========================

// 🔹 Định nghĩa đường dẫn homepage tuyệt đối
const HOMEPAGE_URL = '../../Homepage/ck.html';

// 🔹 Hiển thị overlay rồi điều hướng (tự sửa path về đúng Homepage nếu cần)
function showOverlayThenNavigate(url){
  // Ép mọi URL chứa Homepage/ck.html về đúng đường dẫn gốc
  const target = (url && url.includes('../../Homepage/ck.html'))
    ? HOMEPAGE_URL
    : url;

  const ov = document.getElementById('transition-overlay');
  if (ov){
    ov.style.display = 'flex';
    ov.style.opacity = '1';
    setTimeout(()=>{ window.location.href = target; }, 600);
  } else {
    window.location.href = target;
  }
}

// 🔹 Dùng cho inline onclick="goHome()"
function goHome(){
  showOverlayThenNavigate(HOMEPAGE_URL);
}

// 🔹 Logo click về home
const homeLogo = document.querySelector('.logo-center img');
if (homeLogo){
  homeLogo.addEventListener('click', ()=> showOverlayThenNavigate(HOMEPAGE_URL));
}

// 🔹 Header link có data-transition (trừ giỏ hàng)
document.querySelectorAll('header a[data-transition]').forEach(a=>{
  if(a.id === 'cart-link') return;
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#')) return;
    e.preventDefault();
    showOverlayThenNavigate(href);
  });
});
// Hỗ trợ cả inline onclick="goHome()" lẫn addEventListener
// Navigate to the site homepage (from Product/html pages we must go up two levels)
// Giữ behavior data-transition cho các link khác (trừ giỏ hàng)
document.querySelectorAll('header a[data-transition]').forEach(a=>{
  if(a.id === 'cart-link') return;
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if(!href || href.startsWith('#')) return;
    e.preventDefault();
    showOverlayThenNavigate(href);
  });
});

// ==========================
// Search
// ==========================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
if(searchBtn){
  searchBtn.addEventListener("click", () => {
    const query = (searchInput?.value || "").trim();
    if (query) window.location.href = `search.html?query=${encodeURIComponent(query)}`;
  });
}
if(searchInput){
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchBtn?.click();
    }
  });
}

// ==========================
// Scroll to top
// ==========================
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn){
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) scrollTopBtn.classList.add('show');
    else scrollTopBtn.classList.remove('show');
  });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ==========================
// Helpers
// ==========================
const toNumber = (x) => {
  if (typeof x === 'number') return x;
  const digits = String(x || '').replace(/[^\d.-]/g, '');
  return digits ? parseInt(digits, 10) : 0;
};
const VND  = (n) => (Number(n)||0).toLocaleString('vi-VN') + ' VND';
const slug = (s) => String(s||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/đ/g,'d').replace(/Đ/g,'D')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

// ==========================
// Cart state (localStorage)
// ==========================
function getCart(){ return JSON.parse(localStorage.getItem('cart')||'[]'); }
function setCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }
function countCart(c=getCart()){ return c.reduce((s,it)=> s + (Number(it.quantity)||0 || 1), 0); }
function totalCart(c=getCart()){ return c.reduce((s,it)=> s + toNumber(it.price)*(Number(it.quantity)||0 || 1), 0); }

function renderCartBadge(){
  const badge = document.getElementById('cart-count');
  if(!badge) return;
  const c = countCart();
  badge.textContent = c > 99 ? '99+' : String(c);
}

// ==========================
// Drawer controls (template)
// ==========================
const drawerOverlay = document.getElementById('overlay');          // nền mờ của drawer
const drawer        = document.getElementById('cart-drawer');      // khung drawer
const content       = document.getElementById('cart-content');     // danh sách item
const totalEl       = document.getElementById('cart-total-amount');
const countTitle    = document.getElementById('cart-count-title');
const checkoutBtn   = document.getElementById('checkout-btn');

// Có drawer?
const hasDrawer = !!drawer && !!drawerOverlay && !!content;

function openCartDrawer(){
  if (!hasDrawer) return; // nếu không có drawer trên trang, bỏ qua
  renderCartDrawer();
  drawerOverlay.classList.add('show');
  drawer.classList.add('open');
  // 🔒 Khóa cuộn + Ẩn up arrow
  document.body.classList.add('no-scroll');
  scrollTopBtn?.classList.add('hide');
}
function closeCartDrawer(){
  if (!hasDrawer) return;
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('show');
  // 🔓 Mở cuộn + Hiện up arrow lại (nếu cần)
  document.body.classList.remove('no-scroll');
  scrollTopBtn?.classList.remove('hide');
}
drawerOverlay?.addEventListener('click', closeCartDrawer);
drawer?.querySelector('.close-btn')?.addEventListener('click', closeCartDrawer);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeCartDrawer(); });

// Header cart link: mở drawer nếu có, nếu không thì để điều hướng mặc định
document.getElementById('cart-link')?.addEventListener('click', (e)=>{
  if (hasDrawer){
    e.preventDefault(); e.stopPropagation();
    openCartDrawer();
  }
});

// Render nội dung giỏ hàng
function renderCartDrawer(){
  if (!hasDrawer) return;
  const cart = getCart();
  content.innerHTML = '';
  if(cart.length === 0){
    content.innerHTML = '<p style="padding:12px 20px;color:#666;">Giỏ hàng trống.</p>';
    if (countTitle) countTitle.textContent = '0';
    if (totalEl)    totalEl.textContent    = VND(0);
    if (checkoutBtn) checkoutBtn.disabled  = true;
    return;
  }
  if (checkoutBtn) checkoutBtn.disabled = false;

  cart.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'cart-item';
   row.innerHTML = `
  <img src="${it.img || '../images/background.png'}" alt="${it.name}">
  <div class="cart-item-info">
    <h4>${it.name}</h4>
    <div class="bottom-row">
      <div class="quantity-box" data-id="${it.id}">
        <button class="qty-btn" data-action="dec">−</button>
        <input type="number" class="qty-input" value="${it.quantity || 1}" readonly/>
        <button class="qty-btn" data-action="inc">+</button>
      </div>
      <p>${VND(it.price)}</p>
    </div>
  </div>
  <button class="remove-btn" title="Xóa" aria-label="Xóa" data-action="remove" data-id="${it.id}">×</button>
`;

    content.appendChild(row);
  });
  if (countTitle) countTitle.textContent = String(countCart(cart));
  if (totalEl)    totalEl.textContent    = VND(totalCart(cart));
}

// Sự kiện +/−/xóa trong drawer (uỷ quyền)
content?.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id') || btn.parentElement.getAttribute('data-id');
  const cart = getCart();
  const idx = cart.findIndex(x=> String(x.id) === String(id));
  if(idx === -1) return;

  if(action === 'inc') cart[idx].quantity = (cart[idx].quantity||1) + 1;
  if(action === 'dec') cart[idx].quantity = Math.max(1, (cart[idx].quantity||1) - 1);
  if(action === 'remove') cart.splice(idx,1);

  setCart(cart);
  renderCartBadge();
  renderCartDrawer();
});

// Thanh toán (đổi URL nếu cần)
// Thay cho: checkoutBtn?.addEventListener('click', ()=>{ window.location.href = '../Checkout/checkout.html'; });

checkoutBtn?.addEventListener('click', (e) => {
  e.preventDefault();

  // 👉 Trang đích: đổi tùy bạn dùng payment hay checkout
  const PAYMENT_URL = '../html/payment.html';    // hoặc '../Checkout/checkout.html'

  // helper ép số
  window.toNumber = window.toNumber || function(value) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
};


  // 1) Lấy giỏ từ localStorage (key 'cart')
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (!cart.length) { alert('Giỏ hàng trống!'); return; }

  // 2) Đóng gói payload
  const items = cart.map(({ id, name, price, quantity, img }) => ({
    id,
    name,
    unitPrice: toNumber(price),
    quantity: Number(quantity) || 1,
    imageSrc: img || ''
  }));
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shipping = 15000; // payment sẽ tự tính lại nếu đổi phương thức
  const total    = subtotal + shipping;

  // 3) Lưu tạm + nguồn điều hướng để quay lại mở lại drawer
  sessionStorage.setItem('checkoutData', JSON.stringify({
    items, subtotal, shipping, total,
    currency: 'VND', locale: 'vi-VN', savedAt: new Date().toISOString()
  }));
  sessionStorage.setItem('paymentOrigin', location.href);

  // 4) Sang trang thanh toán
  window.location.href = PAYMENT_URL;
});


// ==========================
// Add to cart (mở drawer nếu có; nếu không thì hiện toast)
// ==========================
const toast = document.getElementById('popupCart'); // fallback popup text (không dùng khi có drawer)
document.querySelectorAll(".btn-cart").forEach(btn=>{
  btn.addEventListener("click", (e)=>{
    e.stopPropagation();
    const name = btn.getAttribute("data-name") || 'Sản phẩm';
    const priceNumber = toNumber(btn.getAttribute("data-price"));
    const card = btn.closest('.product-card');
    const imgSrc = card?.querySelector('img')?.getAttribute('src') || '../images/background.png';
    const id = slug(name);

    let cart = getCart();
    const found = cart.find(x=> x.id === id);
    if(found) found.quantity = (found.quantity||1) + 1;
    else cart.push({ id, name, price: priceNumber, img: imgSrc, quantity: 1 });

    setCart(cart);
    renderCartBadge();

    if (hasDrawer) {
      openCartDrawer();
    } else if (toast) {
      toast.textContent = `${name} đã được thêm vào giỏ hàng!`;
      toast.style.display = 'block';
      toast.style.opacity = 1;
      setTimeout(()=>{ toast.style.display = 'none'; }, 1500);
    }
  });
});

// ==========================
// Rating (giữ logic hiện tại)
// ==========================
function updateProductRatings() {
  const ratings = JSON.parse(localStorage.getItem("ratings") || "{}");
  document.querySelectorAll(".product-card").forEach(card => {
    const img = card.querySelector("img");
    // lấy id từ onclick="location.href='Product_detail.html?id=...'"
    const match = img?.getAttribute("onclick")?.match(/id=([^'"]+)/);
    const productId = match ? match[1] : null;

    const avgRating = productId ? (parseFloat(ratings[productId]) || 0) : 0;
    const fullStars = Math.round(avgRating);
    const emptyStars = 5 - fullStars;
    const stars = "★".repeat(fullStars) + "☆".repeat(emptyStars);

    const ratingElem = card.querySelector(".product-rating .stars");
    const valueElem  = card.querySelector(".product-rating .rating-value");
    if (ratingElem && valueElem) {
      ratingElem.textContent = stars;
      ratingElem.style.color = avgRating > 0 ? "gold" : "#ccc";
      valueElem.textContent  = `(${avgRating.toFixed(1)})`;
    }
  });
}
updateProductRatings();

// ==========================
// React to storage updates
// ==========================
window.addEventListener("storage", (e) => {
  if (e.key === "ratings") updateProductRatings();
  if (e.key === "cart") {
    renderCartBadge();
    if (hasDrawer && drawer.classList.contains('open')) renderCartDrawer();
  }
});

// Boot
renderCartBadge();

/* =================== AUTH + LOGIN/LOGOUT =================== */

// 🔹 Auth helper
window.AuthUtils = {
  // Lấy user hiện tại
  getCurrentUser: function() {
    return JSON.parse(localStorage.getItem('currentUser')) || null;
  },

  // Login: lưu user vào localStorage và cập nhật UI
  login: function(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateAuthUI();
  },

  // Logout: xóa user và cập nhật UI
  logout: function() {
    localStorage.removeItem('currentUser');
    updateAuthUI();
  }
};

// 🔹 Cập nhật giao diện theo trạng thái đăng nhập
function updateAuthUI() {
  try {
    const Auth = window.AuthUtils;
    const user = Auth?.getCurrentUser?.();

    const loginLinks = document.querySelectorAll('a[href*="../Login/login.html"]');
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
    const loginLinks = document.querySelectorAll('a[href*="../Login/login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
    loginLinks.forEach(link => (link.style.display = 'block'));
    logoutLinks.forEach(link => (link.style.display = 'none'));
  }
}

// 🔹 Gọi khi trang load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
});

// 🔹 Logout button handler
document.querySelectorAll('[data-auth="logout"]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();

    // Hiệu ứng overlay
    const overlay = document.getElementById('transition-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }

    // Logout thực sự
    AuthUtils.logout();

    // Chuyển về trang chủ sau 800ms
    showOverlayThenNavigate(HOMEPAGE_URL);
  });
});

// 🔹 Đồng bộ UI khi localStorage thay đổi (tab khác)
window.addEventListener('storage', (e) => {
  if (e.key === 'currentUser') {
    updateAuthUI();
  }
});

/* =================== Example Login Form Handler =================== */
/* Thêm vào trang login.html */
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();

    if (!email || !name) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Lưu user + cập nhật UI
    AuthUtils.login({ name, email });

    // Chuyển về trang trước đó hoặc home
    showOverlayThenNavigate(HOMEPAGE_URL);
  });
}
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/68fd00ab603401195169ddbc/1j8e4l8i4';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
// Hiệu ứng load trang khi mới vào
window.addEventListener('load', () => {
  document.body.classList.add('fade-in');
});





//CẬP NHẬT AVT//
function updateAuthUI() {
  const loginLinks  = document.querySelectorAll('a[href*="../Login/login.html"]');
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
// 📍 Khởi tạo logout popup khi trang load
window.addEventListener('load', () => {
  initLogoutPopup();
});

function initLogoutPopup() {
  // Nếu popup đã tồn tại thì không cần tạo lại
  if (document.getElementById('logout-popup')) return;
  
  // 🔹 Tạo phần tử overlay
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

  // 🔹 Thêm CSS trực tiếp bằng JS
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

  // 🔹 Gắn sự kiện cho nút
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
    if (accountAvatar) accountAvatar.style.display = 'none';
const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    const logoutLinks = document.querySelectorAll('a[data-auth="logout"]');
    loginLinks.forEach(link => (link.style.display = 'block'));
    logoutLinks.forEach(link => (link.style.display = 'none'));

    const overlay = document.getElementById('transition-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }

    setTimeout(() => {
      window.location.href = "../../Homepage/ck.html";
    }, 800);
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.removeItem('overlayShown');
    window.location.href = "../../Homepage/ck.html";
  }
}

// 🔹 Xử lý click trên nút logout
document.addEventListener('click', (e) => {
  const logoutBtn = e.target.closest('a[data-auth="logout"]');
  if (!logoutBtn) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const popup = document.getElementById('logout-popup');
  popup.style.display = 'flex';
}, true);

// ✨ Áp dụng hiệu ứng overlay cho TẤT CẢ các thẻ <a> (TRỪ logout)
document.querySelectorAll('a[href]').forEach(link => {
  link.addEventListener('click', function(e) {
    const targetUrl = this.getAttribute('href');
    
    // ❌ BỎ QUA nút đăng xuất
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