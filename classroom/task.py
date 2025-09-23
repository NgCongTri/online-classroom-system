# from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Class

def send_announcement_email(class_id, title):
    print(f"[Mock Email] Thông báo mới cho class_id={class_id}: {title}")

