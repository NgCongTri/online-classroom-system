from django.urls import path, include
from .views import ( RegisterView, CustomLoginView, UserListCreateView, UserDetailView,
    get_user, LogoutView, CustomTokenRefreshView, ClassListCreateView,
    ClassDetailView, SessionListCreateView, SessionDetailView, InviteUserView,
    AttendanceView, MaterialView, SystemAnnouncementView, ClassAnnouncementView,
    enroll_class, AdminCreateUserView, LoginHistoryView, ClassMembershipView,
    get_available_classes, join_open_class, join_class_with_code,ClassAnnouncementDetailView,
    mark_attendance_with_face, toggle_attendance, delete_attendance,
    UnreadNotificationCountView, MarkAllNotificationAsReadView, MarkNotificationAsReadView,
    NotificationListView, TagViewSet, CategoryViewSet,ClassListView
)
from rest_framework.decorators import api_view
from rest_framework.routers import DefaultRouter



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

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')

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
    path('classes/explore/', ClassListView.as_view(), name='explore-classes'),
    path('classes/<int:class_id>/join/', join_open_class, name='join-open-class'),
    path('classes/join-with-code/', join_class_with_code, name='join-with-code'),

    
    # Session management
    path('sessions/', SessionListCreateView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:session_id>/toggle-attendance/', toggle_attendance, name='toggle-attendance'),
    
    # Membership
    path('invite/', InviteUserView.as_view(), name='invite-user'),
    path('class-memberships/', ClassMembershipView.as_view(), name='class-membership'),
    
    # Attendance
    path('attendances/', AttendanceView.as_view(), name='attendance-list'),
    path('attendances/mark-with-face/', mark_attendance_with_face, name='mark-attendance-face'),
    path('attendances/<int:pk>/', delete_attendance, name='delete-attendance'), 
    
    # Materials
    path('materials/', MaterialView.as_view(), name='material-list'),
    
    # Announcements
    path('announcements/system/', SystemAnnouncementView.as_view(), name='system-announcements'),
    path('announcements/class/<int:class_id>/', ClassAnnouncementView.as_view(), name='class-announcements'),
    path('announcements/class/<int:class_id>/<int:pk>/', ClassAnnouncementDetailView.as_view(), name='class-announcement-detail'),

    # Notifications (for students)
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread-count/', UnreadNotificationCountView.as_view(), name='unread-notification-count'),
    path('notifications/mark-all-read/', MarkAllNotificationAsReadView.as_view(), name='mark-all-notifications-read'),
    path('notifications/<int:pk>/mark-read/', MarkNotificationAsReadView.as_view(), name='mark-notification-read'),

]