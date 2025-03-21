from decimal import Decimal
from django.db.models import Avg, StdDev
from investments.models import Investment
from datetime import timedelta
from django.utils import timezone

class RiskCalculationService:
    @staticmethod
    def calculate_investment_risk_factor(investment_amount: Decimal, index, user) -> Decimal:
        """
        Calculate risk factor based on:
        1. Investment size relative to user's total portfolio (60%)
        2. User's investment history and performance (40%)
        """
        risk_factors = []
        
        # 1. Investment Size Risk (60%)
        investment_size_risk = RiskCalculationService._calculate_investment_size_risk(investment_amount, user)
        risk_factors.append((investment_size_risk, Decimal('0.6')))  # 60% weight
        
        # 2. User History Risk (40%)
        user_history_risk = RiskCalculationService._calculate_user_history_risk(user)
        risk_factors.append((user_history_risk, Decimal('0.4')))  # 40% weight
        
        # Calculate weighted average risk factor
        total_risk = sum(risk * weight for risk, weight in risk_factors)
        
        # Normalize risk factor between 0.1 and 10.0
        normalized_risk = max(min(total_risk, Decimal('10.0')), Decimal('0.1'))
        
        return normalized_risk.quantize(Decimal('0.01'))

    @staticmethod
    def _calculate_investment_size_risk(investment_amount: Decimal, user) -> Decimal:
        """
        Calculate risk based on investment size relative to user's portfolio
        New scale:
        - Very small investment (≤5% of portfolio): 0.5
        - Small investment (≤15% of portfolio): 0.8
        - Moderate investment (≤30% of portfolio): 1.2
        - Large investment (≤50% of portfolio): 1.8
        - Very large investment (>50% of portfolio): 2.5
        """
        total_portfolio = Investment.objects.filter(
            user=user, 
            status='ACTIVE'
        ).aggregate(total=Avg('amount'))['total'] or Decimal('0')
        
        if total_portfolio == 0:
            return Decimal('2.0')  # New investor baseline risk
            
        ratio = investment_amount / total_portfolio
        
        if ratio <= Decimal('0.05'):  # Very small investment
            return Decimal('0.5')
        elif ratio <= Decimal('0.15'):  # Small investment
            return Decimal('0.8')
        elif ratio <= Decimal('0.30'):  # Moderate investment
            return Decimal('1.2')
        elif ratio <= Decimal('0.50'):  # Large investment
            return Decimal('1.8')
        else:  # Very large investment
            return Decimal('2.5')

    @staticmethod
    def _calculate_user_history_risk(user) -> Decimal:
        """
        Calculate risk based on user's investment history
        New scale:
        - Excellent performance (≥30% profit): 0.5
        - Very good performance (≥15% profit): 0.8
        - Good performance (≥0% profit): 1.0
        - Slight loss (≥-10% loss): 1.5
        - Moderate loss (≥-20% loss): 2.0
        - Significant loss (>-20% loss): 2.5
        """
        user_investments = Investment.objects.filter(user=user)
        
        if not user_investments.exists():
            return Decimal('1.8')  # New user baseline risk
            
        # Calculate average profit/loss ratio
        total_invested = user_investments.aggregate(total=Avg('amount'))['total'] or Decimal('0')
        total_current = user_investments.aggregate(total=Avg('current_value'))['total'] or Decimal('0')
        
        if total_invested == 0:
            return Decimal('1.8')
            
        performance_ratio = (total_current / total_invested) - Decimal('1.0')  # Convert to profit/loss percentage
        
        # Adjust risk based on historical performance
        if performance_ratio >= Decimal('0.30'):  # Excellent performance (≥30% profit)
            return Decimal('0.5')
        elif performance_ratio >= Decimal('0.15'):  # Very good performance (≥15% profit)
            return Decimal('0.8')
        elif performance_ratio >= Decimal('0.00'):  # Good performance (≥0% profit)
            return Decimal('1.0')
        elif performance_ratio >= Decimal('-0.10'):  # Slight loss (≥-10% loss)
            return Decimal('1.5')
        elif performance_ratio >= Decimal('-0.20'):  # Moderate loss (≥-20% loss)
            return Decimal('2.0')
        else:  # Significant loss (>-20% loss)
            return Decimal('2.5') 