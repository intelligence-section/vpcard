// 
const AUTH_API = 'https://script.google.com/macros/s/AKfycbyx8smVvvVD8n0DTGKe0pBZHLVeZD2yIbwZniG7JQzXQ5iTbDzrFc6iapYIxdelliEs/exec';
const LOGIN_PAGE = 'login.html', HOME_PAGE = 'index.html';
// บทบาท -> ประเภทบัตรที่ใช้ได้ / หน้าแรกหลังล็อกอิน
const ROLE_CATS = { Admin: ['shop','build','student','family'], Student: ['student'], Family: ['family'] };
const ROLE_LANDING = { Admin: 'admin.html', Student: 'visitor-card-student.html', Family: 'visitor-card-family.html' };
const ERR = {
  BAD_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  BLOCKED: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
  NO_ROLE: 'บัญชีนี้ยังไม่ได้กำหนดสิทธิ์ กรุณาติดต่อผู้ดูแลระบบ',
  TOO_MANY_ATTEMPTS: 'ลองผิดหลายครั้งเกินไป กรุณารอ 5 นาที',
  UNAUTHORIZED: 'หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่',
  FORBIDDEN: 'ไม่มีสิทธิ์ใช้งานส่วนนี้',
  EMAIL_EXISTS: 'อีเมลนี้มีในระบบแล้ว', BAD_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',
  WEAK_PASSWORD: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', MISSING_FIELDS: 'กรุณากรอกข้อมูลให้ครบ',
  BAD_ROLE: 'สิทธิ์ไม่ถูกต้อง', CANNOT_BLOCK_SELF: 'ไม่สามารถระงับบัญชีตัวเองได้',
  CANNOT_CHANGE_SELF: 'ไม่สามารถเปลี่ยนสิทธิ์ตัวเองได้', SERVER_ERROR: 'ระบบขัดข้อง ลองใหม่อีกครั้ง'
};
const getToken = () => sessionStorage.getItem('vp_token');
const landing = role => ROLE_LANDING[role] || LOGIN_PAGE;

async function api(action, data = {}) {
  const r = await fetch(AUTH_API, { method: 'POST', body: JSON.stringify({ action, token: getToken(), ...data }) });
  const j = await r.json();
  if (!j.ok) {
    if (j.error === 'UNAUTHORIZED' && action !== 'login') { sessionStorage.removeItem('vp_token'); location.href = LOGIN_PAGE; }
    throw new Error(ERR[j.error] || j.error);
  }
  return j;
}
// roles: ไม่ใส่ = ทุกบทบาทที่มีสิทธิ์ | true = เฉพาะ Admin | ['Admin','Student'] = เฉพาะบทบาทที่ระบุ
async function requireLogin(roles) {
  if (!getToken()) { location.href = LOGIN_PAGE; return null; }
  try {
    const { user } = await api('me');
    if (roles === true) roles = ['Admin'];
    if (roles && !roles.includes(user.role)) { location.href = landing(user.role); return null; }
    return user;
  } catch (e) { return null; }
}
// ล็อกหน้าให้เห็น/เลือกได้เฉพาะประเภทที่หน้านี้และสิทธิ์ของผู้ใช้อนุญาต
function applyRole(user, cats) {
  const ok = cats.filter(c => (ROLE_CATS[user.role] || []).includes(c));
  const bs = [...document.querySelectorAll('#cat button')];
  bs.forEach(b => { if (!ok.includes(b.dataset.v)) b.style.display = 'none'; });
  const first = bs.find(b => ok.includes(b.dataset.v));
  if (first) {
    first.click();
    if (ok.length === 1) { const c = document.getElementById('cat'); if (c && c.parentElement) c.parentElement.style.display = 'none'; }
    const rs = document.getElementById('rs');
    if (rs) rs.addEventListener('click', () => setTimeout(() => first.click(), 0));   // ล้างข้อมูลแล้วคงประเภทเดิม
  }
  if (user.role !== 'Admin') { const t = document.getElementById('tabsel'); if (t && t.parentElement) t.parentElement.style.display = 'none'; }
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:12px;z-index:50;font-size:13px;color:#fff;background:rgba(0,0,0,.45);padding:4px 12px;border-radius:99px';
  bar.appendChild(document.createTextNode((user.name || user.email) + ' · '));
  if (user.role === 'Admin') { const m = document.createElement('a'); m.href = 'admin.html'; m.textContent = 'หน้าแอดมิน'; m.style.cssText = 'color:#f3d97a;margin-right:10px'; bar.appendChild(m); }
  const a = document.createElement('a'); a.href = '#'; a.textContent = 'ออกจากระบบ'; a.style.color = '#f3d97a';
  a.onclick = e => { e.preventDefault(); logout(); };
  bar.appendChild(a); document.body.appendChild(bar);
}
async function logout() {
  try { await api('logout'); } catch (e) {}
  sessionStorage.removeItem('vp_token'); location.href = LOGIN_PAGE;
}
