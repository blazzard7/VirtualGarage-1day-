import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';
import { body, validationResult } from 'express-validator'; // For request body validation

const app = express();
const port = 3000;

// Database Configuration (SQLite for simplicity)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite', // Database file
    logging: false // Disable logging for cleaner console output
});

// Car Model Definition
const Car = sequelize.define('Car', {
    car_id: {
        type: DataTypes.UUID, 
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    make: {
        type: DataTypes.STRING,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: true,
            min: 1900, 
            max: new Date().getFullYear() + 1 
        }
    },
    vin: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /^[A-HJ-NPR-Z0-9]{17}$/i // Basic VIN validation (17 characters, alphanumeric)
        }
    },
    mileage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            isInt: true,
            min: 0 // Mileage cannot be negative
        }
    },
    last_service_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: true
        }
    }
}, {
    tableName: 'cars', 
    timestamps: false // (createdAt, updatedAt)
});


(async () => {
    try {
        await sequelize.sync({ force: false }); 
        console.log('Database synchronized');

        if (await Car.count() === 0) {
            await Car.create({
                user_id: "user123",
                make: "Toyota",
                model: "Camry",
                year: 2020,
                vin: "JTDKL4830399234",
                mileage: 50000,
                last_service_date: "2023-11-15"
            });
            console.log('Database seeded with initial data');
        }


    } catch (error) {
        console.error('Unable to synchronize the database:', error);
    }
})();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Routes ---

// GET /cars - get all cars
app.get('/cars', async (req, res) => {
    try {
        const cars = await Car.findAll();
        res.json(cars);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /cars/:car_id - get car by ID
app.get('/cars/:car_id', async (req, res) => {
    const car_id = req.params.car_id;

    try {
        const car = await Car.findByPk(car_id);
        if (car) {
            res.json(car);
        } else {
            res.status(404).json({ message: 'Car not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /cars - create a new car
app.post(
    '/cars',
    [
        // Validation using express-validator
        body('user_id').notEmpty().withMessage('ID является обязательным полем'),
        body('make').notEmpty().withMessage('Марка вляется обязательным полем'),
        body('model').notEmpty().withMessage('Модель вляется обязательным полем'),
        body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Невалидный год'),
        body('vin').optional().isAlphanumeric().isLength({ min: 17, max: 17 }).withMessage('VIN может быть только из 17 символов'),
        body('mileage').optional().isInt({ min: 0 }).withMessage('Пробег должен быть положительным числом'),
        body('last_service_date').optional().isISO8601().toDate().withMessage('Невалидная дата сервиса')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { user_id, make, model, year, vin, mileage, last_service_date } = req.body;

        try {
            const newCar = await Car.create({
                user_id,
                make,
                model,
                year,
                vin,
                mileage,
                last_service_date
            });
            res.status(201).json(newCar);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// PUT /cars/:car_id - update a car by ID
app.put(
    '/cars/:car_id',
    [
        // Validation (similar to POST route)
        body('user_id').optional().notEmpty().withMessage('ID является обязательным полем'),
        body('make').optional().notEmpty().withMessage('Марка вляется обязательным полем'),
        body('model').optional().notEmpty().withMessage('Модель вляется обязательным полем'),
        body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Невалидный год'),
        body('vin').optional().isAlphanumeric().isLength({ min: 17, max: 17 }).withMessage('VIN должен состоять только из 17 символов'),
        body('mileage').optional().isInt({ min: 0 }).withMessage('Пробег должен быть положительным числом'),
        body('last_service_date').optional().isISO8601().toDate().withMessage('невалидная дата сервиса')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const car_id = req.params.car_id;
        const { user_id, make, model, year, vin, mileage, last_service_date } = req.body;

        try {
            const car = await Car.findByPk(car_id);
            if (!car) {
                return res.status(404).json({ message: 'Car not found' });
            }

            await car.update({
                user_id,
                make,
                model,
                year,
                vin,
                mileage,
                last_service_date
            });

            res.json(car);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// DELETE /cars/:car_id - delete a car by ID
app.delete('/cars/:car_id', async (req, res) => {
    const car_id = req.params.car_id;

    try {
        const car = await Car.findByPk(car_id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        await car.destroy();
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('Virtual Garage API is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});