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

# kiem tra vai tro user trong DB chu khong goi truc tiep tu user
class CustomLoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)  # xác thực SimpleJWT
            if response.status_code == status.HTTP_200_OK:
                email = request.data.get('email')
                user = User.objects.get(email=email)  # Lấy user từ DB
                response.data['user'] = {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role
                }
            return response
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)  
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ClassView
class ClassListCreateView(generics.ListCreateAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role not in ['lecturer', 'admin']:
            raise PermissionDenied("Only lecturers and admin can create classes")
        serializer.save(lecturer=self.request.user)

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

