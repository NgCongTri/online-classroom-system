from rest_framework import serializers
from .models import User, Class, Session

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_role(self, value):
        if value not in ['lecturer', 'student']:
            raise serializers.ValidationError("Invalid role: must be 'lecturer' or 'student'")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        return user

class ClassSerializer(serializers.ModelSerializer):
    lecturer = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'start_date', 'end_date', 'lecturer', 'created_at']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data
class SessionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    class Meta:
        model = Session
        fields = ['id', 'class_id', 'class_name', 'topic', 'date', 'created_at']
        read_only_fields = ['created_at']
    