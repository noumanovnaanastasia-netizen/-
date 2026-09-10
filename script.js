// Переменные игры
let money = 500;
let cargo = { iron: 0, gold: 0, platinum: 0 };
let prices = { iron: 10, gold: 50, platinum: 150 };

let timeLeft = 15;

// Функция бурения астероида
function mineOre() {
    const rand = Math.random() * 100;
    
    if (rand > 40) { // 60% шанс найти Железо
        cargo.iron++;
        document.getElementById('cargo-iron').innerText = cargo.iron;
    } else if (rand > 10) { // 30% шанс найти Золото
        cargo.gold++;
        document.getElementById('cargo-gold').innerText = cargo.gold;
    } else { // 10% шанс найти Платину
        cargo.platinum++;
        document.getElementById('cargo-platinum').innerText = cargo.platinum;
    }
}

// Функция продажи руды
function sellOre(type) {
    if (cargo[type] > 0) {
        money += cargo[type] * prices[type];
        cargo[type] = 0;
        
        // Обновляем экран
        document.getElementById('money').innerText = money;
        document.getElementById(`cargo-${type}`).innerText = 0;
    }
}

// Функция изменения цен на бирже (Рандом)
function updateMarket() {
    // Формула: старая цена + случайный скачок вверх или вниз
    prices.iron = Math.max(5, Math.floor(10 + (Math.random() * 16 - 8)));
    prices.gold = Math.max(25, Math.floor(50 + (Math.random() * 60 - 30)));
    prices.platinum = Math.max(70, Math.floor(150 + (Math.random() * 160 - 80)));

    // Отрисовка новых цен на экране
    document.getElementById('price-iron').innerText = prices.iron + '$';
    document.getElementById('price-gold').innerText = prices.gold + '$';
    document.getElementById('price-platinum').innerText = prices.platinum + '$';
}

// Таймер обновления биржи
setInterval(() => {
    timeLeft--;
    document.getElementById('timer').innerText = timeLeft;

    if (timeLeft <= 0) {
        timeLeft = 15;
        updateMarket();
    }
}, 1000);
