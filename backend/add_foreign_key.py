from django.db import connection

def run():
    with connection.cursor() as cursor:
        try:
            cursor.execute('ALTER TABLE voting_vote ADD CONSTRAINT voting_vote_index_id_fk FOREIGN KEY (index_id) REFERENCES indexes(id);')
            print('Foreign key added successfully')
        except Exception as e:
            print(f'Error adding foreign key: {e}')

if __name__ == '__main__':
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
    run() 