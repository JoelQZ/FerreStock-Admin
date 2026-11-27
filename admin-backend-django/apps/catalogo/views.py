import re
import unicodedata

from django.db.models import Q
from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from .models import Categoria, Marca, Producto, UnidadMedida
from .permissions import SoloAdministradorEscribe
from .serializers import (
    CategoriaSerializer,
    MarcaSerializer,
    ProductoSerializer,
    UnidadMedidaSerializer,
)


def prefijo_categoria(nombre):
    texto = unicodedata.normalize('NFKD', nombre).encode('ascii', 'ignore').decode('ascii')
    palabras = re.findall(r'[A-Za-z]+', texto.upper())
    if not palabras:
        return 'PROD'
    if len(palabras) == 1 or len(palabras[1]) < 2:
        return palabras[0][:4].ljust(4, 'X')
    return palabras[0][:2] + palabras[1][:2]


def siguiente_codigo(prefijo):
    patron = re.compile(rf'^{prefijo}-(\d+)$', re.IGNORECASE)
    numeros = [
        int(coincidencia.group(1))
        for codigo in Producto.objects.filter(codigo__istartswith=f'{prefijo}-').values_list('codigo', flat=True)
        if (coincidencia := patron.match(codigo))
    ]
    return f'{prefijo}-{max(numeros, default=0) + 1:04d}'


class EstadoActivoModelViewSet(viewsets.ModelViewSet):
    permission_classes = (SoloAdministradorEscribe,)

    def perform_destroy(self, instance):
        instance.estado = False
        instance.save(update_fields=('estado',))

    def filtrar_activos(self, queryset):
        if self.request.query_params.get('todos') != '1':
            queryset = queryset.filter(estado=True)
        return queryset


class CategoriaViewSet(EstadoActivoModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    filter_backends = (filters.SearchFilter,)
    search_fields = ('nombre', 'descripcion')

    def get_queryset(self):
        return self.filtrar_activos(super().get_queryset())


class MarcaViewSet(EstadoActivoModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    filter_backends = (filters.SearchFilter,)
    search_fields = ('nombre',)

    def get_queryset(self):
        return self.filtrar_activos(super().get_queryset())


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    queryset = UnidadMedida.objects.all()
    serializer_class = UnidadMedidaSerializer
    permission_classes = (SoloAdministradorEscribe,)
    http_method_names = ('get', 'post', 'put', 'patch', 'head', 'options')


class ProductoViewSet(EstadoActivoModelViewSet):
    queryset = Producto.objects.select_related('categoria', 'marca', 'unidad').all()
    serializer_class = ProductoSerializer
    filter_backends = (filters.SearchFilter,)
    search_fields = ('codigo', 'nombre', 'descripcion')

    def get_queryset(self):
        queryset = self.filtrar_activos(super().get_queryset())

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

    @action(detail=False, methods=['get'], url_path='siguiente-codigo')
    def siguiente_codigo(self, request):
        categoria_id = request.query_params.get('categoria')
        try:
            categoria_id = serializers.IntegerField(min_value=1).run_validation(categoria_id)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({'categoria': 'Debe ser un identificador válido.'}) from exc
        categoria = get_object_or_404(Categoria, pk=categoria_id)
        return Response({'codigo': siguiente_codigo(prefijo_categoria(categoria.nombre))})
