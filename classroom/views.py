from django.http import response
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .serializers import UserSerializer
from .models import User, Class, Session, ClassMembership, Attendance
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied, ValidationError
from .serializers import ClassSerializer, SessionSerializer, ClassMembershipSerializer, AttendanceSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenRefreshView


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [] 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)


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

class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response(status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        response.data['message'] = 'Logout successful'
        return response
        
#Token refresh
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data['access']
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                max_age=1800  
            )
            if 'refresh' in response.data:
                refresh_token = response.data['refresh']
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
            response.data['message'] = 'Token refreshed successfully'
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
        serializer.save(created_by=user, lecturer = user if user.role() == 'lecturer' else None)

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
        class_obj = Class.objects.get(class_code = class_code, is_open_enrollment = 'True')
        user = request.user if request.user.is_authenticated else None
        if user and user.role == 'student' and not ClassMembership.objects.filter(user=user, class_id=class_obj).exists():
            ClassMembership.objects.create(user=user, class_id=class_obj, role='student')
            return Response({'detail': 'Enrolled successfully'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'detail': 'You are already enrolled in this class or not a student'}, status=status.HTTP_400_BAD_REQUEST)
    except Class.DoesNotExist:
        return Response({'detail': 'Class not found'}, status=status.HTTP_400_BAD_REQUEST)

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
        if self.request.user.role != 'lecturer':
            raise PermissionDenied("Only lecturers can create sessions")
        class_id = serializer.validated_data['class_id']
        if class_id.lecturer != self.request.user:
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
        serializer.instance._request_user = self.request.user
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Material.objects.all()
        elif user.role == 'lecturer':
            return Material.objects.filter(class_id__lecturer=user)
        return Material.objects.filter(class_id__classmembership__user=user, class_id__classmembership__role='student')

# Manage announcements
class AnnouncementView(generics.ListCreateAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can create announcements")
        serializer.instance._request_user = user
        announcement = serializer.save(posted_by = user)
        send_announcement_email.delay(announcement.class_id.id, announcement.title)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Material.objects.all()
        elif user.role == 'lecturer':
            return Announcement.objects.filter(class_id__lecturer=user)
        return Announcement.objects.filter(class_id__classmembership__user=user, class_id__classmembership__role='student')
