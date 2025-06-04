# FROM node:20.16.0-alpine

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY prisma ./prisma
# COPY . .

# RUN npm install -g prisma
# RUN prisma generate


# EXPOSE 3000

# CMD ["npm", "start"]

FROM node:20.16.0-alpine

RUN apk add --no-cache musl-locales musl-locales-lang

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY . .

RUN npm install -g prisma
RUN prisma generate

EXPOSE 3000

CMD ["npm", "start"]
