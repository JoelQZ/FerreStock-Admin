from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoginView, RefreshView, RolViewSet, UsuarioViewSet, YoView

router = DefaultRouter()
router.register('roles', RolViewSet, basename='rol')
router.register('usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('auth/yo/', YoView.as_view(), name='auth-yo'),
    path('', include(router.urls)),
]
