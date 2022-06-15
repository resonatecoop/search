FROM node:latest-alpine AS builder

RUN mkdir -p /var/www/api
WORKDIR /var/www/api

COPY . .

RUN npm install
RUN npm run build

FROM node:latest-alpine

RUN mkdir -p /var/www/api/dist

WORKDIR /var/www/api

COPY .env ./
COPY .env.example ./
COPY ./package* ./
COPY ./index.js ./
COPY ./server.js ./

COPY --from=builder /var/www/api/node_modules ./node_modules
COPY --from=builder /var/www/api/lib ./lib

EXPOSE 3000

CMD ["npm", "start"]
