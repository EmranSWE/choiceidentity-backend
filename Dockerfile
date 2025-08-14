
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
COPY .env.example .env
RUN npm run build
EXPOSE 5000
RUN ["chmod","+x","./entrypoint.sh"]
ENTRYPOINT [ "sh","./entrypoint.sh" ]
