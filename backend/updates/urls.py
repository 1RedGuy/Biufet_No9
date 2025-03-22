from django.urls import path
from .views import TestUpdateView, UpdateInvestmentsView

urlpatterns = [
    path('test-update/', TestUpdateView.as_view(), name='test-update'),
    path('update-investments/', UpdateInvestmentsView.as_view(), name='update-investments'),
] 