from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer
from .models import User, Class, Session
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .serializers import ClassSerializer, SessionSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = []  # Không yêu cầu auth

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
        return Response({
            'access': response.data['access'],
            'refresh': response.data['refresh'],
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'role': request.user.role
            }
        })

# ClassView
class ClassListCreateView(generics.ListCreateAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != 'lecturer':
            raise PermissionDenied("Only lecturers can create classes")
        serializer.save(lecturer=self.request.user)

    def get_queryset(self):
        if self.request.user.role == 'lecturer':
            return Class.objects.filter(lecturer=self.request.user)
        return Class.objects.filter(classmembership__user=self.request.user , classmembership__role = 'student')

class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if self.request.user.role == 'lecturer' and obj.lecturer != self.request.user:
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
        if self.request.user.role == 'lecturer':
            return Session.objects.filter(class_id__lecturer=self.request.user)
        return Session.objects.filter(class_id__classmembership__user=self.request.user, class_id__classmembership__role='student')

class SessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if self.request.user.role == 'lecturer' and obj.class_id.lecturer != self.request.user:
            raise PermissionDenied("You do not have permission to access this session")
        return obj