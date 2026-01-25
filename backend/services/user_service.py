"""
User Service for MongoDB operations
"""
from datetime import datetime
from models.user import User

class UserService:
    """Service for user-related database operations"""
    
    def __init__(self, mongo_client):
        self.mongo_client = mongo_client
        self.db = mongo_client.db
        self.users_collection = self.db['users']
    
    def create_user(self, username, password, soil_type):
        """Create a new user"""
        # Check if user already exists
        existing_user = self.users_collection.find_one({'username': username})
        if existing_user:
            return None, "Username already exists"
        
        # Create new user
        password_hash = User.hash_password(password)
        user_data = {
            'username': username,
            'password_hash': password_hash,
            'soil_type': soil_type,
            'created_at': datetime.utcnow()
        }
        
        result = self.users_collection.insert_one(user_data)
        user_data['_id'] = str(result.inserted_id)
        
        return user_data, None
    
    def authenticate_user(self, username, password):
        """Authenticate a user"""
        user = self.users_collection.find_one({'username': username})
        
        if not user:
            return None, "User not found"
        
        if not User.verify_password(user['password_hash'], password):
            return None, "Invalid password"
        
        # Return user without password hash
        return {
            'username': user['username'],
            'soil_type': user['soil_type'],
            'created_at': user['created_at']
        }, None
    
    def get_user(self, username):
        """Get user by username"""
        user = self.users_collection.find_one({'username': username})
        
        if not user:
            return None
        
        return {
            'username': user['username'],
            'soil_type': user['soil_type'],
            'created_at': user['created_at']
        }
    
    def update_soil_type(self, username, soil_type):
        """Update user's soil type preference"""
        result = self.users_collection.update_one(
            {'username': username},
            {'$set': {'soil_type': soil_type}}
        )
        
        return result.modified_count > 0
