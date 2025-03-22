import os
import django
import random
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import CustomUser, Portfolio, PortfolioHistory
from investments.models import Investment, InvestmentPosition
from companies.models import Company
from indexes.models import Index
from django.utils import timezone
from datetime import timedelta

def update_test_user_investment():
    try:
        # Find the test user "testuser"
        try:
            user = CustomUser.objects.get(username='testuser')
            print(f"Found user: {user.username} (ID: {user.id})")
        except CustomUser.DoesNotExist:
            print("User 'testuser' not found. Try another username.")
            return
        
        # Get user's active investments
        investments = Investment.objects.filter(user=user, status='ACTIVE')
        print(f"Found {investments.count()} active investments")
        
        if investments.count() == 0:
            # If no investments exist, create a test investment
            print("No active investments found. Creating a test investment...")
            
            # Find an index to invest in
            try:
                index = Index.objects.first()
                print(f"Using index: {index.name}")
            except:
                print("No indexes found. Cannot create investment.")
                return
                
            # Create a new investment
            investment = Investment.objects.create(
                user=user,
                index=index,
                amount=Decimal('1000.00'),
                status='ACTIVE',
                investment_date=timezone.now() - timedelta(days=30)  # Investment was made 30 days ago
            )
            print(f"Created new investment ID: {investment.id} with amount: ${investment.amount}")
            
            # Add some companies to the investment positions
            companies = Company.objects.filter(indexes=index)[:5]
            
            if companies.exists():
                print("Adding positions for the following companies:")
                total_positions = len(companies)
                for i, company in enumerate(companies):
                    # Calculate a weight - distribute 100% among the companies
                    weight = Decimal(100) / Decimal(total_positions)
                    
                    # Calculate quantity based on weight and investment amount
                    # For simplicity, assuming company price is $100
                    company_price = Decimal('100.00')
                    quantity = (investment.amount * (weight / Decimal('100'))) / company_price
                    
                    position = InvestmentPosition.objects.create(
                        investment=investment,
                        company=company,
                        quantity=quantity,
                        purchase_price=company_price,
                        current_price=company_price * Decimal('1.05'),  # 5% gain to start
                        weight=weight
                    )
                    print(f"  - {company.name}: {quantity} shares at ${company_price}")
                
                # Update the investment's current value to show growth
                investment.current_value = investment.amount * Decimal('1.05')  # 5% initial growth
                investment.save()
                print(f"Updated investment value to ${investment.current_value} (5% growth)")
                
                # Create portfolio history entries
                portfolio, created = Portfolio.objects.get_or_create(user=user)
                print(f"Portfolio {'created' if created else 'found'} for user")
                
                # Create history entries for the last 30 days with gradual growth
                for days_ago in range(30, -1, -5):  # Every 5 days including today
                    date = timezone.now() - timedelta(days=days_ago)
                    growth_factor = Decimal('1.00') + (Decimal('0.05') * ((30 - days_ago) / 30))
                    value = investment.amount * growth_factor
                    profit_loss = value - investment.amount
                    
                    history_entry = PortfolioHistory.objects.create(
                        portfolio=portfolio,
                        timestamp=date,
                        value=value,
                        profit_loss=profit_loss
                    )
                    print(f"Created history entry for {date.date()}: ${value} (profit/loss: ${profit_loss})")
            else:
                print("No companies found for this index.")
        else:
            # If investments exist, update them to show growth
            for investment in investments:
                original_value = investment.amount
                current_value = original_value * Decimal('1.15')  # 15% growth
                
                investment.current_value = current_value
                investment.save()
                
                # Update positions to reflect growth
                positions = InvestmentPosition.objects.filter(investment=investment)
                for position in positions:
                    position.current_price = position.purchase_price * Decimal('1.15')  # 15% growth
                    position.save()
                
                print(f"Updated investment ID: {investment.id}")
                print(f"  Original: ${original_value}")
                print(f"  Current: ${current_value} (15% growth)")
                
                # Calculate profit/loss
                profit_loss = current_value - original_value
                
                # Update/create portfolio history
                portfolio, created = Portfolio.objects.get_or_create(user=user)
                
                # Create a new history entry for today
                history_entry = PortfolioHistory.objects.create(
                    portfolio=portfolio,
                    timestamp=timezone.now(),
                    value=current_value,
                    profit_loss=profit_loss
                )
                print(f"Created new portfolio history entry: ${current_value} (profit/loss: ${profit_loss})")
        
        print("\nUpdates completed successfully. Portfolio growth should now be visible.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    update_test_user_investment() 