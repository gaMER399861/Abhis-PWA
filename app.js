/* ---------- Calculator Logic ---------- */
const currentEl = document.getElementById('current');
const historyEl = document.getElementById('history');
const statusEl  = document.getElementById('status');

let current = '0';
let previous = '';
let operator = null;
let justEvaluated = false;

function updateDisplay() {
  currentEl.textContent = current;
  historyEl.textContent = previous && operator
    ? `${previous} ${operatorSymbol(operator)}`
    : '';
}

function operatorSymbol(op) {
  return { '+': '+', '-': '−', '*': '×', '/': '÷', '%': '%' }[op] || op;
}

function inputDigit(d) {
  if (justEvaluated) { current = '0'; justEvaluated = false; }
  if (d === '.' && current.includes('.')) return;
  current = current === '0' && d !== '.' ? d : current + d;
  updateDisplay();
}

function chooseOperator(op) {
  if (operator && !justEvaluated) compute();
  previous = current;
  operator = op;
  current = '0';
  justEvaluated = false;
  updateDisplay();
}

function compute() {
  if (!operator || previous === '') return;
  const a = parseFloat(previous);
  const b = parseFloat(current);
  let result;
  switch (operator) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = b === 0 ? NaN : a / b; break;
    case '%': result = a % b; break;
  }
  current = isNaN(result) ? 'Error' : String(+result.toFixed(10));
  previous = '';
  operator = null;
  justEvaluated = true;
  updateDisplay();
}

function clearAll() {
  current = '0'; previous = ''; operator = null; justEvaluated = false;
  updateDisplay();
}

function backspace() {
  if (justEvaluated) return clearAll();
  current = current.length > 1 ? current.slice(0, -1) : '0';
  updateDisplay();
}

/* ---------- Event Listeners (as requested) ---------- */
document.querySelector('.buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const value  = btn.dataset.value;
  const action = btn.dataset.action;

  if (value !== undefined) {
    if (['+', '-', '*', '/', '%'].includes(value)) chooseOperator(value);
    else inputDigit(value);
  } else if (action === 'equals') {
    compute();
  } else if (action === 'clear') {
    clearAll();
  } else if (action === 'backspace') {
    backspace();
  }
});

/* Keyboard support */
document.addEventListener('keydown', (e) => {
  if (/[0-9.]/.test(e.key)) inputDigit(e.key);
  else if (['+', '-', '*', '/', '%'].includes(e.key)) chooseOperator(e.key);
  else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); compute(); }
  else if (e.key === 'Backspace') backspace();
  else if (e.key === 'Escape') clearAll();
});

/* ---------- PWA: Register Service Worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => statusEl.textContent = '✅ Ready (offline supported)')
      .catch(err => statusEl.textContent = '⚠️ SW failed: ' + err.message);
  });
} else {
  statusEl.textContent = '⚠️ Service workers not supported';
}

/* ---------- PWA: Install Prompt ---------- */
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.add('show');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  statusEl.textContent = outcome === 'accepted'
    ? '🎉 App installed!'
    : 'Install dismissed';
  deferredPrompt = null;
  installBtn.classList.remove('show');
});

window.addEventListener('appinstalled', () => {
  statusEl.textContent = '🎉 App installed successfully!';
  installBtn.classList.remove('show');
});