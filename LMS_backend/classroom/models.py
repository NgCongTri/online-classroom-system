from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import re
import random
import string
import uuid

# Manage user
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

class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_histories')
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)  
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    access_token = models.TextField(null=True, blank=True) 
    refresh_token = models.TextField(null=True, blank=True)  

    def __str__(self):
        return f"{self.user.username} - {self.login_time.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        ordering = ['-login_time']
        verbose_name = 'Login History'
        verbose_name_plural = 'Login Histories'
    
    @property
    def is_active(self):
        return self.logout_time is None

# Manage classes, sessions, and memberships
class Class(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classes', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_classes', 
        null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    class_code = models.CharField(max_length=10, unique=True, null=True, blank=True)
    is_open_enrollment = models.BooleanField(default=False)

    def __str__(self):
        return self.name
    
    @staticmethod
    def generate_class_code(length = 6):
        max_attempts = 100
        for _ in range(max_attempts):
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
            if not Class.objects.filter(class_code=code).exists():
                return code
        raise ValidationError("Unable to generate a unique class code. Please try again.")
        
    def save(self, *args, **kwargs):
        if not self.class_code and not self.is_open_enrollment:
            self.class_code = Class.generate_class_code()
        elif self.is_open_enrollment:
            self.class_code = None
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

class Session(models.Model):
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sessions')
    topic = models.CharField(max_length=100)
    date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_attendance_open = models.BooleanField(default=False)  # Điểm danh có đang mở không

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

# Manage materials and announcements
class Material(models.Model):
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=100)
    file = models.FileField(upload_to='materials/') 
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

    ANNOUNCEMENT_TYPE = (
        ('class', 'Class'),
        ('system', 'System'),
    )
    type = models.CharField(max_length=10, choices=ANNOUNCEMENT_TYPE, default='class')

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.posted_by and hasattr(self, '_request_user'):
            self.posted_by = self._request_user
        super().save(*args, **kwargs)
