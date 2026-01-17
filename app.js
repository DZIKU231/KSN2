const form = document.getElementById('transaction-form');
const list = document.getElementById('transaction-list');
const totalProfitEl = document.getElementById('total-profit');
const totalLossEl = document.getElementById('total-loss');
const balanceEl = document.getElementById('balance');
const appEl = document.getElementById('app');
const pinScreen = document.getElementById('pin-screen');
const pinInput = document.getElementById('pin-input');
const pinMsg = document.getElementById('pin-msg');
const themeToggle = document.getElementById('theme-toggle');
const loginBtn = document.querySelector(".login-btn");
const resetBtn = document.querySelector("#resetBtn");

const goalInput = document.getElementById('goal-input');
const setGoalBtn = document.getElementById('set-goal-btn');
const goalProgressText = document.getElementById('goal-progress-text');
const goalBar = document.getElementById('goal-bar');
const goalWarning = document.getElementById('goal-warning');

const particleCount = window.innerWidth > 1200 ? 80 :
                      window.innerWidth > 800 ? 60 : 40;
                      
  function setParticlesDynamic(balance) {
  if (!window.pJSDom?.length) return;
  const p = pJSDom[0].pJS;

  let color;
  if (balance > 0) color = "#00c853";
  else if (balance < 0) color = "#ff1744";
  else color = document.body.classList.contains("dark") ? "#ffffff" : "#000000";

  p.particles.color.value = color;
  p.particles.line_linked.color = color;
  p.fn.particlesRefresh();
}


document.addEventListener("DOMContentLoaded", () => {
  // Pobierz motyw z localStorage
  const savedTheme = localStorage.getItem("theme") || "light";

  // Inicjalizacja particles
  particlesJS("particles-js", {
  particles: {
   number: { value: particleCount },
    color: { value: "#ffffff" },
    shape: { type: "circle" },
    opacity: {value: 0.5,
    anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
},
    size: {value: 3,
    anim: { enable: true, speed: 3, size_min: 1, sync: false }
},
    line_linked: { enable: true, distance: 150, opacity: 0.4, color: "#ffffff" },
    move: { enable: true, speed: 2 }
  },
  interactivity: {
    events: {
      onhover: { enable: true, mode: "grab" }, // cząsteczki przyciągają się do kursora
    onclick: { enable: true, mode: "repulse" } // kliknięcie odpycha cząsteczki
    },
    modes: {
       grab: { distance: 120, line_linked: { opacity: 0.8 } },
    repulse: { distance: 150, duration: 0.4 }
    }
  },
  retina_detect: true
});


  // Funkcja zmiany koloru przy toggle motywu
  function setParticlesColor(color) {
    if (!window.pJSDom?.length) return;
    const p = pJSDom[0].pJS;
    p.particles.color.value = color;
    p.particles.line_linked.color = color;
    p.fn.particlesRefresh();
  }

 
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const newColor = document.body.classList.contains("dark") ? "#ffffff" : "#000000";
    setParticlesColor(newColor);
  });
});


let chart;
let chartMode = 'daily';
resetBtn.addEventListener("click", ()=>{
  transactions = [];
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
  updateSummary();
})

let transactions = [];
getTodayDate()

function getTodayDate(){
  const data = new Date();
  let dzien = data.getDate();
  let miesiac = data.getMonth() +1;
  const rok = data.getFullYear();
 if (dzien < 10) dzien = `0${dzien}`;
if (miesiac < 10) miesiac = `0${miesiac}`;

const formatedDate = `${rok}-${miesiac}-${dzien}`;
document.getElementById("date").value = formatedDate;
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
  const saved = localStorage.getItem('transactions');
  if (saved) {
    transactions = JSON.parse(saved).map(t => ({
      ...t,
      id: t.id || Date.now() + Math.random() 
    }));
    saveTransactions(); 
    renderTransactions();
    updateSummary();
  }
}

loginBtn.addEventListener("click", ()=>{
    login();
})

function savePIN(pin) {
  localStorage.setItem('pin', pin);
}

function login() {
  const storedPIN = localStorage.getItem('pin');
  const entered = pinInput.value;

  if (!storedPIN) {
    savePIN(entered);
    pinScreen.classList.add('hidden');
    appEl.classList.remove('hidden');
    loadTransactions();
  } else if (entered === storedPIN) {
    pinScreen.classList.add('hidden');
    appEl.classList.remove('hidden');
    loadTransactions();
  } else {
    pinMsg.textContent = "❌ Niepoprawny PIN!";
  }
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const desc = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;

  const transaction = {
  id: Date.now(),
  date,
  desc,
  amount,
  type
};
  transactions.push(transaction);
  saveTransactions();
  renderTransactions();
  updateSummary();
  document.getElementById('amount').value = '';
});

function renderTransactions() {
  list.innerHTML = '';
  transactions.forEach(t => {
  const li = document.createElement('li');
  li.dataset.id = t.id;

  let i = document.createElement("i");
  i.classList.add("fa-solid", "fa-trash", "icon");

  i.addEventListener("click", () => {
    deleteTransaction(t.id);
  });

  li.innerHTML = `${t.date} - ${t.desc}: ${t.type === 'profit' ? '+' : '-'}${t.amount} zł`;
  li.appendChild(i);
  list.appendChild(li);
});
}

function updateSummary() {
  const profit = transactions
    .filter(t => t.type === 'profit')
    .reduce((sum, t) => sum + t.amount, 0);

  const loss = transactions
    .filter(t => t.type === 'loss')
    .reduce((sum, t) => sum + t.amount, 0);

  totalProfitEl.textContent = profit.toFixed(2);
  totalLossEl.textContent = loss.toFixed(2);
  balanceEl.textContent = (profit - loss).toFixed(2);

  calculateEfficiency();
  updateChart();
  updateGoalProgress(profit - loss);
  setParticlesDynamic(profit - loss);
}

// Motyw: przełączanie jasny/ciemny
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  document.body.classList.toggle('light');
  const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', mode);
});

// Załaduj motyw przy starcie
window.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }
});


function setChartMode(mode) {
  chartMode = mode;
  updateChart();
}

function groupTransactionsByPeriod(mode) {
  const grouped = {};

  transactions.forEach(t => {
    const date = new Date(t.date);
    let key;

    if (mode === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (mode === 'weekly') {
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      key = `${year}-T${week}`;
    }

    if (!grouped[key]) grouped[key] = { profit: 0, loss: 0 };

    if (t.type === 'profit') grouped[key].profit += t.amount;
    else grouped[key].loss += t.amount;
  });

  return grouped;
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function updateChart() {
  const grouped = groupTransactionsByPeriod(chartMode);
  const labels = Object.keys(grouped).sort();

  const placeholder = document.getElementById('chart-placeholder');
  const canvas = document.getElementById('stats-chart');

  // brak danych = pokaż placeholder, schowaj canvas
  if (labels.length === 0) {
    if (chart) chart.destroy();
    canvas.style.display = 'none';
    placeholder.style.display = 'block';
    return;
  }

  // są dane = pokaż wykres, schowaj placeholder
  canvas.style.display = 'block';
  placeholder.style.display = 'none';

  const profits = labels.map(key => grouped[key].profit);
  const losses = labels.map(key => grouped[key].loss);

  const data = {
    labels,
    datasets: [
      {
        label: 'Wypłata',
        backgroundColor: 'rgba(0, 200, 83, 0.6)',
        data: profits,
      },
      {
        label: 'Wpłata',
        backgroundColor: 'rgba(255, 82, 82, 0.6)',
        data: losses,
      },
    ],
  };

  const config = {
    type: 'bar',
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: chartMode === 'daily' ? 'Statystyki dzienne' : 'Statystyki tygodniowe',
        },
      },
    },
  };

  if (chart) chart.destroy();
  const ctx = canvas.getContext('2d');
  chart = new Chart(ctx, config);
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderTransactions();
  updateSummary();
}

function calculateEfficiency(mode = chartMode) {
  const grouped = groupTransactionsByPeriod(mode);
  const keys = Object.keys(grouped);
  
  let successCount = 0;

  keys.forEach(key => {
    const { profit, loss } = grouped[key];
    if (profit > loss) successCount++;
  });

  const rate = keys.length > 0 ? (successCount / keys.length) * 100 : 0;
  document.getElementById('efficiency-rate').textContent = rate.toFixed(1) + '%';
    const el = document.getElementById('efficiency-rate');
el.textContent = rate.toFixed(1) + '%';
el.style.color = rate >= 60 ? 'green' : rate <= 40 ? 'red' : 'orange';
}



let goal = parseFloat(localStorage.getItem('goal')) || 0;

if (goal) goalInput.value = goal;

setGoalBtn.addEventListener('click', () => {
  goal = parseFloat(goalInput.value);
  localStorage.setItem('goal', goal);
  updateSummary(); 
});

function updateGoalProgress(balance) {
  if (!goal || goal === 0) return;

  const percentage = Math.min(Math.max((balance / goal) * 100, 0), 100);
  goalProgressText.textContent = `${percentage.toFixed(1)}%`;
  goalBar.value = percentage;

  // ostrzeżenie przy przekroczeniu
  if ((goal > 0 && balance >= goal) || (goal < 0 && balance <= goal)) {
    goalWarning.textContent = '🎉 Cel osiągnięty!';
  } else {
    goalWarning.textContent = '';
  }
  
}


let inactivityTimeout;

function resetInactivityTimer() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    logout();
  }, 1 * 60 * 1000); 
}

// Nasłuch na aktywność
['click', 'mousemove', 'keypress', 'scroll'].forEach(evt => {
  document.addEventListener(evt, resetInactivityTimer);
});

function logout() {
  appEl.classList.add('hidden');
  pinScreen.classList.remove('hidden');
  pinInput.value = '';
  pinMsg.textContent = '⌛ Wylogowano po minucie braku aktywności';
}


function updateGoalProgress(balance) {
  if (!goal || goal === 0) return;

  const percentage = Math.min(Math.max((balance / goal) * 100, 0), 100);
  goalProgressText.textContent = `${percentage.toFixed(1)}%`;
  goalBar.value = percentage;

  goalBar.classList.remove("low", "mid", "high");
  if (percentage < 33) goalBar.classList.add("low");
  else if (percentage < 66) goalBar.classList.add("mid");
  else goalBar.classList.add("high");
  
updateMotivationalText(percentage);
}

const goalNote = document.getElementById('goal-note');
goalNote.value = localStorage.getItem("goalNote") || "";

goalNote.addEventListener('input', () => {
  localStorage.setItem("goalNote", goalNote.value);
});

function updateMotivationalText(percentage) {
  const motivational = document.getElementById("goal-motivation");
document.getElementById("goal-short-progress").innerHTML = `${percentage.toFixed(0)}%`;
  if (isNaN(percentage) || percentage < 0) {
    motivational.textContent = "🎯 Ustaw cel, aby zacząć śledzić postęp";
    return;
  }

  if (percentage === 0) {
    motivational.textContent = "🛫 Zaczynamy!";
  } else if (percentage < 30) {
    motivational.textContent = "💪 Początek drogi";
  } else if (percentage < 60) {
    motivational.textContent = "🚀 Dobrze Ci idzie!";
  } else if (percentage < 90) {
    motivational.textContent = "🔥 Blisko celu!";
  } else if (percentage < 100) {
    motivational.textContent = "✨ Prawie tam...";
  } else {
    motivational.textContent = "🎉 Cel zrealizowany! Gratulacje!";
  }
}


