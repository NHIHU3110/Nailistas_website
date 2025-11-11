document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('formDatLich');
  const formContainer = document.getElementById('formContainer');
  const overlayError = document.getElementById('overlayError');
  const overlaySuccess = document.getElementById('overlaySuccess');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const soDienThoai = document.getElementById('soDienThoai').value.trim();
      const ngayInput = document.getElementById('ngay').value;
      const gioInput = document.getElementById('gio').value;

      // Kiểm tra số điện thoại (chỉ số)
      if (!/^\d+$/.test(soDienThoai)) {
        showError();
        return;
      }

      // Kiểm tra ngày (không cho quá khứ)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ngayChon = new Date(ngayInput);
      if (isNaN(ngayChon.getTime()) || ngayChon < today) {
        showError();
        return;
      }

      // Kiểm tra giờ trong quá khứ (nếu đặt hôm nay)
      const [gio, phut] = (gioInput || '').split(':').map(Number);
      const now = new Date();
      if (
        ngayChon.toDateString() === now.toDateString() &&
        (gio < now.getHours() || (gio === now.getHours() && phut <= now.getMinutes()))
      ) {
        showError();
        return;
      }

      // Khung giờ làm việc: 8:00 – 17:30
      const trongGio = gio >= 8 && (gio < 17 || (gio === 17 && phut <= 30));
      if (!trongGio) {
        showError();
        return;
      }

      showSuccess();
      form.reset();
    });
  }

  function showError() {
    if (overlayError) overlayError.style.display = 'flex';
    if (formContainer) formContainer.style.filter = 'brightness(50%)';
  }
  window.closeError = function () {
    if (overlayError) overlayError.style.display = 'none';
    if (formContainer) formContainer.style.filter = 'brightness(100%)';
  };

  function showSuccess() {
    if (overlaySuccess) overlaySuccess.style.display = 'flex';
    if (formContainer) formContainer.style.filter = 'brightness(50%)';
  }
  window.closeSuccess = function () {
    if (overlaySuccess) overlaySuccess.style.display = 'none';
    if (formContainer) formContainer.style.filter = 'brightness(100%)';
  };

  // Tawk embed removed from this file to avoid duplicate initialization (centralized in Homepage/ck.js)

  // 🔑 Cập nhật giao diện sau khi DOM + auth đã sẵn sàng
  updateAuthUI();
}); // <-- đây là dấu đóng DUY NHẤT cho DOMContentLoaded


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

var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/68fd00ab603401195169ddbc/1j8e4l8i4';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();