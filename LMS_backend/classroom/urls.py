from django.urls import path
from .views import ( RegisterView, CustomLoginView, UserListCreateView, UserDetailView,
    get_user, LogoutView, CustomTokenRefreshView, ClassListCreateView,
    ClassDetailView, SessionListCreateView, SessionDetailView, InviteUserView,
    AttendanceView, MaterialView, SystemAnnouncementView, ClassAnnouncementView,
    enroll_class, AdminCreateUserView, LoginHistoryView, ClassMembershipView,
    get_available_classes, join_open_class, join_class_with_code
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
    path('login-history/', LoginHistoryView.as_view(), name='login-history'),

    # Class management
    path('classes/', ClassListCreateView.as_view(), name='class-list'),
    path('classes/<int:pk>/', ClassDetailView.as_view(), name='class-detail'),
    path('enroll/', enroll_class, name='enroll_class'),
    path('classes/available/', get_available_classes, name='available-classes'),
    path('classes/<int:class_id>/join/', join_open_class, name='join-open-class'),
    path('classes/join-with-code/', join_class_with_code, name='join-with-code'),
    
    # Session management
    path('sessions/', SessionListCreateView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    
    # Membership
    path('invite/', InviteUserView.as_view(), name='invite-user'),
    path('class-memberships/', ClassMembershipView.as_view(), name='class-membership'),
    
    # Attendance
    path('attendances/', AttendanceView.as_view(), name='attendance-list'),
    
    # Materials
    path('materials/', MaterialView.as_view(), name='material-list'),
    
    # Announcements
    path('announcements/system/', SystemAnnouncementView.as_view(), name='system-announcement-list'),
    path('announcements/class/<int:class_id>/', ClassAnnouncementView.as_view(), name='class-announcement-list'),
]