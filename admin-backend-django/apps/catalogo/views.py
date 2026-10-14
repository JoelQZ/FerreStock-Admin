from django.db.models import Q
from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Categoria, Marca, Producto, UnidadMedida
from .serializers import (
    CategoriaSerializer,
    MarcaSerializer,
    ProductoSerializer,
    UnidadMedidaSerializer,
)


class EstadoActivoModelViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=('estado',))


class CategoriaViewSet(EstadoActivoModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class MarcaViewSet(EstadoActivoModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer


class UnidadMedidaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UnidadMedida.objects.all()
    serializer_class = UnidadMedidaSerializer
    permission_classes = (IsAuthenticated,)


class ProductoViewSet(EstadoActivoModelViewSet):
    queryset = Producto.objects.select_related('categoria', 'marca', 'unidad').all()
    serializer_class = ProductoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('todos') != '1':
            queryset = queryset.filter(estado=True)

        categoria = self.request.query_params.get('categoria')
        if categoria is not None:
            try:
                categoria_id = serializers.IntegerField(min_value=1).run_validation(categoria)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError(
                    {'categoria': 'Debe ser un identificador válido.'}
                ) from exc
            queryset = queryset.filter(categoria_id=categoria_id)

        buscar = self.request.query_params.get('buscar')
        if buscar:
            queryset = queryset.filter(Q(codigo__icontains=buscar) | Q(nombre__icontains=buscar))
        return queryset
