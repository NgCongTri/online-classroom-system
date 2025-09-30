from django.urls import path
from .views import ( RegisterView, CustomLoginView, UserListCreateView, UserDetailView,
    get_user, LogoutView, CustomTokenRefreshView, ClassListCreateView,
    ClassDetailView, SessionListCreateView, SessionDetailView, InviteUserView,
    AttendanceView, MaterialView, SystemAnnouncementView, ClassAnnouncementView,
    enroll_class, AdminCreateUserView
)
from rest_framework.decorators import api_view

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
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('user/', get_user, name='get_user'),
    
    # User management
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('admin/users/create/', AdminCreateUserView.as_view(), name='admin-create-user'), 
    
    # Class management
    path('classes/', ClassListCreateView.as_view(), name='class-list'),
    path('classes/<int:pk>/', ClassDetailView.as_view(), name='class-detail'),
    path('enroll/', enroll_class, name='enroll_class'),
    
    # Session management
    path('sessions/', SessionListCreateView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    
    # Membership
    path('invite/', InviteUserView.as_view(), name='invite-user'),
    
    # Attendance
    path('attendances/', AttendanceView.as_view(), name='attendance-list'),
    
    # Materials
    path('materials/', MaterialView.as_view(), name='material-list'),
    
    # Announcements
    path('announcements/system/', SystemAnnouncementView.as_view(), name='system-announcement-list'),
    path('announcements/class/<int:class_id>/', ClassAnnouncementView.as_view(), name='class-announcement-list'),
]