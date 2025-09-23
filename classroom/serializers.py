import re
from rest_framework import serializers
from .models import User, Class, Session, ClassMembership, Attendance, Material, Announcement
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}, 'username':{'required': True}}

    def validate_role(self, value):
        if value not in ['lecturer', 'student', 'admin']:
            raise serializers.ValidationError("Invalid role: must be 'lecturer', 'student' or 'admin'")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        return user

# Khoi tao Class
class ClassSerializer(serializers.ModelSerializer):
    lecturer = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'lecturer', 'created_at', 'class_code']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data

# Khoi tao Session        
class SessionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    class Meta:
        model = Session
        fields = ['id', 'class_id', 'class_name', 'topic', 'date', 'created_at']
        read_only_fields = ['created_at']
    
class ClassMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    class_name = serializers.CharField(source='class_id.name', read_only=True)

    class Meta:
        model = ClassMembership
        fields = ['id', 'user', 'user_email', 'class_id', 'class_name', 'role', 'invited_at']
        read_only_fields = ['invited_at']

class AttendanceSerializer(serializers.ModelSerializer):
    session_topic = serializers.CharField(source='session.topic', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'session', 'session_topic', 'user', 'user_name', 'is_verified', 'joined_time']
        read_only_fields = ['joined_time', 'user_name','session_topic', 'user']

class MaterialSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'class_id', 'class_name', 'title', 'file', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']
        read_only_fields = ['uploaded_at', 'uploaded_by_name', 'class_name']

class AnnouncementSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'class_id', 'class_name', 'title', 'content']
        read_only_fields = ['class_name']
