
import express from 'express';

const app = express();
const port = 3000;

//сущность
class Car {
    constructor(car_id, user_id, make, model, year, vin, mileage, last_service_date) {
        this.car_id = car_id;
        this.user_id = user_id;
        this.make = make;
        this.model = model;
        this.year = year;
        this.vin = vin;
        this.mileage = mileage;
        this.last_service_date = last_service_date;
    }
}

// хранилище
let cars = [
    new Car(
        "CAR001", 
        "user123",
        "Toyota",
        "Camry",
        2020,
        "JTDKL4830399234",
        50000,
        "2023-11-15"
    )
];

// Middleware
app.use(express.json()); // Для обработки JSON в запросах
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Маршруты
// GET /cars - получить все автомобили
app.get('/cars', (req, res) => {
    res.json(cars);
});

// GET /cars/car_id - получить автомобиль по ID
app.get('/cars/:car_id', (req, res) => {
    const car_id = req.params.car_id;
    const car = cars.find(car => car.car_id === car_id);

    if (car) {
        res.json(car);
    } else {
        res.status(404).json({ message: 'Car not found' });
    }
});

// POST /cars - создать новый автомобиль
app.post('/cars', (req, res) => {
    const { user_id, make, model, year, vin, mileage, last_service_date } = req.body;

    // Простая валидация
    if (!user_id || !make || !model || !year) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const new_car_id = String(Date.now()); // Простой способ генерации ID
    const newCar = new Car(new_car_id, user_id, make, model, year, vin, mileage, last_service_date);
    cars.push(newCar);
    res.status(201).json(newCar);
});

// PUT /cars/car_id - обновить автомобиль по ID
app.put('/cars/:car_id', (req, res) => {
    const car_id = req.params.car_id;
    const { user_id, make, model, year, vin, mileage, last_service_date } = req.body;

    const carIndex = cars.findIndex(car => car.car_id === car_id);

    if (carIndex !== -1) {
        cars[carIndex] = { ...cars[carIndex], user_id, make, model, year, vin, mileage, last_service_date };
        res.json(cars[carIndex]);
    } else {
        res.status(404).json({ message: 'Car not found' });
    }
});

// DELETE /cars/car_id - удалить автомобиль по ID
app.delete('/cars/:car_id', (req, res) => {
    const car_id = req.params.car_id;
    cars = cars.filter(car => car.car_id !== car_id);
    res.status(204).send(); // 204 No Content
});

// Корневой маршрут
app.get('/', (req, res) => {
    res.send('Virtual Garage API is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});