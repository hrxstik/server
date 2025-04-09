import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// function formatDateTime(isoString) {
//   const date = new Date(isoString);
//   return date.toISOString().slice(0, 19).replace('T', ' ');
// }

function authenticate(username, password) {
  const users = [{ id: 1, username: process.env.ADMIN_NAME, password: process.env.ADMIN_PASSWORD }];
  return users.find((u) => u.username === username && u.password === password) || null;
}

function generateToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '4h' });
}

export { authenticate, generateToken };
