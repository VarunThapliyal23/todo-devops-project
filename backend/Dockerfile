# 1. Use official Python image
FROM python:3.12-slim

# 2. Set working directory inside the container
WORKDIR /app

# 3. Copy everything from your current backend folder to /app in container
COPY . /app

# 4. Install dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 5. Expose the port that Flask uses 
EXPOSE 5000

# 6. Run the Flask app
CMD ["python", "app.py"]
