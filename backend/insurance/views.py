from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from .models import InsurancePolicy, CoveragePayment, Claim
from .serializers import InsurancePolicySerializer, CoveragePaymentSerializer, ClaimSerializer
from indexes.models import Index

class InsurancePolicyViewSet(viewsets.ModelViewSet):
    serializer_class = InsurancePolicySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InsurancePolicy.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Set the user to the current authenticated user
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def request_claim(self, request, pk=None):
        policy = self.get_object()
        
        if not policy.is_active:
            return Response(
                {"error": "Policy is not active"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if policy.has_claim:
            return Response(
                {"error": "Policy already has an active claim"},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_value = Decimal(str(request.data.get('current_value', '0')))
        
        # Create a new claim
        claim = Claim.objects.create(
            policy=policy,
            current_investment_value=current_value,
            claim_amount=policy.calculate_payout_amount(current_value)
        )

        if not claim.is_eligible():
            claim.status = 'rejected'
            claim.notes = "Current value is above the trigger threshold"
            claim.save()
            return Response(
                {"error": "Current value is above the trigger threshold for insurance payout"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ClaimSerializer(claim)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def process_monthly_payment(self, request, pk=None):
        policy = self.get_object()
        
        if not policy.is_active:
            return Response(
                {"error": "Policy is not active"},
                status=status.HTTP_400_BAD_REQUEST
            )

        premium = policy.calculate_premium()
        user = policy.user

        with transaction.atomic():
            if not user.deduct_credits(premium):
                return Response(
                    {"error": "Insufficient credits for premium payment"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment = CoveragePayment.objects.create(
                policy=policy,
                amount=premium,
                payment_status='completed'
            )

        serializer = CoveragePaymentSerializer(payment)
        return Response(serializer.data)

class ClaimViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Claim.objects.filter(policy__user=self.request.user)

    @action(detail=True, methods=['post'])
    def process_claim(self, request, pk=None):
        claim = self.get_object()
        
        if claim.status != 'pending':
            return Response(
                {"error": f"Claim is already {claim.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not claim.is_eligible():
            claim.status = 'rejected'
            claim.notes = "Not eligible for payout"
            claim.processed_date = timezone.now()
            claim.save()
            return Response(
                {"error": "Claim is not eligible for payout"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Calculate payout amount
            payout_amount = claim.policy.calculate_payout_amount(claim.current_investment_value)
            
            # Add credits to user's account
            claim.policy.user.add_credits(payout_amount)
            
            # Update claim status
            claim.status = 'paid'
            claim.processed_date = timezone.now()
            claim.claim_amount = payout_amount
            claim.save()

            # Update policy
            claim.policy.has_claim = True
            claim.policy.is_active = False  # Deactivate policy after successful claim
            claim.policy.save()

        serializer = self.get_serializer(claim)
        return Response(serializer.data)

class CoveragePaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CoveragePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CoveragePayment.objects.filter(policy__user=self.request.user)