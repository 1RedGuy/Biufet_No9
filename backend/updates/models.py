from django.db import models

class UpdateLog(models.Model):
    """Model to track when data was last updated"""
    update_type = models.CharField(max_length=50, unique=True)
    last_updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, default='success')
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.update_type} - {self.last_updated}"