from rest_framework import serializers


class PeriodoReporteSerializer(serializers.Serializer):
    desde = serializers.DateField(required=False)
    hasta = serializers.DateField(required=False)

    def validate(self, attrs):
        desde = attrs.get('desde')
        hasta = attrs.get('hasta')
        if desde and hasta and desde > hasta:
            raise serializers.ValidationError(
                {'desde': 'La fecha inicial no puede ser posterior a la fecha final.'}
            )
        return attrs


class VentasReporteSerializer(PeriodoReporteSerializer):
    turno = serializers.IntegerField(required=False, min_value=1)


class LimiteProductosSerializer(PeriodoReporteSerializer):
    limite = serializers.IntegerField(required=False, min_value=1, max_value=100, default=10)


class ResumenVentasSerializer(serializers.Serializer):
    cantidad_ventas = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2)
    igv = serializers.DecimalField(max_digits=14, decimal_places=2)
    total = serializers.DecimalField(max_digits=14, decimal_places=2)


class VentasPorPeriodoFilaSerializer(ResumenVentasSerializer):
    fecha = serializers.DateField()


class VentasPorMetodoPagoSerializer(serializers.Serializer):
    metodo = serializers.CharField()
    cantidad_ventas = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=14, decimal_places=2)


class VentasPorPeriodoSerializer(serializers.Serializer):
    desde = serializers.DateField(allow_null=True)
    hasta = serializers.DateField(allow_null=True)
    turno = serializers.IntegerField(allow_null=True)
    resumen = ResumenVentasSerializer()
    por_metodo_pago = VentasPorMetodoPagoSerializer(many=True)
    periodos = VentasPorPeriodoFilaSerializer(many=True)


class ProductoMasVendidoSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField()
    codigo = serializers.CharField()
    nombre = serializers.CharField()
    cantidad_vendida = serializers.DecimalField(max_digits=14, decimal_places=3)
    total_vendido = serializers.DecimalField(max_digits=14, decimal_places=2)


class ResumenMovimientosCajaSerializer(serializers.Serializer):
    cantidad_movimientos = serializers.IntegerField()
    ingresos = serializers.DecimalField(max_digits=14, decimal_places=2)
    egresos = serializers.DecimalField(max_digits=14, decimal_places=2)


class MovimientoCajaReporteFilaSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    tipo = serializers.CharField()
    cantidad_movimientos = serializers.IntegerField()
    monto_total = serializers.DecimalField(max_digits=14, decimal_places=2)


class MovimientosCajaReporteSerializer(serializers.Serializer):
    desde = serializers.DateField(allow_null=True)
    hasta = serializers.DateField(allow_null=True)
    resumen = ResumenMovimientosCajaSerializer()
    movimientos = MovimientoCajaReporteFilaSerializer(many=True)
