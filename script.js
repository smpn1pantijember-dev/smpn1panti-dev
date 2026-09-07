/* ============================================
   SISTER — Sistem Informasi SMPN 1 Panti Jember
   Semua data disimpan di localStorage browser.
   Ganti SEED_DATA di bawah dengan data asli sekolah.
   ============================================ */

const STORAGE_KEYS = {
  siswa: 'sister_smpn1panti_siswa',
  guru: 'sister_smpn1panti_guru',
  jadwal: 'sister_smpn1panti_jadwal',
  nilai: 'sister_smpn1panti_nilai',
  pengumuman: 'sister_smpn1panti_pengumuman',
  users: 'sister_smpn1panti_users',
  session: 'sister_smpn1panti_session',
};

/* ---------------- Data awal (placeholder) ----------------
   Sebelumnya SEED_DATA ini tidak ada sama sekali di script.js,
   padahal dipakai di renderProfil(). Silakan sesuaikan dengan
   data asli sekolah. */
const SEED_DATA = {
  profile: {
    nama: 'SMP Negeri 1 Panti',
    npsn: '—',
    alamat: 'Kec. Panti, Kab. Jember, Jawa Timur',
    jenjang: 'SMP',
    status: 'Negeri',
    akreditasi: '—',
  },
  siswa: [],
  guru: [],
  jadwal: [],
  nilai: [],
  pengumuman: [],
  users: [
    { id: 'u-admin', username: 'admin', email: 'admin@smpn1panti.sch.id', password: 'admin123' }
  ],
};

/* ---------------- Util ---------------- */
function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function loadData(key){
  try{
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? JSON.parse(raw) : null;
  }catch(e){
    return null;
  }
}
function saveData(key, value){
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
}

/* ---------------- "Database" di memori ----------------
   Sebelumnya variabel `db` ini dipakai di banyak tempat
   (renderDashboard, renderSiswa, dst) tapi tidak pernah
   dideklarasikan -> seluruh script berhenti jalan karena
   ReferenceError begitu halaman dibuka. */
const db = {
  siswa: loadData('siswa') || SEED_DATA.siswa,
  guru: loadData('guru') || SEED_DATA.guru,
  jadwal: loadData('jadwal') || SEED_DATA.jadwal,
  nilai: loadData('nilai') || SEED_DATA.nilai,
  pengumuman: loadData('pengumuman') || SEED_DATA.pengumuman,
};
let users = loadData('users');
if(!users){
  users = SEED_DATA.users;
  saveData('users', users);
}

/* ---------------- Login / Autentikasi ---------------- */
const loginWrap = document.getElementById('loginWrap');
const appRoot = document.getElementById('appRoot');
const loadingScreen = document.getElementById('loadingScreen');
var x = document.getElementById('login');
var y = document.getElementById('register');

function signupButton(){
  x.style.left = '-450px';
  y.style.left = '0px';
}
function signinButton(){
  x.style.left = '0px';
  y.style.left = '450px';
}

function masukKeApp(user){
  saveData('session', { username: user.username });
  document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
  document.getElementById('userName').textContent = user.username;
  document.getElementById('userEmail').textContent = user.email || '—';

  loginWrap.hidden = true;
  appRoot.hidden = false;

  renderDashboard();
  renderSiswa();
  renderGuru();
  renderJadwal();
  renderNilai();
  renderPengumuman();
}

document.getElementById('formLogin').addEventListener('submit', (e)=>{
  e.preventDefault(); // sebelumnya tidak ada -> submit selalu me-reload halaman
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const user = users.find(u => u.username === username && u.password === password);
  if(!user){
    alert('Username atau password salah.');
    return;
  }
  masukKeApp(user);
});

document.getElementById('formRegister').addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  if(!username || !password){ return; }
  if(users.some(u => u.username === username)){
    alert('Username sudah dipakai, silakan pilih yang lain.');
    return;
  }
  const baru = { id: uid(), username, email, password };
  users.push(baru);
  saveData('users', users);
  masukKeApp(baru);
});

document.getElementById('btnLogout').addEventListener('click', ()=>{
  localStorage.removeItem(STORAGE_KEYS.session);
  appRoot.hidden = true;
  loginWrap.hidden = false;
  x.style.left = '0px';
  y.style.left = '450px';
});

/* Auto-login kalau sesi sebelumnya masih ada, lalu sembunyikan loading screen */
window.addEventListener('DOMContentLoaded', ()=>{
  const session = loadData('session');
  const user = session ? users.find(u => u.username === session.username) : null;
  if(user){
    masukKeApp(user);
  }
  if(loadingScreen) loadingScreen.style.display = 'none';
});

/* ---------------- Navigasi SPA ---------------- */
const pageTitles = {
  dashboard: ['Dasbor', 'Ringkasan data sekolah hari ini'],
  siswa: ['Data Siswa', 'Kelola data induk peserta didik'],
  guru: ['Data Guru', 'Kelola data guru dan tenaga kependidikan'],
  jadwal: ['Jadwal Pelajaran', 'Susunan jadwal mengajar per kelas'],
  nilai: ['Nilai Akademik', 'Rekap nilai per siswa dan mata pelajaran'],
  pengumuman: ['Papan Pengumuman', 'Informasi terbaru untuk warga sekolah'],
  profil: ['Profil Sekolah', 'Identitas dan data umum sekolah'],
};

document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const target = btn.dataset.page;
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('is-active'));
    document.getElementById('page-' + target).classList.add('is-active');
    const [title, sub] = pageTitles[target];
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSub').textContent = sub;
    if(target === 'dashboard') renderDashboard();
    if(target === 'profil') renderProfil();
  });
});

/* ---------------- Jam & tanggal ---------------- */
const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function tickClock(){
  const now = new Date();
  document.getElementById('clockTime').textContent = now.toLocaleTimeString('id-ID');
  document.getElementById('clockDate').textContent = `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;
}
tickClock();
setInterval(tickClock, 1000);

/* ---------------- Dashboard ---------------- */
function renderDashboard(){
  document.getElementById('statSiswa').textContent = db.siswa.length;
  document.getElementById('statGuru').textContent = db.guru.length;
  const kelasSet = new Set(db.siswa.map(s=>s.kelas));
  document.getElementById('statKelas').textContent = kelasSet.size;
  document.getElementById('statPengumuman').textContent = db.pengumuman.length;

  const listEl = document.getElementById('dashPengumuman');
  const recent = [...db.pengumuman].sort((a,b)=> new Date(b.tanggal) - new Date(a.tanggal)).slice(0,4);
  listEl.innerHTML = recent.length ? recent.map(p=>`
    <div class="dash-item">
      <strong>${escapeHTML(p.judul)}</strong>
      <span>${formatTanggal(p.tanggal)}</span>
    </div>`).join('') : `<div class="empty">Belum ada pengumuman.</div>`;

  const kelasCount = {};
  db.siswa.forEach(s=>{ kelasCount[s.kelas] = (kelasCount[s.kelas]||0) + 1; });
  const max = Math.max(1, ...Object.values(kelasCount));
  const barEl = document.getElementById('dashKelas');
  const kelasList = ['VII','VIII','IX'];
  barEl.innerHTML = kelasList.map(k=>{
    const n = kelasCount[k] || 0;
    const pct = Math.round((n/max) * 100);
    return `<div class="bar-row">
      <span>Kelas ${k}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <span>${n}</span>
    </div>`;
  }).join('');
}

function formatTanggal(iso){
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderProfil(){
  const p = SEED_DATA.profile || {};
  const grid = document.getElementById('profileGrid');
  if(!grid) return;
  grid.innerHTML = [
    `<div class="profile-item"><span>Nama Sekolah</span><strong>${escapeHTML(p.nama||'—')}</strong></div>`,
    `<div class="profile-item"><span>NPSN</span><strong class="mono">${escapeHTML(p.npsn||'—')}</strong></div>`,
    `<div class="profile-item"><span>Alamat</span><strong>${escapeHTML(p.alamat||'—')}</strong></div>`,
    `<div class="profile-item"><span>Jenjang</span><strong>${escapeHTML(p.jenjang||'—')}</strong></div>`,
    `<div class="profile-item"><span>Status</span><strong>${escapeHTML(p.status||'—')}</strong></div>`,
    `<div class="profile-item"><span>Akreditasi</span><strong>${escapeHTML(p.akreditasi||'—')}</strong></div>`
  ].join('');
}

/* ---------------- Modal helper ---------------- */
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

function openModal(title, bodyHTML){
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalOverlay.classList.add('is-open');
}
function closeModal(){ modalOverlay.classList.remove('is-open'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e=>{ if(e.target === modalOverlay) closeModal(); });

/* ---------------- Data Siswa ---------------- */
function renderSiswa(){
  const tbody = document.getElementById('tabelSiswa');
  tbody.innerHTML = db.siswa.length ? db.siswa.map(s=>`
    <tr>
      <td class="mono">${escapeHTML(s.nis)}</td>
      <td>${escapeHTML(s.nama)}</td>
      <td>${escapeHTML(s.kelas)}</td>
      <td>${s.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
      <td>${escapeHTML(s.alamat || '-')}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="editSiswa('${s.id}')">Ubah</button>
        <button class="icon-btn danger" onclick="hapusSiswa('${s.id}')">Hapus</button>
      </div></td>
    </tr>`).join('') : `<tr><td class="empty-row" colspan="6">Belum ada data siswa.</td></tr>`;
  renderPilihanSiswaNilai();
}

function formSiswaHTML(data={}){
  return `
    <label>NIS</label>
    <input class="input" id="fNis" value="${data.nis||''}" placeholder="Contoh: 2425010">
    <label>Nama Lengkap</label>
    <input class="input" id="fNama" value="${data.nama||''}" placeholder="Nama siswa">
    <label>Kelas</label>
    <select class="select" id="fKelas">
      ${['VII','VIII','IX'].map(k=>`<option ${data.kelas===k?'selected':''}>${k}</option>`).join('')}
    </select>
    <label>Jenis Kelamin</label>
    <select class="select" id="fJk">
      <option value="L" ${data.jk==='L'?'selected':''}>Laki-laki</option>
      <option value="P" ${data.jk==='P'?'selected':''}>Perempuan</option>
    </select>
    <label>Alamat</label>
    <input class="input" id="fAlamat" value="${data.alamat||''}" placeholder="Alamat singkat">
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" id="fSimpan">Simpan</button>
    </div>`;
}

document.getElementById('btnTambahSiswa').addEventListener('click', ()=>{
  openModal('Tambah Siswa', formSiswaHTML());
  document.getElementById('fSimpan').addEventListener('click', ()=>{
    const baru = {
      id: uid(),
      nis: document.getElementById('fNis').value.trim(),
      nama: document.getElementById('fNama').value.trim(),
      kelas: document.getElementById('fKelas').value,
      jk: document.getElementById('fJk').value,
      alamat: document.getElementById('fAlamat').value.trim(),
    };
    if(!baru.nama){ return; }
    db.siswa.push(baru);
    saveData('siswa', db.siswa);
    renderSiswa();
    closeModal();
  });
});

function editSiswa(id){
  const data = db.siswa.find(s=>s.id===id);
  if(!data) return;
  openModal('Ubah Data Siswa', formSiswaHTML(data));
  document.getElementById('fSimpan').addEventListener('click', ()=>{
    data.nis = document.getElementById('fNis').value.trim();
    data.nama = document.getElementById('fNama').value.trim();
    data.kelas = document.getElementById('fKelas').value;
    data.jk = document.getElementById('fJk').value;
    data.alamat = document.getElementById('fAlamat').value.trim();
    saveData('siswa', db.siswa);
    renderSiswa();
    closeModal();
  });
}
function hapusSiswa(id){
  db.siswa = db.siswa.filter(s=>s.id!==id);
  saveData('siswa', db.siswa);
  renderSiswa();
}

/* ---------------- Data Guru ---------------- */
function renderGuru(){
  const tbody = document.getElementById('tabelGuru');
  tbody.innerHTML = db.guru.length ? db.guru.map(g=>`
    <tr>
      <td class="mono">${escapeHTML(g.nip)}</td>
      <td>${escapeHTML(g.nama)}</td>
      <td>${escapeHTML(g.mapel)}</td>
      <td>${escapeHTML(g.jabatan)}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="editGuru('${g.id}')">Ubah</button>
        <button class="icon-btn danger" onclick="hapusGuru('${g.id}')">Hapus</button>
      </div></td>
    </tr>`).join('') : `<tr><td class="empty-row" colspan="5">Belum ada data guru.</td></tr>`;
}

function formGuruHTML(data={}){
  return `
    <label>NIP</label>
    <input class="input" id="fNip" value="${data.nip||''}" placeholder="Nomor Induk Pegawai">
    <label>Nama Lengkap</label>
    <input class="input" id="fNamaG" value="${data.nama||''}" placeholder="Nama guru">
    <label>Mata Pelajaran</label>
    <input class="input" id="fMapel" value="${data.mapel||''}" placeholder="Contoh: Matematika">
    <label>Jabatan</label>
    <input class="input" id="fJabatan" value="${data.jabatan||''}" placeholder="Contoh: Wali Kelas VIII">
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" id="fSimpanG">Simpan</button>
    </div>`;
}

document.getElementById('btnTambahGuru').addEventListener('click', ()=>{
  openModal('Tambah Guru', formGuruHTML());
  document.getElementById('fSimpanG').addEventListener('click', ()=>{
    const baru = {
      id: uid(),
      nip: document.getElementById('fNip').value.trim(),
      nama: document.getElementById('fNamaG').value.trim(),
      mapel: document.getElementById('fMapel').value.trim(),
      jabatan: document.getElementById('fJabatan').value.trim(),
    };
    if(!baru.nama) return;
    db.guru.push(baru);
    saveData('guru', db.guru);
    renderGuru();
    closeModal();
  });
});

function editGuru(id){
  const data = db.guru.find(g=>g.id===id);
  if(!data) return;
  openModal('Ubah Data Guru', formGuruHTML(data));
  document.getElementById('fSimpanG').addEventListener('click', ()=>{
    data.nip = document.getElementById('fNip').value.trim();
    data.nama = document.getElementById('fNamaG').value.trim();
    data.mapel = document.getElementById('fMapel').value.trim();
    data.jabatan = document.getElementById('fJabatan').value.trim();
    saveData('guru', db.guru);
    renderGuru();
    closeModal();
  });
}
function hapusGuru(id){
  db.guru = db.guru.filter(g=>g.id!==id);
  saveData('guru', db.guru);
  renderGuru();
}

/* ---------------- Jadwal ---------------- */
function renderJadwal(){
  const filter = document.getElementById('filterKelasJadwal').value;
  const data = filter === 'semua' ? db.jadwal : db.jadwal.filter(j=>j.kelas===filter);
  const tbody = document.getElementById('tabelJadwal');
  tbody.innerHTML = data.length ? data.map(j=>`
    <tr>
      <td>${escapeHTML(j.hari)}</td>
      <td class="mono">${escapeHTML(j.jam)}</td>
      <td>${escapeHTML(j.kelas)}</td>
      <td>${escapeHTML(j.mapel)}</td>
      <td>${escapeHTML(j.guru)}</td>
    </tr>`).join('') : `<tr><td class="empty-row" colspan="5">Tidak ada jadwal untuk kelas ini.</td></tr>`;
}
document.getElementById('filterKelasJadwal').addEventListener('change', renderJadwal);

/* ---------------- Nilai ---------------- */
function renderPilihanSiswaNilai(){
  const sel = document.getElementById('nilaiSiswa');
  sel.innerHTML = db.siswa.map(s=>`<option value="${s.id}">${escapeHTML(s.nama)} — ${escapeHTML(s.kelas)}</option>`).join('');
}
function renderNilai(){
  const tbody = document.getElementById('tabelNilai');
  tbody.innerHTML = db.nilai.length ? db.nilai.map(n=>{
    const siswa = db.siswa.find(s=>s.id===n.siswaId);
    return `<tr>
      <td>${siswa ? escapeHTML(siswa.nama) : '(dihapus)'}</td>
      <td>${escapeHTML(n.mapel)}</td>
      <td>${escapeHTML(n.semester)}</td>
      <td class="mono">${n.nilai}</td>
      <td><div class="row-actions"><button class="icon-btn danger" onclick="hapusNilai('${n.id}')">Hapus</button></div></td>
    </tr>`;
  }).join('') : `<tr><td class="empty-row" colspan="5">Belum ada nilai tercatat.</td></tr>`;
}
document.getElementById('btnTambahNilai').addEventListener('click', ()=>{
  const siswaId = document.getElementById('nilaiSiswa').value;
  const mapel = document.getElementById('nilaiMapel').value.trim();
  const angka = document.getElementById('nilaiAngka').value;
  const semester = document.getElementById('nilaiSemester').value;
  if(!siswaId || !mapel || angka === '') return;
  db.nilai.push({ id: uid(), siswaId, mapel, nilai: Number(angka), semester });
  saveData('nilai', db.nilai);
  document.getElementById('nilaiMapel').value = '';
  document.getElementById('nilaiAngka').value = '';
  renderNilai();
});
function hapusNilai(id){
  db.nilai = db.nilai.filter(n=>n.id!==id);
  saveData('nilai', db.nilai);
  renderNilai();
}

/* ---------------- Pengumuman ---------------- */
function renderPengumuman(){
  const board = document.getElementById('papanPengumuman');
  const sorted = [...db.pengumuman].sort((a,b)=> new Date(b.tanggal) - new Date(a.tanggal));
  board.innerHTML = sorted.length ? sorted.map(p=>`
    <div class="pin-card">
      <h4>${escapeHTML(p.judul)}</h4>
      <p>${escapeHTML(p.isi)}</p>
      <time>${formatTanggal(p.tanggal)}</time>
      <div class="row-actions">
        <button class="icon-btn danger" onclick="hapusPengumuman('${p.id}')">Hapus</button>
      </div>
    </div>`).join('') : `<div class="empty">Belum ada pengumuman.</div>`;
}

document.getElementById('btnTambahPengumuman').addEventListener('click', ()=>{
  openModal('Buat Pengumuman', `
    <label>Judul</label>
    <input class="input" id="fJudul" placeholder="Judul pengumuman">
    <label>Isi</label>
    <input class="input" id="fIsi" placeholder="Isi singkat pengumuman">
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" id="fSimpanP">Simpan</button>
    </div>`);
  document.getElementById('fSimpanP').addEventListener('click', ()=>{
    const judul = document.getElementById('fJudul').value.trim();
    const isi = document.getElementById('fIsi').value.trim();
    if(!judul) return;
    db.pengumuman.push({ id: uid(), judul, isi, tanggal: new Date().toISOString() });
    saveData('pengumuman', db.pengumuman);
    renderPengumuman();
    renderDashboard();
    closeModal();
  });
});
function hapusPengumuman(id){
  db.pengumuman = db.pengumuman.filter(p=>p.id!==id);
  saveData('pengumuman', db.pengumuman);
  renderPengumuman();
  renderDashboard();
}

/* Catatan: pemanggilan renderDashboard()/renderSiswa()/dst di init lama
   sudah dipindahkan ke dalam masukKeApp(), supaya baru dijalankan
   SETELAH user berhasil login — bukan langsung saat file dimuat. */
