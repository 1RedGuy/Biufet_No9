# Generated manually

import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('companies', '0004_delete_vote'),
        ('indexes', '0004_alter_index_status'),
        ('investments', '0002_alter_investment_options_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Create the CompanyVoteCount model
        migrations.CreateModel(
            name='CompanyVoteCount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_weight', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Total vote weight for this company', max_digits=20, verbose_name='Total Weight')),
                ('vote_count', models.PositiveIntegerField(default=0, help_text='Number of votes for this company', verbose_name='Vote Count')),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vote_counts', to='companies.company', verbose_name='Company')),
                ('index', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='company_vote_counts', to='indexes.index', verbose_name='Index')),
            ],
            options={
                'verbose_name': 'Company Vote Count',
                'verbose_name_plural': 'Company Vote Counts',
                'db_table': 'company_vote_counts',
                'ordering': ['-total_weight'],
                'unique_together': {('index', 'company')},
            },
        ),
        
        # Create the Vote model using the existing votes table, but as a proxy model
        # without actually creating the table or modifying the schema
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='Vote',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('weight', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Vote weight based on investment amount', max_digits=20, null=True, verbose_name='Weight')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True, null=True)),
                        ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='companies.company', verbose_name='Company')),
                        ('index', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='indexes.index', verbose_name='Index')),
                        ('investment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='investments.investment', verbose_name='Investment')),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to=settings.AUTH_USER_MODEL, verbose_name='User')),
                    ],
                    options={
                        'verbose_name': 'Vote',
                        'verbose_name_plural': 'Votes',
                        'db_table': 'voting_vote',
                        'ordering': ['-created_at'],
                        'unique_together': {('user', 'investment', 'company')},
                    },
                ),
            ],
        ),
        
        # Add the new fields to the votes table that are needed for our functionality
        migrations.RunSQL(
            """
            DO $$
            BEGIN
                -- Check if the index_id column exists
                IF NOT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'voting_vote' AND column_name = 'index_id'
                ) THEN
                    -- Add index_id column
                    ALTER TABLE voting_vote ADD COLUMN index_id integer NULL;
                    
                    -- Create a foreign key but allow null values
                    ALTER TABLE voting_vote ADD CONSTRAINT voting_vote_index_id_fk 
                    FOREIGN KEY (index_id) REFERENCES indexes_index(id) DEFERRABLE INITIALLY DEFERRED;
                    
                    -- Add weight column
                    ALTER TABLE voting_vote ADD COLUMN weight numeric(20,2) NULL;
                    
                    -- Add updated_at column
                    ALTER TABLE voting_vote ADD COLUMN updated_at timestamp with time zone NULL;
                END IF;
            END $$;
            """,
            reverse_sql="""
            DO $$
            BEGIN
                -- Remove the columns we added if they exist
                IF EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'voting_vote' AND column_name = 'index_id'
                ) THEN
                    ALTER TABLE voting_vote DROP COLUMN index_id;
                    ALTER TABLE voting_vote DROP COLUMN weight;
                    ALTER TABLE voting_vote DROP COLUMN updated_at;
                END IF;
            END $$;
            """
        ),
    ] 