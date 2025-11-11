// Nhẹ nhàng đọc người dùng đã đăng nhập từ localStorage (hoặc AuthUtils nếu có)
    window.AuthUtils = window.AuthUtils || {
      getCurrentUser(){
        try{ const raw = localStorage.getItem('currentUser'); return raw? JSON.parse(raw): null }catch{ return null }
      }
    }

    function currentEmail(){
      const me = (AuthUtils.getCurrentUser && AuthUtils.getCurrentUser()) || null;
      const e = me?.email || localStorage.getItem('signedInEmail') || localStorage.getItem('loginEmail');
      return e? String(e).toLowerCase(): null;
    }

    const k = (s)=>`acct:${currentEmail()||'guest'}:${s}`;

    function qs(s,root=document){return root.querySelector(s)}
    function qsa(s,root=document){return [...root.querySelectorAll(s)]}

    // ===== Tabs =====
    function switchTab(id){
      qsa('.tab-btn').forEach(b=>b.setAttribute('aria-selected', String(b.dataset.tab===id)));
      qsa('[data-panel]').forEach(p=>p.hidden = (p.dataset.panel !== id));
      localStorage.setItem('acct:lastTab', id);
    }

    // ===== Profile load/save =====
    function loadProfile(){
      const data = JSON.parse(localStorage.getItem(k('profile'))||'{}');
      qs('#email').value = (data.email || currentEmail() || '');
      qs('#fullName').value = data.fullName||'';
      qs('#dob').value = data.dob||'';
      qs('#phone').value = data.phone||'';
      qs('#gender').value = data.gender||'';
      qs('#bio').value = data.bio||'';
    }
    function saveProfile(){
      const oldEmail = currentEmail();                  
      const newEmail = qs('#email').value.trim().toLowerCase();
      const oldK = s => `acct:${oldEmail||'guest'}:${s}`;
      const profile = {
        email: newEmail,
        fullName: qs('#fullName').value.trim(),
        dob: qs('#dob').value,
        phone: qs('#phone').value.trim(),
        gender: qs('#gender').value,
        bio: qs('#bio').value.trim(),
      };
      if (newEmail && newEmail !== oldEmail) {
        const newK = s => `acct:${newEmail}:${s}`;
        const addrs  = JSON.parse(localStorage.getItem(oldK('addrs'))  || '[]');
        const orders = JSON.parse(localStorage.getItem(oldK('orders')) || '[]');
        localStorage.setItem(newK('profile'), JSON.stringify(profile));
        localStorage.setItem(newK('addrs'), JSON.stringify(addrs));
        localStorage.setItem(newK('orders'), JSON.stringify(orders));
        
        localStorage.removeItem(oldK('profile'));
        localStorage.removeItem(oldK('addrs'));
        localStorage.removeItem(oldK('orders'));
        
        localStorage.setItem('signedInEmail', newEmail);
        const me = (AuthUtils.getCurrentUser && AuthUtils.getCurrentUser()) || {};
        localStorage.setItem('currentUser', JSON.stringify({...me, email: newEmail}));
      } else {
        localStorage.setItem(oldK('profile'), JSON.stringify(profile));
      }
      toast('Đã lưu thông tin tài khoản');}


    // ===== Address book =====
    function loadAddrs(){ return JSON.parse(localStorage.getItem(k('addrs'))||'[]') }
    function saveAddrs(arr){ localStorage.setItem(k('addrs'), JSON.stringify(arr)) }
    function renderAddrs(){
      const box = qs('#addrBox');
      const arr = loadAddrs();
      box.innerHTML = '';
      if(!arr.length){ box.innerHTML = '<p class="muted">Chưa có địa chỉ. Nhấn “Thêm địa chỉ”.</p>'; return }
      arr.forEach((a,i)=>{
        const el = document.createElement('div');
        el.className='addr';
        el.innerHTML = `
          <div class="top">
            <span class="tag">${a.label||'Địa chỉ'}</span>
            <div>
              <button class="btn ghost" data-edit="${i}">Sửa</button>
              <button class="btn ghost" data-del="${i}">Xoá</button>
            </div>
          </div>
          <div class="muted">${a.name||''} • ${a.phone||''}</div>
          <div>${a.line||''}</div>
          <div class="muted">${a.note||''}</div>
        `;
        box.appendChild(el);
      });
    }

    function promptAddr(init={}){
      const name = prompt('Họ tên người nhận', init.name||'')
      if(name===null) return null;
      const phone = prompt('SĐT', init.phone||''); if(phone===null) return null;
      const line = prompt('Địa chỉ', init.line||''); if(line===null) return null;
      const note = prompt('Ghi chú', init.note||''); if(note===null) return null;
      const label = prompt('Nhãn (Nhà/Văn phòng...)', init.label||''); if(label===null) return null;
      return {name,phone,line,note,label};
    }

    // ===== Orders =====
    function loadOrders(){ return JSON.parse(localStorage.getItem(k('orders'))||'[]') }
    function renderOrders(){
      const tb = qs('#ordersBody');
      const arr = loadOrders();
      tb.innerHTML = '';
      if(!arr.length){ tb.innerHTML = '<tr><td colspan="5" class="muted">Chưa có đơn hàng.</td></tr>'; return }
      arr.forEach(o=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>#${o.code}</td><td>${o.date}</td><td>${o.items||1}</td><td>${o.total||'—'}</td><td>${o.status||'Đang xử lý'}</td>`;
        tb.appendChild(tr);
      });
    }

    // ===== tiny toast =====
    function toast(msg){
      let t = qs('#toast');
      if(!t){ t = document.createElement('div'); t.id='toast'; document.body.appendChild(t);
        Object.assign(t.style,{position:'fixed',bottom:'20px',right:'20px',background:'#201a16',color:'#fff',padding:'10px 14px',borderRadius:'12px',boxShadow:'0 10px 30px rgba(0,0,0,.2)',zIndex:9999,opacity:0,transition:'opacity .2s'});
      }
      t.textContent = msg; t.style.opacity=1; setTimeout(()=> t.style.opacity=0, 1200);
    }

    document.addEventListener('DOMContentLoaded',()=>{
      // Tabs
      qsa('.tab-btn').forEach(b=> b.addEventListener('click', ()=> switchTab(b.dataset.tab)));
      switchTab(localStorage.getItem('acct:lastTab') || 'info');

      // Profile
      loadProfile();
      qs('#saveInfo').addEventListener('click', saveProfile);

      // Change password demo
      qs('#changePwd').addEventListener('click', ()=>{
        const ok = confirm('Bạn muốn đặt lại mật khẩu? (demo)');
        if(ok) toast('Đã gửi email đặt lại mật khẩu (demo)');
      });

      // Addresses
      renderAddrs();
      qs('#addAddr').addEventListener('click', ()=>{
        const x = promptAddr(); if(!x) return; const arr = loadAddrs(); arr.unshift(x); saveAddrs(arr); renderAddrs(); toast('Đã thêm địa chỉ');
      });
      qs('#addrBox').addEventListener('click', (e)=>{
        const iDel = e.target.getAttribute('data-del');
        const iEdit = e.target.getAttribute('data-edit');
        if(iDel){ const arr = loadAddrs(); arr.splice(+iDel,1); saveAddrs(arr); renderAddrs(); toast('Đã xoá'); }
        if(iEdit){ const arr = loadAddrs(); const cur = arr[+iEdit]; const x = promptAddr(cur); if(!x) return; arr[+iEdit]=x; saveAddrs(arr); renderAddrs(); toast('Đã cập nhật'); }
      });

      // Orders (demo dữ liệu nếu trống)
      if(!loadOrders().length){
        localStorage.setItem(k('orders'), JSON.stringify([
          {code:'1023', date:'2025-10-14', items:2, total:'299.000đ', status:'Hoàn tất'},
          {code:'0988', date:'2025-10-05', items:1, total:'159.000đ', status:'Đang giao'},
        ]));
      }
      renderOrders();
    })

// ================== CART POPUP ==================
document.addEventListener('DOMContentLoaded', () => {
    const overlayCart = document.getElementById('overlay-cart');
    const drawer = document.getElementById('cart-popup');
    const contentEl = document.getElementById('cart-content');
    const totalEl = document.getElementById('cart-total-amount');
    const countTitle = document.getElementById('cart-count-title');
    const badgeEl = document.getElementById('cart-count');
    const checkout = document.getElementById('checkout-btn');
    const headerCartLink = document.getElementById('cart-link');
  
    if (!overlayCart || !drawer || !contentEl || !totalEl || !checkout || !headerCartLink) {
      console.warn('[NailistasCart] Thiếu HTML fragment.');
      return;
    }
  
    const toNumber = v => Number(String(v).replace(/[^\d.-]/g,'')) || 0;
    const VND = n => (Number(n)||0).toLocaleString('vi-VN')+' VND';
    const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
    const setCart = c => localStorage.setItem('cart', JSON.stringify(c));
    const countCart = c => (c||getCart()).reduce((s,it)=> s + (Number(it.quantity)||0), 0);
    const totalCart = c => (c||getCart()).reduce((s,it)=> s + toNumber(it.price)*(Number(it.quantity)||0), 0);
  
    function renderBadge() {
      const c = countCart();
      if (badgeEl) badgeEl.textContent = c > 99 ? '99+' : String(c);
      if (countTitle) countTitle.textContent = String(c);
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
  
    function openCart() {
      renderPopup();
      overlayCart.classList.add('show');
      drawer.classList.add('open');
    }
    function closeCart() {
      drawer.classList.remove('open');
      overlayCart.classList.remove('show');
    }
  
    overlayCart.addEventListener('click', closeCart);
    drawer.querySelector('.close-btn')?.addEventListener('click', closeCart);
    document.addEventListener('keydown', e => { if(e.key==='Escape') closeCart(); });
  
    headerCartLink.addEventListener('click', e => {
      e.preventDefault();
      openCart();
    });
  
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
  
      const PAYMENT_URL = document.querySelector('meta[name="payment-url"]')?.content || '../Product/html/payment.html';
      window.location.href = PAYMENT_URL;
    });
  
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-add-to-cart');
      if (!btn) return;
  
      const id = btn.dataset.id;
      const name = btn.dataset.name||'';
      const price = toNumber(btn.dataset.price||0);
      const img = btn.dataset.img||'';
      if (!id) { console.warn('[NailistasCart] Thiếu data-id'); return; }
  
      const cart = getCart();
      const k = cart.findIndex(it => String(it.id) === String(id));
      if (k!==-1) cart[k].quantity +=1;
      else cart.push({id,name,price,img,quantity:1});
      setCart(cart);
      renderBadge();
      openCart();
    });
  
    window.addEventListener('storage', e => {
      if(e.key==='cart') renderBadge();
    });
  
    renderBadge();
  });
  
  const getImageById = id => `Product/images/${id}.jpg`;
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add-to-cart');
    if (!btn) return;
  
    const id = btn.dataset.id;
    const name = btn.dataset.name || '';
    const price = toNumber(btn.dataset.price || 0);
  
    const img = getImageById(id); // lấy đúng ảnh trong product/images
  
    if (!id) { console.warn('[NailistasCart] Thiếu data-id'); return; }
  
    const cart = getCart();
    const k = cart.findIndex(it => String(it.id) === String(id));
    if (k !== -1) cart[k].quantity += 1;
    else cart.push({ id, name, price, img, quantity: 1 });
  
    setCart(cart);
    renderBadge();
    openCart();
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    const currentUser = JSON.parse(localStorage.getItem("sv_current_user") || "null");
    if (!currentUser) {
      alert("Bạn chưa đăng nhập!");
      window.location.href = "../Login/login.html";
      return;
    }
  
    const profile = JSON.parse(localStorage.getItem(`acct:${currentUser.email}:profile`) || "{}");
  
    document.getElementById("email").value    = profile.email || currentUser.email;
    document.getElementById("fullName").value = profile.fullName || currentUser.name;
    document.getElementById("dob").value      = profile.dob || "";
    document.getElementById("phone").value    = profile.phone || "";
    document.getElementById("gender").value   = profile.gender || "";
    document.getElementById("bio").value      = profile.bio || "";
  });
  
  // Save info
  document.getElementById("saveInfo").addEventListener("click", () => {
    const currentUser = JSON.parse(localStorage.getItem("sv_current_user") || "null");
    if (!currentUser) return;
  
    const profile = {
      email: document.getElementById("email").value.trim(),
      fullName: document.getElementById("fullName").value.trim(),
      dob: document.getElementById("dob").value,
      phone: document.getElementById("phone").value.trim(),
      gender: document.getElementById("gender").value,
      bio: document.getElementById("bio").value.trim()
    };
  
    localStorage.setItem(`acct:${currentUser.email}:profile`, JSON.stringify(profile));
    alert("Đã lưu thông tin tài khoản!");
  });
  
// ===== Check login =====
document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("sv_current_user") || "null");
  if (!currentUser) {
    alert("Bạn chưa đăng nhập!");
    window.location.href = "../Login/login.html";
    return;
  }

  // Hiển thị thông tin profile
  const profile = JSON.parse(localStorage.getItem(`acct:${currentUser.email}:profile`) || "{}");
  document.getElementById("email").value    = profile.email || currentUser.email;
  document.getElementById("fullName").value = profile.fullName || currentUser.name;
  document.getElementById("dob").value      = profile.dob || "";
  document.getElementById("phone").value    = profile.phone || "";
  document.getElementById("gender").value   = profile.gender || "";
  document.getElementById("bio").value      = profile.bio || "";

  // Hiển thị nút logout
  document.querySelector('[data-auth="logout"]').style.display = "inline-block";
});

// ===== Lưu info =====
document.getElementById("saveInfo").addEventListener("click", () => {
  const currentUser = JSON.parse(localStorage.getItem("sv_current_user") || "null");
  if (!currentUser) return;

  const profile = {
    email: document.getElementById("email").value.trim(),
    fullName: document.getElementById("fullName").value.trim(),
    dob: document.getElementById("dob").value,
    phone: document.getElementById("phone").value.trim(),
    gender: document.getElementById("gender").value,
    bio: document.getElementById("bio").value.trim()
  };

  localStorage.setItem(`acct:${currentUser.email}:profile`, JSON.stringify(profile));
  alert("Đã lưu thông tin tài khoản!");
});

// ===== Đổi mật khẩu =====
document.getElementById("changePwd").addEventListener("click", () => {
  const currentUser = JSON.parse(localStorage.getItem("sv_current_user") || "null");
  if (!currentUser) return;

  const oldPw = prompt("Nhập mật khẩu hiện tại:");
  const users = JSON.parse(localStorage.getItem("sv_users") || "[]");
  const userIndex = users.findIndex(u => u.email === currentUser.email);

  if (userIndex === -1) {
    alert("Người dùng không tồn tại!");
    return;
  }

  // Check mật khẩu cũ
  const hashedOldPw = AuthUtils.hashPassword(oldPw);
  if (users[userIndex].pw !== hashedOldPw) {
    alert("Mật khẩu cũ không đúng!");
    return;
  }

  // Nhập mật khẩu mới
  const newPw = prompt("Nhập mật khẩu mới (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt):");
  if (!newPw || newPw.length < 8) {
    alert("Mật khẩu không hợp lệ!");
    return;
  }

  // Update
  users[userIndex].pw = AuthUtils.hashPassword(newPw);
  localStorage.setItem("sv_users", JSON.stringify(users));
  alert("Đổi mật khẩu thành công!");
});

// Khởi tạo avatar từ localStorage
function loadAvatar() {
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarAvatarEls = document.querySelectorAll('.account-avatar');

  const avatarData = localStorage.getItem('user_avatar');
  if (avatarData) {
    avatarPreview.style.backgroundImage = `url(${avatarData})`;
    avatarPreview.textContent = '';
    avatarAvatarEls.forEach(el => {
      el.style.backgroundImage = `url(${avatarData})`;
      el.textContent = '';
    });
  } else {
    avatarPreview.style.backgroundImage = '';
    avatarPreview.textContent = '+';
    avatarAvatarEls.forEach(el => el.style.backgroundImage = '');
  }
}

// Chọn file avatar
document.getElementById('avatarPreview')?.addEventListener('click', () => {
  document.getElementById('avatarInput').click();
});

document.getElementById('avatarInput')?.addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    // Lưu vào localStorage
    localStorage.setItem('user_avatar', dataUrl);
    // Cập nhật UI
    loadAvatar();
  }
  reader.readAsDataURL(file);
});

// Gọi khi load trang
document.addEventListener('DOMContentLoaded', loadAvatar);

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
