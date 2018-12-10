FROM node:alpine

WORKDIR /usr/app

COPY package*.json ./
RUN npm install
ENV PORT=3000

COPY . .

EXPOSE 3000

CMD ["npm", "start"]