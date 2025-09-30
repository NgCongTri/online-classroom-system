from django.http import response
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .serializers import UserSerializer, RegistrationSerializer, AdminUserSerializer
from .models import User, Class, Session, ClassMembership, Attendance , Material, Announcement
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, ValidationError
from .serializers import ClassSerializer, SessionSerializer, ClassMembershipSerializer, AttendanceSerializer, MaterialSerializer, AnnouncementSerializer
from .task import send_announcement_email
from rest_framework.decorators import api_view, permission_classes,authentication_classes
from rest_framework_simplejwt.views import TokenRefreshView
from .authentication import CookieJWTAuthentication
import logging

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer  # Use RegistrationSerializer instead
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Register request data: {request.data}")
            
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response({
                    'message': 'User registered successfully',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': user.role
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Validation errors: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response({
                'error': 'Registration failed',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomLoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data['access']
            refresh_token = response.data['refresh']
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=1800  
            )
            response.set_cookie(
                'refresh_token',
                refresh_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=86400  
            )
            
            del response.data['access']
            del response.data['refresh']
            email = request.data.get('email')
            user = User.objects.get(email=email)
            response.data['user'] = {
                'id': user.id,
                'email': user.email,
                'role': user.role
            }
            response.data['message'] = 'Login successful'
        return response

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can view users")
        return User.objects.all()

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can view users")
        return User.objects.all()

@api_view(['GET'])
@authentication_classes([CookieJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    })

class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response(status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return Response({"message": "Logout successful"}, status=200)
        
#Token refresh
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "No refresh token in cookie"}, status=status.HTTP_400_BAD_REQUEST)

        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200 and "access" in response.data:
            access_token = response.data["access"]
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,   
                samesite="Lax",
                max_age=60 * 60  
            )
            del response.data["access"]
            response.data["message"] = "Token refreshed successfully"
        return response

# ClassView
class ClassListCreateView(generics.ListCreateAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can create classes")
        serializer.save(created_by=user, lecturer = user if user.role == 'lecturer' else None)

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Class.objects.all()
        elif self.request.user.role == 'lecturer':
            return Class.objects.filter(lecturer=self.request.user)
        return Class.objects.filter(classmembership__user=self.request.user , classmembership__role = 'student')

@api_view(['POST'])
@permission_classes([AllowAny])
def enroll_class(request):
    class_code = request.data.get('class_code')
    try:
        class_obj = Class.objects.get(is_open_enrollment=True)
        user = request.user if request.user.is_authenticated else None
        if not user or user.role != 'student':
            return Response({'detail': 'You must be a student to enroll'}, status=status.HTTP_400_BAD_REQUEST)
        
        if ClassMembership.objects.filter(user=user, class_id=class_obj).exists():
            return Response({'detail': 'You are already enrolled in this class'}, status=status.HTTP_400_BAD_REQUEST)
        
        if class_obj.class_code:  
            if not class_code or class_code != class_obj.class_code:
                return Response({'detail': 'Invalid class code'}, status=status.HTTP_400_BAD_REQUEST)
        
        ClassMembership.objects.create(user=user, class_id=class_obj, role='student')
        return Response({'detail': 'Enrolled successfully'}, status=status.HTTP_201_CREATED)
    except Class.DoesNotExist:
        return Response({'detail': 'No open enrollment class found or invalid code'}, status=status.HTTP_400_BAD_REQUEST)

class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):   
        obj = super().get_object()
        if self.request.user.role not in ['lecturer', 'admin'] and obj.lecturer != self.request.user:
            raise PermissionDenied("You do not have permission to access this class")
        return obj

# SessionView 
class SessionListCreateView(generics.ListCreateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers can create sessions")
        class_id = serializer.validated_data['class_id']
        if class_id.lecturer != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You do not have permission to create a session for this class")
        serializer.save()

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Session.objects.all()
        if self.request.user.role == 'lecturer':
            return Session.objects.filter(class_id__lecturer=self.request.user)
        return Session.objects.filter(class_id__classmembership__user=self.request.user, class_id__classmembership__role='student')

class SessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if self.request.user.role not in ['lecturer', 'admin'] and obj.class_id.lecturer != self.request.user:
            raise PermissionDenied("You do not have permission to access this session")
        return obj

# Invite user by admin and lecturer
class InviteUserView(generics.CreateAPIView):
    serializer_class = ClassMembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can invite users")
        class_id = serializer.validated_data['class_id']
        if class_id.lecturer != self.request.user:
            raise PermissionDenied("You can only invite to your own classes")
        serializer.save()
        print(f'invited {serializer.validated_data['user'].email} to {serializer.validated_data['class_id'].name} as {serializer.validated_data['role']}')

# Manage attendance 
class AttendanceView(generics.ListCreateAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role not in ['student', 'admin']:
            raise PermissionDenied("Only students and admin can create attendances")
        if Attendance.objects.filter(session=serializer.validated_data['session'], user=self.request.user).exists():
            raise ValidationError("You have already attended this session")
        serializer.save(user=self.request.user)

# Manage materials
class MaterialView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can upload materials")
        serializer.save(uploaded_by=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Material.objects.all()
        elif user.role == 'lecturer':
            return Material.objects.filter(class_id__lecturer=user)
        return Material.objects.filter(class_id__classmembership__user=user, class_id__classmembership__role='student')

# SystemAnnouncementView
class SystemAnnouncementView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Announcement.objects.filter(type="system")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'admin':
            raise PermissionDenied("Only admin can create system announcements")
        serializer.save(posted_by=user, type="system", class_id=None)


# ClassAnnouncementView
class ClassAnnouncementView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        class_id = self.kwargs['class_id']
        user = self.request.user

        if user.role == 'admin':
            return Announcement.objects.filter(class_id=class_id, type="class")
        elif user.role == 'lecturer':
            return Announcement.objects.filter(class_id__lecturer=user, class_id=class_id, type="class")
        return Announcement.objects.filter(class_id=class_id, class_id__classmembership__user=user, type="class")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers or admins can create class announcements")
        serializer.save(posted_by=user, type="class")

class AdminCreateUserView(generics.CreateAPIView):
    """Admin-only endpoint to create users with any role"""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Check if user is admin
        if request.user.role != 'admin':
            return Response({
                'error': 'Permission denied',
                'message': 'Only admins can create users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            logger.info(f"Admin create user request data: {request.data}")
            
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response({
                    'message': 'User created successfully',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': user.role
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Validation errors: {serializer.errors}")
                return Response({
                    'error': 'Validation failed',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"User creation error: {str(e)}")
            return Response({
                'error': 'User creation failed',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


