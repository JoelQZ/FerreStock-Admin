from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Rol
from .permissions import PuedeGestionarUsuarios
from .serializers import (
    RolSerializer,
    UsuarioActualSerializer,
    UsuarioSerializer,
    UsuarioTokenObtainPairSerializer,
)

Usuario = get_user_model()


class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = UsuarioTokenObtainPairSerializer


class UsuarioTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        token = RefreshToken(attrs['refresh'])
        user_id = token.get(api_settings.USER_ID_CLAIM)
        try:
            user = Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist as exc:
            raise InvalidToken('El usuario asociado al token ya no existe.') from exc

        if not user.is_active:
            raise AuthenticationFailed('La cuenta está desactivada.')
        return data


class RefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = UsuarioTokenRefreshSerializer


class YoView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UsuarioActualSerializer(request.user)
        return Response(serializer.data)


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all().order_by('nombre')
    serializer_class = RolSerializer
    permission_classes = (PuedeGestionarUsuarios,)

    def destroy(self, request, *args, **kwargs):
        rol = self.get_object()
        if rol.usuarios.exists():
            return Response(
                {'detail': 'No se puede eliminar un rol que tiene usuarios asignados.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('rol').order_by('usuario')
    serializer_class = UsuarioSerializer
    permission_classes = (PuedeGestionarUsuarios,)

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=('estado',))
