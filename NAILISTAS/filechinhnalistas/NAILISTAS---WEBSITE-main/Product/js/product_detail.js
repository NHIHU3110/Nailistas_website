const HOMEPAGE_URL = '/Homepage/ck.html';

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
// 🔹 Logo → về trang chủ với overlay
// 🔹 Dùng cho inline onclick="goHome()"
function goHome(){
  showOverlayThenNavigate(HOMEPAGE_URL);
}

// 🔹 Overlay chuyển trang cho các link header có data-transition
(function attachHeaderTransitions(){
  const overlay = document.getElementById('transition-overlay');
  function showOverlayThenNavigate(url){
    if (!overlay) { window.location.href = url; return; }
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    setTimeout(()=>{ window.location.href = url; }, 800);
  }
  document.querySelectorAll('header a[data-transition]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const url = a.getAttribute('href');
      if (!url) return;
      // Nếu là link giỏ hàng, ta sẽ chặn riêng ở handler dưới
      if (a.id === 'cart-link') return;
      e.preventDefault();
      showOverlayThenNavigate(url);
    });
  });
})();

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

document.getElementById("back-button").onclick = () => {
  if (document.referrer) window.history.back();
  else window.location.href = "Product.html";
};

// ===== Drawer state & helpers (GIỮ localStorage key "cart") =====
const cartOverlay = document.getElementById('overlay');
const cartPopup = document.getElementById('cart-popup');
const cartContent = document.getElementById('cart-content');
const cartTotalEl = document.getElementById('cart-total-amount');
const cartCountTitle = document.getElementById('cart-count-title');
const cartCountEl = document.getElementById('cart-count');

const VND = (n) => (Number(n)||0).toLocaleString('vi-VN') + ' VND';
const toNumber = (x) => typeof x === 'number' ? x : Number(String(x).replace(/[^0-9.-]/g,'')) || 0;

function getCart(){ return JSON.parse(localStorage.getItem('cart') || '[]'); }
function setCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); }
function countCart(cart = getCart()){ return cart.reduce((s,it)=> s + (Number(it.quantity)||0), 0); }
function totalCart(cart = getCart()){ return cart.reduce((s,it)=> s + toNumber(it.price) * (Number(it.quantity)||0), 0); }

function renderCartBadge(){
  if (!cartCountEl) return;
  const c = countCart();
  cartCountEl.textContent = c > 99 ? '99+' : String(c);
}

function renderCartPopup(){
  const cart = getCart();
  cartContent.innerHTML = '';
  if(cart.length === 0){
    cartContent.innerHTML = '<p style="padding:12px 4px;color:#666;">Giỏ hàng trống.</p>';
    cartCountTitle.textContent = '0';
    cartTotalEl.textContent = VND(0);
    document.getElementById('checkout-btn').disabled = true;
    return;
  }
  document.getElementById('checkout-btn').disabled = false;

  cart.forEach((it)=>{
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${it.img}" alt="${it.name}">
      <div class="cart-item-info">
        <h4>${it.name}</h4>
        <div class="bottom-row">
          <div class="quantity-box" data-id="${it.id}">
            <button class="qty-btn" data-action="dec">−</button>
            <input type="number" class="qty-input" value="${it.quantity}" readonly/>
            <button class="qty-btn" data-action="inc">+</button>
          </div>
          <p>${VND(it.price)}</p>
        </div>
      </div>
      <button class="remove-btn" title="Xóa" aria-label="Xóa" data-action="remove" data-id="${it.id}">×</button>
    `;
    cartContent.appendChild(row);
  });
  cartCountTitle.textContent = String(countCart(cart));
  cartTotalEl.textContent = VND(totalCart(cart));
}

function openCartPopup(){
  renderCartPopup();
  cartOverlay.classList.add('show');
  cartPopup.classList.add('open');
}
function closeCartPopup(){
  cartPopup.classList.remove('open');
  cartOverlay.classList.remove('show');
}

cartOverlay.addEventListener('click', closeCartPopup);
cartPopup.querySelector('.close-btn').addEventListener('click', closeCartPopup);
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeCartPopup(); });

// Delegated events trong drawer: +/−/xóa
cartContent.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const id = btn.getAttribute('data-id') || btn.parentElement.getAttribute('data-id');
  const cart = getCart();
  const idx = cart.findIndex(x=> String(x.id) === String(id));
  if(idx === -1) return;

  if(action === 'inc') cart[idx].quantity++;
  if(action === 'dec') cart[idx].quantity = Math.max(1, cart[idx].quantity - 1);
  if(action === 'remove') cart.splice(idx,1);

  setCart(cart);
  renderCartBadge();
  renderCartPopup();
});

// Checkout
// === Checkout → chuyển sang payment kèm dữ liệu ===
(function () {
  const btn = document.getElementById('checkout-btn');
  if (!btn) return;

  const PAYMENT_URL = '../html/payment.html'; // chỉnh đường dẫn nếu khác

  const toNumber = v => Number(String(v).replace(/[^\d.-]/g, '')) || 0;

  btn.addEventListener('click', (e) => {
    e.preventDefault();

    // 1) Lấy giỏ hàng từ localStorage
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
    const shipping = 15000;               // payment sẽ tự tính lại theo lựa chọn
    const total = subtotal + shipping;
    const payload = {
      items, subtotal, shipping, total,
      currency: 'VND', locale: 'vi-VN', savedAt: new Date().toISOString()
    };

    // 3) Ghi vào sessionStorage + lưu trang nguồn
    sessionStorage.setItem('checkoutData', JSON.stringify(payload));
    sessionStorage.setItem('paymentOrigin', location.href);

    // 4) Điều hướng sang Payment
    window.location.href = PAYMENT_URL;
  });
})();


// Link giỏ hàng trên header → mở drawer (chặn điều hướng)
const headerCartLink = document.getElementById('cart-link');
if (headerCartLink) {
  headerCartLink.addEventListener('click', (e)=>{
    e.preventDefault(); e.stopPropagation();
    openCartPopup();
  }, true);
}

// ===== Tải chi tiết sản phẩm + gợi ý (giữ nguyên logic) =====
const loadingMsg = document.getElementById('loading-message');

fetch('../data/products.json')
  .then(response => {
    if (!response.ok) throw new Error("Không thể tải dữ liệu sản phẩm");
    return response.json();
  })
  .then(products => {
    const product = products[id];
    const productDetail = document.getElementById("product-detail");

    loadingMsg.style.display = "none";
    renderCartBadge(); // ✅ show badge theo cart hiện tại

    if (!product) {
      productDetail.innerHTML = `<p style="text-align:center; color:#9F4E6E;">Không tìm thấy sản phẩm này.</p>`;
      return;
    }

    // Breadcrumb
    let categoryName = "", categoryLink = "#";
    switch (product.type) {
      case "polish":    categoryName = "Sản phẩm sơn móng"; categoryLink = "../html/nail_polish.html"; break;
      case "tool":      categoryName = "Dụng cụ cơ bản";    categoryLink = "../html/basic_tools.html"; break;
      case "fake_nail": categoryName = "Sản phẩm Nailbox";  categoryLink = "../html/fake_nails.html"; break;
    }
    const breadcrumbContainer = document.createElement("div");
    breadcrumbContainer.className = "breadcrumb-container";
    const breadcrumb = document.createElement("div");
    breadcrumb.className = "breadcrumb";
    breadcrumb.innerHTML = `
      <a href="ck.html">Nailistas</a> /
      <a href="${categoryLink}">${categoryName}</a> /
      <span>${product.name}</span>
    `;
    breadcrumbContainer.appendChild(breadcrumb);
    const main = document.querySelector("main");
    main.insertBefore(breadcrumbContainer, productDetail);

    // Giá
    let priceNumber = 0;
    if (typeof product.price === "string") {
      const digits = product.price.replace(/[^\d]/g, "");
      priceNumber = digits ? parseInt(digits,10) : 0;
    } else if (typeof product.price === "number") {
      priceNumber = product.price;
    }
    const formattedPrice = priceNumber ? priceNumber.toLocaleString("vi-VN") + " VND" : "Đang cập nhật";

    // Render chi tiết
    productDetail.innerHTML = `
      <div class="product-image">
        <img src="${product.img}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h2>${product.name}</h2>
        <div class="price">Giá: ${formattedPrice}</div>
        <p>${product.desc || "Mô tả đang cập nhật."}</p>
        <div class="action-buttons">
          <div class="quantity-container">
            <button class="qty-btn" id="minus-btn"><img src="../images/minus.png" alt="-"></button>
            <input type="number" id="quantity" value="1" min="1">
            <button class="qty-btn" id="plus-btn"><img src="../images/plus.png" alt="+"></button>
          </div>
          <div class="btn-cart">
            <img src="../images/cart.png" alt="Thêm vào giỏ">
          </div>
        </div>
      </div>
    `;

    // +/- số lượng
    const minusBtn = document.getElementById("minus-btn");
    const plusBtn = document.getElementById("plus-btn");
    const quantityInput = document.getElementById("quantity");
    minusBtn.onclick = () => { let v = parseInt(quantityInput.value,10) || 1; if (v>1) quantityInput.value = v-1; };
    plusBtn.onclick = () => { let v = parseInt(quantityInput.value,10) || 1; quantityInput.value = v+1; };

    // Thêm giỏ hàng → mở drawer
    const addBtn = document.querySelector(".btn-cart img");
    addBtn.onclick = () => {
      const quantity = parseInt(quantityInput.value,10) || 1;
      const cart = getCart();
      const idx = cart.findIndex(item => String(item.id) === String(id));
      if (idx !== -1) cart[idx].quantity += quantity;
      else cart.push({ id, name: product.name, img: product.img, price: priceNumber, quantity });

      setCart(cart);
      renderCartBadge();
      openCartPopup();
    };

    // Carousel gợi ý (vẫn có overlay khi navigate)
    const overlay = document.getElementById('transition-overlay');
    const showOverlayThenNavigate = (url)=>{
      if (!overlay) { window.location.href = url; return; }
      overlay.style.display = 'flex'; overlay.style.opacity = '1';
      setTimeout(()=>{ window.location.href = url; }, 800);
    };

    const carousel = document.getElementById("recommendation-carousel");
    let keys = Object.keys(products).filter(key => key !== id);
    keys.sort(() => Math.random() - 0.5);
    keys = keys.slice(0, 9);

    keys.forEach(key => {
      const p = products[key];
      let pPrice = 0;
      if (typeof p.price === "string") {
        const digits = p.price.replace(/[^\d]/g, "");
        pPrice = digits ? parseInt(digits,10) : 0;
      } else if (typeof p.price === "number") {
        pPrice = p.price;
      }

      const card = document.createElement("div");
      card.className = "carousel-card";
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p>${pPrice.toLocaleString("vi-VN")} VND</p>
      `;
      card.onclick = () => showOverlayThenNavigate(`Product_detail.html?id=${key}`);
      carousel.appendChild(card);
    });

    document.getElementById("arrow-left").onclick = () =>
      carousel.scrollBy({ left: -220, behavior: 'smooth' });
    document.getElementById("arrow-right").onclick = () =>
      carousel.scrollBy({ left: 220, behavior: 'smooth' });
  })
  .catch(err => {
    console.error("Lỗi load sản phẩm:", err);
    const loadingMsg = document.getElementById('loading-message');
    if (loadingMsg) loadingMsg.textContent = "Không thể tải dữ liệu sản phẩm.";
  });

/* 🔹 Nút lên đầu trang */
const scrollTopBtn = document.getElementById("scrollTopBtn");
window.addEventListener("scroll", () => {
  if (document.documentElement.scrollTop > 200) scrollTopBtn.classList.add("show");
  else scrollTopBtn.classList.remove("show");
});
scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ================== REVIEW MODULE (giữ nguyên logic cũ) ================== */
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  if (!productId) { console.error("❌ Không tìm thấy productId trong URL"); return; }

  const reviewBtn = document.getElementById("leave-review-btn");
  const popup = document.getElementById("review-popup");
  const closeBtn = document.getElementById("close-popup");
  const form = document.getElementById("review-form");
  const reviewList = document.getElementById("review-list");
  let selectedRating = 0;

  document.querySelectorAll(".star-rating span").forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = star.dataset.value;
      document.querySelectorAll(".star-rating span").forEach(s => {
        s.classList.toggle("active", s.dataset.value <= selectedRating);
      });
    });
  });

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function loadReviews() {
    let reviews = JSON.parse(localStorage.getItem("reviews_" + productId)) || [];
    reviewList.innerHTML = "";

    const filterStar = document.getElementById("filter-star")?.value || "all";
    const filterTime = document.getElementById("filter-time")?.value || "newest";

    if (filterStar !== "all") reviews = reviews.filter(r => r.rating === parseInt(filterStar,10));
    reviews.sort((a, b) => filterTime === "newest" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

    if (reviews.length === 0) {
      reviewList.innerHTML = "<p class='review-message'>Chưa có đánh giá nào cho sản phẩm này.</p>";
    } else {
      reviews.forEach(r => {
        const item = document.createElement("div");
        item.classList.add("review-item");
        item.innerHTML = `
          <strong>${escapeHTML(r.name)}</strong> (${escapeHTML(r.email)})<br>
          <span>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span><br>
          <p>${escapeHTML(r.content)}</p>
          <small class="review-date">${new Date(r.date).toLocaleDateString("vi-VN")}</small>
        `;
        reviewList.prepend(item);
      });
      reviewBtn.textContent = "Để lại đánh giá khác";
    }
  }

  loadReviews();
  document.getElementById("filter-star")?.addEventListener("change", loadReviews);
  document.getElementById("filter-time")?.addEventListener("change", loadReviews);

  function updateReviewSummary() {
    const reviews = JSON.parse(localStorage.getItem("reviews_" + productId)) || [];
    const count = reviews.length;
    const avg = count ? (reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1) : "0.0";
    const reviewCountEl = document.getElementById("review-count");
    const avgRatingEl = document.getElementById("average-rating");
    if (reviewCountEl) reviewCountEl.textContent = `Reviews (${count})`;
    if (avgRatingEl) avgRatingEl.textContent = `${avg} ★★★★★`;
  }
  updateReviewSummary();

  reviewBtn.addEventListener("click", () => {
    popup.style.display = "flex";
    selectedRating = 0;
    document.querySelectorAll(".star-rating span").forEach(s => s.classList.remove("active"));
    form.reset();
  });
  closeBtn.addEventListener("click", () => popup.style.display = "none");
  window.addEventListener("click", e => { if (e.target === popup) popup.style.display = "none"; });

  function showPopup(message, isError = false) {
    const successPopup = document.getElementById("review-success-popup");
    const msg = document.getElementById("success-popup-message");
    msg.textContent = message;
    successPopup.querySelector(".success-popup-content").style.background = isError ? "#ffecec" : "#fff";
    successPopup.classList.add("show");
    setTimeout(() => successPopup.classList.remove("show"), 2000);
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const content = document.getElementById("review-content").value.trim();

    if (!selectedRating) { showPopup("Vui lòng chọn số sao đánh giá!", true); return; }
    const reviews = JSON.parse(localStorage.getItem("reviews_" + productId)) || [];
    if (reviews.some(r => r.email === email)) { showPopup("Email này đã đánh giá sản phẩm rồi!", true); return; }

    const newReview = { name, email, content, rating: parseInt(selectedRating,10), date: new Date() };
    reviews.unshift(newReview);
    localStorage.setItem("reviews_" + productId, JSON.stringify(reviews));

    const avg = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    const ratings = JSON.parse(localStorage.getItem("ratings") || "{}");
    ratings[productId] = avg;
    localStorage.setItem("ratings", JSON.stringify(ratings));
    window.dispatchEvent(new StorageEvent("storage", { key: "ratings", newValue: JSON.stringify(ratings) }));

    popup.style.display = "none";
    loadReviews();
    updateReviewSummary();
    showPopup("Cảm ơn bạn đã gửi đánh giá ");
  });
});

// ✅ Đồng bộ badge/drawer khi storage thay đổi (tab khác)
window.addEventListener('storage', (e)=>{
  if(e.key === 'cart'){ renderCartBadge(); if(cartPopup.classList.contains('open')) renderCartPopup(); }
});

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
//function goHome() {
//  const overlay = document.getElementById('transition-overlay');
//  overlay.style.display = 'flex'; // Show the overlay
//  overlay.style.opacity = '1';    // Make the overlay visible
//  setTimeout(() => {
//    window.location.href = "../../Homepage/ck.html";  // Redirect to the desired page after 800ms
//  }, 800); // Wait for 800ms to let the overlay transition
//}

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
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/68fd00ab603401195169ddbc/1j8e4l8i4';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();