from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, mixins, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalogo.models import Producto
from apps.inventario.models import MovimientoInventario
from apps.usuarios.models import Rol

from .models import Cliente, MetodoPago, TipoComprobante, Venta
from .serializers import (
    AnularVentaSerializer,
    ClienteSerializer,
    MetodoPagoSerializer,
    TipoComprobanteSerializer,
    VentaCreateSerializer,
    VentaSerializer,
)

def usuario_puede_ver_todas_las_ventas(user):
    return user.is_superuser or (
        user.rol_id is not None
        and user.rol.nombre in (Rol.Nombre.ADMINISTRADOR, Rol.Nombre.DUENO)
    )


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = (IsAuthenticated,)


class TipoComprobanteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = TipoComprobante.objects.all()
    serializer_class = TipoComprobanteSerializer
    permission_classes = (IsAuthenticated,)


class MetodoPagoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MetodoPago.objects.filter(estado=True)
    serializer_class = MetodoPagoSerializer
    permission_classes = (IsAuthenticated,)


class VentaListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = Venta.objects.select_related(
            'usuario',
            'turno',
            'cliente',
            'tipo_comprobante',
            'usuario_anula',
        ).prefetch_related('detalles__producto', 'pagos__metodo')
        if usuario_puede_ver_todas_las_ventas(self.request.user):
            return queryset
        return queryset.filter(usuario=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VentaCreateSerializer
        return VentaSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        venta = serializer.save()
        return Response(
            VentaSerializer(venta, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class AnularVentaView(generics.GenericAPIView):
    serializer_class = AnularVentaSerializer
    permission_classes = (IsAuthenticated,)

    @transaction.atomic
    def post(self, request, pk):
        venta = get_object_or_404(
            Venta.objects.select_for_update().select_related('usuario', 'turno'),
            pk=pk,
        )
        if not usuario_puede_ver_todas_las_ventas(request.user) and venta.usuario_id != request.user.pk:
            raise PermissionDenied('No tienes permiso para anular esta venta.')
        if venta.estado != Venta.Estado.COMPLETADA:
            raise ValidationError({'venta': 'Solo se pueden anular ventas completadas.'})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        motivo = serializer.validated_data['motivo']
        detalles = list(venta.detalles.select_related('producto').order_by('producto_id', 'pk'))
        producto_ids = sorted({detalle.producto_id for detalle in detalles})
        productos = {
            producto.pk: producto
            for producto in Producto.objects.select_for_update()
            .filter(pk__in=producto_ids)
            .order_by('pk')
        }
        if len(productos) != len(producto_ids):
            raise ValidationError({'venta': 'No fue posible recuperar el stock de todos los productos.'})

        fecha_anulacion = timezone.now()
        for detalle in detalles:
            producto = productos[detalle.producto_id]
            stock_anterior = producto.stock
            stock_nuevo = stock_anterior + detalle.cantidad
            if stock_nuevo > Decimal('9999999.999'):
                raise ValidationError(
                    {'venta': f'La devolución excede el stock máximo de {producto.codigo}.'}
                )
            producto.stock = stock_nuevo
            producto.save(update_fields=('stock',))
            MovimientoInventario.objects.create(
                producto=producto,
                usuario=request.user,
                venta=venta,
                tipo=MovimientoInventario.Tipo.ENTRADA,
                cantidad=detalle.cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                fecha=fecha_anulacion,
            )

        venta.estado = Venta.Estado.ANULADA
        venta.motivo_anulacion = motivo
        venta.fecha_anulacion = fecha_anulacion
        venta.usuario_anula = request.user
        venta.save(
            update_fields=(
                'estado',
                'motivo_anulacion',
                'fecha_anulacion',
                'usuario_anula',
            )
        )
        return Response(VentaSerializer(venta, context=self.get_serializer_context()).data)

# Create your views here.
