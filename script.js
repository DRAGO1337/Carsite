
// Car database
const cars = {
    car1: {
        name: "Toyota Supra MK4",
        engine: "2JZ-GTE 3.0L Inline-6",
        horsepower: 320,
        weight: 1510,
        turbo: true
    },
    car2: {
        name: "Nissan Skyline GT-R R34",
        engine: "RB26DETT 2.6L Inline-6",
        horsepower: 280,
        weight: 1560,
        turbo: true
    },
    car3: {
        name: "Porsche 911 GT3",
        engine: "4.0L Flat-6",
        horsepower: 502,
        weight: 1435,
        turbo: false
    }
};

// Parts database
const parts = {
    engine: [
        { name: "High-Flow Turbocharger", brand: "Garrett", price: 3500, description: "Boost pressure up to 25 PSI" },
        { name: "Performance ECU", brand: "AEM", price: 1200, description: "Advanced engine management" },
        { name: "Cold Air Intake", brand: "K&N", price: 300, description: "Increased airflow" }
    ],
    suspension: [
        { name: "Coilover Kit", brand: "KW", price: 2200, description: "Adjustable height and damping" },
        { name: "Sway Bars", brand: "Eibach", price: 500, description: "Reduced body roll" },
        { name: "Control Arms", brand: "Megan Racing", price: 800, description: "Improved handling" }
    ],
    wheels: [
        { name: "Forged Wheels 19\"", brand: "BBS", price: 4000, description: "Lightweight racing wheels" },
        { name: "Sport Tires", brand: "Michelin", price: 1200, description: "High-performance tires" },
        { name: "Brake Kit", brand: "Brembo", price: 3200, description: "6-piston calipers" }
    ],
    bodywork: [
        { name: "Carbon Fiber Hood", brand: "Seibon", price: 1000, description: "Lightweight construction" },
        { name: "Wide Body Kit", brand: "Rocket Bunny", price: 3500, description: "Aggressive styling" },
        { name: "Rear Wing", brand: "APR", price: 700, description: "Enhanced downforce" }
    ]
};

// Selected parts and total price
let selectedParts = [];
let selectedCar = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Car selection
    document.querySelectorAll('.car-item').forEach(car => {
        car.addEventListener('click', () => {
            const carId = car.dataset.car;
            selectedCar = cars[carId];
            updateCarInfo();
            document.querySelectorAll('.car-item').forEach(c => c.classList.remove('active'));
            car.classList.add('active');
        });
    });

    // Category selection
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayParts(btn.dataset.category);
        });
    });

    // Initialize with first car and engine parts
    document.querySelector('.car-item').click();
    document.querySelector('.category-btn').click();
});

// Update car information display
function updateCarInfo() {
    const carInfo = document.getElementById('selected-car-info');
    carInfo.innerHTML = `
        <h3>${selectedCar.name}</h3>
        <p>Engine: ${selectedCar.engine}</p>
        <p>Horsepower: ${selectedCar.horsepower} HP</p>
        <p>Weight: ${selectedCar.weight} kg</p>
        <p>Turbo: ${selectedCar.turbo ? 'Yes' : 'No'}</p>
    `;
}

// Display parts for selected category
function displayParts(category) {
    const grid = document.getElementById('parts-grid');
    grid.innerHTML = '';
    
    parts[category].forEach(part => {
        const card = document.createElement('div');
        card.className = 'part-card';
        card.innerHTML = `
            <h3>${part.name}</h3>
            <p><strong>Brand:</strong> ${part.brand}</p>
            <p><strong>Price:</strong> $${part.price}</p>
            <p>${part.description}</p>
            <button onclick="addToBuild('${category}', '${part.name}', ${part.price})">Add to Build</button>
        `;
        grid.appendChild(card);
    });
}

// Add part to build
function addToBuild(category, partName, price) {
    selectedParts.push({ category, name: partName, price });
    updateBuildList();
}

// Update build list display
function updateBuildList() {
    const buildList = document.getElementById('selected-parts');
    const totalPriceElement = document.getElementById('total-price');
    
    buildList.innerHTML = selectedParts.map(part => `
        <div class="selected-part">
            <p><strong>${part.name}</strong></p>
            <p>$${part.price}</p>
        </div>
    `).join('');
    
    const total = selectedParts.reduce((sum, part) => sum + part.price, 0);
    totalPriceElement.textContent = total;
}
