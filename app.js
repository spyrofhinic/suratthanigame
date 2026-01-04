// /app.js
const $ = (sel) => document.querySelector(sel);
const GAS_URL = "https://script.google.com/macros/s/AKfycbwgDw05SlfuW9Ozy_sTICul0JTY7Mo8dDZMY0HWqwpKd04I8oh2JtiaW1w48dI1Odq64Q/exec";
const GAS_KEY = "AKfycbwgDw05SlfuW9Ozy_sTICul0JTY7Mo8dDZMY0HWqwpKd04I8oh2JtiaW1w48dI1Odq64Q";
const VENUE_QUERY = "ศาลากลางจังหวัดสุราษฎร์ธานี ศูนย์ประชุม";
const MAPS_OPEN_URL = (q) => `https://www.google.com/maps/@9.133954,99.3326335,20.75z?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D`;
const MAPS_EMBED_URL = (q) => `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1392.726574140321!2d99.332163795104!3d9.134083831596012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30540775e49b8fdf%3A0x5e333e5a6b36bcb!2z4Lio4Liy4Lil4Liy4LiB4Lil4Liy4LiH4LiI4Lix4LiH4Lir4Lin4Lix4LiU4Liq4Li44Lij4Liy4Lip4LiO4Lij4LmM4LiY4Liy4LiZ4Li1!5e0!3m2!1sth!2sth!4v1767462212504!5m2!1sth!2sth&output=embed`;
const mapUrl = MAPS_OPEN_URL(VENUE_QUERY);
// Mobile drawer toggle
const btnMenu = document.querySelector("#btnMenu");
const overlay = document.querySelector("#overlay");

function openSidebar() {
  document.body.classList.add("sidebar-open");
}
function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}
function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

if (btnMenu) btnMenu.addEventListener("click", toggleSidebar);
if (overlay) overlay.addEventListener("click", closeSidebar);

// ปิดเมนูอัตโนมัติเมื่อกดลิงก์ใน sidebar (มือถือ)
document.querySelectorAll("#sidebar a.navItem").forEach(a => {
  a.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 980px)").matches) closeSidebar();
  });
});


const openBtn = document.querySelector("#btnOpenMap");
if (openBtn) openBtn.onclick = () => window.open(mapUrl, "_blank", "noopener");

async function copyLink() {
  try {
    await navigator.clipboard.writeText(mapUrl);
    alert("คัดลอกลิงก์แผนที่แล้ว");
  } catch {
    prompt("คัดลอกลิงก์นี้:", mapUrl);
  }
}

const copyBtn1 = document.querySelector("#btnCopyMap");
if (copyBtn1) copyBtn1.onclick = copyLink;

const copyBtn2 = document.querySelector("#btnCopyMap2");
if (copyBtn2) copyBtn2.onclick = copyLink;



async function fetchSheet(name, params = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set("key", GAS_KEY);
  url.searchParams.set("name", name);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "API error");
  return data.rows;
}

async function loadAnnouncementsForRole(role) {
  const audience = (role === "STAFF") ? "staff" : "athlete";
  // view=active: เฉพาะประกาศที่อยู่ในช่วงเวลา + ตาม audience
  const rows = await fetchSheet("announcements", { view: "active", audience });
  return rows;
}

async function loadScheduleByDate(dateStr) {
  const rows = await fetchSheet("schedule");
  return rows.filter(r => String(r.date) === dateStr);
}

async function loadCallTime(teamId, dateStr) {
  const rows = await fetchSheet("calltime");
  return rows.filter(r => r.team_id === teamId && String(r.date) === dateStr);
}

async function renderAnnouncementsBlock() {
  try {
    const audience = (state.role === "STAFF") ? "staff" : "athlete";
    const rows = await fetchSheet("announcements", { view: "active", audience });

    const pinned = rows.filter(r => String(r.pinned).toLowerCase() === "true");
    const list = (pinned.length ? pinned : rows).slice(0, 3);

    return list.map(a => `
      <div class="alert card ${a.severity === "urgent" ? "danger" : ""}" style="padding:12px">
        <strong>${a.title || "ประกาศ"}</strong>
        <div class="muted" style="font-size:12px;margin-top:4px">${a.updated_at || ""}</div>
        <div style="margin-top:6px">${a.body || ""}</div>
      </div>
    `).join("");
  } catch (e) {
    return `<div class="muted">โหลดประกาศไม่สำเร็จ: ${e.message}</div>`;
  }
}



const state = {
  role: localStorage.getItem("role") || "PUBLIC", // "ATHLETE" | "STAFF" | "PUBLIC"
  name: localStorage.getItem("name") || "",
};

function setRole(role, name="") {
  state.role = role;
  state.name = name;
  localStorage.setItem("role", role);
  localStorage.setItem("name", name);
  applyRoleToUI();
  navigate(location.hash || "#/");
}

function logout() {
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  state.role = "PUBLIC";
  state.name = "";
  applyRoleToUI();
  navigate("#/login");
}

function applyRoleToUI() {
  const rolePill = $("#rolePill");
  const btnLogout = $("#btnLogout");

  if (state.role === "ATHLETE") {
    rolePill.textContent = `เข้าสู่ระบบ: นักกีฬา/โค้ช • ${state.name || "ผู้ใช้"}`;
    btnLogout.style.display = "";
  } else if (state.role === "STAFF") {
    rolePill.textContent = `เข้าสู่ระบบ: ทีมงาน • ${state.name || "ผู้ใช้"}`;
    btnLogout.style.display = "";
  } else {
    rolePill.textContent = "ยังไม่ได้เข้าสู่ระบบ";
    btnLogout.style.display = "none";
  }

  document.querySelectorAll(".only-athlete").forEach(el => {
    el.style.display = (state.role === "ATHLETE") ? "" : "none";
  });
  document.querySelectorAll(".only-staff").forEach(el => {
    el.style.display = (state.role === "STAFF") ? "" : "none";
  });

  // Highlight active nav
  const path = (location.hash || "#/").replace("#", "");
  document.querySelectorAll(".navItem").forEach(a => {
    a.classList.toggle("active", a.dataset.route === path);
  });
}

function guard(route) {
  // Staff routes
  if (route.startsWith("/staff")) return state.role === "STAFF";
  // Athlete routes start with /a in real app; here we just guard some pages
  return true;
}

function navigate(hash) {
  if (!hash.startsWith("#")) hash = "#" + hash;
  const route = hash.replace("#", "") || "/";

  if (route !== "/login" && state.role === "PUBLIC") {
    renderLogin();
    applyRoleToUI();
    return;
  }

  if (!guard(route)) {
    renderForbidden();
    applyRoleToUI();
    return;
  }

  // Router switch
  const r = route.split("?")[0];
  const parts = r.split("/").filter(Boolean);

  if (r === "/") return renderDashboard();
  if (r === "/login") return renderLogin();
  if (r === "/announcements") return renderAnnouncements();
  if (r === "/my-schedule") return renderMySchedule();
  if (r === "/check-in") return renderCheckIn();
  if (r === "/call-time") return renderCallTime();
  if (r === "/matches") return renderMatches();
  if (parts[0] === "match" && parts[1]) return renderMatchDetail(parts[1]);
  if (r === "/results") return renderResults();
  if (r === "/livestream") return renderLivestream();
  if (r === "/venue") return renderVenue();
  if (r === "/travel") return renderTravel();
  if (r === "/stay") return renderStay();
  if (r === "/food") return renderFood();
  if (r === "/rules") return renderRules();
  if (r === "/documents") return renderDocuments();
  if (r === "/incidents") return renderIncidents();
  if (r === "/contacts") return renderContacts();
  if (r === "/faq") return renderFAQ();

  // Staff tools
  if (r === "/staff/run-of-show") return renderRunOfShow();
  if (r === "/staff/check-in-manager") return renderCheckInManager();
  if (r === "/staff/call-time-manager") return renderCallTimeManager();
  if (r === "/staff/match-ops") return renderMatchOps();
  if (r === "/staff/results-manager") return renderResultsManager();
  if (r === "/staff/incidents-queue") return renderIncidentsQueue();
  if (r === "/staff/documents-manager") return renderDocumentsManager();

  renderNotFound();
  applyRoleToUI();
}

function mount(html) {
  $("#view").innerHTML = html;
  applyRoleToUI();
}

function card(title, body, cls="") {
  return `<div class="card ${cls}"><h3>${title}</h3>${body}</div>`;
}

/* ---------- Renders ---------- */

function renderLogin() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>เข้าสู่ระบบพอร์ทัลหน้างาน (Prototype)</h2>
        <div class="muted">เลือกบทบาทเพื่อเข้าใช้งาน • ตัวอย่างนี้เป็นระบบจำลอง (ไม่เชื่อมฐานข้อมูล)</div>
        <div class="pills">
          <span class="pill">นักกีฬา/โค้ช: ดูตารางของฉัน • เช็กอิน • แจ้งปัญหา</span>
          <span class="pill">ทีมงาน: จัดการ call time • match ops • incident queue</span>
        </div>
      </div>

      <div class="card" style="grid-column:1/-1">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Login แยกนักกีฬา / ทีมงาน</h3>
          <span class="badge">Role-based UI</span>
        </div>

        <div class="grid" style="margin-top:10px">
          <div class="card" style="grid-column:1/-1">
            <div class="form">
              <label>บทบาท</label>
              <select class="select" id="roleSelect">
                <option value="ATHLETE">นักกีฬา/โค้ช</option>
                <option value="STAFF">ทีมงาน</option>
              </select>

              <label>ชื่อ (จำลอง)</label>
              <input class="input" id="nameInput" placeholder="เช่น ทีมสุราษฎร์ฯ / OPS-01" />

              <label>วิธีเข้าสู่ระบบ (จำลอง)</label>
              <div class="row">
                <input class="input" style="flex:1" placeholder="เบอร์โทร/อีเมล" />
                <input class="input" style="flex:1" placeholder="OTP/รหัสผ่าน" />
              </div>

              <div class="row">
                <button class="btn ok" id="doLogin">เข้าสู่ระบบ</button>
                <button class="btn ghost" onclick="alert('สำหรับของจริง: ลืมรหัส / ติดต่อแอดมิน')">ลืมรหัส/ขอความช่วยเหลือ</button>
              </div>

              <div class="muted" style="font-size:12px">
                แนะนำของจริง: นักกีฬาใช้ OTP เบอร์โทร / ทีมงานใช้ Email+Password หรือ SSO
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  $("#doLogin").onclick = () => {
    const role = $("#roleSelect").value;
    const name = $("#nameInput").value.trim();
    setRole(role, name);
  };
}

function renderDashboard() {
  const roleLabel = state.role === "STAFF" ? "ทีมงาน" : "นักกีฬา/โค้ช";
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Dashboard • ${roleLabel}</h2>
        <div class="muted">ศูนย์ควบคุมงานหน้างาน: ประกาศด่วน • กิจกรรมวันนี้ • ปุ่มลัด</div>
        <div class="pills">
          <span class="pill">Event: 13–16 พ.ค. 2569</span>
          <span class="pill">Venue: ศูนย์ประชุมฯ ศาลากลางสุราษฎร์ฯ</span>
          <span class="pill">Mode: Prototype</span>
        </div>
      </div>

      ${card("ประกาศด่วน (Pinned)", `
        <div class="alert card" style="padding:12px">
          <strong>ตัวอย่างประกาศ:</strong> โปรดเช็กอินก่อนเวลาแข่ง 60 นาที และตรวจสอบอุปกรณ์ที่จุด Technical Check
        </div>
        <div class="row" style="margin-top:10px">
          <a class="btn small" href="#/announcements">ดูประกาศทั้งหมด</a>
          <a class="btn small ghost" href="#/venue">เปิดแผนที่/ผัง</a>
        </div>
      `, "alert")}

      ${state.role === "ATHLETE"
        ? card("My Next Action", `
            <div class="row">
              <span class="badge">Call Time</span>
              <span class="badge">Room A</span>
              <span class="badge live">T-45 นาที</span>
            </div>
            <p class="muted">นัดหมายทีม: 09:15 • Warm-up: 09:30 • แข่ง: 10:00</p>
            <div class="row">
              <a class="btn small ok" href="#/call-time">ดู Call Time</a>
              <a class="btn small ghost" href="#/my-schedule">ตารางของฉัน</a>
              <a class="btn small ghost" href="#/incidents">แจ้งปัญหา</a>
            </div>
          `)
        : card("Ops Overview", `
            <div class="row">
              <span class="badge">เช็กอินแล้ว 18/24 ทีม</span>
              <span class="badge live">Live matches: 2</span>
              <span class="badge">Incidents เปิดอยู่: 3</span>
            </div>
            <p class="muted">ทางลัดสำหรับทีมงาน: Run-of-show / Match Ops / Incident Queue</p>
            <div class="row">
              <a class="btn small ok" href="#/staff/run-of-show">Run-of-show</a>
              <a class="btn small ghost" href="#/staff/match-ops">Match Ops</a>
              <a class="btn small ghost" href="#/staff/incidents-queue">Incidents Queue</a>
            </div>
          `)
      }

      ${card("Quick Actions", `
        <div class="row">
          <a class="btn small" href="#/check-in">เช็กอิน</a>
          <a class="btn small ghost" href="#/matches">Matches</a>
          <a class="btn small ghost" href="#/results">Results</a>
          <a class="btn small ghost" href="#/contacts">Contacts</a>
        </div>
        <p class="muted" style="margin-top:10px">แนะแนวหน้างาน: ทำ QR ไปหน้า /announcements และ /venue</p>
      `, "")}

      ${card("วันนี้มีอะไร", `
        <table class="table">
          <thead><tr><th>เวลา</th><th>รายการ</th><th>สถานะ</th></tr></thead>
          <tbody>
            <tr><td>09:00</td><td>เปิดลงทะเบียน</td><td><span class="badge">Upcoming</span></td></tr>
            <tr><td>10:00</td><td>Match 001 (รอบแบ่งกลุ่ม)</td><td><span class="badge live">Live</span></td></tr>
            <tr><td>12:30</td><td>Match 007</td><td><span class="badge">Upcoming</span></td></tr>
          </tbody>
        </table>
      `, "")}
    </div>
  `);
}

function renderAnnouncements() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>ประกาศด่วน</h2>
        <div class="muted">รวมประกาศทางการสำหรับหน้างาน • สามารถปักหมุด/หมดอายุได้ (ของจริง)</div>
      </div>

      ${card("ประกาศ #1 (ด่วน)", `
        <div class="row">
${announcementCard1()}
        ${announcementCard2()}
          <span class="badge live">ด่วน</span>
          <span class="badge">อัปเดต 08:40</span>
          <span class="badge">กลุ่ม: นักกีฬา+ทีมงาน</span>
        </div>
        <p>โปรดมาตรวจอุปกรณ์ที่จุด Technical Check ก่อนแข่ง 45 นาที</p>
        <div class="row">
          <button class="btn small ok" onclick="alert('บันทึก: ยืนยันรับทราบแล้ว (จำลอง)')">ยืนยันรับทราบ</button>
          <button class="btn small ghost" onclick="alert('แชร์ลิงก์ประกาศ (จำลอง)')">แชร์</button>
        </div>
      `, "alert danger")}

      ${card("ประกาศ #2", `
        <div class="row">
          <span class="badge">ทั่วไป</span>
          <span class="badge">อัปเดต 07:55</span>
        </div>
        <p>จุดลงทะเบียนอยู่ชั้น 1 โซน A โปรดนำบัตรประชาชน/บัตรนักกีฬา</p>
      `, "alert")}
    </div>
  `);
}

function renderMySchedule() {
  if (state.role !== "ATHLETE") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>ตารางของฉัน</h2>
        <div class="muted">แสดงเฉพาะกิจกรรม/แมตช์ของทีมคุณ (ของจริงจะผูกกับบัญชี)</div>
      </div>

      ${card("Timeline วันนี้", `
        <table class="table">
          <thead><tr><th>เวลา</th><th>กิจกรรม</th><th>สถานที่</th></tr></thead>
          <tbody>
            <tr><td>09:15</td><td>Call Time</td><td>Room A</td></tr>
            <tr><td>09:30</td><td>Warm-up</td><td>Warm-up Zone</td></tr>
            <tr><td>10:00</td><td><a href="#/match/001">Match 001</a></td><td>Room A</td></tr>
            <tr><td>11:30</td><td>Media (ถ้ามี)</td><td>Media Point</td></tr>
          </tbody>
        </table>
      `)}

      ${card("ปุ่มลัด", `
        <div class="row">
          <a class="btn small ok" href="#/call-time">ดู Call Time</a>
          <a class="btn small ghost" href="#/venue">แผนที่/ผัง</a>
          <a class="btn small ghost" href="#/incidents">แจ้งปัญหา</a>
        </div>
      `)}
    </div>
  `);
}

function renderCheckIn() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Check-in</h2>
        <div class="muted">โฟลว์เช็กอิน 3 ขั้นตอน • ของจริงสามารถใช้ QR + ตรวจเอกสาร</div>
      </div>

      ${card("Step 1: ระบุทีม/จังหวัด", `
        <input class="input" placeholder="กรอกรหัสทีม/จังหวัด (จำลอง)" />
        <div class="row" style="margin-top:10px">
          <button class="btn small">สแกน QR (จำลอง)</button>
          <button class="btn small ghost">ค้นหา</button>
        </div>
      `)}

      ${card("Step 2: ยืนยันรายชื่อ", `
        <p class="muted">ตัวอย่าง: หัวหน้าทีม / ผู้จัดการทีม / นักกีฬา 5 คน</p>
        <button class="btn small ok" onclick="alert('ยืนยันรายชื่อแล้ว (จำลอง)')">ยืนยัน</button>
      `)}

      ${card("Step 3: สถานะ", `
        <div class="row">
          <span class="badge done">เช็กอินสำเร็จ</span>
          <span class="badge">ไปต่อ: Technical Check</span>
        </div>
        <div class="row" style="margin-top:10px">
          <a class="btn small ghost" href="#/venue">นำทางไปจุดถัดไป</a>
        </div>
      `)}
    </div>
  `);
}

function renderCallTime() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Call Time</h2>
        <div class="muted">นักกีฬาเห็นเฉพาะทีมตนเอง • ทีมงานสามารถจัดการได้ใน Staff Tools</div>
      </div>

      ${card("รายการวันนี้", `
        <table class="table">
          <thead><tr><th>เวลา</th><th>รายการ</th><th>ห้อง</th><th>สถานะ</th></tr></thead>
          <tbody>
            <tr><td>09:15</td><td>Call Time</td><td>Room A</td><td><span class="badge live">T-45</span></td></tr>
            <tr><td>10:00</td><td><a href="#/match/001">Match 001</a></td><td>Room A</td><td><span class="badge">Upcoming</span></td></tr>
            <tr><td>12:30</td><td><a href="#/match/007">Match 007</a></td><td>Room B</td><td><span class="badge">Upcoming</span></td></tr>
          </tbody>
        </table>
      `)}
    </div>
  `);
}

function renderMatches() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Matches</h2>
        <div class="muted">รายการแมตช์ทั้งหมด • กดเข้าเพื่อดูรายละเอียด/เช็กลิสต์/แจ้งปัญหา</div>
      </div>

      ${card("Filter (Prototype)", `
        <div class="row">
          <select class="select" style="flex:1">
            <option>ทุกเกม</option><option>Game A</option><option>Game B</option>
          </select>
          <select class="select" style="flex:1">
            <option>ทุกวัน</option><option>13 พ.ค.</option><option>14 พ.ค.</option>
          </select>
          <input class="input" style="flex:1" placeholder="ค้นหาทีม/จังหวัด" />
        </div>
      `)}

      ${card("รายการแมตช์", `
        <table class="table">
          <thead><tr><th>เวลา</th><th>แมตช์</th><th>ห้อง</th><th>สถานะ</th></tr></thead>
          <tbody>
            <tr><td>10:00</td><td><a href="#/match/001">Match 001 • จังหวัด A vs จังหวัด B</a></td><td>Room A</td><td><span class="badge live">Live</span></td></tr>
            <tr><td>12:30</td><td><a href="#/match/007">Match 007 • จังหวัด C vs จังหวัด D</a></td><td>Room B</td><td><span class="badge">Upcoming</span></td></tr>
            <tr><td>15:30</td><td><a href="#/match/014">Match 014 • จังหวัด E vs จังหวัด F</a></td><td>Room A</td><td><span class="badge done">Done</span></td></tr>
          </tbody>
        </table>
      `)}
    </div>
  `);
}

function renderMatchDetail(id) {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Match Detail • ${id}</h2>
        <div class="muted">รายละเอียดแมตช์ + เช็กลิสต์ก่อนแข่ง + ปุ่มแจ้งปัญหา</div>
      </div>

      ${card("สรุป", `
        <div class="row">
          <span class="badge">รอบ: Group</span>
          <span class="badge">เวลา: 10:00</span>
          <span class="badge">ห้อง: Room A</span>
          <span class="badge live">สถานะ: Live</span>
        </div>
        <p class="muted">ทีม: จังหวัด A vs จังหวัด B</p>
      `)}

      ${card("Checklist ก่อนแข่ง", `
        <ul>
          <li>ยืนยันรายชื่อผู้เล่น</li>
          <li>ตรวจอุปกรณ์/บัญชี</li>
          <li>ทดสอบอินเทอร์เน็ต/เสียง</li>
        </ul>
        <div class="row">
          <button class="btn small ok" onclick="alert('Checklist OK (จำลอง)')">ยืนยันพร้อมแข่ง</button>
          <a class="btn small ghost" href="#/incidents">แจ้งปัญหา</a>
        </div>
      `)}

      ${card("ข้อมูลเพิ่มเติม", `
        <p class="muted">ของจริง: ใส่ลิงก์สตรีม / กรรมการ / หมายเหตุพิเศษ</p>
      `)}
    </div>
  `);
}

function renderResults() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Results</h2>
        <div class="muted">ผลล่าสุด + Bracket/Standing (Prototype)</div>
      </div>

      ${card("ผลล่าสุด", `
        <table class="table">
          <thead><tr><th>แมตช์</th><th>ผล</th><th>เวลา</th></tr></thead>
          <tbody>
            <tr><td>Match 014</td><td>จังหวัด E 2–0 จังหวัด F</td><td>15:30</td></tr>
            <tr><td>Match 013</td><td>จังหวัด C 2–1 จังหวัด D</td><td>14:40</td></tr>
          </tbody>
        </table>
      `)}

      ${card("Bracket (Placeholder)", `
        <p class="muted">ของจริง: แสดงสายการแข่งขันแบบเลื่อนแนวนอนบนมือถือ</p>
        <div class="pill">[ Quarter ] → [ Semi ] → [ Final ]</div>
      `)}

      ${card("Standing (Placeholder)", `
        <p class="muted">ของจริง: ตารางคะแนนจังหวัดตามเกม</p>
        <div class="pill">A: 3W-0L • B: 2W-1L • C: 1W-2L</div>
      `)}
    </div>
  `);
}

function renderLivestream() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Livestream</h2>
        <div class="muted">ของจริง: ฝัง YouTube/Facebook + ตารางสตรีมวันนี้</div>
      </div>
      ${card("Player (Placeholder)", `
        <div class="card" style="height:260px; display:grid; place-items:center">
          <div class="muted">Embed Player Here</div>
        </div>
      `)}
      ${card("ตารางสตรีมวันนี้", `
        <table class="table">
          <thead><tr><th>เวลา</th><th>รายการ</th></tr></thead>
          <tbody>
            <tr><td>10:00</td><td>Match 001</td></tr>
            <tr><td>12:30</td><td>Match 007</td></tr>
          </tbody>
        </table>
      `)}
    </div>
  `);
}

function renderVenue() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Venue</h2>
        <div class="muted">แผนที่ + ผังอาคาร + จุดสำคัญ (ลงทะเบียน/พยาบาล/สื่อ)</div>
      </div>

      ${card("ข้อมูลสถานที่", `
        <div class="row">
          <span class="badge">Registration: ชั้น 1 โซน A</span>
          <span class="badge">Medical</span>
          <span class="badge">Media Point</span>
        </div>
        <p class="muted">ของจริง: ใส่ลิงก์ปักหมุด Google Maps + รูปทางเข้า</p>
        <div class="row">
          <button class="btn small">เปิดแผนที่ (จำลอง)</button>
          <button class="btn small ghost">ดูผังอาคาร (จำลอง)</button>
          <button class="btn small ghost">ที่จอดรถ (จำลอง)</button>
        </div>
      `)}
    </div>
  `);
}

function renderTravel() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Travel</h2>
        <div class="muted">แยกต้นทาง: สนามบิน / รถไฟ / บขส / รถยนต์ • เส้นทาง/เวลา/ค่าใช้จ่าย</div>
      </div>

      <div class="travelLayout">
        <!-- LEFT: Source selector -->
        <div class="card travelLeft">
          <h3 style="margin:0 0 10px 0">เลือกต้นทาง</h3>

          <div class="travelTabs">
            <button class="tabBtn active" data-src="airport">✈️ สนามบิน</button>
            <button class="tabBtn" data-src="train">🚆 รถไฟ</button>
            <button class="tabBtn" data-src="bus">🚌 บขส</button>
            <button class="tabBtn" data-src="car">🚗 รถยนต์</button>
          </div>

          <div class="muted" style="font-size:12px;margin-top:10px">
            เลือกต้นทางเพื่อดูเส้นทางแนะนำ / จุดลงรถ / เวลา / ค่าใช้จ่าย
          </div>
        </div>

        <!-- RIGHT: Detail area -->
        <div class="travelRight">
          <div class="travelHeader card">
            <div class="row" style="justify-content:space-between">
              <div>
                <h3 style="margin:0">จากสนามบินสุราษฎร์ฯ → Venue</h3>
                <div class="muted" style="font-size:12px;margin-top:4px">
                  ศูนย์ประชุมฯ ศาลากลางสุราษฎร์ธานี
                </div>
              </div>
              <button class="btn small" id="btnOpenMap">เปิดแผนที่จริง</button>
<button class="btn small ghost" id="btnCopyMap">คัดลอกลิงก์</button>
            </div>
          </div>

          <div class="travelCards">
            ${card("ตัวเลือกแนะนำ", `
              <div class="row">
                <span class="badge">รถตู้/แท็กซี่</span>
                <span class="badge">เร็ว</span>
                <span class="badge">สะดวก</span>
              </div>
              <p class="muted" style="margin-top:8px">
                เวลา: ~40–60 นาที • ค่าใช้จ่าย: ~XXX–XXX บาท (Placeholder)
              </p>
            `)}

            ${card("Step-by-step", `
              <ol style="margin:0; padding-left:18px">
                <li>ออกจากอาคารผู้โดยสาร → จุดรับรถ</li>
                <li>แจ้งปลายทาง: “ศาลากลางสุราษฎร์ฯ / ศูนย์ประชุมฯ”</li>
                <li>ถึงจุดลงทะเบียน: ชั้น 1 โซน A</li>
              </ol>
              <div class="row" style="margin-top:10px">
                <button class="btn small">เปิดแผนที่ (จำลอง)</button>
                <button class="btn small ghost">แชร์เส้นทาง</button>
              </div>
            `)}

            ${card("จุดสำคัญ", `
              <ul style="margin:0; padding-left:18px">
                <li>Drop-off แนะนำ: ประตูหน้าอาคาร</li>
                <li>Parking: โซน B (ถ้ามี)</li>
                <li>Help Desk: หน้าลงทะเบียน</li>
              </ul>
            `)}

            ${card("หมายเหตุ", `
              <p class="muted" style="margin:0">
                ใส่ข้อมูลจริงได้ภายหลัง: ตารางรถตู้, เบอร์ติดต่อ, เวลาเร่งด่วน
              </p>
            `)}
${card("แผนที่ (Google Maps)", `
  <div class="mapBox">
    <iframe
      class="mapFrame"
      src="${MAPS_EMBED_URL(VENUE_QUERY)}"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen
    ></iframe>
  </div>
  <div class="row" style="margin-top:10px">
    <a class="btn small" href="${MAPS_OPEN_URL(VENUE_QUERY)}" target="_blank" rel="noopener">เปิดแผนที่จริง</a>
    <button class="btn small ghost" id="btnCopyMap2">คัดลอกลิงก์</button>
  </div>
  <div class="muted" style="font-size:12px;margin-top:8px">
    *ถ้า Embed ไม่ขึ้น ให้เปิดแผนที่จริง (บางเครือข่ายบล็อค iframe)
  </div>
`)}

          </div>
        </div>
      </div>
    </div>
  `);

  // ---- Simple tab behavior (prototype) ----
  const tabs = document.querySelectorAll(".tabBtn");
  const header = document.querySelector(".travelHeader h3");

  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const src = btn.dataset.src;
      const mapTitle = {
        airport: "จากสนามบินสุราษฎร์ฯ → Venue",
        train: "จากสถานีรถไฟ → Venue",
        bus: "จาก บขส → Venue",
        car: "เดินทางด้วยรถยนต์ → Venue",
      };
      header.textContent = mapTitle[src] || "Travel → Venue";
    };
  });
}


function renderStay(){ mount(`<div class="grid"><div class="card kv"><h2>ที่พัก</h2><div class="muted">รายการที่พัก + ระยะทาง + เบอร์ + แผนที่ (Placeholder)</div></div>${card("ตัวอย่างที่พัก", `<div class="row"><span class="badge">ใกล้สนาม</span><span class="badge">ช่วงราคา</span></div><p class="muted">Hotel A • 2.1 กม. • โทร • แผนที่</p>`)} </div>`); }
function renderFood(){ mount(`<div class="grid"><div class="card kv"><h2>ร้านอาหาร</h2><div class="muted">จัดหมวด เช้า/กลางวัน/เย็น/มื้อดึก (Placeholder)</div></div>${card("ตัวอย่างร้าน", `<div class="row"><span class="badge">เช้า</span><span class="badge">ใกล้สนาม</span></div><p class="muted">ร้าน A • เวลาเปิด • แผนที่</p>`)} </div>`); }
function renderRules(){ mount(`<div class="grid"><div class="card kv"><h2>Rules</h2><div class="muted">กติกา/อุปกรณ์ที่อนุญาต/บทลงโทษ (Placeholder)</div></div>${card("สรุปกติกา", `<ul><li>การเช็กอินก่อนแข่ง</li><li>อุปกรณ์ที่อนุญาต</li><li>ความเป็นธรรมการแข่งขัน</li></ul> <button class="btn small ghost">ดาวน์โหลด PDF (จำลอง)</button>`)} </div>`); }
function renderDocuments(){ mount(`<div class="grid"><div class="card kv"><h2>Documents</h2><div class="muted">ศูนย์รวมเอกสารดาวน์โหลด (Placeholder)</div></div>${card("ไฟล์", `<ul><li>ตารางแข่ง (PDF)</li><li>กติกา (PDF)</li><li>Media Guideline (PDF)</li></ul>`)} </div>`); }

function renderIncidents() {
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Incidents</h2>
        <div class="muted">แจ้งปัญหา/เหตุฉุกเฉิน • ของจริงจะส่งเข้าคิวทีมงาน + Assign</div>
      </div>

      ${card("ฟอร์มแจ้งปัญหา", `
        <div class="form">
          <label>ประเภท</label>
          <select class="select">
            <option>เทคนิค/อุปกรณ์</option>
            <option>ตาราง/เวลา</option>
            <option>สุขภาพ/การแพทย์</option>
            <option>อื่น ๆ</option>
          </select>
          <label>สถานที่/ห้อง</label>
          <input class="input" placeholder="เช่น Room A / จุดลงทะเบียน" />
          <label>รายละเอียด</label>
          <textarea class="textarea" placeholder="อธิบายสั้น ๆ พร้อมเวลาที่เกิดเหตุ"></textarea>
          <div class="row">
            <button class="btn ok" onclick="alert('ส่งเคสแล้ว (จำลอง)')">ส่งเคส</button>
            <button class="btn ghost" onclick="alert('แนบรูป (จำลอง)')">แนบรูป</button>
          </div>
        </div>
      `)}

      ${card("สถานะเคสของฉัน (ตัวอย่าง)", `
        <div class="row">
          <span class="badge live">รับเรื่องแล้ว</span>
          <span class="badge">Assign: TECH-02</span>
          <span class="badge">ETA: 10 นาที</span>
        </div>
        <p class="muted">เคส #A-102 • อินเทอร์เน็ตไม่เสถียรใน Room A</p>
      `)}
    </div>
  `);
}

function renderContacts(){
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Contacts</h2>
        <div class="muted">ติดต่อทีมงานแยกฝ่าย (Prototype)</div>
      </div>
      ${card("ฝ่ายประสานงาน", `<div class="row"><span class="badge">OPS</span><span class="badge">09:00–20:00</span></div><p>โทร: XXX-XXX-XXXX • Line: @xxxxx</p>`)}
      ${card("ฝ่ายเทคนิค", `<div class="row"><span class="badge">TECH</span><span class="badge live">On-call</span></div><p>โทร: XXX-XXX-XXXX • Line: @xxxxx</p>`)}
      ${card("ฉุกเฉิน/พยาบาล", `<div class="row"><span class="badge">MED</span><span class="badge danger">Emergency</span></div><p>โทร: XXX-XXX-XXXX</p>`)}
    </div>
  `);
}

function renderFAQ(){
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>FAQ</h2>
        <div class="muted">คำถามพบบ่อย ลดคำถามซ้ำหน้างาน</div>
      </div>
      ${card("ตัวอย่าง FAQ", `
        <details open><summary>ต้องเช็กอินก่อนแข่งกี่นาที?</summary><p class="muted">แนะนำ 60 นาที และตรวจอุปกรณ์ 45 นาที</p></details>
        <details><summary>ถ้าชื่อผู้เล่นไม่ตรงทำอย่างไร?</summary><p class="muted">ติดต่อจุดลงทะเบียน/ฝ่ายประสานงาน</p></details>
        <details><summary>ของหายติดต่อที่ไหน?</summary><p class="muted">ติดต่อฝ่ายประสานงาน</p></details>
      `)}
    </div>
  `);
}

/* ---- Staff tools ---- */
function renderRunOfShow(){
  if (state.role !== "STAFF") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>Run-of-show (ทีมงาน)</h2>
        <div class="muted">ไทม์ไลน์ปฏิบัติงานรายวัน (Placeholder)</div>
      </div>
      ${card("Timeline", `
        <table class="table">
          <thead><tr><th>เวลา</th><th>งาน</th><th>Owner</th></tr></thead>
          <tbody>
            <tr><td>08:00</td><td>เปิดระบบ/ตรวจเน็ต</td><td>TECH</td></tr>
            <tr><td>09:00</td><td>เปิดลงทะเบียน</td><td>OPS</td></tr>
            <tr><td>10:00</td><td>เริ่มแข่งรอบแรก</td><td>REF/OPS</td></tr>
          </tbody>
        </table>
      `)}
    </div>
  `);
}
function renderCheckInManager(){
  if (state.role !== "STAFF") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv"><h2>Check-in Manager</h2><div class="muted">ค้นหา/สแกน QR/ทำสถานะเช็กอิน (Placeholder)</div></div>
      ${card("ค้นหาทีม", `<div class="row"><input class="input" style="flex:1" placeholder="ทีม/จังหวัด"/><button class="btn small">ค้นหา</button><button class="btn small ghost">สแกน QR</button></div>`)}
      ${card("รายการทีม (ตัวอย่าง)", `<table class="table"><thead><tr><th>ทีม</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead><tbody><tr><td>จังหวัด A</td><td><span class="badge done">Checked-in</span></td><td>ครบ</td></tr><tr><td>จังหวัด B</td><td><span class="badge">Pending</span></td><td>รอเอกสาร</td></tr></tbody></table>`)}
    </div>
  `);
}
function renderCallTimeManager(){
  if (state.role !== "STAFF") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv"><h2>Call Time Manager</h2><div class="muted">ปรับ call time แบบกลุ่ม/ตั้ง buffer (Placeholder)</div></div>
      ${card("เครื่องมือ", `<div class="row"><button class="btn small ok">ปรับเวลา +10 นาที</button><button class="btn small ghost">ตั้ง Buffer 5 นาที</button><button class="btn small ghost">ประกาศอัปเดต</button></div>`)}
      ${card("ตาราง call time", `<table class="table"><thead><tr><th>ทีม</th><th>Call</th><th>Match</th><th>Room</th></tr></thead><tbody><tr><td>จังหวัด A</td><td>09:15</td><td>10:00</td><td>A</td></tr><tr><td>จังหวัด C</td><td>11:45</td><td>12:30</td><td>B</td></tr></tbody></table>`)}
    </div>
  `);
}
function renderMatchOps(){
  if (state.role !== "STAFF") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv"><h2>Match Ops</h2><div class="muted">เปลี่ยนสถานะแมตช์/ห้อง/บันทึกโน้ต (Placeholder)</div></div>
      ${card("Live / Upcoming", `<table class="table"><thead><tr><th>Match</th><th>Status</th><th>Room</th><th>Action</th></tr></thead><tbody><tr><td>001</td><td><span class="badge live">Live</span></td><td>A</td><td><button class="btn small ghost" onclick="alert('Pause/Resume (จำลอง)')">ควบคุม</button></td></tr><tr><td>007</td><td><span class="badge">Upcoming</span></td><td>B</td><td><button class="btn small ok" onclick="alert('Start (จำลอง)')">เริ่ม</button></td></tr></tbody></table>`)}
    </div>
  `);
}
function renderResultsManager(){
  if (state.role !== "STAFF") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv"><h2>Results Manager</h2><div class="muted">กรอกผล/อัปเดต bracket (Placeholder)</div></div>
      ${card("กรอกผล", `<div class="form"><label>Match ID</label><input class="input" placeholder="เช่น 001"/><label>Score</label><input class="input" placeholder="2-0"/><button class="btn ok" onclick="alert('บันทึกผล (จำลอง)')">บันทึก</button></div>`)}
    </div>
  `);
}
function renderIncidentsQueue(){
  if (state.role !== "STAFF") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv"><h2>Incidents Queue</h2><div class="muted">คิวปัญหา + Assign + ปิดเคส (Placeholder)</div></div>
      ${card("รายการเคส", `<table class="table"><thead><tr><th>ID</th><th>ประเภท</th><th>ห้อง</th><th>สถานะ</th><th>Assign</th></tr></thead><tbody><tr><td>A-102</td><td>เทคนิค</td><td>A</td><td><span class="badge live">กำลังแก้</span></td><td>TECH-02</td></tr><tr><td>A-103</td><td>ตาราง</td><td>B</td><td><span class="badge">ใหม่</span></td><td><button class="btn small ok" onclick="alert('Assign (จำลอง)')">Assign</button></td></tr></tbody></table>`)}
    </div>
  `);
}
function renderDocumentsManager(){
  if (state.role !== "STAFF") return renderForbidden();
  mount(`
    <div class="grid">
      <div class="card kv"><h2>Documents Manager</h2><div class="muted">อัปโหลด/จัดหมวดเอกสาร (Placeholder)</div></div>
      ${card("อัปโหลด", `<div class="row"><button class="btn ok" onclick="alert('Upload (จำลอง)')">อัปโหลดไฟล์</button><button class="btn ghost" onclick="alert('จัดหมวด (จำลอง)')">จัดหมวด</button></div>`)}
    </div>
  `);
}

function renderForbidden(){
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>403 • ไม่มีสิทธิ์เข้าถึง</h2>
        <div class="muted">หน้านี้สงวนสำหรับทีมงานเท่านั้น</div>
        <div class="row" style="margin-top:10px">
          <a class="btn" href="#/">กลับหน้า Dashboard</a>
          <a class="btn ghost" href="#/login">สลับบัญชี</a>
        </div>
      </div>
    </div>
  `);
}
function renderNotFound(){
  mount(`
    <div class="grid">
      <div class="card kv">
        <h2>404 • ไม่พบหน้า</h2>
        <div class="muted">ตรวจสอบลิงก์หรือกลับหน้า Dashboard</div>
        <a class="btn" href="#/">กลับหน้า Dashboard</a>
      </div>
    </div>
  `);
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
}
function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}
function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

if (btnMenu) btnMenu.addEventListener("click", toggleSidebar);
if (overlay) overlay.addEventListener("click", closeSidebar);

// ปิดเมนูอัตโนมัติเมื่อกดลิงก์ใน sidebar (มือถือ)
document.querySelectorAll("#sidebar a.navItem").forEach(a => {
  a.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 980px)").matches) closeSidebar();
  });
});

/* ---------- Events ---------- */
window.addEventListener("hashchange", () => navigate(location.hash));

$("#btnLogout").addEventListener("click", logout);
$("#btnHelp").addEventListener("click", () => alert("Help (จำลอง): ติดต่อฝ่ายประสานงาน/แอดมินระบบ"));

/* init */
if (!location.hash) location.hash = "#/login";
applyRoleToUI();
navigate(location.hash);
