// ===== Utilities =====
const $  = (sel, parent=document) => parent.querySelector(sel);
const $$ = (sel, parent=document) => Array.from(parent.querySelectorAll(sel));

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ===== Users "database": localStorage (bền) + sessionStorage (tạm) =====
function loadUsers(){
  let local = [], sess = [];
  try { local = JSON.parse(localStorage.getItem("sv_users") || "[]"); } catch {}
  try { sess  = JSON.parse(sessionStorage.getItem("sv_users") || "[]"); } catch {}
  // Gộp theo email, ưu tiên phiên bản session (tạm) ghi đè
  const map = new Map();
  [...local, ...sess].forEach(u => { if (u?.email) map.set(u.email, u); });
  return Array.from(map.values());
}
function saveUsers(list){ localStorage.setItem("sv_users", JSON.stringify(list)); }
function saveUsersTemp(list){ sessionStorage.setItem("sv_users", JSON.stringify(list)); }

// ===== Hash demo (KHÔNG dùng production) =====
function hashPassword(pw){
  return btoa(unescape(encodeURIComponent(pw))).split("").reverse().join("");
}

// ===== Toggle eye buttons =====
function initToggleEye(){
  $$(".toggle-eye").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.for;
      const input = document.getElementById(id);
      if (!input) return;
      input.type = (input.type === "password") ? "text" : "password";
    });
  });
}

// ===== Password strength meter =====
function initPasswordStrength(inputId, barId, hintId){
  const input = document.getElementById(inputId);
  const bar   = document.getElementById(barId);
  const hint  = document.getElementById(hintId);
  if(!input || !bar || !hint) return;

  input.addEventListener("input", e => {
    const v = e.target.value;
    let score = 0;
    if(v.length >= 8) score++;
    if(/[A-Z]/.test(v)) score++;
    if(/[a-z]/.test(v)) score++;
    if(/[0-9]/.test(v)) score++;
    if(/[^A-Za-z0-9]/.test(v)) score++;
    const pct = Math.min(100, score*20);
    bar.style.width = pct + "%";
    hint.textContent = "Độ mạnh: " + (pct<40 ? "yếu" : pct<80 ? "trung bình" : "mạnh");
  });
}


// ===== Current user: lưu role cũng vào localStorage =====
function setCurrentUser(user){
  if (!user) return;
  localStorage.setItem("sv_current_user", JSON.stringify({
    name: user.name || "",
    email: user.email || "",
    role: user.role || "user"
  }));
}
function getCurrentUser(){
  try { return JSON.parse(localStorage.getItem("sv_current_user") || "null"); }
  catch { return null; }
}
function clearCurrentUser(){
  localStorage.removeItem("sv_current_user");
}
// (Duplicate current-user helpers removed — one set above is sufficient)

/* ✅ THÊM MỚI: Đăng xuất chuẩn */
function logout(options = { clearAll: false }) {
  try {
    // Xóa user hiện tại
    clearCurrentUser();

    // Xóa thêm các phiên tạm (phòng khi có dùng)
    sessionStorage.removeItem("sv_users");

    // Nếu muốn “sạch sẽ” hơn thì clear luôn các key có thể dùng
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    // Tùy chọn: xóa toàn bộ user local (ít khi cần)
    if (options.clearAll) {
      localStorage.removeItem("sv_users");
    }
  } catch (e) {
    console.error("Auth logout error:", e);
  }
}




// ===== Export =====
window.AuthUtils = {
  $, $$, emailRe,
  loadUsers, saveUsers, saveUsersTemp,
  hashPassword,
  initToggleEye, initPasswordStrength,
  setCurrentUser, getCurrentUser, clearCurrentUser,
  logout 
};
// No automatic set of current user at module load — setCurrentUser should be called
// only when a real user object exists (e.g., after login/registration).

// Function to go to a specific page (goHome) with transition effect
function goHome() {
  const overlay = document.getElementById('transition-overlay');
  overlay.style.display = 'flex'; // Show the overlay
  overlay.style.opacity = '1';    // Make the overlay visible
  setTimeout(() => {
    try {
      // Compute homepage URL relative to the current document pathname so
      // pages at different depths correctly reach the real Homepage/ck.html
      const marker = '/NAILISTAS---WEBSITE-main';
      const p = window.location.pathname || '';
      const idx = p.indexOf(marker);
      const base = idx >= 0 ? p.slice(0, idx + marker.length) : '';
      const homepage = window.location.origin + base + '/Homepage/ck.html';
      window.location.href = homepage;
    } catch (e) {
      // Fallback: try a root-relative path
      window.location.href = window.location.origin + '/Homepage/ck.html';
    }
  }, 800); // Wait for 800ms to let the overlay transition
}

function login(email, pw) {
  const users = AuthUtils.loadUsers();

  // Kiểm tra user có tồn tại
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if(user){
    // So sánh mật khẩu
    if(AuthUtils.hashPassword(pw) !== user.pw){
      alert("Mật khẩu không đúng!");
      return;
    }
  } else {
    // Nếu user chưa có, tạo mới
    user = {
      name: "Người dùng mới", // bạn có thể đổi tên mặc định
      email: email.toLowerCase(),
      pw: AuthUtils.hashPassword(pw),
      role: "user",
      createdAt: Date.now()
    };
    users.push(user);
    AuthUtils.saveUsers(users); // lưu lại vào localStorage
  }

  // Lưu current user
  AuthUtils.setCurrentUser(user);

  // Chuyển trang
  goHome();
}

// (Removed stray login-success demo block; use AuthUtils.setCurrentUser or
// handleLoginSuccess(user) in the real login flow instead.)
// Tạo confetti petals
function launchRosePetals(count = 40) {
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'rose-petal';
    petal.style.left = Math.random() * window.innerWidth + 'px';
    petal.style.animationDuration = (2 + Math.random() * 3) + 's'; // 2-5s
    petal.style.animationDelay = (Math.random() * 0.5) + 's';
    petal.style.setProperty('--rand', Math.random()); // gán giá trị ngẫu nhiên cho CSS
    document.body.appendChild(petal);

    petal.addEventListener('animationend', () => petal.remove());
  }
}

// Hiệu ứng khi logout
function logoutWithEffect() {
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('logout');
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  launchRosePetals(50); // Confetti màu tối

  setTimeout(() => {
    AuthUtils.logout();
    goHome();
  }, 800);
}

// Gắn sự kiện cho nút logout
const logoutBtn = document.querySelector('[data-auth="logout"]');
if (logoutBtn) logoutBtn.addEventListener('click', e => { 
  e.preventDefault(); 
  logoutWithEffect(); 
});

// Hiệu ứng khi login thành công (không gọi goHome bên trong)
function loginSuccessEffect(count = 100) {
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.remove('logout');
  overlay.style.backgroundColor = 'var(--primary)';
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  launchRosePetals(count);

  // Ẩn overlay sau animation
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 1500);
}

// Login thành công
function handleLoginSuccess(user) {
  if (user.role === 'admin') {
    const goAdmin = confirm(
      "Bạn đăng nhập bằng tài khoản Admin.\nOK = vào Admin Dashboard. Cancel = vào Trang chủ."
    );

    loginSuccessEffect(); // hiệu ứng confetti trước

    setTimeout(() => {
      if (goAdmin) {
        window.location.href = "../Admin/admin.html";
      } else {
        goHome();
      }
    }, 1200);
  } else {
    loginSuccessEffect();
    setTimeout(() => goHome(), 1200);
  }
}

