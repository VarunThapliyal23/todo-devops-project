#1. Build stage
FROM node:22-slim AS build 

#2. Set working directory
WORKDIR /app

#3. Copy package.json and install dependencies
COPY package*.json ./
RUN npm install 

#4. Copy all source files
COPY . .

#5. Build the app
RUN npm run build

#6. Production stage
FROM nginx:alpine

#7. Copy build output to nginx public folder
COPY --from=build /app/build /usr/share/nginx/html

#8. expose port 80
EXPOSE 80

#9. Start nginx server
CMD ["nginx", "-g", "daemon off;"]