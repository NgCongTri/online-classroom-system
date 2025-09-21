from django.urls import path
from .views import RegisterView, CustomLoginView
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from django.views.generic import TemplateView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .views import ClassListCreateView, ClassDetailView, SessionListCreateView, SessionDetailView ,InviteUserView,  AttendanceView, enroll_class, CustomTokenRefreshView,LogoutView

# Simple API root view
@api_view(['GET'])
def api_root(request):
    return Response({
        'message': 'Welcome to the Online Classroom API',
        'endpoints': {
            'register': '/api/register/',
            'login': '/api/login/',
            'token': '/api/token/',
            'token_refresh': '/api/token/refresh/'
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('classes/', ClassListCreateView.as_view(), name='class-list-create'),
    path('classes/<int:pk>/', ClassDetailView.as_view(), name='class-detail'),
    path('sessions/', SessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('invite/', InviteUserView.as_view(), name='invite-user'),
    path('attendance/', AttendanceView.as_view(), name='attendance'),
    path('enroll/',enroll_class, name='enroll-class'),
]