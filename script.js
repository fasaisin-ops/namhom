/* ==========================================================
   Body Scent — script.js (ใช้ร่วมกันทุกหน้า)
   ทำงานตาม element ที่พบในหน้านั้นๆ:
   - product.html : #filter-bar, #product-list
   - order.html   : #orderForm, #customerName, #contact, #items, #total, #note
   - admin.html   : #ordersTable tbody
   ========================================================== */

var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyt73_vDRSb2aGjb9CGkmB1IUZmVv0bNw8nkKk3_05xIh7wwTZK1nc5z9uSCBSQv5LBGQ/exec";
var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTmh74SA6VR4k8G2O_pPYBPQhir9KxgijHnTCMZcRrADjNM5bWStQy1z38jbO44O9C_EqQzKy_Dq-p4/pub?gid=0&single=true&output=csv";

var MOODS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "fresh", label: "Fresh" },
  { key: "sweet", label: "Sweet" },
  { key: "confident", label: "Confident" },
  { key: "romance", label: "Romance" }
];

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("product-list")) initProductPage();
  if (document.getElementById("orderForm")) initOrderPage();
  if (document.querySelector("#ordersTable tbody")) initAdminPage();
});

/* ==========================================================
   1) หน้า product.html
   ========================================================== */
function initProductPage() {
  var filterBar = document.getElementById("filter-bar");
  var list = document.getElementById("product-list");
  var products = [];

  var params = new URLSearchParams(window.location.search);
  var current = (params.get("mood") || "all").toLowerCase();
  var valid = MOODS.some(function (m) { return m.key === current; });
  if (!valid) current = "all";

  buildFilterBar();

  fetch("products.json")
    .then(function (res) {
      if (!res.ok) throw new Error("โหลด products.json ไม่สำเร็จ");
      return res.json();
    })
    .then(function (data) {
      products = data;
      render();
    })
    .catch(function (error) {
      console.error(error);
      list.textContent = "ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง";
    });

  function buildFilterBar() {
    if (!filterBar) return;
    filterBar.classList.add("filter");
    filterBar.innerHTML = "";
    MOODS.forEach(function (m) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = m.label;
      btn.dataset.mood = m.key;
      if (m.key === current) btn.classList.add("is-active");
      btn.addEventListener("click", function () {
        current = m.key;
        filterBar.querySelectorAll("button").forEach(function (b) {
          b.classList.toggle("is-active", b.dataset.mood === current);
        });
        render();
      });
      filterBar.appendChild(btn);
    });
  }

  function render() {
    list.innerHTML = "";
    var shown = products.filter(function (p) {
      return current === "all" || p.mood === current;
    });

    if (shown.length === 0) {
      list.textContent = "ไม่พบสินค้าในหมวดนี้";
      return;
    }
    shown.forEach(function (p) { list.appendChild(createCard(p)); });
  }

  function createCard(p) {
    var itemName = p.size ? p.name + " " + p.size : p.name;
    var moodLabel = p.mood.charAt(0).toUpperCase() + p.mood.slice(1);

    var card = document.createElement("article");
    card.className = "product-card mood-" + p.mood;

    var imgWrap = document.createElement("div");
    imgWrap.className = "product-card__image";
    var img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;
    img.loading = "lazy";
    imgWrap.appendChild(img);

    var body = document.createElement("div");
    body.className = "product-card__body";

    var mood = document.createElement("div");
    mood.className = "product-card__mood";
    var dot = document.createElement("span");
    dot.className = "mood-dot";
    mood.appendChild(dot);
    mood.appendChild(document.createTextNode(moodLabel));

    var name = document.createElement("h3");
    name.className = "product-card__name";
    name.textContent = p.name;

    var meta = document.createElement("div");
    meta.className = "product-card__meta";
    meta.textContent = p.size ? "ขนาด " + p.size : "";

    var foot = document.createElement("div");
    foot.className = "product-card__foot";
    foot.style.marginTop = "auto";

    var price = document.createElement("span");
    price.className = "price";
    price.textContent = Number(p.price).toLocaleString("th-TH") + " บาท";

    var btn = document.createElement("a");
    btn.className = "btn btn--small";
    btn.textContent = "สั่งซื้อ";
    btn.href = "order.html?item=" + encodeURIComponent(itemName) +
               "&price=" + encodeURIComponent(p.price);

    foot.appendChild(price);
    foot.appendChild(btn);
    body.appendChild(mood);
    body.appendChild(name);
    body.appendChild(meta);
    body.appendChild(foot);
    card.appendChild(imgWrap);
    card.appendChild(body);
    return card;
  }
}

/* ==========================================================
   2) หน้า order.html
   ========================================================== */
function initOrderPage() {
  var form = document.getElementById("orderForm");
  var itemsEl = document.getElementById("items");
  var totalEl = document.getElementById("total");

  // เติมค่าจาก URL parameter ลงทั้งช่อง items และ total
  var params = new URLSearchParams(window.location.search);
  var item = params.get("item");
  var price = params.get("price");
  if (item && itemsEl) itemsEl.value = item;
  if (price && totalEl) totalEl.value = price;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var payload = {
      customerName: document.getElementById("customerName").value.trim(),
      contact: document.getElementById("contact").value.trim(),
      items: itemsEl.value.trim(),
      total: totalEl.value.trim(),
      note: document.getElementById("note").value.trim()
    };

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    .then(() => { window.location.href = 'thankyou.html'; })
    .catch(error => {
      console.error(error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      if (submitBtn) submitBtn.disabled = false;
    });
  });
}

/* ==========================================================
   3) หน้า admin.html
   ========================================================== */
function initAdminPage() {
  var tbody = document.querySelector("#ordersTable tbody");
  var COLS = 6;

  showMessage("กำลังโหลดข้อมูล...");

  fetch(SHEET_CSV_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      return res.text();
    })
    .then(function (text) {
      var rows = parseCSV(text).filter(function (r) {
        return r.some(function (c) { return c.trim() !== ""; });
      });

      // ถ้าแถวแรกเป็นหัวตาราง (ช่องแรกไม่มีตัวเลขเลย เช่น "วันเวลา") ให้ข้าม
      if (rows.length && !/\d/.test(rows[0][0] || "")) rows.shift();

      // แถวใหม่ถูกเพิ่มต่อท้ายชีตเสมอ จึงกลับลำดับเพื่อให้ล่าสุดขึ้นก่อน
      rows.reverse();

      if (rows.length === 0) {
        showMessage("ยังไม่มีคำสั่งซื้อ");
        return;
      }

      tbody.innerHTML = "";
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        for (var i = 0; i < COLS; i++) {
          var td = document.createElement("td");
          td.textContent = r[i] !== undefined ? r[i] : "";
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    })
    .catch(function (error) {
      console.error(error);
      showMessage("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    });

  function showMessage(msg) {
    tbody.innerHTML = "";
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.colSpan = COLS;
    td.textContent = msg;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

/* ---------- CSV parser (รองรับ "..." , "" ในข้อความ, และขึ้นบรรทัดใหม่ในช่อง) ---------- */
function parseCSV(text) {
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;

  // ตัด BOM ถ้ามี
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  for (var i = 0; i < text.length; i++) {
    var ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
