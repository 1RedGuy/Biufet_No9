import time
import threading
import logging
import sys
import platform
from datetime import datetime
import subprocess
import os
from django.conf import settings
from django.utils import timezone
from django.db.utils import ProgrammingError, OperationalError
from .models import UpdateLog

logger = logging.getLogger(__name__)

def update_investments_after_prices():
    """Update investment positions with the latest stock prices"""
    try:
        logger.info("Updating investment positions with latest stock prices...")
        
        # Use local import to avoid circular imports
        from investments.models import Investment, InvestmentPosition
        
        # Get all active investments
        investments = Investment.objects.filter(status='ACTIVE')
        updated_count = 0
        
        for investment in investments:
            positions = investment.positions.all()
            
            for position in positions:
                # Update current price from company
                if position.company.current_price:
                    position.current_price = position.company.current_price
                    position.save()
            
            # Update investment total value
            investment.update_current_value()
            updated_count += 1
        
        logger.info(f"Updated {updated_count} investments with latest stock prices")
        return updated_count
    except Exception as e:
        logger.exception(f"Error updating investments: {str(e)}")
        return 0

def update_stock_prices():
    """Run the update_stock_data management command"""
    try:
        logger.info("Starting stock price update...")
        # Save log entry for starting the update
        update_log, created = UpdateLog.objects.get_or_create(
            update_type='stock_prices',
            defaults={'status': 'running'}
        )
        update_log.status = 'running'
        update_log.save()
        
        # Get project path
        project_path = settings.BASE_DIR
        
        # Run the management command using subprocess
        python_cmd = "python3" if platform.system() != "Windows" else "python"
        command = f"{python_cmd} {project_path}/manage.py update_stock_data"
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate()
        
        # Check if command was successful
        if process.returncode == 0:
            logger.info("Stock price update completed successfully")
            update_log.status = 'success'
            update_log.details = stdout.decode('utf-8')
            
            # Update investments with new prices
            try:
                investments_updated = update_investments_after_prices()
                update_log.details += f"\n\nAlso updated {investments_updated} investments with latest prices."
            except Exception as e:
                logger.error(f"Error updating investments after price update: {str(e)}")
                update_log.details += f"\n\nError updating investments: {str(e)}"
        else:
            logger.error(f"Error updating stock prices: {stderr.decode('utf-8')}")
            update_log.status = 'error'
            update_log.details = stderr.decode('utf-8')
            
        update_log.save()
        return update_log
        
    except Exception as e:
        logger.exception(f"Exception during stock price update: {str(e)}")
        try:
            update_log.status = 'error'
            update_log.details = str(e)
            update_log.save()
            return update_log
        except:
            pass
        return None

def run_test_update():
    """Run a test update immediately and return the result"""
    return update_stock_prices()

def start_price_updater():
    """Start the price updater thread that runs every 30 minutes"""
    logger.info("Price updater thread started")
    
    # Allow database initialization before checking for updates
    time.sleep(10)
    
    update_interval = 30 * 60  # 30 minutes in seconds
    
    while True:
        try:
            # Check when was the last update
            try:
                last_update = UpdateLog.objects.filter(update_type='stock_prices').first()
                
                run_update = True
                if last_update:
                    # Calculate time since last update
                    time_since_update = (timezone.now() - last_update.last_updated).total_seconds()
                    # Only run if it's been more than update_interval since last update
                    run_update = time_since_update >= update_interval
                
                if run_update:
                    # Run in a separate thread to avoid blocking
                    update_thread = threading.Thread(target=update_stock_prices)
                    update_thread.daemon = True
                    update_thread.start()
            except (ProgrammingError, OperationalError) as e:
                # Database might not be ready yet
                logger.warning(f"Database not ready: {str(e)}")
            
            # Sleep for 1 minute before checking again
            time.sleep(60)
            
        except Exception as e:
            logger.exception(f"Error in price updater thread: {str(e)}")
            # Sleep a bit before retrying
            time.sleep(60)