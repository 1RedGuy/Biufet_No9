import os
import django
import sys
from django.db.models import Q

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from companies.models import Company

def cleanup_companies():
    print("\nStarting company cleanup process...")
    
    # Get total companies count
    total_companies = Company.objects.count()
    print(f"\nTotal companies before cleanup: {total_companies}")
    
    # Get companies without price
    companies_to_delete = Company.objects.filter(
        Q(current_price__isnull=True) | 
        Q(current_price=0)
    )
    
    to_delete_count = companies_to_delete.count()
    print(f"Found {to_delete_count} companies without prices")
    
    # Ask for confirmation
    if to_delete_count > 0:
        confirmation = input(f"\nAre you sure you want to delete {to_delete_count} companies? (yes/no): ")
        
        if confirmation.lower() == 'yes':
            # Delete companies
            deletion_result = companies_to_delete.delete()
            
            # Count after deletion
            remaining_companies = Company.objects.count()
            
            print("\nDeletion completed successfully!")
            print(f"Companies deleted: {to_delete_count}")
            print(f"Remaining companies: {remaining_companies}")
            print("\nDeletion details:")
            for model, count in deletion_result[1].items():
                print(f"- {model}: {count} records deleted")
        else:
            print("\nOperation cancelled by user")
    else:
        print("\nNo companies found that need to be deleted")

if __name__ == '__main__':
    try:
        cleanup_companies()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
    finally:
        print("\nScript completed") 