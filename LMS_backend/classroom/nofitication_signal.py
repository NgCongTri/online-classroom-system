from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Announcement, Notification, ClassMembership, User
from django.utils import timezone

@receiver(post_save, sender=Announcement)
def create_announcement_notification(sender, instance, created, **kwargs):
    if not created:
        return
    if instance.type != 'system':
        users = User.objects.filter(is_active=True).values_list('id', flat=True)
    else:
        class_obj = instance.class_id
        memberships = ClassMembership.objects.filter(class_id=class_obj, role='student').select_related('user')
        user_ids = memberships.values_list('user_id', flat=True)
    notifications = []
    batch_size = 500
    for user_id in user_ids:
        notifications.append(Notification(user_id=user_id, announcement=instance))
    Notification.objects.bulk_create(notifications, batch_size=batch_size)