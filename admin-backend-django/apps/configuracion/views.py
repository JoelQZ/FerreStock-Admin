from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Negocio
from apps.usuarios.models import Rol
from .serializers import NegocioSerializer


def puede_administrar_negocio(user):
    return user.is_superuser or (
        user.rol_id is not None
        and user.rol.nombre in (Rol.Nombre.ADMINISTRADOR, Rol.Nombre.DUENO)
    )


class NegocioView(APIView):
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return Negocio.objects.order_by('pk').first()

    def get(self, request):
        negocio = self.get_object()
        if negocio is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(NegocioSerializer(negocio).data)

    def put(self, request):
        self.check_write_permission(request)
        return self._save(request, partial=False)

    def patch(self, request):
        self.check_write_permission(request)
        return self._save(request, partial=True)

    @staticmethod
    def check_write_permission(request):
        if not puede_administrar_negocio(request.user):
            raise PermissionDenied(
                'Se requiere el rol Administrador o Dueño para actualizar el negocio.'
            )

    def _save(self, request, *, partial):
        negocio = self.get_object()
        if partial and negocio is None:
            raise NotFound('Los datos del negocio aún no están configurados.')
        created = negocio is None
        serializer = NegocioSerializer(negocio, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        negocio = serializer.save()
        return Response(
            NegocioSerializer(negocio).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
