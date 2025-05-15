FROM node:20.16.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY . .

RUN npm install -g prisma
RUN prisma generate


EXPOSE 3000

CMD ["npm", "start"]
