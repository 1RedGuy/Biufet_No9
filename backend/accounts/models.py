from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, UserManager
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(username, email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=254, unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    credits = models.DecimalField(
        max_digits=20, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name=_('Available Credits')
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def add_credits(self, amount):
        """Add credits to user's account"""
        self.credits += Decimal(str(amount))
        self.save()

    def deduct_credits(self, amount):
        """Deduct credits from user's account"""
        if self.credits >= Decimal(str(amount)):
            self.credits -= Decimal(str(amount))
            self.save()
            return True
        return False

class Portfolio(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='portfolio')
    total_value = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0.00'))
    total_profit_loss = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0.00'))
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Portfolio"

    def update_totals(self):
        """Update portfolio totals based on all investments"""
        from investments.models import Investment
        investments = Investment.objects.filter(user=self.user)
        self.total_value = sum(inv.current_value for inv in investments)
        self.total_profit_loss = sum(inv.profit_loss for inv in investments)
        self.save()

class PortfolioHistory(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='history')
    value = models.DecimalField(max_digits=20, decimal_places=2)
    profit_loss = models.DecimalField(max_digits=20, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Portfolio histories'

    def __str__(self):
        return f"{self.portfolio.user.username}'s Portfolio History - {self.timestamp}"
