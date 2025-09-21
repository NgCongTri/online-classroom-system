from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import re
import random
import string

def validate_username(value):
    if not re.match(r'^[a-zA-Z0-9_]+$', value):
        raise ValidationError("Username can only contain letters, numbers, and underscores.")
    if len(value) < 3 or len(value) > 100:
        raise ValidationError("Username must be between 3 and 100 characters long.")
    return value

class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=100, unique=True, null=True, blank=True, validators=[validate_username])

    ROLE_CHOICES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    face_vector = models.BinaryField(null=True, blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']

    def __str__(self):
        return self.email

    def clean(self):
        validate_password(self.password)

class Class(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classes', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_classes', 
        null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    class_code = models.CharField(max_length=10, unique=True, default=''.join(random.choices(string.ascii_uppercase + string.digits, k=6)))
    is_open_enrollment = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']

class Session(models.Model):
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sessions')
    topic = models.CharField(max_length=100)
    date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.topic} - {self.class_id.name}"

    class Meta:
        ordering = ['date']

class ClassMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=User.ROLE_CHOICES, default='student')
    invited_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.class_id.name}"

    class Meta:
        unique_together = ('user', 'class_id')

class Attendance(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='attendances')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    is_verified = models.BooleanField(default=False)
    joined_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.session.topic}"

    class Meta:
        unique_together = ('session', 'user')

class Material(models.Model):
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=100)
    file = models.FileField(upload_to='classroom/materials/') 
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_materials', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.uploaded_by and hasattr(self, '_request_user'):
            self.uploaded_by = self._request_user
        super().save(*args, **kwargs)

class Announcement(models.Model):
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=100)
    content = models.TextField()
    posted_at = models.DateTimeField(auto_now_add=True)
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_announcements', 
        null=True, blank=True) 

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.uploaded_by and hasattr(self, '_request_user'):
            self.posted_by = self._request_user
        super().save(*args, **kwargs)
