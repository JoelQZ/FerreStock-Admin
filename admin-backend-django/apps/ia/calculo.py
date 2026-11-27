from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.catalogo.models import Producto
from apps.ventas.models import DetalleVenta, Venta

from .models import PrediccionReposicion

DIAS_HISTORIAL = 30
DIAS_COBERTURA = 15
DIAS_SIN_DEMANDA = 999
MIL = Decimal('0.001')


def calcular_predicciones():
    ahora = timezone.now()
    vendido_por_producto = dict(
        DetalleVenta.objects.filter(
            venta__estado=Venta.Estado.COMPLETADA,
            venta__fecha_hora__gte=ahora - timedelta(days=DIAS_HISTORIAL),
        )
        .values_list('producto')
        .annotate(total=Sum('cantidad'))
    )

    predicciones = []
    for producto in Producto.objects.filter(estado=True):
        vendido = vendido_por_producto.get(producto.id_producto, Decimal('0'))
        if not vendido and producto.stock > producto.stock_minimo:
            continue

        demanda = (vendido / DIAS_HISTORIAL).quantize(MIL, rounding=ROUND_HALF_UP)
        if demanda > 0:
            dias = min(int(producto.stock / demanda), DIAS_SIN_DEMANDA)
        else:
            dias = 0 if producto.stock <= 0 else DIAS_SIN_DEMANDA
        sugerida = max(demanda * DIAS_COBERTURA + producto.stock_minimo - producto.stock, Decimal('0'))

        predicciones.append(
            PrediccionReposicion(
                producto=producto,
                fecha_calculo=ahora,
                demanda_estimada=demanda,
                dias_para_agotarse=dias,
                cantidad_sugerida=sugerida.quantize(MIL, rounding=ROUND_HALF_UP),
            )
        )

    with transaction.atomic():
        PrediccionReposicion.objects.all().delete()
        PrediccionReposicion.objects.bulk_create(predicciones)
