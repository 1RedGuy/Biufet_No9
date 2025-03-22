from django.shortcuts import render
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import InsurancePolicy, InsuranceClaim
from .serializers import InsurancePolicySerializer, InsuranceClaimSerializer


class InsurancePolicyViewSet(viewsets.ModelViewSet):
    serializer_class = InsurancePolicySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return InsurancePolicy.objects.filter(
            user=self.request.user
        ).select_related('investment')
    
    def perform_create(self, serializer):
        with transaction.atomic():
            # Create the insurance policy
            policy = serializer.save(user=self.request.user)
            
            # Deduct the premium from the user's credits
            user = self.request.user
            user.deduct_credits(policy.premium_amount)
    
    @action(detail=False, methods=['get'])
    def eligible(self, request):
        """Get all eligible policies for claims"""
        # Filter policies that are eligible for claims
        eligible_policies = []
        for policy in self.get_queryset().filter(status='active'):
            if policy.is_eligible_for_claim():
                eligible_policies.append(policy)
        
        serializer = self.get_serializer(eligible_policies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        """Create a claim for this policy"""
        policy = self.get_object()
        
        # Check if policy is eligible for a claim
        if not policy.is_eligible_for_claim():
            return Response({
                'error': 'This policy is not eligible for a claim'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if there's already a pending or approved claim
        existing_claim = InsuranceClaim.objects.filter(
            policy=policy,
            status__in=['pending', 'approved', 'paid']
        ).first()
        
        if existing_claim:
            return Response({
                'error': 'There is already a claim for this policy',
                'claim_id': existing_claim.id,
                'claim_status': existing_claim.status
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the claim
        with transaction.atomic():
            # Calculate the claim amount
            amount_claimed = policy.calculate_payout_amount()
            
            # Create the claim
            claim = InsuranceClaim.objects.create(
                policy=policy,
                amount_claimed=amount_claimed
            )
            
            # Process the claim immediately
            claim.process_claim()
            
            # Pay the claim if approved
            if claim.status == 'approved':
                claim.pay_claim()
            
            serializer = InsuranceClaimSerializer(claim)
            return Response(serializer.data)


class InsuranceClaimViewSet(viewsets.ModelViewSet):
    serializer_class = InsuranceClaimSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return InsuranceClaim.objects.filter(
            policy__user=self.request.user
        ).select_related('policy', 'policy__investment')
    
    def perform_create(self, serializer):
        with transaction.atomic():
            # Validate that the policy belongs to the user
            policy = serializer.validated_data['policy']
            if policy.user != self.request.user:
                raise serializers.ValidationError("You don't own this policy")
            
            # Create the claim
            claim = serializer.save()
            
            # Process the claim immediately
            claim.process_claim()
            
            # Pay the claim if approved
            if claim.status == 'approved':
                claim.pay_claim()
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a pending claim"""
        claim = self.get_object()
        
        # Make sure the claim is pending
        if claim.status != 'pending':
            return Response({
                'error': f'Cannot process a claim with status {claim.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process the claim
        claim.process_claim()
        
        # Pay the claim if approved
        if claim.status == 'approved':
            claim.pay_claim()
        
        serializer = self.get_serializer(claim)
        return Response(serializer.data) 