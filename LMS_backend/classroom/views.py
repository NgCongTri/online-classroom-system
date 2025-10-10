from django.http import response
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .serializers import (
    UserSerializer, RegistrationSerializer, AdminUserSerializer, 
    LoginHistorySerializer, ClassSerializer, SessionSerializer,
    ClassMembershipSerializer, AttendanceSerializer, MaterialSerializer,
    AnnouncementSerializer
)
from .models import User, Class, Session, ClassMembership, Attendance, Material, Announcement, LoginHistory
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, ValidationError
from .task import send_announcement_email
from django.utils import timezone
import logging
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from .authentication import CookieJWTAuthentication
import json
from rest_framework.views import APIView
logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer 
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


class CustomLoginView(TokenObtainPairView):

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                email = request.data.get('email')
                try:
                    user = User.objects.get(email=email)
                    
                    # Get tokens
                    access_token = response.data.get('access')
                    refresh_token = response.data.get('refresh')
                    
                    if not access_token or not refresh_token:
                        return Response({
                            'error': 'Token generation failed',
                            'message': 'Failed to generate authentication tokens'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                    previous_sessions = LoginHistory.objects.filter(
                        user=user,
                        logout_time__isnull=True 
                    )
                    
                    if previous_sessions.exists():
                        count = previous_sessions.update(logout_time=timezone.now())
                        logger.info(f"🔄 Marked {count} previous session(s) as inactive for user {user.username}")
                    
                    ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
                    login_history = LoginHistory.objects.create(
                        user=user,
                        ip_address=ip_address,
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        access_token=access_token,  
                        refresh_token=refresh_token  
                    )
                    
                    session_id = str(login_history.session_id)
                    
                    logger.info(f"User {user.username} ({user.role}) logged in. Session: {session_id}")
                    
                    response.data = {
                        'access': access_token,
                        'session_id': session_id,
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'role': user.role,
                        },
                        'expires_in': 45 * 60
                    }
                    
                    
                    response.set_cookie(
                        key=f'refresh_token_{session_id}',
                        value=refresh_token,
                        httponly=True,   
                        secure=False,   
                        samesite='Lax', 
                        max_age=60 * 60 * 24                      
                    )
                    
                    logger.info(f"✅ Set cookie: refresh_token_{session_id}")
                    
                except User.DoesNotExist:
                    return Response({
                        'error': 'User not found',
                        'message': 'Invalid credentials'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                    
            return response
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                'error': 'Login failed',
                'message': 'An error occurred during login',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    print(f"get_user called - User: {user.username}, Role: {user.role}")  
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    })

class LogoutView(APIView):
    permission_classes = []
    
    def post(self, request):
        try:
            session_id = None
            try:
                session_id = request.data.get('session_id')
            except Exception:
                pass
            
            # If not found, try parsing request.body (beacon request or raw body)
            if not session_id and request.body:
                try:
                    body_data = json.loads(request.body.decode('utf-8'))
                    session_id = body_data.get('session_id')
                except Exception:
                    pass
            
            if not session_id:
                return Response(
                    {'error': 'Session ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )            
            
            login_history = LoginHistory.objects.filter(
                session_id=session_id,
                logout_time__isnull=True
            ).first()
            
            if not login_history:
                return Response(
                    {'error': 'Active session not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Mark as inactive by setting logout_time
            login_history.logout_time = timezone.now()
            login_history.save()

            response = Response(
                {'message': 'Logout successful'},
                status=status.HTTP_200_OK
            )
            response.delete_cookie(f'refresh_token_{session_id}')
            
            return response
            
        except Exception as e:
            # Log the error for debugging
            import traceback
            print(f"❌ LogoutView Error: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Token refresh
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Get session_id from header
        session_id = request.headers.get('X-Session-ID')
        
        if not session_id:
            logger.error('❌ No session ID in refresh request')
            return Response(
                {"detail": "Session ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get refresh token from cookie (unique per session)
        cookie_name = f"refresh_token_{session_id}"
        refresh_token = request.COOKIES.get(cookie_name)
        
        if not refresh_token:
            logger.error(f'❌ No refresh token found in cookie: {cookie_name}')
            return Response(
                {"detail": "No refresh token found"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        logger.info(f'🔄 Refreshing token for session: {session_id}')
        
        # Set refresh token in request data for parent class
        request.data['refresh'] = refresh_token
        
        # Call parent class to generate new access token
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200 and "access" in response.data:
            access_token = response.data["access"]
            
            # Update access token in LoginHistory
            try:
                login_history = LoginHistory.objects.get(
                    session_id=session_id,
                    logout_time__isnull=True
                )
                login_history.access_token = access_token
                login_history.save(update_fields=['access_token'])
                logger.info(f'✅ Access token refreshed for session: {session_id}')
            except LoginHistory.DoesNotExist:
                logger.warning(f'⚠️ Session {session_id} not found in LoginHistory')
            
            # Return new access token (frontend will save to sessionStorage)
            # No need to set cookie - frontend handles storage
        
        return response

class LoginHistoryView(generics.ListAPIView):
    serializer_class = LoginHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return LoginHistory.objects.select_related('user').order_by('-login_time')[:100]
        return LoginHistory.objects.filter(user=self.request.user).select_related('user').order_by('-login_time')[:10]

# ClassView
class ClassListCreateView(generics.ListCreateAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        logger.info(f"Received class creation data: {request.data}")
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can create classes")
        logger.info(f"💾 Saving class with validated data: {serializer.validated_data}")
        serializer.save(created_by=user, lecturer=user if user.role == 'lecturer' else None)

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Class.objects.all()
        elif self.request.user.role == 'lecturer':
            return Class.objects.filter(lecturer=self.request.user)
        return Class.objects.filter(classmembership__user=self.request.user, classmembership__role='student')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_class(request):
    class_code = request.data.get('class_code')
    try:
        class_obj = Class.objects.get(class_code=class_code, is_open_enrollment=True)
        user = request.user
        
        if user.role != 'student':
            return Response({'detail': 'You must be a student to enroll'}, status=status.HTTP_400_BAD_REQUEST)
        
        if ClassMembership.objects.filter(user=user, class_id=class_obj).exists():
            return Response({'detail': 'You are already enrolled in this class'}, status=status.HTTP_400_BAD_REQUEST)
        
        ClassMembership.objects.create(user=user, class_id=class_obj, role='student')
        return Response({'detail': 'Enrolled successfully'}, status=status.HTTP_201_CREATED)
        
    except Class.DoesNotExist:
        return Response({'detail': 'Invalid class code or class not available for enrollment'}, status=status.HTTP_400_BAD_REQUEST)

class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):   
        obj = super().get_object()
        user = self.request.user
        
        # Allow access if user is admin, lecturer of the class, or enrolled student
        if user.role == 'admin' or obj.lecturer == user:
            return obj
        
        # Check if student is enrolled in the class
        if user.role == 'student' and ClassMembership.objects.filter(user=user, class_id=obj).exists():
            return obj
            
        raise PermissionDenied("You do not have permission to access this class")
    
    def perform_update(self, serializer):
        # Only lecturer and admin can update
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admins can update classes")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only lecturer and admin can delete
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admins can delete classes")
        instance.delete()

# SessionView 
class SessionListCreateView(generics.ListCreateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can create sessions")
        
        class_id = serializer.validated_data['class_id']
        
        # Admin can create sessions for any class
        if user.role == 'admin':
            serializer.save()
            return
        
        # Lecturer can only create sessions for their own classes
        if class_id.lecturer != user:
            raise PermissionDenied("You do not have permission to create a session for this class")
        
        serializer.save()

    def get_queryset(self):
        class_id = self.request.query_params.get('class_id')
        user = self.request.user
        
        if user.role == 'admin':
            queryset = Session.objects.all()
        elif user.role == 'lecturer':
            queryset = Session.objects.filter(class_id__lecturer=user)
        else:
            # Student can see sessions of classes they're enrolled in
            queryset = Session.objects.filter(class_id__memberships__user=user)
        
        # Filter by class_id if provided
        if class_id:
            queryset = queryset.filter(class_id=class_id)
        
        return queryset.select_related('class_id').order_by('date')

class SessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Admin always has access
        if user.role == 'admin':
            return obj
        
        # Lecturer has access to their own class sessions
        if user.role == 'lecturer' and obj.class_id.lecturer == user:
            return obj
        
        # Student has access if enrolled in the class
        if user.role == 'student' and ClassMembership.objects.filter(user=user, class_id=obj.class_id).exists():
            return obj
            
        raise PermissionDenied("You do not have permission to access this session")

# Invite user by admin and lecturer
class InviteUserView(generics.CreateAPIView):
    serializer_class = ClassMembershipSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can invite users")
        
        class_id = serializer.validated_data['class_id']
        
        # Admin can invite to any class
        if user.role == 'admin':
            serializer.save()
            return
        
        # Lecturer can only invite to their own classes
        if class_id.lecturer != user:
            raise PermissionDenied("You can only invite to your own classes")
        
        serializer.save()
        serializer.save()
        print(f'invited {serializer.validated_data["user"].email} to {serializer.validated_data["class_id"].name} as {serializer.validated_data["role"]}')

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

class ClassMembershipView(generics.ListCreateAPIView):
    serializer_class = ClassMembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        class_id = self.request.query_params.get('class_id') or self.kwargs.get('class_id')
        user = self.request.user

        if class_id is None:
            return ClassMembership.objects.filter(user=user).select_related('user', 'class_id')

        if user.role == 'admin':
            return ClassMembership.objects.filter(class_id=class_id).select_related('user', 'class_id')
        elif user.role == 'lecturer':
            return ClassMembership.objects.filter(class_id__lecturer=user, class_id=class_id).select_related('user', 'class_id')
        else:
            # Student can view members if they are enrolled in the class
            if ClassMembership.objects.filter(class_id=class_id, user=user).exists():
                return ClassMembership.objects.filter(class_id=class_id).select_related('user', 'class_id')
            return ClassMembership.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can add members")

        class_id = serializer.validated_data['class_id']
        if class_id.lecturer != user and user.role != 'admin':
            raise PermissionDenied("You can only add members to your own classes")
        serializer.save()

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
        class_id = self.kwargs['class_id'] or self.request.query_params.get('class_id')
        user = self.request.user

        if not class_id:
            return Announcement.objects.none()

        if user.role == 'admin':
            return Announcement.objects.filter(class_id=class_id, type="class")
        elif user.role == 'lecturer':
            return Announcement.objects.filter(class_id__lecturer=user, class_id=class_id, type="class").select_related('posted_by', 'class_id')
        else:
            # Student can view announcements if they are enrolled in the class
            if ClassMembership.objects.filter(class_id=class_id, user=user).exists():
                return Announcement.objects.filter(class_id=class_id, type="class").select_related('posted_by', 'class_id')
            return Announcement.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers or admins can create class announcements")

        class_id = self.request.data.get('class_id') or self.kwargs.get('class_id')
        if not class_id:
            raise ValidationError("class_id is required")
        serializer.save(posted_by=user, type="class", class_id_id=class_id)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_classes(request):
    """Get all available classes for students to join"""
    user = request.user
    
    if user.role != 'student':
        return Response({'detail': 'Only students can view available classes'}, status=status.HTTP_403_FORBIDDEN)
    
    # Get all classes
    all_classes = Class.objects.all()
    
    # Get classes student is already enrolled in
    enrolled_class_ids = ClassMembership.objects.filter(
        user=user
    ).values_list('class_id', flat=True)
    
    # Filter out enrolled classes
    available_classes = all_classes.exclude(id__in=enrolled_class_ids)
    
    serializer = ClassSerializer(available_classes, many=True)
    return Response(serializer.data)

# Join open class without code
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_open_class(request, class_id):
    user = request.user
    
    if user.role != 'student':
        return Response({'detail': 'Only students can join classes'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        class_obj = Class.objects.get(id=class_id)

        if not class_obj.is_open_enrollment:
            return Response({'detail': 'This class requires a code to join'}, status=status.HTTP_400_BAD_REQUEST)
        
        if ClassMembership.objects.filter(user=user, class_id=class_obj).exists():
            return Response({'detail': 'You are already enrolled in this class'}, status=status.HTTP_400_BAD_REQUEST)
        
        ClassMembership.objects.create(user=user, class_id=class_obj, role='student')
        
        return Response({'detail': 'Successfully enrolled in class'}, status=status.HTTP_201_CREATED)
        
    except Class.DoesNotExist:
        return Response({'detail': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

# Join class with code
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_class_with_code(request):    
    user = request.user
    class_code = request.data.get('class_code')
    
    if user.role != 'student':
        return Response({'detail': 'Only students can join classes'}, status=status.HTTP_403_FORBIDDEN)
    
    if not class_code:
        return Response({'detail': 'Class code is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        class_obj = Class.objects.get(class_code=class_code)

        if ClassMembership.objects.filter(user=user, class_id=class_obj).exists():
            return Response({'detail': 'You are already enrolled in this class'}, status=status.HTTP_400_BAD_REQUEST)

        ClassMembership.objects.create(user=user, class_id=class_obj, role='student')
        
        return Response({'detail': 'Successfully joined class'}, status=status.HTTP_201_CREATED)
        
    except Class.DoesNotExist:
        return Response({'detail': 'Invalid class code'}, status=status.HTTP_404_NOT_FOUND)




