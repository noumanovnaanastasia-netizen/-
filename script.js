// ==========================================
// ЧАСТЬ 1: ИСПРАВЛЕННОЕ ЯДРО И ЖЕСТКИЙ ГАРАЖ
// ==========================================

let player = JSON.parse(localStorage.getItem('avtobuy_mobile_save')) || {
    money: 75893,
    currentCity: "Тула",
    garage: [],
    history: [{ text: "Начальный капитал", val: "+75 893 ₽", type: "positive" }]
};

const cities = {
    "Тула": { desc: "Твой родной город. Цены стабильные.", dist: 0 },
    "Москва": { desc: "Огромный авторынок, высокие цены.", dist: 180 },
    "Питер": { desc: "Много редких иномарок.", dist: 700 },
    "Киров": { desc: "Дешевые отечественные авто.", dist: 950 },
    "Смоленск": { desc: "Хорошие варианты из Европы.", dist: 400 },
    "Тюмень": { desc: "Суровый рынок Сибири.", dist: 2100 }
};

const carPool = [
    { model: "ЛАДА 2104", basePrice: 55000, desc: "Живой кузов, ковролин, шины dunlop" },
    { model: "ЛАДА 21099", basePrice: 65000, desc: "Стояла в гараже у деда. Мотор шепчет" },
    { model: "ИЖ Ода", basePrice: 35000, desc: "Пороги устали, но доедет куда угодно" },
    { model: "ГАЗ Волга 3110", basePrice: 85000, desc: "Салон велюр, состояние приличное" },
    { model: "ISUZU V340", basePrice: 1400000, desc: "Мотор миллионник, работяга" }
];

const names = ["Артём", "Юрий", "Евгений", "Николай", "Сергей", "Влад", "Димыч", "Лёха"];
const buyerPhrases = [
    "Цена кусается. Скинешь?",
    "За такие деньги она должна быть идеальной. Давай дешевле?",
    "По фоткам вижу косяки. Уступишь?",
    "Готов забрать прямо сейчас, но скинь сотку."
];

let currentChatCar = null;
let currentCityFeed = [];
let isSellingMode = false; // Режим: мы покупаем или мы продаем?

window.onload = function() {
    updateUI();
    if (currentCityFeed.length === 0) {
        generateFeedForCurrentCity();
    }
    renderFeed();
};

function saveGame() {
    localStorage.setItem('avtobuy_mobile_save', JSON.stringify(player));
}

function updateUI() {
    document.getElementById('bank-balance').innerText = player.money.toLocaleString();
    document.getElementById('current-city-badge').innerText = player.currentCity;
    document.getElementById('current-market-city').innerText = player.currentCity;
    
    const historyBox = document.getElementById('bank-history');
    if (historyBox) {
        historyBox.innerHTML = '';
        player.history.slice().reverse().forEach(item => {
            historyBox.innerHTML += `<div class="history-item ${item.type}"><span>${item.text}</span><strong>${item.val}</strong></div>`;
        });
    }
}

function openApp(id) {
    document.getElementById('screen-home').classList.add('hidden');
    document.querySelectorAll('.app-window').forEach(app => app.classList.add('hidden'));
    document.getElementById(`app-${id}`).classList.remove('hidden');
    
    if (id === 'garage') renderGarage();
    if (id === 'map') renderMap();
    if (id === 'avtobuy') renderFeed();
}

function closeApp() {
    document.querySelectorAll('.app-window').forEach(app => app.classList.add('hidden'));
    document.getElementById('screen-home').classList.remove('hidden');
    updateUI();
}

function renderGarage() {
    const container = document.getElementById('garage-container');
    container.innerHTML = player.garage.length === 0 ? '<p style="text-align:center;color:#6b7280;padding-top:30px;">Твой автопарк пуст.</p>' : '';
    
    player.garage.forEach((car, index) => {
        let div = document.createElement('div');
        div.className = 'car-card';
        let idealSalePrice = Math.floor(car.marketValue * 1.2);
        div.innerHTML = `
            <div class="car-title">${car.model}</div>
            <div class="car-desc">Куплено за: ${car.buyPrice.toLocaleString()} ₽<br>Рынок: ${car.marketValue.toLocaleString()} ₽</div>
            <button class="btn-action" style="background:#22c55e;" onclick="startSellDeal(${index}, ${idealSalePrice})">Ждать покупателя 📱</button>
        `;
        container.appendChild(div);
    });
}
// ==========================================
// ЧАСТЬ 2: СЛУЧАЙНЫЙ РЫНОК И ИНТЕРАКТИВНЫЙ ТОРГ
// ==========================================

function generateFeedForCurrentCity() {
    currentCityFeed = [];
    let cityMod = player.currentCity === "Москва" ? 1.25 : (player.currentCity === "Киров" ? 0.80 : 1.0);
    
    for (let i = 0; i < 4; i++) {
        let template = carPool[Math.floor(Math.random() * carPool.length)];
        let marketValue = Math.floor(template.basePrice * cityMod * (1 + (Math.random() * 0.16 - 0.08)));
        let initialPrice = Math.floor(marketValue * (0.85 + Math.random() * 0.1)); 
        let seller = names[Math.floor(Math.random() * names.length)];

        currentCityFeed.push({
            model: template.model, initialPrice: initialPrice, currentPrice: initialPrice, marketValue: marketValue, seller: seller, desc: template.desc
        });
    }
}

function renderFeed() {
    const feed = document.getElementById('feed-container');
    if (!feed) return;
    feed.innerHTML = '';
    currentCityFeed.forEach((car, index) => {
        let card = document.createElement('div');
        card.className = 'car-card';
        card.innerHTML = `
            <div class="car-title">${car.model}</div>
            <div class="car-price">${car.currentPrice.toLocaleString()} ₽</div>
            <div class="car-desc">Продавец: ${car.seller} | Рынок: ${car.marketValue.toLocaleString()} ₽<br>${car.desc}</div>
            <button class="btn-action" onclick="startBuyDeal(${index})">Начать торг</button>
        `;
        feed.appendChild(card);
    });
}

// Мы покупаем машину у NPC
function startBuyDeal(index) {
    isSellingMode = false;
    currentChatCar = { ...currentCityFeed[index], index: index, step: 0 };
    openApp('chat');
    document.getElementById('chat-seller-name').innerText = currentChatCar.seller;
    
    const box = document.getElementById('chat-box');
    box.innerHTML = `<div class="msg seller">Привет! Продаю ${currentChatCar.model}. Прошу ${currentChatCar.currentPrice.toLocaleString()} ₽. Скидывать много не буду.</div>`;
    showChatControls();
}

// К нам пришел клиент покупать НАШУ тачку из гаража
function startSellDeal(index, idealPrice) {
    isSellingMode = true;
    let car = player.garage[index];
    // Клиент хочет сбить цену и предлагает на 15% меньше твоей идеальной цены
    let clientOffer = Math.floor(idealPrice * 0.82);
    
    currentChatCar = { 
        model: car.model, 
        currentPrice: idealPrice, // Наша цена
        clientPrice: clientOffer,  // Цена клиента
        index: index, 
        seller: names[Math.floor(Math.random() * names.length)],
        step: 0 
    };
    
    openApp('chat');
    document.getElementById('chat-seller-name').innerText = `${currentChatCar.seller} (Покупатель)`;
    
    const box = document.getElementById('chat-box');
    box.innerHTML = `<div class="msg seller">Привет! Интересует ${currentChatCar.model}. Вы выставили её за ${idealPrice.toLocaleString()} ₽. ${buyerPhrases[Math.floor(Math.random() * buyerPhrases.length)]} Дам за неё ${clientOffer.toLocaleString()} ₽.</div>`;
    showChatControls();
}

function showChatControls() {
    const ctrl = document.getElementById('chat-controls');
    ctrl.innerHTML = '';

    if (!isSellingMode) {
        // Мы покупаем
        let offerHard = Math.floor(currentChatCar.currentPrice * 0.85);
        let offerSoft = Math.floor(currentChatCar.currentPrice * 0.93);
        if (currentChatCar.step === 0) {
            ctrl.innerHTML = `
                <button class="btn-chat" onclick="handleBuyOffer(${offerHard}, 'hard')">Предложить ${offerHard.toLocaleString()} ₽ (Дерзко)</button>
                <button class="btn-chat" onclick="handleBuyOffer(${offerSoft}, 'soft')">Предложить ${offerSoft.toLocaleString()} ₽ (Аккуратно)</button>
            `;
        } else {
            ctrl.innerHTML = `
                <button class="btn-chat" style="background:#22c55e;" onclick="confirmPurchase()">🤝 Забрать авто за ${currentChatCar.currentPrice.toLocaleString()} ₽</button>
                <button class="btn-chat" style="background:#ef4444;" onclick="openApp('avtobuy')">Уйти</button>
            `;
        }
    } else {
        // Мы продаем клиенту
        let counterOffer = Math.floor(currentChatCar.currentPrice * 0.94); // Наша уступка
        if (currentChatCar.step === 0) {
            ctrl.innerHTML = `
                <button class="btn-chat" style="background:#22c55e;" onclick="confirmSale(${currentChatCar.clientPrice})">Договорились, забирай за ${currentChatCar.clientPrice.toLocaleString()} ₽</button>
                <button class="btn-chat" onclick="handleSellCounter(${counterOffer})">Никаких скидок! Моя цена: ${counterOffer.toLocaleString()} ₽</button>
            `;
        } else {
            ctrl.innerHTML = `
                <button class="btn-chat" style="background:#ef4444;" onclick="openApp('garage')">Покупатель ушел...</button>
            `;
        }
    }
}

function handleBuyOffer(amount, type) {
    const box = document.getElementById('chat-box');
    box.innerHTML += `<div class="msg player">Давай за ${amount.toLocaleString()} ₽ и я забираю?</div>`;
    currentChatCar.step = 1;
    box.scrollTop = box.scrollHeight;

    setTimeout(() => {
        if (type === 'hard' && Math.random() < 0.3) {
            box.innerHTML += `<div class="msg seller">Ты издеваешься? За такие копейки не отдам. Разговор окончен! 😡</div>`;
            ctrl.innerHTML = `<button class="btn-chat" style="background:#ef4444;" onclick="openApp('avtobuy')">Вас заблокировали</button>`;
        } else {
            let diff = currentChatCar.currentPrice - amount;
            currentChatCar.currentPrice = Math.floor(amount + diff * 0.5);
            box.innerHTML += `<div class="msg seller">Ну ладно, скину немного. Моё последнее слово: ${currentChatCar.currentPrice.toLocaleString()} ₽. Берешь?</div>`;
            showChatControls();
        }
        box.scrollTop = box.scrollHeight;
    }, 700);
}

function handleSellCounter(ourPrice) {
    const box = document.getElementById('chat-box');
    box.innerHTML += `<div class="msg player">Машина в идеале, уступлю максимум до ${ourPrice.toLocaleString()} ₽.</div>`;
    box.scrollTop = box.scrollHeight;

    setTimeout(() => {
        if (Math.random() > 0.4) {
            currentChatCar.clientPrice = ourPrice;
            box.innerHTML += `<div class="msg seller">Ладно, убедил, тачка реально живая. По рукам, забираю за ${ourPrice.toLocaleString()} ₽! 🤝</div>`;
            document.getElementById('chat-controls').innerHTML = `<button class="btn-chat" style="background:#22c55e;" onclick="confirmSale(${ourPrice})">Оформить сделку 💰</button>`;
        } else {
            box.innerHTML += `<div class="msg seller">Не, это дорого для меня. Поищу другие варианты. Удачи. 👋</div>`;
            currentChatCar.step = 1;
            showChatControls();
        }
        box.scrollTop = box.scrollHeight;
    }, 700);
}

function confirmPurchase() {
    if (player.money >= currentChatCar.currentPrice) {
        player.money -= currentChatCar.currentPrice;
        player.garage.push({ model: currentChatCar.model, buyPrice: currentChatCar.currentPrice, marketValue: currentChatCar.marketValue });
        player.history.push({ text: `Купил ${currentChatCar.model}`, val: `-${currentChatCar.currentPrice.toLocaleString()} ₽`, type: "negative" });
        currentCityFeed.splice(currentChatCar.index, 1);
        saveGame(); updateUI(); alert("Машина в вашем гараже!"); openApp('garage');
    } else { alert("Недостаточно денег!"); }
}

function confirmSale(finalPrice) {
    player.money += finalPrice;
    let car = player.garage[currentChatCar.index];
    player.garage.splice(currentChatCar.index, 1);
    
    player.history.push({ text: `Продал ${car.model}`, val: `+${finalPrice.toLocaleString()} ₽`, type: "positive" });
    saveGame(); updateUI(); alert("Машина продана! Деньги на счету."); openApp('garage');
}

function renderMap() {
    const list = document.getElementById('city-travel-list');
    list.innerHTML = '';
    for (let cityName in cities) {
        let div = document.createElement('div'); div.className = 'city-card';
        if (cityName === player.currentCity) {
            div.innerHTML = `<div class="city-info"><h4>${cityName}</h4><p>${cities[cityName].desc}</p></div><span class="current-city-placeholder">Вы здесь 📍</span>`;
        } else {
            let trainCost = Math.floor(2020 + cities[cityName].dist * 0.5);
            let planeCost = Math.floor(6664 + cities[cityName].dist * 1.2);
            div.innerHTML = `
                <div class="city-info"><h4>${cityName}</h4><p>${cities[cityName].desc}</p></div>
                <div class="travel-options">
                    <button class="btn-travel train" onclick="travelToCity('${cityName}', ${trainCost}, 'Поезд')">🚂 ${trainCost}₽</button>
                    <button class="btn-travel plane" onclick="travelToCity('${cityName}', ${planeCost}, 'Самолёт')">✈️ ${planeCost}₽</button>
                </div>`;
        }
        list.appendChild(div);
    }
}

function travelToCity(targetCity, cost, mode) {
    if (player.money >= cost) {
        player.money -= cost; player.currentCity = targetCity;
        player.history.push({ text: `${mode}: ${player.currentCity}`, val: `-${cost.toLocaleString()} ₽`, type: "negative" });
        generateFeedForCurrentCity(); saveGame(); updateUI(); renderMap(); alert(`Вы прибыли в г. ${targetCity}!`);
    } else { alert("Недостаточно денег!"); }
}

function goToSleep() {
    alert("Вы поспали. Все объявления на рынке полностью ОБНОВИЛИСЬ! 💤");
    generateFeedForCurrentCity();
    renderFeed();
}
