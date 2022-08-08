# Stage 1: building the code
FROM node:16-alpine3.11 as builder

WORKDIR /usr/app

COPY package*.json ./

RUN npm ci --silence

COPY . .

RUN npm run build

# Stage 2: Final
FROM node:16-alpine3.11

WORKDIR /usr/app

COPY --from=builder /usr/app/package.json ./package.json

COPY --from=builder /usr/app/package-lock.json ./package-lock.json

COPY --from=builder /usr/app/dist ./dist

RUN npm ci --production

RUN chown -R node:node /usr/app

USER node

EXPOSE 3000

CMD [ "npm", "start"]
