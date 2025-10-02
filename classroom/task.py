from django.core.mail import send_mail
from django.conf import settings

def send_announcement_email(recipients, subject, message):
    """Send announcement email to recipients"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

