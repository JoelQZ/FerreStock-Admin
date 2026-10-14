from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Ingreso, MovimientoInventario, Proveedor
from .serializers import (
    IngresoSerializer,
    MovimientoInventarioSerializer,
    ProveedorSerializer,
)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = (IsAuthenticated,)

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=('estado',))


class IngresoListCreateView(generics.ListCreateAPIView):
    queryset = Ingreso.objects.select_related('proveedor', 'usuario').prefetch_related(
        'detalles__producto'
    )
    serializer_class = IngresoSerializer
    permission_classes = (IsAuthenticated,)


class KardexListView(generics.ListAPIView):
    queryset = MovimientoInventario.objects.select_related(
        'producto',
        'usuario',
        'venta',
        'ingreso',
    )
    serializer_class = MovimientoInventarioSerializer
    permission_classes = (IsAuthenticated,)
