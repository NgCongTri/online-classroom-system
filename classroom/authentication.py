from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Lấy token từ cookie
        cookie_token = request.COOKIES.get('access_token')
        if cookie_token:
            try:
                validated_token = self.get_validated_token(cookie_token)
                return self.get_user(validated_token), validated_token
            except Exception as e:
                raise AuthenticationFailed('Invalid token in cookie')
        return super().authenticate(request)