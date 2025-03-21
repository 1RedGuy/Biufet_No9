from django.apps import AppConfig
import threading
import time
import os
import sys
from datetime import datetime

class UpdatesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'updates'
    
    def ready(self):
        # Avoid running twice in development server
        if os.environ.get('RUN_MAIN') != 'true' and 'runserver' in sys.argv:
            return
            
        # Import here to avoid AppRegistryNotReady exception
        from .tasks import start_price_updater
        
        # Start the updater thread
        updater_thread = threading.Thread(target=start_price_updater)
        updater_thread.daemon = True  # Thread will exit when main thread exits
        updater_thread.start()