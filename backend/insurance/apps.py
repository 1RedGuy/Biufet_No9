from django.apps import AppConfig


class InsuranceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'insurance'
    
    def ready(self):
        import insurance.signals  # Import signals to connect them 