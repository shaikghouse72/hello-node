FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY hello-world.js .

EXPOSE 3000

CMD ["node", "hello-world.js"]
