import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use('/photos', express.static(path.join(__dirname, 'photos')));

connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.stack);
    return;
  }
  console.log('Подключение к базе данных прошло успешно');
});

app.get('/images/getSliderImages', (req, res) => {
  const imagesDir = path.join(__dirname, 'photos');

  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error('Ошибка при чтении директории:', err);
      return res.status(500).send('Error reading images directory');
    }

    const images = files
      .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file))
      .map((file) => `http://localhost:5000/photos/${file}`);
    res.json(images);
  });
});

const users = [{ id: 1, username: process.env.ADMIN_NAME, password: process.env.ADMIN_PASSWORD }];

function authenticate(username, password) {
  return users.find((u) => u.username === username && u.password === password) || null;
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = authenticate(username, password);

  if (!user) {
    return res.status(401).send('Неверные данные');
  }
  const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '4h' });
  res.json({ token });
});

app.post('/api/book', async (req, res) => {
  const { propertyType, propertyId, dates, phone } = req.body;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);
  const minDateStr = minDate.toISOString().split('T')[0];

  if (dates.start < minDateStr) {
    return res
      .status(400)
      .send('Дата въезда должна быть не раньше чем через два дня от текущей даты');
  }

  try {
    res.json({ message: 'Бронирование успешно!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при бронировании');
  }
});

app.get('/api/getBookings', async (req, res) => {
  const { propertyType } = req.query;

  let query = `
      SELECT 
          bookings.id,
          bookings.start_date,
          bookings.end_date,
          bookings.start_time,
          bookings.phone,
          bookings.end_time,
          bookings.created_at,
          property_types.type_name,
          properties.property_name
      FROM bookings
      JOIN properties ON bookings.property_id = properties.id
      JOIN property_types ON properties.property_type_id = property_types.id
      WHERE bookings.deleted_at IS NULL
  `;

  if (propertyType) {
    query += ` AND property_types.type_name = ?`;
  }

  try {
    const [bookings] = await connection.promise().query(query, [propertyType]);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при получении бронирований');
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  try {
    await connection
      .promise()
      .query('UPDATE bookings SET deleted_at = NOW() WHERE id = ?', [bookingId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при удалении бронирования');
  }
});

app.get('/api/occupied-dates/:propertyId', async (req, res) => {
  const propertyId = req.params.propertyId;

  try {
    const occupiedDates = await connection.query(
      'SELECT start_date, end_date FROM bookings WHERE property_id = ?',
      [propertyId],
    );
    res.json(occupiedDates.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при получении занятых дат');
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
