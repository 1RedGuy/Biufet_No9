from django.db import connection

def run():
    with connection.cursor() as cursor:
        # List all tables in the database
        cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print("Tables in database:")
        for table in tables:
            print(f"- {table[0]}")
        
        # Check if company_vote_counts table exists
        cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'company_vote_counts'
        );
        """)
        exists = cursor.fetchone()[0]
        print(f"\ncompany_vote_counts table exists: {exists}")
        
        if exists:
            # Check schema for company_vote_counts table
            cursor.execute("""
            SELECT column_name, is_nullable, data_type
            FROM information_schema.columns
            WHERE table_name = 'company_vote_counts'
            ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            print("company_vote_counts table schema:")
            for column in columns:
                print(f"Column: {column[0]}, Nullable: {column[1]}, Type: {column[2]}")
        
        # Check schema for voting_vote table
        cursor.execute("""
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
        WHERE table_name = 'voting_vote'
        ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\nVoting_vote table schema:")
        for column in columns:
            print(f"Column: {column[0]}, Nullable: {column[1]}, Type: {column[2]}")

if __name__ == '__main__':
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
    run() 