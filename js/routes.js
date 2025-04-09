import express from 'express';
import { authenticate, generateToken } from './utils.js';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/book', async (req, res) => {
  const schema = Joi.object({
    propertyId: Joi.number().integer().required(),
    dates: Joi.object({
      start: Joi.date().required(),
      end: Joi.date().required(),
    }).required(),
    phone: Joi.string()
      .required()
      .pattern(/^\d{11}$/),
    startTime: Joi.string().pattern(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: Joi.string().pattern(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
  });

  try {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }

    const { propertyId, dates, phone, startTime, endTime } = req.body;

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);

    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);

    if (endDate.getTime() === startDate.getTime() && propertyId !== 8 && propertyId !== 9) {
      endDate.setDate(endDate.getDate() + 1);
    }

    if (endDate > maxDate) {
      return res
        .status(400)
        .send({ message: 'Бронирование можно сделать только в течение 90 дней.' });
    }

    const maxDuration = 14;
    const duration = Math.round((endDate - startDate) / (1000 * 3600 * 24));
    if (duration > maxDuration) {
      return res
        .status(400)
        .send({ message: 'Продолжительность бронирования не может превышать 2 недели.' });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const existingBooking = await tx.booking.findMany({
        where: {
          propertyId,
          deletedAt: null,
          startDate: { lt: new Date(dates.end) },
          endDate: { gt: new Date(dates.start) },
        },
      });

      if (existingBooking.length > 0) {
        const conflictingBooking = existingBooking.find((booking) => {
          return (
            new Date(booking.endDate).setHours(0, 0, 0, 0) ===
            new Date(dates.start).setHours(0, 0, 0, 0)
          );
        });

        if (conflictingBooking) {
          return await tx.booking.create({
            data: {
              propertyId,
              startDate,
              endDate,
              phone,
              startTime: startTime || '14:00',
              endTime: endTime || '11:00',
            },
          });
        } else {
          throw new Error('Пересечение дат с существующим бронированием');
        }
      } else {
        return await tx.booking.create({
          data: {
            propertyId,
            startDate,
            endDate,
            phone,
            startTime: startTime || '14:00',
            endTime: endTime || '11:00',
          },
        });
      }
    });

    res.json({
      message: 'Бронирование успешно!',
      endDate: endDate,
    });
  } catch (err) {
    if (
      err.message === 'Пересечение дат с существующим бронированием, попробуйте обновить страницу.'
    ) {
      return res.status(400).send({ message: err.message });
    }
    res.status(500).send('Ошибка при бронировании');
  }
});

router.get('/get-properties', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        propertyName: true,
        propertyType: {
          select: {
            typeName: true,
          },
        },
      },
    });

    const propertiesMap = properties.reduce((acc, property) => {
      if (!acc[property.propertyType.typeName]) {
        acc[property.propertyType.typeName] = [];
      }
      acc[property.propertyType.typeName].push({
        id: property.id,
        name: property.propertyName,
      });
      return acc;
    }, {});

    res.json(propertiesMap);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при получении объектов недвижимости');
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = authenticate(username, password);

  if (!user) {
    return res.status(401).send('Неверные данные');
  }
  const token = generateToken(user);
  res.json({ token });
});

router.get('/getBookings', async (req, res) => {
  const { propertyType } = req.query;

  try {
    let bookings = await prisma.booking.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        property: {
          include: {
            propertyType: true,
          },
        },
      },
    });

    if (propertyType) {
      bookings = bookings.filter(
        (booking) => booking.property.propertyType.typeName === propertyType,
      );
    }

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      property_name: booking.property.propertyName,
      type_name: booking.property.propertyType.typeName,
      start_date: booking.startDate.toISOString(),
      end_date: booking.endDate.toISOString(),
      start_time: booking.startTime,
      end_time: booking.endTime,
      phone: booking.phone,
      created_at: booking.createdAt.toISOString(),
    }));

    res.json(formattedBookings);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при получении бронирований');
  }
});

router.delete('/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;
  try {
    await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: { deletedAt: new Date() },
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при удалении бронирования');
  }
});

router.get('/occupied-dates/:propertyId', async (req, res) => {
  const propertyId = req.params.propertyId;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId: Number(propertyId),
        deletedAt: null,
      },
    });

    const occupiedDates = [];
    bookings.forEach((booking) => {
      let currentDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      currentDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (currentDate.getTime() === endDate.getTime()) {
        occupiedDates.push(new Date(currentDate));
      } else {
        while (currentDate < endDate) {
          occupiedDates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    occupiedDates.push(today);

    res.json(occupiedDates);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при получении занятых дат');
  }
});

export default router;
