from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from .models import LoginHistory
import logging

logger = logging.getLogger(__name__)

class CookieJWTAuthentication(BaseAuthentication):
    """
    Hybrid JWT Authentication:
    - Access Token from Authorization header (Bearer token)
    - Session ID from X-Session-ID header
    - Validates both token and session
    """
    
    def authenticate(self, request):
        # Skip authentication for face recognition endpoint
        if request.path == '/api/attendances/mark-with-face/':
            return None
        
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        try:
            access_token = auth_header.split(' ')[1]
        except IndexError:
            return None
        
        # ✅ Get session_id from header
        session_id = request.headers.get('X-Session-ID')
        
        if not session_id:
            raise AuthenticationFailed('Session ID is required')
        
        try:
            # ✅ Validate JWT token
            token = AccessToken(access_token)
            user_id = token.get('user_id')
            
            # ✅ Get session from database
            try:
                login_history = LoginHistory.objects.select_related('user').get(
                    session_id=session_id,
                    logout_time__isnull=True
                )
            except LoginHistory.DoesNotExist:
                raise AuthenticationFailed('Invalid or expired session')
            
            # ✅ Verify user_id matches session
            if str(login_history.user.id) != str(user_id):
                raise AuthenticationFailed('Session user mismatch')
            
            if login_history.access_token and login_history.access_token != access_token:
                logger.warning(f"Access token mismatch for session {session_id}")                
                login_history.access_token = access_token
                login_history.save(update_fields=['access_token'])
            
            return (login_history.user, token)
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise AuthenticationFailed(f'Authentication failed: {str(e)}')
    
    def authenticate_header(self, request):
        return 'Bearer'