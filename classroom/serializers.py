import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import (User, Class, Session, ClassMembership,
    Attendance, Material, Announcement, LoginHistory)

class UserSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'username': {'required': True},
            'email': {'required': True},
            'role': {'required': False}
        }

    def validate_role(self, value):
        # Only allow student and lecturer roles for registration
        if value not in ['lecturer', 'student']:
            raise serializers.ValidationError("Invalid role: only 'lecturer' and 'student' are allowed for registration")
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Password is required")
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username is required")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        
        if not password:
            raise serializers.ValidationError({"password": "Password is required"})
        if not password_confirm:
            raise serializers.ValidationError({"password_confirm": "Password confirmation is required"})
        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        
        # Set default role if not provided
        if not data.get('role'):
            data['role'] = 'student'
            
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                role=validated_data.get('role', 'student')  
            )
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create user: {str(e)}")

class RegistrationSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=[('student', 'Student'), ('lecturer', 'Lecturer')], required=False, default='student')
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'username': {'required': True},
            'email': {'required': True}
        }

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Password is required")
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username is required")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
            
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'student')
        )
        return user

class AdminUserSerializer(serializers.ModelSerializer):
    """Role admin can create users with any role"""
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'username': {'required': True},
            'email': {'required': True},
            'role': {'required': False}
        }

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError("Password is required")
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username is required")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def validate_role(self, value):
        """Admin can create users with any role"""
        if value not in ['student', 'lecturer', 'admin']:
            raise serializers.ValidationError("Invalid role")
        return value
    
    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        
        if not password:
            raise serializers.ValidationError({"password": "Password is required"})
        if not password_confirm:
            raise serializers.ValidationError({"password_confirm": "Password confirmation is required"})
        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        
        # Set default role if not provided
        if not data.get('role'):
            data['role'] = 'student'
            
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                role=validated_data.get('role', 'student')
            )
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create user: {str(e)}")


class LoginHistorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    is_active = serializers.SerializerMethodField()
    session_id = serializers.UUIDField(read_only=True)  # ✅ Add session_id

    class Meta:
        model = LoginHistory
        fields = ['id', 'user', 'username', 'email', 'user_role', 'login_time', 
                  'logout_time', 'ip_address', 'user_agent', 'is_active', 'session_id']
    
    def get_is_active(self, obj):        
        return obj.logout_time is None

# Khoi tao Class
class ClassSerializer(serializers.ModelSerializer):
    lecturer = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'lecturer', 'created_at', 'class_code', 'is_open_enrollment']
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
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ['id', 'type', 'class_id', 'class_name', 'title', 'content', 'posted_by', 'created_at']
        read_only_fields = ['class_name', 'posted_by', 'created_at']

    def get_class_name(self, obj):
        return obj.class_id.name if obj.class_id else None


