"""
User Model for MongoDB
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User:
    """User model for authentication and preferences"""
    
    def __init__(self, username, password_hash, soil_type, created_at=None):
        self.username = username
        self.password_hash = password_hash
        self.soil_type = soil_type
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'username': self.username,
            'soil_type': self.soil_type,
            'created_at': self.created_at
        }
    
    @staticmethod
    def hash_password(password):
        """Hash a password"""
        return generate_password_hash(password)
    
    @staticmethod
    def verify_password(password_hash, password):
        """Verify a password against hash"""
        return check_password_hash(password_hash, password)
