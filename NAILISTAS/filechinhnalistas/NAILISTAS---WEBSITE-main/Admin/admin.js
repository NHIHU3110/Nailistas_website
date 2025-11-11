function showSectionFromHash() {
    const hash = window.location.hash || '#dashboard';
    const id = hash.replace('#', '');
    document.querySelectorAll('main section').forEach(sec => sec.hidden = true);
    const activeSec = document.getElementById(id);
    if (activeSec) activeSec.hidden = false;
    document.querySelectorAll('aside .nav a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`aside .nav a[href="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');
  }
  window.addEventListener('load', showSectionFromHash);
  window.addEventListener('hashchange', showSectionFromHash);


    // --- Utilities ---
    const qs = (q, root=document) => root.querySelector(q);
    const qsa = (q, root=document) => Array.from(root.querySelectorAll(q));
    const money = v => (v||0).toLocaleString('vi-VN') + '₫';
    const uid = (p='AP') => p + Math.random().toString(36).slice(2,8).toUpperCase();

    const store = {
      get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d } },
      set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
    }

    // --- Seeds ---
    const defaultServices = [
      {code:'S01', name:'Sơn gel cơ bản', price:150000},
      {code:'S02', name:'Vẽ hoạ tiết', price:80000},
      {code:'S03', name:'Đắp bột', price:250000},
      {code:'S04', name:'Cắt da + dưỡng', price:100000}
    ];

    function seedServices(){
      if(!store.get('services')) store.set('services', defaultServices);
      renderServices();
      fillServiceSelect();
    }

    // --- Renderers ---
    function renderServices(){
      const services = store.get('services', defaultServices);
      const box = qs('#servicesList');
      box.innerHTML = '';
      services.forEach(s=>{
        const row = document.createElement('div');
        row.style.display='grid';
        row.style.gridTemplateColumns='1fr auto';
        row.style.alignItems='center';
        row.style.gap='8px';
        row.innerHTML = `<div><b>${s.name}</b><div style="color:var(--tx-muted); font-size:12px">Mã ${s.code} • ${money(s.price)}</div></div>`+
                        `<button class="btn" onclick="addApptWith('${s.code}')">Đặt nhanh</button>`
        box.appendChild(row);
      })
    }

    function fillServiceSelect(){
      const sel = qs('#f_service');
      const services = store.get('services', defaultServices);
      sel.innerHTML = services.map(s=>`<option value="${s.code}" data-price="${s.price}">${s.name} — ${money(s.price)}</option>`).join('');
    }

    function renderCustomers(){
      const cust = store.get('customers', []);
      const tbody = qs('#custBody');
      tbody.innerHTML = '';
      cust.forEach(c=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${c.name}</td>
          <td>${c.phone||''}</td>
          <td>${c.visits||0}</td>
          <td>${c.note||''}</td>
          <td><button class="btn" onclick="quickBook('${c.id}')">Đặt lịch</button></td>`
        tbody.appendChild(tr);
      })
    }

    function renderAppointments(){
      const appts = store.get('appts', []);
      const tbody = qs('#apptBody');
      tbody.innerHTML='';
      appts.sort((a,b)=> new Date(a.time) - new Date(b.time));
      appts.forEach(a=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${a.code}</td>
          <td>${a.name}<div style="color:var(--tx-muted); font-size:12px">${a.phone||''}</div></td>
          <td>${serviceName(a.service)}<div style="color:var(--tx-muted); font-size:12px">${money(a.price)}</div></td>
          <td>${a.staff||'-'}</td>
          <td>${fmtTime(a.time)}</td>
          <td>${money(a.price)}</td>
          <td><span class="status ${a.status}">${labelStatus(a.status)}</span></td>
          <td>
            <button class="btn" onclick="markDone('${a.code}')">Hoàn tất</button>
            <button class="btn" onclick="cancelAppt('${a.code}')">Huỷ</button>
          </td>`
        tbody.appendChild(tr);
      })
      refreshKPIs();
    }

    function fmtTime(t){
      if(!t) return '-';
      const d = new Date(t);
      return d.toLocaleString('vi-VN',{hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'});
    }
    function serviceName(code){
      const s = store.get('services', defaultServices).find(x=>x.code===code);
      return s? s.name : code;
    }
    function labelStatus(s){
      return s==='done'?'Hoàn tất': s==='cancel'?'Huỷ': 'Đã đặt';
    }

    // --- KPI ---
    function refreshKPIs(){
      const appts = store.get('appts', []);
      const today = new Date();
      const isToday = a => new Date(a.time).toDateString() === today.toDateString();
      const todays = appts.filter(isToday);
      qs('#kpiBookings').textContent = todays.length;
      const revenue = todays.reduce((sum,a)=> a.status!=='cancel' ? sum + (+a.price||0) : sum, 0);
      qs('#kpiRevenue').textContent = money(revenue);
      qs('#kpiUtil').textContent = Math.min(100, Math.round(todays.length/16*100)) + '%';
      // count new customers (first appointment in last 7 days)
      const since = new Date(); since.setDate(since.getDate()-7);
      const newCusts = new Set(appts.filter(a=> new Date(a.time)>=since).map(a=>a.phone||a.name));
      qs('#kpiNew').textContent = newCusts.size;
    }

    // --- Actions ---
    function openModal(id){ qs('#'+id).classList.add('open'); }
    function closeModal(id){ qs('#'+id).classList.remove('open'); }

    function saveAppt(){
      const code = uid('AP');
      const name = qs('#f_name').value.trim();
      const phone = qs('#f_phone').value.trim();
      const service = qs('#f_service').value;
      const staff = qs('#f_staff').value.trim();
      const time = qs('#f_time').value;
      const price = +(qs('#f_price').value || qs('#f_service').selectedOptions[0].dataset.price || 0);
      if(!name || !time) { alert('Vui lòng nhập tên và thời gian'); return; }
      const appts = store.get('appts', []);
      appts.push({code,name,phone,service,staff,time,price,status:'booked'});
      store.set('appts', appts);

      // increase visits
      const customers = store.get('customers', []);
      let c = customers.find(x=>x.phone===phone && phone);
      if(!c && (name || phone)){
        c = {id:uid('C'), name, phone, visits:0, note:''}; customers.push(c);
      }
      if(c){ c.visits = (c.visits||0) + 1; store.set('customers', customers); }

      closeModal('createAppt');
      renderAppointments();
      renderCustomers();
      reportToday();
  reportMonth();
    }

    function markDone(code){
      const appts = store.get('appts', []);
      const a = appts.find(x=>x.code===code); if(!a) return;
      a.status = 'done';
      store.set('appts', appts);
      renderAppointments();
      renderAppointments();
      refreshKPIs();
      reportToday();
      reportMonth();
    }

    function cancelAppt(code){
      const appts = store.get('appts', []);
      const a = appts.find(x=>x.code===code); if(!a) return;
      a.status = 'cancel';
      store.set('appts', appts);
      renderAppointments();
      refreshKPIs();
      reportToday();
      reportMonth();
    }

    function addApptWith(serviceCode){
      openModal('createAppt');
      qs('#f_service').value = serviceCode;
    }

    function saveCustomer(){
      const customers = store.get('customers', []);
      const id = uid('C');
      customers.push({id,name:qs('#c_name').value.trim(), phone:qs('#c_phone').value.trim(), note:qs('#c_note').value.trim(), visits:0});
      store.set('customers', customers);
      closeModal('createCustomer');
      renderCustomers();
    }

    function quickBook(customerId){
      const c = store.get('customers', []).find(x=>x.id===customerId); if(!c) return;
      openModal('createAppt');
      qs('#f_name').value = c.name; qs('#f_phone').value = c.phone;
    }

    function exportCSV(){
      const appts = store.get('appts', []);
      const rows = [['Code','Name','Phone','Service','Staff','Time','Price','Status']]
        .concat(appts.map(a=>[a.code, a.name, a.phone, serviceName(a.service), a.staff, a.time, a.price, a.status]));
      const csv = rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','\"')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='appointments.csv'; a.click();
      URL.revokeObjectURL(url);
    }

    // Global search (very light)
    qs('#globalSearch').addEventListener('input', e=>{
      const q = e.target.value.toLowerCase();
      qsa('#apptBody tr').forEach(tr=>{
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      })
    })    // --- Navigation + section helpers ---
    function showSection(id){
      document.querySelectorAll('.view').forEach(s=>s.hidden=true);
      const el = document.getElementById(id.replace('#',''));
      if(el) el.hidden=false;
      document.querySelectorAll('aside .nav a').forEach(a=>a.classList.remove('active'));
      const link = document.querySelector(`aside .nav a[href="#${id.replace('#','')}"]`);
      if(link) link.classList.add('active');
      // sync tables when switching
      if(id==='appointments') renderAppointmentsTables();
      if(id==='customers') renderCustomersTables();
      if(id==='services') renderServicesTable();
      if(id==='staff') renderStaff();
      if(id==='inventory') renderInventory();
      if(id==='promos') renderPromos();
    }

    document.querySelectorAll('aside .nav a').forEach(a=>{
      a.addEventListener('click', e=>{
        const hash = a.getAttribute('href');
        if(hash && hash.startsWith('#')){ e.preventDefault(); showSection(hash.substring(1)); }
      })
    })
    
    // --- Secondary renderers ---
    let apptStatusFilter = 'all';
    function renderAppointmentsTables(){
      renderAppointments();
      const appts = store.get('appts', []);
      const tbody = document.getElementById('apptBody2');
      if(!tbody) return;
      tbody.innerHTML='';
      appts
        .filter(a=> apptStatusFilter==='all' ? true : a.status===apptStatusFilter)
        .sort((a,b)=> new Date(a.time) - new Date(b.time))
        .forEach(a=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${a.code}</td>
            <td>${a.name}</td>
            <td>${serviceName(a.service)}</td>
            <td>${a.staff||'-'}</td>
            <td>${fmtTime(a.time)}</td>
            <td>${money(a.price)}</td>
            <td><span class="status ${a.status}">${labelStatus(a.status)}</span></td>
            <td><button class="btn" onclick="markDone('${a.code}')">Hoàn tất</button></td>`
          tbody.appendChild(tr);
        })
    }
    function filterAppt(st){ apptStatusFilter = st; renderAppointmentsTables(); }

    function renderCustomersTables(){
      renderCustomers();
      const cust = store.get('customers', []);
      const tbody = document.getElementById('custBody2'); if(!tbody) return;
      tbody.innerHTML='';
      cust.forEach(c=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.name}</td><td>${c.phone||''}</td><td>${c.visits||0}</td><td>${c.note||''}</td><td><button class="btn" onclick="quickBook('${c.id}')">Đặt lịch</button></td>`;
        tbody.appendChild(tr);
      })
    }

    function renderServicesTable(){
      const services = store.get('services', defaultServices);
      const tbody = document.getElementById('svcBody'); if(!tbody) return;
      tbody.innerHTML='';
      services.forEach(s=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.code}</td><td>${s.name}</td><td>${money(s.price)}</td><td><button class="btn" onclick="addApptWith('${s.code}')">Đặt nhanh</button></td>`;
        tbody.appendChild(tr);
      })
    }

    function addServicePrompt(){
      const name = prompt('Tên dịch vụ'); if(!name) return;
      const price = parseInt(prompt('Giá (VNĐ)'),10) || 0;
      const services = store.get('services', defaultServices);
      const code = 'S' + String(services.length+1).padStart(2,'0');
      services.push({code,name,price}); store.set('services', services);
      renderServices(); fillServiceSelect(); renderServicesTable();
    }

    // Staff
    function renderStaff(){
      const staff = store.get('staff', []);
      const tbody = document.getElementById('staffBody'); if(!tbody) return;
      tbody.innerHTML='';
      staff.forEach(s=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.name}</td><td>${s.role||'KTV'}</td><td>${s.phone||''}</td><td>${s.note||''}</td>`;
        tbody.appendChild(tr);
      })
    }
    function addStaffPrompt(){
      const name = prompt('Tên nhân sự'); if(!name) return;
      const role = prompt('Vai trò','Kỹ thuật viên')||'Kỹ thuật viên';
      const phone = prompt('SĐT','');
      const staff = store.get('staff', []); staff.push({name,role,phone}); store.set('staff', staff);
      renderStaff();
    }

    // Inventory
    function renderInventory(){
      const inv = store.get('inventory', []);
      const tbody = document.getElementById('invBody'); if(!tbody) return;
      tbody.innerHTML='';
      inv.forEach(i=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i.code}</td><td>${i.name}</td><td>${i.qty||0}</td><td>${i.unit||''}</td><td>${money(i.cost||0)}</td>`;
        tbody.appendChild(tr);
      })
    }
    function addItemPrompt(){
      const name = prompt('Tên vật tư'); if(!name) return;
      const qty = parseFloat(prompt('Số lượng', '1'))||0;
      const unit = prompt('Đơn vị','chai');
      const cost = parseInt(prompt('Giá nhập/đơn vị','0'),10)||0;
      const inv = store.get('inventory', []);
      const code = 'I' + String(inv.length+1).padStart(3,'0');
      inv.push({code,name,qty,unit,cost}); store.set('inventory', inv);
      renderInventory();
    }

    // Promotions
    function renderPromos(){
      const promos = store.get('promos', []);
      const tbody = document.getElementById('promoBody'); if(!tbody) return;
      tbody.innerHTML='';
      promos.forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.code}</td><td>${p.name}</td><td>${p.from||'-'} → ${p.to||'-'}</td><td>${p.off||0}%</td><td>${p.active?'Đang diễn ra':'Hết hạn'}</td>`;
        tbody.appendChild(tr);
      })
    }
    function addPromoPrompt(){
      const name = prompt('Tên chương trình'); if(!name) return;
      const off = parseInt(prompt('Mức giảm (%)','10'),10)||0;
      const from = prompt('Từ ngày (YYYY-MM-DD)');
      const to = prompt('Đến ngày (YYYY-MM-DD)');
      const promos = store.get('promos', []); const code='PR'+String(promos.length+1).padStart(2,'0');
      const active = (new Date()>=new Date(from)) && (new Date()<=new Date(to));
      promos.push({code,name,off,from,to,active}); store.set('promos', promos);
      renderPromos();
    }

    // Reports (simple aggregates)
    function sumRevenueIn(range){
      const appts = store.get('appts', []);
      return appts.filter(a=>{
        const t = new Date(a.time); return t>=range.start && t<=range.end && a.status!=='cancel';
      }).reduce((s,a)=>s+(+a.price||0),0);
    }
    function countApptIn(range){
      const appts = store.get('appts', []);
      return appts.filter(a=>{ const t=new Date(a.time); return t>=range.start && t<=range.end; }).length;
    }
    function reportToday(){
      const d=new Date(); const start=new Date(d.getFullYear(),d.getMonth(),d.getDate()); const end=new Date(start); end.setHours(23,59,59,999);
      document.getElementById('reportRevenue').textContent = money(sumRevenueIn({start,end}));
      document.getElementById('reportCount').textContent = countApptIn({start,end});
    }
    function reportMonth(){
      const d=new Date(); const start=new Date(d.getFullYear(),d.getMonth(),1); const end=new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999);
      document.getElementById('reportRevenue').textContent = money(sumRevenueIn({start,end}));
      document.getElementById('reportCount').textContent = countApptIn({start,end});
    }

    // Settings
    function saveSettings(){
      const settings = { name:document.getElementById('set_name').value, phone:document.getElementById('set_phone').value, addr:document.getElementById('set_addr').value };
      store.set('settings', settings); alert('Đã lưu cài đặt!');
    }
    // --- Navigation + section helpers ---
    function showSection(id){
      // Ẩn tất cả các section
      document.querySelectorAll('.view').forEach(s => s.hidden = true);
      
      // Lấy phần cần hiển thị
      const el = document.getElementById(id.replace('#', ''));
      if(el) el.hidden = false;

      // Đổi trạng thái active cho các liên kết
      document.querySelectorAll('aside .nav a').forEach(a => a.classList.remove('active'));
      const link = document.querySelector(`aside .nav a[href="#${id.replace('#', '')}"]`);
      if(link) link.classList.add('active');
      
      // Render dữ liệu cho từng phần
      if(id === 'appointments') renderAppointmentsTables();
      if(id === 'customers') renderCustomersTables();
      if(id === 'services') renderServicesTable();
      if(id === 'staff') renderStaff();
      if(id === 'inventory') renderInventory();
      if(id === 'promos') renderPromos();
    }

    // Thêm sự kiện cho các liên kết trong sidebar
    document.querySelectorAll('aside .nav a').forEach(a => {
      a.addEventListener('click', e => {
        const hash = a.getAttribute('href');
        if(hash && hash.startsWith('#')) {
          e.preventDefault();
          showSection(hash.substring(1)); // Chuyển đến phần tương ứng khi click
        }
      });
    });


    // --- Init ---
    ;(function init(){
      if(!store.get('services')) store.set('services', defaultServices);
      renderServices(); fillServiceSelect();
      if(!store.get('customers')) store.set('customers',[
        {id:uid('C'), name:'Lan Hương', phone:'0901000001', visits:2, note:'Yêu cầu màu nude'},
        {id:uid('C'), name:'Trúc Mai', phone:'0902000002', visits:1, note:''}
      ]);
      renderCustomers();
      if(!store.get('appts')) store.set('appts',[
        {code:uid('AP'), name:'Lan Hương', phone:'0901000001', service:'S01', staff:'Linh', time:new Date(Date.now()+60*60*1000).toISOString().slice(0,16), price:150000, status:'booked'},
        {code:uid('AP'), name:'Trúc Mai', phone:'0902000002', service:'S02', staff:'An', time:new Date(Date.now()+3*60*60*1000).toISOString().slice(0,16), price:80000, status:'booked'}
      ]);
      if(!store.get('staff')) store.set('staff', [
        {name:'Linh', role:'Kỹ thuật viên', phone:'0903 111 222'},
        {name:'An', role:'Kỹ thuật viên', phone:'0903 333 444'}
      ]);
      if(!store.get('inventory')) store.set('inventory', [
        {code:'I001', name:'Nước sơn gel hồng', qty:10, unit:'chai', cost:70000},
        {code:'I002', name:'Bông gòn', qty:5, unit:'túi', cost:15000}
      ]);
      if(!store.get('promos')) store.set('promos', [
        {code:'PR01', name:'Happy Monday', off:10, from:'2025-01-01', to:'2025-12-31', active:true}
      ]);

      renderAppointments();
      showSection('dashboard');
    })();

      // run on admin.html load
(function checkAdminPage(){
  const user = window.AuthUtils && window.AuthUtils.getCurrentUser && window.AuthUtils.getCurrentUser();
  if(!user || user.role !== 'admin'){
    alert('Bạn không có quyền truy cập trang Admin.');
    // về trang chủ
    window.location.href = "../Homepage/ck.html";
  } else {
    // show admin name
    document.querySelector('.user-chip span') && (document.querySelector('.user-chip span').textContent = user.name || 'Admin');
  }
})();

function logout() {
    // Xoá token đăng nhập (nếu có)
    localStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminLoggedIn');
  
    // Hiệu ứng mượt trước khi thoát
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = 0;
    overlay.style.background = 'white';
    overlay.style.opacity = 0;
    overlay.style.transition = 'opacity 0.5s ease';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => (overlay.style.opacity = 1));
  
    setTimeout(() => {
      window.location.href = '../Login/login.html';
    }, 500);
  }
  
  function logout() {
    // Hiện popup xác nhận
    document.getElementById('logoutConfirm').style.display = 'flex';
  }
  
  function closeLogout() {
    // Ẩn popup
    document.getElementById('logoutConfirm').style.display = 'none';
  }
  
  function confirmLogout() {
    // Hiệu ứng trắng mờ khi đăng xuất
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = 0;
    overlay.style.background = 'white';
    overlay.style.opacity = 0;
    overlay.style.transition = 'opacity 0.5s ease';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => (overlay.style.opacity = 1));
  
    // Xóa dữ liệu đăng nhập
    localStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminLoggedIn');
  
    setTimeout(() => {
      window.location.href = '../Login/login.html';
    }, 500);
  }
  