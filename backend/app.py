# This is a simple Flask application that serves as a RESTful API for a Todo application.
# It uses MongoDB for data storage and Flask-PyMongo for database interactions.
# The application supports CRUD operations: Create, Read, Update, and Delete for todos.
# It also uses Flask-CORS to handle Cross-Origin Resource Sharing, allowing the frontend to communicate with the backend.
# The application is configured to run on a specified port and can be deployed on platforms like Heroku or Render.
# Import necessary libraries

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
mongo = PyMongo(app)

# Helper function to convert MongoDB ObjectId to string
def parse_json(data):
    if isinstance(data, list):
        return [{**item, "_id": str(item["_id"])} for item in data]
    return {**data, "_id": str(data["_id"])}

@app.route("/api/todos", methods=["GET"])
def get_todos():
    # Get user_id from query parameters
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    # Filter todos by user_id
    todos = list(mongo.db.todos.find({"user_id": user_id}).sort("created_at", -1))
    return jsonify(parse_json(todos))

@app.route("/api/todos", methods=["POST"])
def create_todo():
    todo_data = request.get_json()
    
    # Validate user_id is provided
    if not todo_data.get('user_id'):
        return jsonify({"error": "user_id is required"}), 400
    
    todo_data["created_at"] = datetime.utcnow()
    todo_id = mongo.db.todos.insert_one(todo_data).inserted_id
    new_todo = mongo.db.todos.find_one({"_id": todo_id})
    return jsonify(parse_json(new_todo))

@app.route("/api/todos/<todo_id>", methods=["PUT"])
def update_todo(todo_id):
    update_data = request.get_json()
    
    # Validate user_id is provided
    if not update_data.get('user_id'):
        return jsonify({"error": "user_id is required"}), 400
    
    user_id = update_data.pop('user_id')  # Remove user_id from update data
    
    # Update only if the todo belongs to the user
    result = mongo.db.todos.update_one(
        {"_id": ObjectId(todo_id), "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Todo not found or access denied"}), 404
    
    updated_todo = mongo.db.todos.find_one({"_id": ObjectId(todo_id)})
    return jsonify(parse_json(updated_todo))

@app.route("/api/todos/<todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    # Get user_id from query parameters
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    # Delete only if the todo belongs to the user
    result = mongo.db.todos.delete_one({"_id": ObjectId(todo_id), "user_id": user_id})
    
    if result.deleted_count:
        return jsonify({"message": "Todo deleted successfully"}), 200
    return jsonify({"error": "Todo not found or access denied"}), 404

@app.route("/api/todos/batch", methods=["DELETE"])
def batch_delete_todos():
    data = request.get_json()
    ids = data.get("ids", [])
    user_id = data.get("user_id")
    
    if not ids:
        return jsonify({"error": "No IDs provided"}), 400
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    # Convert string IDs to ObjectId
    object_ids = [ObjectId(id) for id in ids]
    
    # Delete all todos with matching IDs that belong to the user
    result = mongo.db.todos.delete_many({
        "_id": {"$in": object_ids},
        "user_id": user_id
    })
    
    return jsonify({
        "message": f"{result.deleted_count} todos deleted successfully",
        "deleted_count": result.deleted_count
    }), 200

# Optional: Route to get user stats (for debugging)
@app.route("/api/users/<user_id>/stats", methods=["GET"])
def get_user_stats(user_id):
    total_todos = mongo.db.todos.count_documents({"user_id": user_id})
    completed_todos = mongo.db.todos.count_documents({"user_id": user_id, "completed": True})
    
    return jsonify({
        "user_id": user_id,
        "total_todos": total_todos,
        "completed_todos": completed_todos,
        "pending_todos": total_todos - completed_todos
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))