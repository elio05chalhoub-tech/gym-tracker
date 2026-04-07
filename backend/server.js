require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tdee', require('./src/routes/tdee'));
app.use('/api/workouts', require('./src/routes/workouts'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/user', require('./src/routes/user'));
app.use('/api/meals', require('./src/routes/meals'));

app.get('/', (req, res) => res.json({ message: 'Gym Tracker API running' }));
app.get('/test', (req, res) => res.json({ message: 'test ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
