from rest_framework.permissions import BasePermission

from apps.usuarios.models import Rol


class PuedeConsultarReportes(BasePermission):
    message = 'Se requiere el rol Administrador para consultar reportes.'

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
