# test_mongo.py
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["todoapp"]
print("MongoDB connection successful!")

# Create a test document
test_result = db.test.insert_one({"test": "connection"})
print(f"Test document inserted with ID: {test_result.inserted_id}")

# Clean up
db.test.delete_one({"_id": test_result.inserted_id})