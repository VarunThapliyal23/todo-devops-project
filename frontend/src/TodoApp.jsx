// This is a simple Flask application that serves as a RESTful API for a Todo application.
// It uses MongoDB for data storage and Flask-PyMongo for database interactions.
// The application supports CRUD operations: Create, Read, Update, and Delete for todos.
// The API endpoints are:
// - GET /api/todos: Fetch all todos
// - POST /api/todos: Create a new todo
// - PUT /api/todos/<id>: Update a todo by ID
// - DELETE /api/todos/<id>: Delete a todo by ID

// TodoApp.jsx - Updated with UUID-based user isolation
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TodoApp.css';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userId, setUserId] = useState(null);

  // Generate or retrieve user ID
  useEffect(() => {
    let storedUserId = localStorage.getItem('todoapp_user_id');
    if (!storedUserId) {
      // Generate new UUID
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('todoapp_user_id', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Fetch todos when userId is set
  useEffect(() => {
    if (userId) {
      fetchTodos();
    }
  }, [userId]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/todos?user_id=${userId}`);
      setTodos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !userId) return;
    
    try {
      const response = await axios.post('/api/todos', { 
        title: newTodo, 
        completed: false,
        user_id: userId 
      });
      setTodos([...todos, response.data]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      await axios.put(`/api/todos/${id}`, { 
        completed: !completed,
        user_id: userId 
      });
      setTodos(todos.map(todo => 
        todo._id === id ? { ...todo, completed: !completed } : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`/api/todos/${id}?user_id=${userId}`);
      setTodos(todos.filter(todo => todo._id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Function to start editing a task
  const startEditing = (id, currentTitle) => {
    setEditingTask(id);
    setEditText(currentTitle);
    setOpenDropdown(null);
  };

  // Function to save edited task - IMPROVED VERSION
  const saveEdit = async (id) => {
    console.log('Save edit called for ID:', id);
    console.log('Edit text:', editText);
    
    if (!editText.trim()) {
      console.log('Edit text is empty, canceling edit');
      cancelEdit();
      return;
    }
    
    try {
      console.log('Sending update request...');
      const response = await axios.put(`/api/todos/${id}`, { 
        title: editText.trim(),
        user_id: userId 
      });
      
      console.log('Update successful, updating local state...');
      setTodos(todos.map(todo => 
        todo._id === id ? { ...todo, title: editText.trim() } : todo
      ));
      
      // Clear editing state immediately
      console.log('Clearing edit state...');
      setEditingTask(null);
      setEditText('');
      console.log('Edit state cleared successfully');
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Function to cancel editing - IMPROVED VERSION
  const cancelEdit = () => {
    console.log('Cancel edit called');
    setEditingTask(null);
    setEditText('');
    console.log('Edit state cleared');
  };

  // Function to handle dropdown toggle
  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  // Function to handle task selection
  const handleSelection = (id) => {
    if (selectedTasks.includes(id)) {
      setSelectedTasks(selectedTasks.filter(taskId => taskId !== id));
    } else {
      setSelectedTasks([...selectedTasks, id]);
    }
  };

  // Function to handle batch delete
  const deleteSelectedTasks = async () => {
    if (selectedTasks.length === 0 || !userId) return;
    
    try {
      // Use batch delete endpoint
      await axios.delete('/api/todos/batch', {
        data: { 
          ids: selectedTasks,
          user_id: userId 
        }
      });
      
      // Update the todos list
      setTodos(todos.filter(todo => !selectedTasks.includes(todo._id)));
      
      // Clear selection and exit selection mode
      setSelectedTasks([]);
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting selected tasks:', error);
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedTasks([]); // Clear selections when exiting selection mode
    }
    setEditingTask(null); // Cancel any editing when toggling selection mode
    setOpenDropdown(null); // Close any open dropdowns
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle keyboard events for editing
  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      saveEdit(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    }
  };

  // Handle save button click
  const handleSaveClick = (e, id, currentEditText) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Save button clicked - ID:', id, 'Text:', currentEditText);
    
    // Use the current editText state
    if (!editText.trim()) {
      console.log('No text to save, canceling');
      cancelEdit();
      return;
    }
    
    saveEdit(id);
  };

  // Handle cancel button click
  const handleCancelClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Cancel button clicked');
    cancelEdit();
  };

  // Show loading if userId is not set yet
  if (!userId) {
    return (
      <div className="todo-app">
        <p className="loading">Initializing your personal todo space...</p>
      </div>
    );
  }

  return (
    <div className="todo-app">
      <h1>Todo List</h1>
      
      <form className="todo-form" onSubmit={addTodo}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="todo-input"
        />
        <button type="submit" className="add-button">Add</button>
      </form>

      <div className="todo-actions">
        <button 
          className={`selection-mode-button ${selectionMode ? 'active' : ''}`} 
          onClick={toggleSelectionMode}
        >
          {selectionMode ? 'Cancel Selection' : 'Select Tasks'}
        </button>
        
        {selectionMode && (
          <button 
            className="delete-selected-button"
            onClick={deleteSelectedTasks}
            disabled={selectedTasks.length === 0}
          >
            Delete Selected ({selectedTasks.length})
          </button>
        )}
      </div>

      {loading ? (
        <p className="loading">Loading your tasks...</p>
      ) : (
        <ul className="todo-list">
          {todos.length === 0 ? (
            <p className="empty-message">✨ No tasks yet. Add your first one above! ✨</p>
          ) : (
            todos.map(todo => (
              <li 
                key={todo._id} 
                className={`todo-item ${todo.completed ? 'completed' : ''} ${selectedTasks.includes(todo._id) ? 'selected' : ''}`}
              >
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(todo._id)}
                    onChange={() => handleSelection(todo._id)}
                    className="todo-checkbox selection-checkbox"
                  />
                )}
                
                {editingTask === todo._id ? (
                  <div className="edit-container">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-input"
                      onKeyDown={(e) => handleEditKeyDown(e, todo._id)}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button 
                        onClick={(e) => handleSaveClick(e, todo._id, editText)}
                        className="save-button"
                        title="Save (Enter)"
                        type="button"
                      >
                        ✓
                      </button>
                      <button 
                        onClick={handleCancelClick}
                        className="cancel-button"
                        title="Cancel (Escape)"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="todo-title">{todo.title}</span>
                )}
                
                {!selectionMode && editingTask !== todo._id && (
                  <div className="todo-menu" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="menu-button"
                      onClick={() => toggleDropdown(todo._id)}
                      title="More options"
                    >
                      ⋮
                    </button>
                    {openDropdown === todo._id && (
                      <div className="dropdown-menu">
                        <button
                          className="dropdown-item"
                          onClick={() => startEditing(todo._id, todo.title)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="dropdown-item delete-item"
                          onClick={() => deleteTodo(todo._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default TodoApp;