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
    """
    Hybrid Login (Like Google/Facebook):
    - Access Token → Response JSON (Frontend stores in localStorage)
    - Refresh Token → httpOnly Cookie (Secure, not accessible by JavaScript)
    - Session ID → Response JSON (Frontend stores in localStorage)
    """
    
    def post(self, request, *args, **kwargs):
        try:
            # ✅ Get JWT tokens from parent class
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
                    
                    # ✅ Create new session
                    ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
                    login_history = LoginHistory.objects.create(
                        user=user,
                        ip_address=ip_address,
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        access_token=access_token,   # Store for tracking
                        refresh_token=refresh_token  # Store for validation
                    )
                    
                    session_id = str(login_history.session_id)
                    
                    logger.info(f"User {user.username} ({user.role}) logged in. Session: {session_id}")
                    
                    # ✅ Response với access_token và session_id (Frontend lưu localStorage)
                    response.data = {
                        'access': access_token,
                        'session_id': session_id,
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'role': user.role,
                        },
                        'expires_in': 45 * 60  # 45 minutes in seconds
                    }
                    
                    # ✅ V2: Set refresh_token với session_id prefix (UNIQUE per session)
                    # Mỗi session có cookie riêng → Không conflict giữa các user
                    response.set_cookie(
                        key=f'refresh_token_{session_id}',  # ✅ UNIQUE KEY
                        value=refresh_token,
                        httponly=True,   # JavaScript KHÔNG thể đọc (bảo mật cao)
                        secure=False,    # Set True in production (HTTPS only)
                        samesite='Lax',  # CSRF protection
                        max_age=60 * 60 * 24  # 1 day
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

# ✅ V2: Token Refresh View
class CustomTokenRefreshView(generics.GenericAPIView):
    """
    V2: Refresh Access Token using:
    - Refresh Token from httpOnly cookie: refresh_token_{session_id}
    - Session ID from request header/body
    
    Advantages:
    - Mỗi session có cookie riêng (không conflict)
    - Vẫn dùng httpOnly (bảo mật cao)
    - Browser tự động gửi cookie
    """
    permission_classes = []  # No authentication required for refresh
    
    def post(self, request):
        try:
            # ✅ Get session_id from header or body
            session_id = request.headers.get('X-Session-ID') or request.data.get('session_id')
            
            if not session_id:
                return Response({
                    'error': 'No session ID',
                    'message': 'Session ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ V2: Get refresh_token from cookie with session_id prefix
            cookie_key = f'refresh_token_{session_id}'
            refresh_token = request.COOKIES.get(cookie_key)
            
            # 🔍 DEBUG: Log all cookies
            logger.info(f"🔍 Looking for cookie: {cookie_key}")
            logger.info(f"🔍 Available cookies: {list(request.COOKIES.keys())}")
            logger.info(f"🔍 Found refresh_token: {'Yes' if refresh_token else 'No'}")
            
            if not refresh_token:
                logger.warning(f"❌ No cookie found: {cookie_key}")
                logger.warning(f"Available cookies: {list(request.COOKIES.keys())}")
                return Response({
                    'error': 'No refresh token',
                    'message': 'Refresh token not found. Please login again.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # ✅ Validate session is still active
            try:
                login_history = LoginHistory.objects.select_related('user').get(
                    session_id=session_id,
                    logout_time__isnull=True
                )
            except LoginHistory.DoesNotExist:
                return Response({
                    'error': 'Invalid session',
                    'message': 'Session not found or has been logged out'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # ✅ Validate refresh_token matches session
            if login_history.refresh_token != refresh_token:
                return Response({
                    'error': 'Token mismatch',
                    'message': 'Refresh token does not match session'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # ✅ Generate new access token
            from rest_framework_simplejwt.tokens import RefreshToken
            
            try:
                refresh = RefreshToken(refresh_token)
                new_access_token = str(refresh.access_token)
                
                # ✅ Update access_token in database
                login_history.access_token = new_access_token
                login_history.save(update_fields=['access_token'])
                
                logger.info(f"Token refreshed for session {session_id}, user: {login_history.user.username}")
                
                # ✅ Return new access_token
                return Response({
                    'access': new_access_token,
                    'expires_in': 45 * 60  # 45 minutes
                }, status=status.HTTP_200_OK)
                
            except Exception as token_error:
                logger.error(f"Token refresh error: {str(token_error)}")
                return Response({
                    'error': 'Invalid token',
                    'message': 'Refresh token is invalid or expired. Please login again.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return Response({
                'error': 'Refresh failed',
                'message': str(e)
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

class LogoutView(generics.GenericAPIView):
    """
    Logout specific session:
    - Blacklist refresh token
    - Mark session as logged out
    - Clear refresh_token cookie
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # ✅ Get session_id from header or body
            session_id = request.headers.get('X-Session-ID') or request.data.get('session_id')
            
            if session_id:
                # ✅ Find and logout session
                login_history = LoginHistory.objects.filter(
                    session_id=session_id,
                    user=request.user,
                    logout_time__isnull=True
                ).first()
                
                if login_history:
                    # ✅ Blacklist refresh token
                    try:
                        from rest_framework_simplejwt.tokens import RefreshToken
                        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
                        
                        if login_history.refresh_token:
                            refresh = RefreshToken(login_history.refresh_token)
                            refresh.blacklist()
                            logger.info(f"Refresh token blacklisted for session {session_id}")
                    except Exception as blacklist_error:
                        logger.warning(f"Failed to blacklist token: {str(blacklist_error)}")
                    
                    # ✅ Mark session as logged out
                    login_history.logout_time = timezone.now()
                    login_history.access_token = None   # Clear tokens
                    login_history.refresh_token = None
                    login_history.save()
                    
                    logger.info(f"Session {session_id} logged out for user {request.user.username}")
            
            # ✅ V2: Clear refresh_token_{session_id} cookie
            response = Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
            
            if session_id:
                response.delete_cookie(f'refresh_token_{session_id}')
                logger.info(f"✅ Deleted cookie: refresh_token_{session_id}")
            
            return response
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({
                'error': 'Logout failed',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Token refresh
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

    def perform_create(self, serializer):
        user = self.request.user
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can create classes")
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

    def perform_create(self, serializer):
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can invite users")
        class_id = serializer.validated_data['class_id']
        if class_id.lecturer != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You can only invite to your own classes")
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




