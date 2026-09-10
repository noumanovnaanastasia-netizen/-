// Загрузка состояния или дефолт
let state = JSON.parse(localStorage.getItem('space_infinity_save')) || {
    pilotName: '', money: 500, galaxy: 1, exp: 0, lastTime: Date.now(),
    cargo: { 1: 0, 2: 0, 3: 0 },
    upgrades: { drone: 0, drill: 1, offline: 0 }
};

const galaxyConfigs = {
    1: { name: 'Млечный Путь', ores: ['Железо', 'Золото', 'Платина'], emojis: ['🪨','✨','💎'], astEmoji: '🪨', color: '#070a12' },
    2: { name: 'Туманность Андромеды', ores: ['Антиматерию', 'Темные Кристаллы', 'Метеоритную Пыль'], emojis: ['🌌','🔮','☄️'], astEmoji: '🪐', color: '#022c22' }
};

let prices = { 1: 10, 2: 50, 3: 150 };
let timeLeft = 15; let eventModifier = 1;
let bossActive = false; let bossHp = 100; let bossTimerInterval;

// Проверка регистрации ника
window.onload = function() {
    if (!state.pilotName) {
        document.getElementById('auth-modal').classList.remove('hidden');
    } else {
        document.getElementById('auth-modal').classList.add('hidden');
        initGame();
    }
};

function registerPilot() {
    let input = document.getElementById('pilot-name-input').value.trim();
    state.pilotName = input ? input.substring(0, 8) : 'PILOT';
    document.getElementById('auth-modal').classList.add('hidden');
    initGame();
}

function initGame() {
    // Расчет Оффлайн Дохода
    if (state.upgrades.offline > 0) {
        let diffMs = Date.now() - state.lastTime;
        let tenMins = Math.floor(diffMs / 600000); // Сколько 10-минутных отрезков прошло
        if (tenMins > 0) {
            let offlineEarned = tenMins * 5 * state.upgrades.offline;
            state.cargo[1] += offlineEarned;
            showToast(`🛰️ С возвращением! Пока вас не было, дроны накопили ${offlineEarned} ед. базовой руды!`);
        }
    }
    
    // Каждые 3 секунды - доход от дронов
    setInterval(() => {
        if (state.upgrades.drone > 0) {
            state.cargo[1] += state.upgrades.drone;
            updateUI(); saveGame();
        }
    }, 3000);

    // Каждые 4 минуты - шанс прилёта Босса
    setInterval(() => { if(!bossActive) triggerBossEvent(); }, 240000);

    updateUI(); updateMarket();
}

function saveGame() {
    state.lastTime = Date.now();
    localStorage.setItem('space_infinity_save', JSON.stringify(state));
}

function switchScreen(name) {
    ['mine', 'market', 'shop', 'dark'].forEach(s => document.getElementById(`screen-${s}`).classList.add('hidden'));
    ['mine', 'market', 'shop', 'dark'].forEach(s => document.getElementById(`nav-${s}`).classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.remove('hidden');
    document.getElementById(`nav-${name}`).classList.add('active');
}

function handleAsteroidClick(e) {
    if (bossActive) {
        bossHp -= state.upgrades.drill;
        document.getElementById('boss-hp-fill').style.width = Math.max(0, bossHp) + '%';
        if (bossHp <= 0) winBoss();
    } else {
        let rand = Math.random() * 100;
        let amt = state.upgrades.drill;
        if (rand > 45) state.cargo[1] += amt;
        else if (rand > 10) state.cargo[2] += amt;
        else state.cargo[3] += amt;
    }
    updateUI(); saveGame();
}

function sellOre(type) {
    if (state.cargo[type] > 0) {
        state.money += state.cargo[type] * prices[type] * eventModifier;
        state.cargo[type] = 0;
        updateUI(); saveGame();
    }
}

function buyUpgrade(type) {
    let costs = { drone: 300, drill: 800, offline: 1500 };
    if (state.money >= costs[type]) {
        state.money -= costs[type];
        if (type === 'drone') state.upgrades.drone++;
        if (type === 'drill') state.upgrades.drill *= 2;
        if (type === 'offline') state.upgrades.offline++;
        updateUI(); saveGame();
    } else { showToast("❌ Недостаточно средств для модернизации!"); }
}

function playPirateRoulette() {
    if (state.cargo[2] < 30) { showToast("🏴‍☠️ Пираты требуют 30 штук второго типа руды для ставки!"); return; }
    state.cargo[2] -= 30;
    let rand = Math.random();
    if (rand < 0.2) { state.money += 5000; showToast("🎰 ДЖЕКПОТ! Вы сорвали куш на Чёрном Рынке: +5000$!"); }
    else if (rand < 0.4) { state.upgrades.drone += 2; showToast("🎰 УСПЕХ! Пираты подарили вам 2 Хакерских Дрона!"); }
    else if (rand < 0.7) { state.cargo[1] = 0; showToast("🏴‍☠️ ОБМАН! Пираты напоили вас космо-элем и обчистили трюмы!"); }
    else { state.money = Math.max(0, state.money - 1000); showToast("🚨 ОБЛАВА! Прилетела Космо-Полиция. Штраф за контрабанду: -1000$!"); }
    updateUI(); saveGame();
}

function triggerWarpJump() {
    if (state.money >= 25000 && state.galaxy === 1) {
        state.money -= 25000; state.galaxy = 2;
        document.body.style.backgroundColor = galaxyConfigs[2].color;
        showToast("🌌 ВАРП-ДВИГАТЕЛЬ ЗАПУЩЕН! Вы перешли в Туманность Андромеды!");
        updateUI(); saveGame();
    } else if (state.galaxy === 2) { showToast("🚀 Вы уже достигли крайней доступной Галактики!"); }
    else { showToast("❌ Для гиперпрыжка нужно 25 000$!"); }
}

function triggerBossEvent() {
    bossActive = true; bossHp = 100;
    document.getElementById('boss-panel').classList.remove('hidden');
    document.getElementById('boss-hp-fill').style.width = '100%';
    let t = 60; document.getElementById('boss-time').innerText = t;
    switchScreen('mine');
    
    bossTimerInterval = setInterval(() => {
        t--; document.getElementById('boss-time').innerText = t;
        if (t <= 0) { endBoss(false); }
    }, 1000);
}

function winBoss() { endBoss(true); state.money += 3000; showToast("💥 ПОБЕДА! Вы раскололи Босса! Награда: +3000$!"); updateUI(); }
function endBoss(success) {
    bossActive = false; clearInterval(bossTimerInterval);
    document.getElementById('boss-panel').classList.add('hidden');
    if (!success) { state.money = Math.max(0, state.money - 500); showToast("🚨 БОСС УЛЕТЕЛ! Осколки повредили обшивку. Ремонт: -500$!"); updateUI(); }
    saveGame();
}

function updateMarket() {
    prices[1] = Math.max(5, Math.floor(10 * state.galaxy + (Math.random() * 16 - 8)));
    prices[2] = Math.max(25, Math.floor(50 * state.galaxy + (Math.random() * 60 - 30)));
    prices[3] = Math.max(70, Math.floor(150 * state.galaxy + (Math.random() * 160 - 80)));

    let rand = Math.random();
    if (rand < 0.1) { eventModifier = 2.5; showToast("🌌 ВСПЫШКА НА СВЕРХНОВОЙ! Все цены умножены на 2.5!"); }
    else if (rand > 0.9) { state.money = Math.floor(state.money * 0.9); showToast("🏛️ Галактическая Федерация списала 10% налога на космо-дороги!"); }
    else { eventModifier = 1; }
    updateUI();
}

function updateUI() {
    let conf = galaxyConfigs[state.galaxy];
    document.getElementById('pilot-name-display').innerText = state.pilotName;
    document.getElementById('money').innerText = Math.floor(state.money);
    document.getElementById('galaxy-text').innerText = conf.name;
    document.getElementById('main-asteroid').innerText = conf.astEmoji;
    
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`ore${i}-name`).innerText = conf.ores[i-1];
        document.getElementById(`cargo-${i}`).innerText = state.cargo[i];
        document.getElementById(`m-ore${i}`).innerText = `${conf.emojis[i-1]} ${conf.ores[i-1]}:`;
        document.getElementById(`price-${i}`).innerText = (prices[i] * eventModifier) + '$';
    }
}

function showToast(txt) {
    let t = document.getElementById('event-toast'); t.innerText = txt; t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 5000);
}

setInterval(() => { timeLeft--; document.getElementById('timer').innerText = timeLeft; if (timeLeft <= 0) { timeLeft = 15; updateMarket(); } }, 1000);
function resetAllData() { if(confirm("Сбросить Галактику?")) { localStorage.removeItem('space_infinity_save'); location.reload(); } }
