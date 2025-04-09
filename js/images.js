import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/getSliderImages', (req, res) => {
  const imagesDir = path.join(__dirname, '../photos');

  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error('Ошибка при чтении директории:', err);
      return res.status(500).send('Error reading images directory');
    }

    const images = files
      .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file))
      .map((file) => `${process.env.BASE_URL}/photos/${file}`);
    res.json(images);
  });
});

export default router;
