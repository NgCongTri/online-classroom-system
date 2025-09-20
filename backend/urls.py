"""URL configuration for backend project."""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('classroom.urls')),
    # Redirect to the admin interface or another valid endpoint
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
]
