from rest_framework import generics, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from apps.catalogo.permissions import SoloAdministradorEscribe

from .models import Ingreso, MovimientoInventario, Proveedor
from .serializers import (
    IngresoSerializer,
    MovimientoInventarioSerializer,
    ProveedorSerializer,
)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = (SoloAdministradorEscribe,)

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=('estado',))


class IngresoListCreateView(generics.ListCreateAPIView):
    queryset = Ingreso.objects.select_related('proveedor', 'usuario').prefetch_related(
        'detalles__producto'
    )
    serializer_class = IngresoSerializer
    permission_classes = (SoloAdministradorEscribe,)


class KardexListView(generics.ListAPIView):
    queryset = MovimientoInventario.objects.select_related(
        'producto',
        'usuario',
        'venta',
        'ingreso',
    )
    serializer_class = MovimientoInventarioSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = super().get_queryset()
        producto = self.request.query_params.get('producto')
        if producto:
            if not producto.isdigit():
                raise ValidationError({'producto': 'Debe ser un identificador válido.'})
            queryset = queryset.filter(producto_id=int(producto))
        return queryset
