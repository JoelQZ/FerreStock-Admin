from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.usuarios.models import Rol


class SoloAdministradorEscribe(BasePermission):
    message = 'Se requiere el rol Administrador para modificar el catálogo.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.is_superuser or (
            user.rol_id is not None and user.rol.nombre == Rol.Nombre.ADMINISTRADOR
        )
