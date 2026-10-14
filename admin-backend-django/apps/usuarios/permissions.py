from rest_framework.permissions import BasePermission

from .models import Rol


class PuedeGestionarUsuarios(BasePermission):
    message = 'Se requiere el rol Administrador para gestionar usuarios y roles.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or (
                    user.rol_id is not None
                    and user.rol.nombre == Rol.Nombre.ADMINISTRADOR
                )
            )
        )
