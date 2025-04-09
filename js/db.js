import { PrismaClient } from '@prisma/client';

class Database {
  static instance;

  constructor() {
    if (Database.instance) {
      return Database.instance;
    }

    this.prisma = new PrismaClient();

    Database.instance = this;
  }

  async query(model, method, data = {}) {
    try {
      switch (method) {
        case 'create':
          return await this.prisma[model].create({ data });
        case 'findMany':
          return await this.prisma[model].findMany(data);
        case 'update':
          return await this.prisma[model].update(data);
        case 'delete':
          return await this.prisma[model].delete(data);
        default:
          throw new Error('Недопустимый метод запроса');
      }
    } catch (err) {
      console.error('Ошибка при выполнении запроса:', err);
      throw err;
    }
  }
}

export default Database;
