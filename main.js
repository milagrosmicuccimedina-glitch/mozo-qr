// ===== Configuración =====
// Número de WhatsApp para contratar: código de país + área + número, sin espacios ni "+".
// Ej.: "5492954123456". Mientras esté vacío, los botones abren WhatsApp sin destinatario.
const WHATSAPP = "";

// ===== Links de WhatsApp =====
document.querySelectorAll(".js-wa").forEach((a) => {
  const text = encodeURIComponent(a.dataset.msg || "Hola! Quiero info sobre Mozo QR.");
  a.href = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${text}` : `https://wa.me/?text=${text}`;
  a.target = "_blank";
  a.rel = "noopener";
});
document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

// ===== Demo: carta de un local de ejemplo =====
const MENU = {
  Entradas: [
    ["🥟", "Empanadas de carne", "Cortadas a cuchillo, al horno. Por unidad.", 2200],
    ["🧀", "Provoleta", "Con orégano, ají molido y oliva.", 7800],
    ["🥗", "Ensalada de la casa", "Hojas verdes, tomate, huevo y croutons.", 6900],
  ],
  Principales: [
    ["🥩", "Bife de chorizo", "400 g, con papas fritas o puré.", 18500],
    ["🍝", "Sorrentinos de jamón y queso", "Con salsa a elección.", 12900],
    ["🍗", "Milanesa napolitana", "Con guarnición. Para compartir.", 16400],
  ],
  Postres: [
    ["🍮", "Flan casero", "Con dulce de leche o crema.", 5200],
    ["🍨", "Helado", "Dos gustos.", 4800],
  ],
  Bebidas: [
    ["🥤", "Gaseosa 500 ml", "Línea Coca-Cola.", 3200],
    ["🍷", "Copa de vino", "Malbec de la casa.", 4500],
    ["🍺", "Cerveza tirada", "Pinta.", 5000],
  ],
};

const cart = new Map(); // nombre -> { qty, price }
const peso = (n) => "$" + n.toLocaleString("es-AR");
const tabs = document.querySelector(".menu__tabs");
const list = document.querySelector(".menu__list");

function showCategory(name) {
  tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.textContent === name)));
  list.innerHTML = "";
  for (const [emoji, title, desc, price] of MENU[name]) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="menu__emoji" aria-hidden="true">${emoji}</span>
      <div><p class="menu__name"></p><p class="menu__desc"></p></div>
      <div class="menu__right">
        <span class="menu__price">${peso(price)}</span>
        <span class="menu__count"></span>
      </div>
      <button type="button" class="menu__add">+</button>`;
    li.querySelector(".menu__name").textContent = title;
    li.querySelector(".menu__desc").textContent = desc;
    const add = li.querySelector(".menu__add");
    add.setAttribute("aria-label", `Agregar ${title}`);
    const count = li.querySelector(".menu__count");
    const paint = () => (count.textContent = cart.get(title)?.qty ? `En tu pedido: ${cart.get(title).qty}` : "");
    add.addEventListener("click", () => {
      const it = cart.get(title) || { qty: 0, price };
      it.qty++;
      cart.set(title, it);
      paint();
      renderCart();
    });
    paint();
    list.appendChild(li);
  }
}

Object.keys(MENU).forEach((name, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.role = "tab";
  b.textContent = name;
  b.addEventListener("click", () => showCategory(name));
  tabs.appendChild(b);
  if (i === 0) showCategory(name);
});

// ===== Demo: avisos al personal =====
const status = document.querySelector(".app__status");
const pay = document.querySelector(".pay");
const callBtn = document.querySelector('[data-action="call"]');
const billBtn = document.querySelector('[data-action="bill"]');
const staffList = document.querySelector(".staff__list");
const staffCount = document.querySelector(".staff__count");
let pending = 0;

function updateCount() {
  staffCount.textContent = pending === 1 ? "1 aviso" : `${pending} avisos`;
}

function addAlert({ kind, title, meta, items = [], onDone }) {
  staffList.querySelector(".staff__empty")?.remove();
  const li = document.createElement("li");
  li.className = `alert alert--${kind}`;
  const time = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  li.innerHTML = `
    <span class="alert__icon" aria-hidden="true">${{ bill: "🧾", order: "🍽️" }[kind] || "🔔"}</span>
    <div class="alert__body"><p class="alert__title"></p><p class="alert__meta"></p></div>
    <button type="button">Atendido</button>`;
  li.querySelector(".alert__title").textContent = title;
  li.querySelector(".alert__meta").textContent = `${meta} · ${time}`;
  if (items.length) {
    const ul = document.createElement("ul");
    ul.className = "alert__items";
    for (const t of items) {
      const i = document.createElement("li");
      i.textContent = t;
      ul.appendChild(i);
    }
    li.querySelector(".alert__body").appendChild(ul);
  }
  li.querySelector("button").addEventListener("click", () => {
    li.classList.add("alert--done");
    li.querySelector(".alert__meta").textContent += " · atendido ✓";
    pending--;
    updateCount();
    onDone();
  });
  staffList.prepend(li);
  pending++;
  updateCount();
  beep();
}

callBtn.addEventListener("click", () => {
  callBtn.disabled = true;
  status.textContent = "✓ Listo, el mozo ya viene a tu mesa.";
  addAlert({
    kind: "call",
    title: "Mesa 4 llama al mozo",
    meta: "La Esquina",
    onDone: () => {
      callBtn.disabled = false;
      status.textContent = "";
    },
  });
});

billBtn.addEventListener("click", () => {
  pay.hidden = !pay.hidden;
});

pay.querySelectorAll("[data-pay]").forEach((b) =>
  b.addEventListener("click", () => {
    const method = b.dataset.pay;
    pay.hidden = true;
    billBtn.disabled = true;
    status.textContent = `✓ Ya te traen la cuenta. Pagás con ${method}.`;
    addAlert({
      kind: "bill",
      title: "Mesa 4 pide la cuenta",
      meta: `Paga con ${method}`,
      onDone: () => {
        billBtn.disabled = false;
        status.textContent = "";
      },
    });
  }),
);

// Sonidito corto, como el que escucha el mozo en el celular
let audio;
function beep() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, audio.currentTime);
    o.frequency.setValueAtTime(1175, audio.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.35);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.36);
  } catch {
    // Sin audio: el aviso igual aparece en pantalla
  }
}

// ===== Demo: pedido desde la mesa =====
const cartBar = document.querySelector(".cart");
const cartQty = document.querySelector(".cart__qty");
const cartTotal = document.querySelector(".cart__total");
const cartSend = document.querySelector(".cart__send");

function renderCart() {
  let qty = 0;
  let total = 0;
  for (const it of cart.values()) {
    qty += it.qty;
    total += it.qty * it.price;
  }
  cartBar.hidden = qty === 0;
  cartQty.textContent = qty === 1 ? "1 producto" : `${qty} productos`;
  cartTotal.textContent = peso(total);
}

cartSend.addEventListener("click", () => {
  const items = [...cart.entries()].map(([name, it]) => `${it.qty} × ${name}`);
  const total = cartTotal.textContent;
  addAlert({
    kind: "order",
    title: "Mesa 4 hizo un pedido",
    meta: `Total ${total}`,
    items,
    onDone: () => {},
  });
  cart.clear();
  renderCart();
  showCategory(tabs.querySelector('[aria-selected="true"]').textContent);
  status.textContent = "✓ ¡Pedido enviado! Ya lo están preparando.";
  setTimeout(() => {
    if (status.textContent.startsWith("✓ ¡Pedido")) status.textContent = "";
  }, 4000);
});
