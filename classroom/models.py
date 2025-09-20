from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    face_vector = models.BinaryField(null=True, blank=True)

    def __str__(self):
        return self.username

class Class(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classes', limit_choices_to={'role': 'lecturer'})
    created_at = models.DateTimeField(auto_now_add=True)

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