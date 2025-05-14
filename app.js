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
  if(dzien < 10){
    dzien = `0${dzien}`;
  }
  else if(miesiac < 10){
    miesiac = `0${miesiac}`;
  }
  else{
    return
  }

  const formatedDate = `${rok}-${miesiac}-${dzien}`;
  document.getElementById("date").value = formatedDate;
}

function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
  const saved = localStorage.getItem('transactions');
  if (saved) {
    transactions = JSON.parse(saved);
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

  const transaction = { date, desc, amount, type };
  transactions.push(transaction);
  saveTransactions();
  renderTransactions();
  updateSummary();
  form.reset();
});

function renderTransactions() {
  list.innerHTML = '';
  transactions.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.date} - ${t.desc}: ${t.type === 'profit' ? '+' : '-'}${t.amount} zł`;
    list.appendChild(li);
    updateChart();
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
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: chartMode === 'daily' ? 'Statystyki dzienne' : 'Statystyki tygodniowe',
        },
      },
    },
  };

  if (chart) chart.destroy();
  const ctx = document.getElementById('stats-chart').getContext('2d');
  chart = new Chart(ctx, config);
  calculateEfficiency();
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
}


