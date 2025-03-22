import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import CustomUser

def list_users():
    users = CustomUser.objects.all()
    print(f"Found {users.count()} users:")
    
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")

if __name__ == "__main__":
    list_users() 