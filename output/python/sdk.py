# Auto-generated SDK for Demo API v1.0.0
# Do not edit manually

import requests

BASE_URL = "https://api.example.com/v1"

def get_users(params=None):
    """Get all users"""
    url = f"https://api.example.com/v1/users"
    response = requests.get(url, params=params)
    return response.json()

def create_user(body=None):
    """Create a new user"""
    url = f"https://api.example.com/v1/users"
    response = requests.post(url, json=body)
    return response.json()

def get_user_by_id(id):
    """Get user by ID"""
    url = f"https://api.example.com/v1/users/{id}"
    response = requests.get(url)
    return response.json()

def get_products():
    """Get all products"""
    url = f"https://api.example.com/v1/products"
    response = requests.get(url)
    return response.json()
