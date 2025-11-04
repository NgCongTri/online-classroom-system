import re
from django.utils import timezone
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import (User, Class, Session, ClassMembership,
    Attendance, Material, Announcement, LoginHistory, Notification, Category, Tag)

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
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 'role'
        ]
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
    session_id = serializers.UUIDField(read_only=True) 

    class Meta:
        model = LoginHistory
        fields = ['id', 'user', 'username', 'email', 'user_role', 'login_time', 
                  'logout_time', 'ip_address', 'user_agent', 'is_active', 'session_id']
    
    def get_is_active(self, obj):        
        return obj.logout_time is None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent']
        read_only_fields = ['slug']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']

# Khoi tao Class
class ClassSerializer(serializers.ModelSerializer):
    lecturer_email = serializers.CharField(source='lecturer.email', read_only=True, allow_null=True)
    lecturer_name = serializers.CharField(source='lecturer.username', read_only=True, allow_null=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source='category', queryset=Category.objects.all(), write_only=True, required=False, allow_null=True)
    tag_ids = serializers.PrimaryKeyRelatedField(source='tags', queryset=Tag.objects.all(), many=True, write_only=True, required=False)

    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 
                  'lecturer', 'lecturer_name', 'lecturer_email', 'created_by',
                  'created_at', 'class_code', 'is_open_enrollment', 'category', 'tags', 'category_id', 'tag_ids']
        read_only_fields = ['created_at', 'lecturer_name', 'lecturer_email']
    
    def to_representation(self, instance):
        """Customize serialization to return IDs as integers"""
        representation = super().to_representation(instance)
        
        representation['lecturer'] = instance.lecturer.id if instance.lecturer else None
        representation['created_by'] = instance.created_by.id if instance.created_by else None
        
        return representation
    
    def validate(self, data):
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 ClassSerializer.validate() called with data: {data}")
        
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date:
            if start_date > end_date:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date'
                })
        
        is_open = data.get('is_open_enrollment', True)
        
        logger.info(f"🔍 is_open_enrollment: {is_open}")
        
        if is_open:
            logger.info(f"Open enrollment - setting class_code to None")
            data['class_code'] = None
        else:
            if 'class_code' in data:
                data.pop('class_code')
            logger.info(f"Code required - class_code will be auto-generated by model")
        
        logger.info(f"Validation passed, returning data: {data}")
        return data
    
    def validate_class_code(self, value):
        if not value:
            return value
        value = value.strip()        
        
        if self.instance:            
            if Class.objects.filter(class_code=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError('This class code is already in use')
        else:            
            if Class.objects.filter(class_code=value).exists():
                raise serializers.ValidationError('This class code is already in use')
        
        return value

# Khoi tao Session        
class SessionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    is_attendance_available = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ['id', 'class_id', 'class_name', 'topic', 'date',
                'created_at', 'is_attendance_open', 'attendance_start_time', 
                'attendance_end_time', 'auto_attendance', 'is_attendance_available']
        read_only_fields = ['created_at']

    def get_is_attendance_available(self, obj):
        if not obj.auto_attendance:
            return obj.is_attendance_open
        
        now = timezone.now()
        if obj.attendance_start_time and obj.attendance_end_time:
            return obj.attendance_start_time <= now <= obj.attendance_end_time
        
        return False

    def validate(self, data):
        auto_attendance = data.get('auto_attendance', False)
        attendance_start = data.get('attendance_start_time')
        attendance_end = data.get('attendance_end_time')
        
        if auto_attendance:
            if not attendance_start or not attendance_end:
                raise serializers.ValidationError({
                    'attendance_start_time': 'This field is required when auto_attendance is enabled',
                    'attendance_end_time': 'This field is required when auto_attendance is enabled'
                })
            if attendance_start >= attendance_end:
                raise serializers.ValidationError({
                    'attendance_end_time': 'Attendance end time must be after start time'
                })
        
        return data
    
class ClassMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    class_data = serializers.SerializerMethodField()  

    class Meta:
        model = ClassMembership
        fields = ['id', 'user', 'user_name', 'user_email', 'class_id', 'class_name', 
                  'class_data', 'role', 'invited_at'] 
        read_only_fields = ['invited_at']

    def get_class_data(self, obj):
        if obj.class_id:
            return {
                'id': obj.class_id.id,
                'name': obj.class_id.name,
                'description': obj.class_id.description,
                'start_date': obj.class_id.start_date,
                'end_date': obj.class_id.end_date,
                'lecturer': obj.class_id.lecturer.id if obj.class_id.lecturer else None,
                'lecturer_name': obj.class_id.lecturer.username if obj.class_id.lecturer else None,
                'lecturer_email': obj.class_id.lecturer.email if obj.class_id.lecturer else None,
                'created_by': obj.class_id.created_by.id if obj.class_id.created_by else None,
                'created_at': obj.class_id.created_at,
                'class_code': obj.class_id.class_code,
                'is_open_enrollment': obj.class_id.is_open_enrollment,
            }
        return None
    

class AttendanceSerializer(serializers.ModelSerializer):
    session_topic = serializers.CharField(source='session.topic', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ['id', 'session', 'session_topic', 'user', 'user_name', 'is_verified', 'joined_time']
        read_only_fields = ['joined_time', 'user_name','session_topic']
    
    def get_user(self, obj):
        """Return user details"""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'role': obj.user.role
            }
        return None

class MaterialSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = ['id', 'class_id', 'class_name', 'title', 'file', 'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'file_url']
        read_only_fields = ['uploaded_at', 'uploaded_by_name', 'class_name']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

class AnnouncementSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    posted_by_name = serializers.CharField(source='posted_by.username', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'type', 'class_id', 'class_name', 'title', 'content', 'posted_by', 'posted_by_name', 'posted_at']
        read_only_fields = ['class_name', 'posted_by', 'posted_at', 'class_id', 'type'] 

    def get_class_name(self, obj):
        return obj.class_id.name if obj.class_id else None

class NotificationSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='announcement.title', read_only=True)
    class_id = serializers.IntegerField(source='announcement.class_id.id', read_only=True)
    class_name = serializers.CharField(source='announcement.class_id.name', read_only=True)
    excerpt = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'user', 'announcement', 'title', 'class_id', 'class_name', 'excerpt', 'is_read']
        read_only_fields = ['user', 'announcement', 'title', 'class_id', 'class_name', 'excerpt'] 

    def get_excerpt(self, obj):
        return obj.announcement.content[:100] if obj.announcement else None
