from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('voting', '0003_alter_session_id_nullable'),
    ]

    operations = [
        migrations.RunSQL(
            """
            CREATE TABLE IF NOT EXISTS company_vote_counts (
                id bigserial PRIMARY KEY,
                total_weight numeric(20,2) NOT NULL DEFAULT 0.00,
                vote_count integer NOT NULL DEFAULT 0,
                last_updated timestamp with time zone NOT NULL DEFAULT now(),
                company_id bigint NOT NULL,
                index_id bigint NOT NULL,
                CONSTRAINT company_vote_counts_index_company_unique UNIQUE (index_id, company_id),
                CONSTRAINT company_vote_counts_company_id_fk FOREIGN KEY (company_id)
                    REFERENCES companies (id) DEFERRABLE INITIALLY DEFERRED,
                CONSTRAINT company_vote_counts_index_id_fk FOREIGN KEY (index_id)
                    REFERENCES indexes (id) DEFERRABLE INITIALLY DEFERRED
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS company_vote_counts;
            """
        ),
    ] 