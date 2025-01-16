import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2';

dotenv.config();

const app = express();
const port = process.env.PORT;

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.stack);
    return;
  }
  console.log('Подключение к базе данных прошло успешно');
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
