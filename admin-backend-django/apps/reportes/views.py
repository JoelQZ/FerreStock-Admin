from decimal import Decimal

from django.db.models import Count, DecimalField, F, Q, Sum
from django.db.models.functions import TruncDate
from rest_framework import generics
from rest_framework.response import Response

from apps.caja.models import MovimientoCaja
from apps.ventas.models import DetalleVenta, Venta

from .permissions import PuedeConsultarReportes
from .serializers import (
    LimiteProductosSerializer,
    MovimientosCajaReporteSerializer,
    PeriodoReporteSerializer,
    ProductoMasVendidoSerializer,
    VentasPorPeriodoSerializer,
)

MONEY_FIELD = DecimalField(max_digits=14, decimal_places=2)
QUANTITY_FIELD = DecimalField(max_digits=14, decimal_places=3)
ZERO = Decimal('0.00')
CENT = Decimal('0.01')


def money(value):
    return (value or ZERO).quantize(CENT)


def validated_period(request, serializer_class=PeriodoReporteSerializer):
    serializer = serializer_class(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


def filter_period(queryset, field, desde, hasta):
    if desde:
        queryset = queryset.filter(**{f'{field}__date__gte': desde})
    if hasta:
        queryset = queryset.filter(**{f'{field}__date__lte': hasta})
    return queryset


class VentasPorPeriodoView(generics.GenericAPIView):
    permission_classes = (PuedeConsultarReportes,)
    serializer_class = PeriodoReporteSerializer

    def get(self, request):
        params = validated_period(request)
        ventas = filter_period(
            Venta.objects.filter(estado=Venta.Estado.COMPLETADA),
            'fecha_hora',
            params.get('desde'),
            params.get('hasta'),
        )
        resumen = ventas.aggregate(
            cantidad_ventas=Count('id_venta'),
            subtotal=Sum('subtotal', output_field=MONEY_FIELD),
            igv=Sum('igv', output_field=MONEY_FIELD),
            total=Sum('total', output_field=MONEY_FIELD),
        )
        periodos = list(
            ventas.annotate(fecha_dia=TruncDate('fecha_hora'))
            .values('fecha_dia')
            .annotate(
                cantidad_ventas=Count('id_venta'),
                subtotal=Sum('subtotal', output_field=MONEY_FIELD),
                igv=Sum('igv', output_field=MONEY_FIELD),
                total=Sum('total', output_field=MONEY_FIELD),
            )
            .order_by('fecha_dia')
        )
        for fila in periodos:
            fila['fecha'] = fila.pop('fecha_dia')
            fila['subtotal'] = money(fila['subtotal'])
            fila['igv'] = money(fila['igv'])
            fila['total'] = money(fila['total'])

        data = {
            'desde': params.get('desde'),
            'hasta': params.get('hasta'),
            'resumen': {
                'cantidad_ventas': resumen['cantidad_ventas'],
                'subtotal': money(resumen['subtotal']),
                'igv': money(resumen['igv']),
                'total': money(resumen['total']),
            },
            'periodos': periodos,
        }
        output = VentasPorPeriodoSerializer(data=data)
        output.is_valid(raise_exception=True)
        return Response(output.data)


class ProductosMasVendidosView(generics.GenericAPIView):
    permission_classes = (PuedeConsultarReportes,)
    serializer_class = LimiteProductosSerializer

    def get(self, request):
        params = validated_period(request, LimiteProductosSerializer)
        ventas = filter_period(
            Venta.objects.filter(estado=Venta.Estado.COMPLETADA),
            'fecha_hora',
            params.get('desde'),
            params.get('hasta'),
        )
        productos = (
            DetalleVenta.objects.filter(venta__in=ventas)
            .values(
                'producto_id',
                codigo=F('producto__codigo'),
                nombre=F('producto__nombre'),
            )
            .annotate(
                cantidad_vendida=Sum('cantidad', output_field=QUANTITY_FIELD),
                total_vendido=Sum('subtotal', output_field=MONEY_FIELD),
            )
            .order_by('-cantidad_vendida', '-total_vendido', 'nombre')[:params['limite']]
        )
        productos = [
            {
                **producto,
                'cantidad_vendida': producto['cantidad_vendida'].quantize(
                    Decimal('0.001')
                ),
                'total_vendido': money(producto['total_vendido']),
            }
            for producto in productos
        ]
        output = ProductoMasVendidoSerializer(productos, many=True)
        return Response(
            {
                'desde': params.get('desde'),
                'hasta': params.get('hasta'),
                'limite': params['limite'],
                'productos': output.data,
            }
        )


class MovimientosCajaReporteView(generics.GenericAPIView):
    permission_classes = (PuedeConsultarReportes,)
    serializer_class = PeriodoReporteSerializer

    def get(self, request):
        params = validated_period(request)
        movimientos = filter_period(
            MovimientoCaja.objects.all(),
            'fecha',
            params.get('desde'),
            params.get('hasta'),
        )
        resumen = movimientos.aggregate(
            cantidad_movimientos=Count('id_mov_caja'),
            ingresos=Sum(
                'monto',
                filter=Q(tipo=MovimientoCaja.Tipo.INGRESO),
                output_field=MONEY_FIELD,
            ),
            egresos=Sum(
                'monto',
                filter=Q(tipo=MovimientoCaja.Tipo.EGRESO),
                output_field=MONEY_FIELD,
            ),
        )
        filas = list(
            movimientos.annotate(fecha_dia=TruncDate('fecha'))
            .values('fecha_dia', 'tipo')
            .annotate(
                cantidad_movimientos=Count('id_mov_caja'),
                monto_total=Sum('monto', output_field=MONEY_FIELD),
            )
            .order_by('fecha_dia', 'tipo')
        )
        for fila in filas:
            fila['fecha'] = fila.pop('fecha_dia')
            fila['monto_total'] = money(fila['monto_total'])
        data = {
            'desde': params.get('desde'),
            'hasta': params.get('hasta'),
            'resumen': {
                'cantidad_movimientos': resumen['cantidad_movimientos'],
                'ingresos': money(resumen['ingresos']),
                'egresos': money(resumen['egresos']),
            },
            'movimientos': filas,
        }
        output = MovimientosCajaReporteSerializer(data=data)
        output.is_valid(raise_exception=True)
        return Response(output.data)
