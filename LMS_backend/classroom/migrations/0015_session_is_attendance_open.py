# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('classroom', '0014_loginhistory_access_token_loginhistory_refresh_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='session',
            name='is_attendance_open',
            field=models.BooleanField(default=False),
        ),
    ]
