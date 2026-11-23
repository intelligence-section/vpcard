// ใส่ URL ของ Web App (ลงท้าย /exec) ตรงนี้ที่เดียว
const AUTH_API = 'https://script.google.com/macros/s/AKfycbyx8smVvvVD8n0DTGKe0pBZHLVeZD2yIbwZniG7JQzXQ5iTbDzrFc6iapYIxdelliEs/exec';
const LOGIN_PAGE = 'login.html', HOME_PAGE = 'index.html';
const ERR = {
  BAD_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  BLOCKED: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
  TOO_MANY_ATTEMPTS: 'ลองผิดหลายครั้งเกินไป กรุณารอ 5 นาที',
  UNAUTHORIZED: 'หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่',
  FORBIDDEN: 'ไม่มีสิทธิ์ใช้งานส่วนนี้',
  EMAIL_EXISTS: 'อีเมลนี้มีในระบบแล้ว', BAD_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',
  WEAK_PASSWORD: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', MISSING_FIELDS: 'กรุณากรอกข้อมูลให้ครบ',
  CANNOT_BLOCK_SELF: 'ไม่สามารถระงับบัญชีตัวเองได้', SERVER_ERROR: 'ระบบขัดข้อง ลองใหม่อีกครั้ง'
};
const getToken = () => sessionStorage.getItem('vp_token');

async function api(action, data = {}) {
  // ไม่ตั้ง Content-Type เพื่อเลี่ยง CORS preflight ของ Apps Script
  const r = await fetch(AUTH_API, { method: 'POST', body: JSON.stringify({ action, token: getToken(), ...data }) });
  const j = await r.json();
  if (!j.ok) {
    if (j.error === 'UNAUTHORIZED' && action !== 'login') { sessionStorage.removeItem('vp_token'); location.href = LOGIN_PAGE; }
    throw new Error(ERR[j.error] || j.error);
  }
  return j;
}
// เรียกที่ต้นทุกหน้าที่ต้องล็อกอิน: คืน user หรือ null (แล้วเด้งไปหน้าล็อกอินให้)
async function requireLogin(adminOnly) {
  if (!getToken()) { location.href = LOGIN_PAGE; return null; }
  try {
    const { user } = await api('me');
    if (adminOnly && user.role !== 'Admin') { location.href = HOME_PAGE; return null; }
    return user;
  } catch (e) { return null; }
}
async function logout() {
  try { await api('logout'); } catch (e) {}
  sessionStorage.removeItem('vp_token'); location.href = LOGIN_PAGE;
}
