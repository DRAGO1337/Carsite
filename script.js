
// API and Data Management
const API_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
let carDatabase = [];
let partsDatabase = null;
let selectedParts = [];
let selectedCar = null;

// Enhanced car data structure
class Car {
    constructor(data) {
        this.make = data.Make_Name;
        this.model = data.Model_Name || '';
        this.year = data.Model_Year || 2023;
        this.manufacturerId = data.Make_ID;
        this.modelId = data.Model_ID;
        this.specs = null;
    }

    getFullName() {
        return `${this.year} ${this.make} ${this.model}`.trim();
    }

    async loadSpecs() {
        try {
            const response = await fetch(`${API_BASE_URL}/GetVehicleTypesForMakeId/${this.manufacturerId}?format=json`);
            const data = await response.json();
            const vehicleType = data.Results[0]?.VehicleTypeName;
            
            this.specs = {
                type: vehicleType || 'Unknown',
                manufacturer: this.make,
                model: this.model,
                year: this.year
            };
            
            return this.specs;
        } catch (error) {
            console.error('Error loading vehicle specs:', error);
            return null;
        }
    }
}

// Fetch and process car makes from API
async function fetchCarMakes() {
    try {
        document.querySelector('.main-content').innerHTML = '<div class="loading">Loading car database...</div>';
        
        // Fetch recent car makes (last 5 years)
        const currentYear = new Date().getFullYear();
        const makes = await fetch(`${API_BASE_URL}/getallmakes?format=json`);
        const makesData = await makes.json();
        
        // Filter out non-car manufacturers
        const carMakes = makesData.Results.filter(make => 
            !make.Make_Name.includes('TRAILER') && 
            !make.Make_Name.includes('EQUIPMENT') &&
            !make.Make_Name.includes('MOPED') &&
            !make.Make_Name.includes('MOTORCYCLE')
        );
        
        // Get models for each make (limited to 5 manufacturers for performance)
        const cars = [];
        for (const make of carMakes.slice(0, 5)) {
            const modelsResponse = await fetch(`${API_BASE_URL}/GetModelsForMakeId/${make.Make_ID}?format=json`);
            const modelsData = await modelsResponse.json();
            
            modelsData.Results.forEach(model => {
                cars.push(new Car({
                    Make_ID: make.Make_ID,
                    Make_Name: make.Make_Name,
                    Model_ID: model.Model_ID,
                    Model_Name: model.Model_Name,
                    Model_Year: currentYear
                }));
            });
        }
        
        document.querySelector('.main-content').innerHTML = '<div id="selected-car-info"><h2>Select a car to view details</h2></div>';
        return cars;
    } catch (error) {
        console.error('Error fetching car makes:', error);
        document.querySelector('.main-content').innerHTML = '<div class="error">Error loading car database</div>';
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

// Search and filter cars with autocomplete
function filterCars(searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    return carDatabase.filter(car => 
        car.getFullName().toLowerCase().includes(lowerSearch)
    ).slice(0, 10); // Limit to 10 suggestions
}

// Display car details
function displayCarDetails(car) {
    const detailsHtml = `
        <h2>${car.getFullName()}</h2>
        <div class="car-specs">
            <div class="spec-item">
                <strong>Horsepower:</strong> ${car.specs.horsepower} HP
            </div>
            <div class="spec-item">
                <strong>Engine:</strong> ${car.specs.engineSize}
            </div>
            <div class="spec-item">
                <strong>Turbo:</strong> ${car.specs.turbo ? 'Yes' : 'No'}
            </div>
            <div class="spec-item">
                <strong>Weight:</strong> ${car.specs.weight}
            </div>
        </div>
    `;
    document.getElementById('selected-car-info').innerHTML = detailsHtml;
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
const CARS_PER_PAGE = 10;
let currentPage = 0;

function updateCarList(cars) {
    const carList = document.querySelector('.car-list');
    const startIndex = currentPage * CARS_PER_PAGE;
    const displayedCars = cars.slice(startIndex, startIndex + CARS_PER_PAGE);
    
    carList.innerHTML = `
        ${displayedCars.map(car => `
            <div class="car-item">
                <h3>${car.getFullName()}</h3>
            </div>
        `).join('')}
        <div class="pagination">
            ${currentPage > 0 ? '<button class="prev-page">Previous</button>' : ''}
            ${startIndex + CARS_PER_PAGE < cars.length ? '<button class="next-page">Next</button>' : ''}
        </div>
    `;
    
    // Add click handlers for car selection
    document.querySelectorAll('.car-item').forEach((item, index) => {
        item.addEventListener('click', async () => {
            const car = displayedCars[index];
            selectedCar = car;
            
            document.querySelectorAll('.car-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Load and display car specs
            document.getElementById('selected-car-info').innerHTML = '<div class="loading">Loading car details...</div>';
            await car.loadSpecs();
            displayCarDetails(car);
        });
    });
    
    // Add pagination handlers
    const prevBtn = carList.querySelector('.prev-page');
    const nextBtn = carList.querySelector('.next-page');
    
    if (prevBtn) prevBtn.addEventListener('click', () => {
        currentPage--;
        updateCarList(cars);
    });
    
    if (nextBtn) nextBtn.addEventListener('click', () => {
        currentPage++;
        updateCarList(cars);
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
