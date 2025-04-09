import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import routes from './js/routes.js';
import images from './js/images.js';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use('/images', images);
app.use('/photos', express.static(path.join(__dirname, 'photos')));

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
