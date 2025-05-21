
// API and Data Management
const API_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
let carDatabase = [];
let partsDatabase = null;
let selectedParts = [];
let selectedCar = null;

// Fetch car makes from API
async function fetchCarMakes() {
    try {
        const response = await fetch(`${API_BASE_URL}/getallmakes?format=json`);
        const data = await response.json();
        return data.Results;
    } catch (error) {
        console.error('Error fetching car makes:', error);
        return [];
    }
}

// Fetch car models for a specific make
async function fetchCarModels(makeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/GetModelsForMakeId/${makeId}?format=json`);
        const data = await response.json();
        return data.Results;
    } catch (error) {
        console.error('Error fetching car models:', error);
        return [];
    }
}

// Load parts database (mock data for now)
async function loadPartsDatabase() {
    return {
        engine: [
            { 
                name: "High-Flow Turbocharger",
                brand: "Garrett",
                price: 3500,
                description: "Boost pressure up to 25 PSI",
                compatibility: {
                    engineTypes: ["Inline-4", "Inline-6", "V6"],
                    yearRange: [1990, 2024],
                    requiresTurbo: false
                }
            },
            // ... more parts with compatibility data
        ],
        suspension: [
            {
                name: "Coilover Kit",
                brand: "KW",
                price: 2200,
                description: "Adjustable height and damping",
                compatibility: {
                    yearRange: [1990, 2024]
                }
            }
            // ... more parts
        ],
        // ... other categories
    };
}

// Search and filter cars
function filterCars(searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    return carDatabase.filter(car => 
        car.Make_Name.toLowerCase().includes(lowerSearch) ||
        car.Model_Name?.toLowerCase().includes(lowerSearch)
    );
}

// Check part compatibility
function isPartCompatible(part, car) {
    if (!part.compatibility) return true;
    
    const meetsEngineReq = !part.compatibility.engineTypes || 
        part.compatibility.engineTypes.includes(car.engineType);
    
    const meetsYearReq = !part.compatibility.yearRange ||
        (car.year >= part.compatibility.yearRange[0] && 
         car.year <= part.compatibility.yearRange[1]);
    
    const meetsTurboReq = !part.compatibility.requiresTurbo ||
        part.compatibility.requiresTurbo === car.turbo;
    
    return meetsEngineReq && meetsYearReq && meetsTurboReq;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Show loading state
        document.querySelector('.main-content').innerHTML = '<div class="loading">Loading car database...</div>';
        
        // Load initial data
        const makes = await fetchCarMakes();
        carDatabase = makes;
        partsDatabase = await loadPartsDatabase();
        
        // Setup search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'car-search';
        searchInput.placeholder = 'Search cars...';
        document.querySelector('.sidebar').insertBefore(searchInput, document.querySelector('.car-list'));
        
        // Setup search handler
        searchInput.addEventListener('input', (e) => {
            const filtered = filterCars(e.target.value);
            updateCarList(filtered);
        });
        
        // Initial car list render
        updateCarList(makes);
        
        // Setup category handlers
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                displayCompatibleParts(btn.dataset.category);
            });
        });
    } catch (error) {
        console.error('Error initializing app:', error);
        document.querySelector('.main-content').innerHTML = '<div class="error">Error loading car database. Please try again later.</div>';
    }
});

// Update car list display
function updateCarList(cars) {
    const carList = document.querySelector('.car-list');
    carList.innerHTML = cars.map(car => `
        <div class="car-item" data-make-id="${car.Make_ID}">
            <h3>${car.Make_Name}</h3>
            <p>Click to view models</p>
        </div>
    `).join('');
    
    // Add click handlers for car selection
    document.querySelectorAll('.car-item').forEach(car => {
        car.addEventListener('click', async () => {
            const makeId = car.dataset.makeId;
            const models = await fetchCarModels(makeId);
            displayCarModels(models);
        });
    });
}

// Display car models
function displayCarModels(models) {
    const carInfo = document.getElementById('selected-car-info');
    carInfo.innerHTML = `
        <h3>Available Models</h3>
        <div class="models-grid">
            ${models.map(model => `
                <div class="model-card">
                    <h4>${model.Model_Name}</h4>
                    <button onclick="selectCarModel(${JSON.stringify(model)})">Select</button>
                </div>
            `).join('')}
        </div>
    `;
}

// Display compatible parts
function displayCompatibleParts(category) {
    if (!selectedCar) {
        document.getElementById('parts-grid').innerHTML = '<div class="notice">Please select a car first</div>';
        return;
    }
    
    const parts = partsDatabase[category].filter(part => isPartCompatible(part, selectedCar));
    const grid = document.getElementById('parts-grid');
    
    grid.innerHTML = parts.map(part => `
        <div class="part-card">
            <h3>${part.name}</h3>
            <p><strong>Brand:</strong> ${part.brand}</p>
            <p><strong>Price:</strong> $${part.price}</p>
            <p>${part.description}</p>
            <button onclick="addToBuild('${category}', '${part.name}', ${part.price})">Add to Build</button>
        </div>
    `).join('');
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
            <button onclick="removePart('${part.name}')" class="remove-btn">Remove</button>
        </div>
    `).join('');
    
    const total = selectedParts.reduce((sum, part) => sum + part.price, 0);
    totalPriceElement.textContent = total;
}

// Remove part from build
function removePart(partName) {
    selectedParts = selectedParts.filter(part => part.name !== partName);
    updateBuildList();
}
