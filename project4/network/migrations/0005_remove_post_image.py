# Generated by Django 5.1.6 on 2025-03-22 17:30

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0004_alter_post_likes'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='image',
        ),
    ]
