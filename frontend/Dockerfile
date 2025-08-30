# ---------- Build Stage ----------
FROM node:22-slim AS build 

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install ALL dependencies for build
RUN npm install

# Copy source code
COPY . .

# Build React app
RUN npm run build

# ---------- Production Stage ----------
FROM nginx:alpine

# Copy build output to Nginx HTML folder
COPY --from=build /app/build /usr/share/nginx/html

# Remove default Nginx config and add our own (for React Router support)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# Expose port 80
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]