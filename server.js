import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(cors());
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

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
