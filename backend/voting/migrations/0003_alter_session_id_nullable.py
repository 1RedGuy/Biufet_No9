# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('voting', '0002_vote_session_id'),
    ]

    operations = [
        migrations.RunSQL(
            """
            ALTER TABLE voting_vote ALTER COLUMN session_id DROP NOT NULL;
            """,
            reverse_sql="""
            ALTER TABLE voting_vote ALTER COLUMN session_id SET NOT NULL;
            """
        ),
    ] 