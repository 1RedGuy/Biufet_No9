#!/bin/bash
# Test script for full backend workflow

# Activate virtual environment
source venv/bin/activate || source venv/Scripts/activate

# Check if Django server is running, if not start it in the background
PID=$(lsof -t -i :8000)
if [ -z "$PID" ]; then
  echo "Starting Django server in the background..."
  python3 manage.py runserver &
  SERVER_PID=$!
  sleep 5  # Give server time to start
  echo "Django server started with PID: $SERVER_PID"
fi

API_URL="http://localhost:8000"
TOKEN=""
ADMIN_TOKEN=""

echo "======================"
echo "Starting API Test Flow"
echo "======================"

# Step 1: Create a test user
echo "Step 1: Creating a test user"
curl -X POST "$API_URL/accounts/signup/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser99",
    "email": "testuser99@example.com",
    "password": "Test123456",
    "first_name": "Test",
    "last_name": "User"
  }'
echo -e "\n"

sleep 1

# Step 2: Login as the test user
echo "Step 2: Logging in as test user"
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/accounts/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser99",
    "password": "Test123456"
  }')
echo "$TOKEN_RESPONSE"

# Use jq if available, otherwise fallback to grep/sed
if command -v jq &> /dev/null; then
  TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access // empty')
else
  # Extract token using grep and sed instead of json_pp
  TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access":"[^"]*"' | sed 's/"access":"//g' | sed 's/"//g')
fi
echo "Acquired token: $TOKEN"
echo -e "\n"

# Check if token was successfully extracted
if [ -z "$TOKEN" ]; then
  echo "Failed to extract user token. Trying alternate method for JSON parsing."
  TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access":"[^"]*"' | grep -o '[^"]*' | tail -1)
  echo "Second attempt token: $TOKEN"
  
  # If still empty, exit
  if [ -z "$TOKEN" ]; then
    echo "Failed to extract token. Please make sure the server is running and credentials are correct."
    exit 1
  fi
fi

# Step 3: Login as an admin
echo "Step 3: Logging in as admin"
ADMIN_TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/accounts/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "1redguy",
    "password": "test"
  }')
echo "$ADMIN_TOKEN_RESPONSE"

# Use jq if available, otherwise fallback to grep/sed
if command -v jq &> /dev/null; then
  ADMIN_TOKEN=$(echo "$ADMIN_TOKEN_RESPONSE" | jq -r '.access // empty')
else
  # Extract token using grep and sed
  ADMIN_TOKEN=$(echo "$ADMIN_TOKEN_RESPONSE" | grep -o '"access":"[^"]*"' | sed 's/"access":"//g' | sed 's/"//g')
fi
echo "Acquired admin token: $ADMIN_TOKEN"
echo -e "\n"

# Check if admin token was successfully extracted
if [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to extract admin token. Trying alternate method for JSON parsing."
  ADMIN_TOKEN=$(echo "$ADMIN_TOKEN_RESPONSE" | grep -o '"access":"[^"]*"' | grep -o '[^"]*' | tail -1)
  echo "Second attempt admin token: $ADMIN_TOKEN"
  
  # If still empty, exit
  if [ -z "$ADMIN_TOKEN" ]; then
    echo "Failed to extract admin token. Please make sure the server is running and admin credentials are correct."
    exit 1
  fi
fi

# Step 4: User adds credits to their own account (self-funding)
echo "Step 4: User adds credits to their own account"
curl -X POST "$API_URL/accounts/users/add_credits/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 5000
  }'
echo -e "\n"

# Step 5: Check user credits
echo "Step 5: Checking user profile to see credits"
curl -X GET "$API_URL/accounts/profile/" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# Step 6: List available companies
echo "Step 6: Listing available companies"
COMPANIES_RESPONSE=$(curl -s -X GET "$API_URL/companies/companies/" \
  -H "Authorization: Bearer $TOKEN")
echo "$COMPANIES_RESPONSE" | head -n 20
echo -e "\n... (truncated output) ...\n"

# Step 7: Create a new index (as admin)
echo "Step 7: Creating a new index"
INDEX_RESPONSE=$(curl -s -X POST "$API_URL/indexes/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Index 2023",
    "description": "A test index for demonstration purposes",
    "min_companies": 10,
    "max_companies": 20,
    "min_votes_per_user": 5,
    "max_votes_per_user": 10,
    "investment_start_date": "2023-01-01T00:00:00Z",
    "investment_end_date": "2023-12-31T23:59:59Z",
    "voting_start_date": "2024-01-01T00:00:00Z",
    "voting_end_date": "2024-01-10T23:59:59Z",
    "lock_period_months": 12,
    "status": "active",
    "company_ids": []
  }')
echo "$INDEX_RESPONSE"

# Use jq if available, otherwise fallback to grep/sed
if command -v jq &> /dev/null; then
  INDEX_ID=$(echo "$INDEX_RESPONSE" | jq -r '.id // empty')
else
  INDEX_ID=$(echo "$INDEX_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://g')
  # Try an alternative pattern if the first one fails
  if [ -z "$INDEX_ID" ]; then
    INDEX_ID=$(echo "$INDEX_RESPONSE" | grep -o '"id": *[0-9]*' | head -1 | sed 's/"id": *//g')
  fi
fi
echo "Created index ID: $INDEX_ID"
echo -e "\n"

# Check if INDEX_ID is empty
if [ -z "$INDEX_ID" ]; then
  echo "Failed to extract index ID. Exiting."
  exit 1
fi

# Step 8: Add companies to the index (as admin)
echo "Step 8: Adding companies to the index"
# Get first 20 company IDs
COMPANY_IDS=$(echo "$COMPANIES_RESPONSE" | grep -o '"id":[0-9]*' | head -20 | sed 's/"id"://g' | tr '\n' ',' | sed 's/,$//')

if [ -z "$COMPANY_IDS" ]; then
  echo "Failed to extract company IDs. Trying alternative pattern."
  COMPANY_IDS=$(echo "$COMPANIES_RESPONSE" | grep -o '"id": *[0-9]*' | head -20 | sed 's/"id": *//g' | tr '\n' ',' | sed 's/,$//')
fi

echo "Company IDs: $COMPANY_IDS"

if [ -z "$COMPANY_IDS" ]; then
  echo "No company IDs found. Exiting."
  exit 1
fi

ADD_COMPANIES_RESPONSE=$(curl -s -X POST "$API_URL/indexes/$INDEX_ID/add_companies/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"company_ids\": [$COMPANY_IDS]
  }")
echo "$ADD_COMPANIES_RESPONSE"
echo -e "\n"

# Step 9: Make investment as user
echo "Step 9: Making an investment"
INVESTMENT_RESPONSE=$(curl -s -X POST "$API_URL/investments/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"index_id\": $INDEX_ID,
    \"amount\": 1000
  }")
echo "$INVESTMENT_RESPONSE"

# Use jq if available, otherwise fallback to grep/sed
if command -v jq &> /dev/null; then
  INVESTMENT_ID=$(echo "$INVESTMENT_RESPONSE" | jq -r '.id // empty')
else
  INVESTMENT_ID=$(echo "$INVESTMENT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://g')
  # Try an alternative pattern if the first one fails
  if [ -z "$INVESTMENT_ID" ]; then
    INVESTMENT_ID=$(echo "$INVESTMENT_RESPONSE" | grep -o '"id": *[0-9]*' | head -1 | sed 's/"id": *//g')
  fi
fi
echo "Created investment ID: $INVESTMENT_ID"
echo -e "\n"

# Check if INVESTMENT_ID is empty
if [ -z "$INVESTMENT_ID" ]; then
  echo "Failed to extract investment ID. Exiting."
  exit 1
fi

# Step 10: Change index status to voting (as admin)
echo "Step 10: Changing index status to voting"
curl -X PATCH "$API_URL/indexes/$INDEX_ID/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "voting"
  }'
echo -e "\n"

# Step 11: Create a voting session (as admin)
echo "Step 11: Creating a voting session"
VOTING_RESPONSE=$(curl -s -X POST "$API_URL/voting/sessions/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"index\": $INDEX_ID,
    \"title\": \"Test Voting Session\",
    \"description\": \"Vote for companies in test index\",
    \"start_date\": \"2024-01-01T00:00:00Z\",
    \"end_date\": \"2024-01-10T23:59:59Z\",
    \"status\": \"active\",
    \"max_votes_allowed\": 10
  }")
echo "$VOTING_RESPONSE"

# Use jq if available, otherwise fallback to grep/sed
if command -v jq &> /dev/null; then
  VOTING_ID=$(echo "$VOTING_RESPONSE" | jq -r '.id // empty')
else
  VOTING_ID=$(echo "$VOTING_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://g')
  # Try an alternative pattern if the first one fails
  if [ -z "$VOTING_ID" ]; then
    VOTING_ID=$(echo "$VOTING_RESPONSE" | grep -o '"id": *[0-9]*' | head -1 | sed 's/"id": *//g')
  fi
fi
echo "Created voting session ID: $VOTING_ID"
echo -e "\n"

# Check if we have valid IDs to continue
if [ -z "$INDEX_ID" ] || [ -z "$INVESTMENT_ID" ] || [ -z "$VOTING_ID" ]; then
  echo "Missing required IDs. Exiting test flow."
  exit 1
fi

# Step 12: Cast votes as user
echo "Step 12: Casting votes"
# Get 10 company IDs from the index
INDEX_DETAIL_RESPONSE=$(curl -s -X GET "$API_URL/indexes/$INDEX_ID/" \
  -H "Authorization: Bearer $TOKEN")

INDEX_COMPANY_IDS=$(echo "$INDEX_DETAIL_RESPONSE" | grep -o '"companies":\[[^]]*\]' \
  | grep -o '"id":[0-9]*' | head -10 | sed 's/"id"://g')

# Try alternative pattern if the first one fails
if [ -z "$INDEX_COMPANY_IDS" ]; then
  INDEX_COMPANY_IDS=$(echo "$INDEX_DETAIL_RESPONSE" | grep -o '"id": *[0-9]*' | head -10 | sed 's/"id": *//g')
fi

echo "Companies to vote for: $INDEX_COMPANY_IDS"

# Cast a vote for each company
for COMPANY_ID in $INDEX_COMPANY_IDS; do
  echo "Voting for company ID: $COMPANY_ID"
  curl -X POST "$API_URL/voting/cast-vote/" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"session\": $VOTING_ID,
      \"company\": $COMPANY_ID,
      \"investment\": $INVESTMENT_ID
    }"
  echo -e "\n"
done
echo -e "\n"

# Step 13: Complete voting session (as admin)
echo "Step 13: Completing voting session"
curl -X PATCH "$API_URL/voting/sessions/$VOTING_ID/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "completed"
  }'
echo -e "\n"

# Step 14: Generate positions for the investment
echo "Step 14: Generating investment positions"
curl -X POST "$API_URL/investments/$INVESTMENT_ID/generate-positions/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# Step 15: Update stock prices manually
echo "Step 15: Updating stock prices"
curl -X POST "$API_URL/updates/test-update/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
echo -e "\n"

# Step 16: Update investment positions
echo "Step 16: Updating investment positions"
curl -X POST "$API_URL/updates/update-investments/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
echo -e "\n"

# Step 17: View investment details
echo "Step 17: Viewing investment details"
curl -X GET "$API_URL/investments/$INVESTMENT_ID/" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# Step 18: View investment positions
echo "Step 18: Viewing investment positions"
curl -X GET "$API_URL/investments/$INVESTMENT_ID/positions/" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# Step 19: Check user portfolio
echo "Step 19: Checking user portfolio"
curl -X GET "$API_URL/accounts/portfolio/" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# Step 20: Check user profile with full investment data
echo "Step 20: Checking user profile"
curl -X GET "$API_URL/accounts/profile/" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "======================"
echo "API Test Flow Complete"
echo "======================" 