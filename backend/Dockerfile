FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./
RUN yarn install --frozen-lockfile

COPY src ./src

EXPOSE 3000

CMD ["yarn", "start:stable"]
