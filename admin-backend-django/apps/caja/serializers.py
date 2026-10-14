from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import serializers

from apps.ventas.models import MetodoPago, Pago, Venta

from .models import MovimientoCaja, Turno


class MontoPositivoSerializer(serializers.Serializer):
    monto_inicial = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('0.00'),
    )


class TurnoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)

    class Meta:
        model = Turno
        fields = (
            'id_turno',
            'usuario',
            'usuario_nombre',
            'apertura',
            'monto_inicial',
            'cierre',
            'monto_esperado',
            'monto_real',
            'diferencia',
            'estado',
        )
        read_only_fields = fields


class CierreTurnoSerializer(serializers.Serializer):
    monto_real = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('0.00'),
    )


class ResumenTurnoSerializer(serializers.Serializer):
    turno = TurnoSerializer(read_only=True)
    ventas = serializers.IntegerField(read_only=True)
    ventas_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    efectivo_ventas = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    otros_pagos = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    ingresos_caja = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    egresos_caja = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    monto_esperado = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )


class MovimientoCajaSerializer(serializers.ModelSerializer):
    turno = serializers.PrimaryKeyRelatedField(read_only=True)
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = MovimientoCaja
        fields = (
            'id_mov_caja',
            'turno',
            'usuario',
            'tipo',
            'monto',
            'motivo',
            'fecha',
        )
        read_only_fields = ('id_mov_caja', 'turno', 'usuario', 'fecha')

    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError('El monto debe ser mayor que cero.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        turno = Turno.objects.select_for_update().filter(
            usuario=request.user,
            estado=Turno.Estado.ABIERTO,
        ).first()
        if turno is None:
            raise serializers.ValidationError(
                {'turno': 'No tienes un turno de caja abierto.'}
            )
        return MovimientoCaja.objects.create(
            turno=turno,
            usuario=request.user,
            fecha=timezone.now(),
            **validated_data,
        )


def obtener_resumen_turno(turno):
    ventas = Venta.objects.filter(
        turno=turno,
        estado=Venta.Estado.COMPLETADA,
    )
    ventas_agregadas = ventas.aggregate(
        cantidad=Count('id_venta'),
        total=Sum('total'),
    )
    pagos = Pago.objects.filter(venta__in=ventas)
    metodos_efectivo = MetodoPago.objects.filter(nombre__iexact='efectivo')
    efectivo = pagos.filter(metodo__in=metodos_efectivo).aggregate(total=Sum('monto'))['total']
    otros_pagos = pagos.exclude(metodo__in=metodos_efectivo).aggregate(total=Sum('monto'))['total']
    movimientos = MovimientoCaja.objects.filter(turno=turno)
    ingresos = movimientos.filter(tipo=MovimientoCaja.Tipo.INGRESO).aggregate(
        total=Sum('monto')
    )['total']
    egresos = movimientos.filter(tipo=MovimientoCaja.Tipo.EGRESO).aggregate(
        total=Sum('monto')
    )['total']

    efectivo = efectivo or Decimal('0.00')
    otros_pagos = otros_pagos or Decimal('0.00')
    ingresos = ingresos or Decimal('0.00')
    egresos = egresos or Decimal('0.00')
    ventas_total = ventas_agregadas['total'] or Decimal('0.00')
    esperado = turno.monto_inicial + efectivo + ingresos - egresos
    if abs(esperado) > Decimal('9999999999.99'):
        raise serializers.ValidationError(
            {'monto_esperado': 'El saldo esperado excede el máximo permitido.'}
        )

    return {
        'turno': turno,
        'ventas': ventas_agregadas['cantidad'] or 0,
        'ventas_total': ventas_total,
        'efectivo_ventas': efectivo,
        'otros_pagos': otros_pagos,
        'ingresos_caja': ingresos,
        'egresos_caja': egresos,
        'monto_esperado': esperado,
    }


@transaction.atomic
def cerrar_turno(turno, monto_real):
    resumen = obtener_resumen_turno(turno)
    diferencia = monto_real - resumen['monto_esperado']
    if abs(diferencia) > Decimal('9999999999.99'):
        raise serializers.ValidationError(
            {'monto_real': 'La diferencia excede el máximo permitido.'}
        )
    turno.cierre = timezone.now()
    turno.monto_esperado = resumen['monto_esperado']
    turno.monto_real = monto_real
    turno.diferencia = diferencia
    turno.estado = Turno.Estado.CERRADO
    turno.save(
        update_fields=(
            'cierre',
            'monto_esperado',
            'monto_real',
            'diferencia',
            'estado',
        )
    )
    return turno, resumen
