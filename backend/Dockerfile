# 1. Use official lightweight Python image
FROM python:3.12-slim

# 2. Set working directory
WORKDIR /app

# 3. Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of the backend code
COPY . .

# 5. Expose Flask port
EXPOSE 5000

# 6. Use Gunicorn as WSGI production server
# "app:app" means -> app.py file and app = Flask(__name__) inside it
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]