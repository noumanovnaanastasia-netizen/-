// ==========================================
// ЧАСТЬ 1: НАСТРОЙКИ, БАНК И ГАРАЖ
// ==========================================

let player = JSON.parse(localStorage.getItem('avtobuy_infinity_save')) || {
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
    { model: "ЛАДА 2104", basePrice: 55000, desc: "На ходу, живой кузов, новый ковролин, шины dunlop" },
    { model: "ЛАДА 21099", basePrice: 65000, desc: "Выставил дед. Салон чистый, нужно подкрасить заднее крыло" },
    { model: "ИЖ Ода", basePrice: 35000, desc: "Пороги немного устали, но мотор так и шепчет" },
    { model: "ГАЗ Волга 3110", basePrice: 85000, desc: "Настоящий корабль! Салон велюр, состояние идеальное" },
    { model: "ISUZU V340", basePrice: 1400000, desc: "Работяга. Мотор миллионник, готов к рейсам" }
];

const names = ["Артём", "Юрий", "Евгений", "Николай", "Сергей", "Влад"];
let currentChatCar = null;
let currentCityFeed = []; 

// Стартовая инициализация
window.onload = function() {
    updateUI();
    if (!localStorage.getItem('avtobuy_infinity_save') || currentCityFeed.length === 0) {
        generateFeedForCurrentCity();
    }
    renderFeed();
};

function saveGame() {
    localStorage.setItem('avtobuy_infinity_save', JSON.stringify(player));
}

function updateUI() {
    document.getElementById('bank-balance').innerText = player.money.toLocaleString();
    document.getElementById('current-city-badge').innerText = player.currentCity;
    document.getElementById('current-market-city').innerText = player.currentCity;
    document.getElementById('map-current-city').innerText = player.currentCity;
    
    const historyBox = document.getElementById('bank-history');
    historyBox.innerHTML = '';
    player.history.slice().reverse().forEach(item => {
        historyBox.innerHTML += `
            <div class="history-item ${item.type}">
                <span>${item.text}</span>
                <strong>${item.val}</strong>
            </div>
        `;
    });
}

function openApp(id) {
    document.getElementById('screen-home').classList.add('hidden');
    document.querySelectorAll('.app-window').forEach(app => app.classList.add('hidden'));
    document.getElementById(`app-${id}`).classList.remove('hidden');
    
    if (id === 'garage') renderGarage();
    if (id === 'map') renderMap();
}

function closeApp() {
    document.querySelectorAll('.app-window').forEach(app => app.classList.add('hidden'));
    document.getElementById('screen-home').classList.remove('hidden');
}

function renderGarage() {
    const container = document.getElementById('garage-container');
    container.innerHTML = player.garage.length === 0 ? '<p style="text-align:center;color:#6b7280;padding-top:30px;">Твой автопарк пуст. Купи авто на AvtoBuy!</p>' : '';
    
    player.garage.forEach((car, index) => {
        let div = document.createElement('div');
        div.className = 'car-card';
        let retailPrice = Math.floor(car.marketValue * 1.18); 
        div.innerHTML = `
            <div class="car-title">${car.model}</div>
            <div class="car-desc">Куплено за: ${car.buyPrice.toLocaleString()} ₽<br>Рыночная стоимость: ${car.marketValue.toLocaleString()} ₽</div>
            <div class="car-price" style="color:#22c55e;">Выставил: ${retailPrice.toLocaleString()} ₽</div>
            <button class="btn-action" style="background:#22c55e;" onclick="sellCarFromGarage(${index}, ${retailPrice})">Продать клиенту 💰</button>
        `;
        container.appendChild(div);
    });
}

function sellCarFromGarage(index, price) {
    let car = player.garage[index];
    player.money += price;
    player.garage.splice(index, 1);

    player.history.push({
        text: `Продано авто: ${car.model}`,
        val: `+${price.toLocaleString()} ₽`,
        type: "positive"
    });

    saveGame();
    updateUI();
    renderGarage();
    alert("Успешно продано! Деньги зачислены на баланс! 🎉");
}

function goToSleep() {
    alert("Вы легли спать. Время промоталось, авторынок обновился! 💤");
    generateFeedForCurrentCity();
    renderFeed();
}
// ==========================================
// ЧАСТЬ 2: ОБЪЯВЛЕНИЯ, ЧАТ И ЛОГИСТИКА
// ==========================================

function generateFeedForCurrentCity() {
    currentCityFeed = [];
    let cityMod = player.currentCity === "Москва" ? 1.2 : (player.currentCity === "Киров" ? 0.85 : 1.0);
    
    for (let i = 0; i < 4; i++) {
        let template = carPool[Math.floor(Math.random() * carPool.length)];
        let mod = template.basePrice > 500000 ? 1 : cityMod;
        
        let marketValue = Math.floor(template.basePrice * mod * (1 + (Math.random() * 0.1 - 0.05)));
        let initialPrice = Math.floor(marketValue * 0.9); 
        let seller = names[Math.floor(Math.random() * names.length)];

        currentCityFeed.push({
            model: template.model,
            initialPrice: initialPrice,
            currentPrice: initialPrice,
            marketValue: marketValue,
            seller: seller,
            desc: template.desc
        });
    }
}

function renderFeed() {
    const feed = document.getElementById('feed-container');
    feed.innerHTML = '';
    currentCityFeed.forEach((car, index) => {
        let card = document.createElement('div');
        card.className = 'car-card';
        card.innerHTML = `
            <div class="car-title">${car.model}</div>
            <div class="car-price">${car.currentPrice.toLocaleString()} ₽</div>
            <div class="car-desc">Продавец: ${car.seller} | Рыночная цена: ${car.marketValue.toLocaleString()} ₽<br>${car.desc}</div>
            <button class="btn-action" onclick="startDeal(${index})">Позвонить / Торговаться</button>
        `;
        feed.appendChild(card);
    });
}

function startDeal(index) {
    currentChatCar = { ...currentCityFeed[index], index: index, step: 0 };
    
    openApp('chat');
    document.getElementById('chat-seller-name').innerText = currentChatCar.seller;
    
    const box = document.getElementById('chat-box');
    box.innerHTML = `<div class="msg seller">Здравствуйте! Продаю ${currentChatCar.model}. Цена ${currentChatCar.currentPrice.toLocaleString()} ₽. Готов обсуждать! 👋</div>`;
    showChatControls();
}

function showChatControls() {
    const ctrl = document.getElementById('chat-controls');
    ctrl.innerHTML = '';

    let offer1 = Math.floor(currentChatCar.currentPrice * 0.88); 
    let offer2 = Math.floor(currentChatCar.currentPrice * 0.94); 

    if (currentChatCar.step === 0) {
        ctrl.innerHTML = `
            <button class="btn-chat" onclick="playerOffer(${offer1}, 'hard')">Предложить ${offer1.toLocaleString()} ₽ (Сбить жёстко)</button>
            <button class="btn-chat" onclick="playerOffer(${offer2}, 'soft')">Предложить ${offer2.toLocaleString()} ₽ (Сбить мягко)</button>
        `;
    } else if (currentChatCar.step === 1) {
        ctrl.innerHTML = `
            <button class="btn-chat" style="background:#22c55e;" onclick="confirmPurchase()">🤝 Забрать авто за ${currentChatCar.currentPrice.toLocaleString()} ₽</button>
            <button class="btn-chat" style="background:#ef4444;" onclick="openApp('avtobuy')">Отказаться от сделки</button>
        `;
    }
}

function playerOffer(amount, type) {
    const box = document.getElementById('chat-box');
    box.innerHTML += `<div class="msg player">Предлагаю ${amount.toLocaleString()} ₽ за вашу машину. 💰</div>`;
    currentChatCar.step = 1;
    showChatControls();
    box.scrollTop = box.scrollHeight;

    setTimeout(() => {
        let diff = currentChatCar.currentPrice - amount;
        if (type === 'hard' && Math.random() > 0.4) {
            currentChatCar.currentPrice = Math.floor(amount + diff * 0.4);
            box.innerHTML += `<div class="msg seller">Маловато будет. Давай сойдёмся хотя бы на ${currentChatCar.currentPrice.toLocaleString()} ₽? 🤔</div>`;
        } else {
            currentChatCar.currentPrice = amount;
            box.innerHTML += `<div class="msg seller">Ладно, убедил. По рукам, забирай за ${amount.toLocaleString()} ₽! По рукам.</div>`;
        }
        showChatControls();
        box.scrollTop = box.scrollHeight;
    }, 800);
}

function confirmPurchase() {
    if (player.money >= currentChatCar.currentPrice) {
        player.money -= currentChatCar.currentPrice;
        player.garage.push({
            model: currentChatCar.model,
            buyPrice: currentChatCar.currentPrice,
            marketValue: currentChatCar.marketValue
        });
        
        player.history.push({
            text: `Покупка авто: ${currentChatCar.model}`,
            val: `-${currentChatCar.currentPrice.toLocaleString()} ₽`,
            type: "negative"
        });

        currentCityFeed.splice(currentChatCar.index, 1);
        
        saveGame();
        updateUI();
        alert("Сделка согласована! Машина перегнана в ваш Гараж. 🚙");
        openApp('garage');
    } else {
        alert("Ошибка! Недостаточно денег в П-Банке!");
    }
}

function renderMap() {
    const list = document.getElementById('city-travel-list');
    list.innerHTML = '';

    for (let cityName in cities) {
        let div = document.createElement('div');
        div.className = 'city-card';
        
        if (cityName === player.currentCity) {
            div.innerHTML = `
                <div class="city-info"><h4>${cityName}</h4><p>${cities[cityName].desc}</p></div>
                <span class="current-city-placeholder">Вы здесь 📍</span>
            `;
        } else {
            let trainCost = Math.floor(2020 + cities[cityName].dist * 0.5);
            let planeCost = Math.floor(6664 + cities[cityName].dist * 1.2);
            div.innerHTML = `
                <div class="city-info"><h4>${cityName}</h4><p>${cities[cityName].desc}</p></div>
                <div class="travel-options">
                    <button class="btn-travel train" onclick="travelToCity('${cityName}', ${trainCost}, 'Поезд')">🚂 ${trainCost}₽</button>
                    <button class="btn-travel plane" onclick="travelToCity('${cityName}', ${planeCost}, 'Самолёт')">✈️ ${planeCost}₽</button>
                </div>
            `;
        }
        list.appendChild(div);
    }
}

function travelToCity(targetCity, cost, mode) {
    if (player.money >= cost) {
        player.money -= cost;
        player.currentCity = targetCity;
        
        player.history.push({
            text: `${mode}: ${player.currentCity}`,
            val: `-${cost.toLocaleString()} ₽`,
            type: "negative"
        });

        generateFeedForCurrentCity(); 
        saveGame();
        updateUI();
        renderMap();
        alert(`Вы прибыли в г. ${targetCity}! Лента AvtoBuy обновилась локальными объявлениями.`);
    } else {
        alert("Недостаточно денег на билет!");
    }
}

setInterval(() => { 
    timeLeft--; 
    document.getElementById('timer').innerText = timeLeft; 
    if (timeLeft <= 0) { 
        timeLeft = 15; 
        let cityMod = player.currentCity === "Москва" ? 1.2 : (player.currentCity === "Киров" ? 0.85 : 1.0);
        currentCityFeed.forEach(car => {
            car.currentPrice = Math.floor(car.initialPrice * (1 + (Math.random() * 0.06 - 0.03)));
        });
        renderFeed();
    } 
}, 1000);
