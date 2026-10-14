from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.caja.models import Turno
from apps.catalogo.models import Producto
from apps.configuracion.models import Negocio
from apps.inventario.models import MovimientoInventario

from .models import (
    Cliente,
    DetalleVenta,
    MetodoPago,
    Pago,
    TipoComprobante,
    Venta,
)

CENTAVO = Decimal('0.01')
STOCK_MAXIMO = Decimal('9999999.999')
MONTO_MAXIMO = Decimal('9999999999.99')


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = (
            'id_cliente',
            'tipo_documento',
            'numero_documento',
            'nombre_razon_social',
            'direccion',
        )
        read_only_fields = ('id_cliente',)

    def validate_numero_documento(self, value):
        tipo_documento = self.initial_data.get(
            'tipo_documento',
            getattr(self.instance, 'tipo_documento', None),
        )
        longitud = {'DNI': 8, 'RUC': 11}.get(tipo_documento)
        if longitud and (not value.isdigit() or len(value) != longitud):
            raise serializers.ValidationError(
                f'El {tipo_documento} debe contener exactamente {longitud} dígitos.'
            )
        return value


class TipoComprobanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoComprobante
        fields = ('id_tipo', 'nombre', 'serie', 'correlativo_actual')
        read_only_fields = ('id_tipo', 'correlativo_actual')


class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetodoPago
        fields = ('id_metodo', 'nombre', 'requiere_codigo', 'estado')
        read_only_fields = fields


class DetalleVentaInputSerializer(serializers.Serializer):
    producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.filter(estado=True),
    )
    cantidad = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        min_value=Decimal('0.001'),
    )


class PagoInputSerializer(serializers.Serializer):
    metodo = serializers.PrimaryKeyRelatedField(
        queryset=MetodoPago.objects.filter(estado=True),
    )
    monto = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=CENTAVO,
    )
    monto_recibido = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=CENTAVO,
        required=False,
    )
    codigo_operacion = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate(self, attrs):
        metodo = attrs['metodo']
        codigo = attrs.get('codigo_operacion', '').strip()
        if metodo.requiere_codigo and not codigo:
            raise serializers.ValidationError(
                {'codigo_operacion': 'Este método de pago requiere un código de operación.'}
            )
        attrs['codigo_operacion'] = codigo
        recibido = attrs.get('monto_recibido')
        if metodo.nombre.strip().casefold() == 'efectivo':
            recibido = recibido if recibido is not None else attrs['monto']
            if recibido < attrs['monto']:
                raise serializers.ValidationError(
                    {'monto_recibido': 'El efectivo recibido no puede ser menor al monto pagado.'}
                )
            attrs['monto_recibido'] = recibido
        elif recibido is not None and recibido != attrs['monto']:
            raise serializers.ValidationError(
                {'monto_recibido': 'El monto recibido debe coincidir con el pago no efectivo.'}
            )
        else:
            attrs['monto_recibido'] = attrs['monto']
        return attrs


class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = DetalleVenta
        fields = (
            'id_detalle',
            'producto',
            'producto_codigo',
            'producto_nombre',
            'cantidad',
            'precio_unitario',
            'subtotal',
        )


class PagoSerializer(serializers.ModelSerializer):
    metodo_nombre = serializers.CharField(source='metodo.nombre', read_only=True)

    class Meta:
        model = Pago
        fields = (
            'id_pago',
            'metodo',
            'metodo_nombre',
            'monto',
            'monto_recibido',
            'vuelto',
            'codigo_operacion',
        )


class VentaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    turno = serializers.PrimaryKeyRelatedField(read_only=True)
    cliente_nombre = serializers.CharField(
        source='cliente.nombre_razon_social',
        read_only=True,
    )
    tipo_comprobante_nombre = serializers.CharField(
        source='tipo_comprobante.nombre',
        read_only=True,
    )
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    pagos = PagoSerializer(many=True, read_only=True)

    class Meta:
        model = Venta
        fields = (
            'id_venta',
            'fecha_hora',
            'subtotal',
            'igv',
            'total',
            'estado',
            'usuario',
            'usuario_nombre',
            'turno',
            'cliente',
            'cliente_nombre',
            'tipo_comprobante',
            'tipo_comprobante_nombre',
            'serie',
            'numero',
            'motivo_anulacion',
            'fecha_anulacion',
            'usuario_anula',
            'detalles',
            'pagos',
        )
        read_only_fields = fields


class VentaCreateSerializer(serializers.Serializer):
    cliente = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        required=False,
        allow_null=True,
    )
    tipo_comprobante = serializers.PrimaryKeyRelatedField(
        queryset=TipoComprobante.objects.all(),
    )
    detalles = DetalleVentaInputSerializer(many=True)
    pagos = PagoInputSerializer(many=True)

    def validate_detalles(self, value):
        if not value:
            raise serializers.ValidationError('La venta debe contener al menos un producto.')
        return value

    def validate_pagos(self, value):
        if not value:
            raise serializers.ValidationError('La venta debe contener al menos un pago.')
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
                {'turno': 'Debes abrir un turno de caja antes de registrar ventas.'}
            )

        tipo_comprobante = TipoComprobante.objects.select_for_update().get(
            pk=validated_data['tipo_comprobante'].pk
        )
        if tipo_comprobante.correlativo_actual >= 2147483647:
            raise serializers.ValidationError(
                {'tipo_comprobante': 'Se agotó el correlativo del comprobante.'}
            )

        detalles_data = validated_data['detalles']
        cantidades = {}
        for detalle in detalles_data:
            producto = detalle['producto']
            cantidades[producto.pk] = cantidades.get(producto.pk, Decimal('0')) + detalle['cantidad']

        productos = {
            producto.pk: producto
            for producto in Producto.objects.select_for_update()
            .filter(pk__in=sorted(cantidades), estado=True)
            .order_by('pk')
        }
        if len(productos) != len(cantidades):
            raise serializers.ValidationError(
                {'detalles': 'Uno o más productos ya no están disponibles.'}
            )
        for producto_id, cantidad in cantidades.items():
            producto = productos[producto_id]
            if producto.stock < cantidad:
                raise serializers.ValidationError(
                    {
                        'detalles': (
                            f'Stock insuficiente para {producto.codigo}: '
                            f'disponible {producto.stock}, solicitado {cantidad}.'
                        )
                    }
                )

        items = []
        subtotal = Decimal('0.00')
        for detalle in detalles_data:
            producto = productos[detalle['producto'].pk]
            linea_subtotal = (producto.precio_venta * detalle['cantidad']).quantize(
                CENTAVO,
                rounding=ROUND_HALF_UP,
            )
            items.append((producto, detalle['cantidad'], producto.precio_venta, linea_subtotal))
            subtotal += linea_subtotal

        negocio = Negocio.objects.order_by('pk').first()
        igv_porcentaje = negocio.igv_porcentaje if negocio else Decimal('18.00')
        igv = (subtotal * igv_porcentaje / Decimal('100')).quantize(
            CENTAVO,
            rounding=ROUND_HALF_UP,
        )
        total = subtotal + igv
        if total > MONTO_MAXIMO:
            raise serializers.ValidationError({'detalles': 'El total supera el máximo permitido.'})

        pagos_data = validated_data['pagos']
        total_pagado = sum((pago['monto'] for pago in pagos_data), Decimal('0.00'))
        if total_pagado != total:
            raise serializers.ValidationError(
                {'pagos': f'Los pagos deben sumar exactamente {total:.2f}.'}
            )

        correlativo = tipo_comprobante.correlativo_actual + 1
        tipo_comprobante.correlativo_actual = correlativo
        tipo_comprobante.save(update_fields=('correlativo_actual',))
        fecha_hora = timezone.now()
        venta = Venta.objects.create(
            fecha_hora=fecha_hora,
            subtotal=subtotal,
            igv=igv,
            total=total,
            usuario=request.user,
            turno=turno,
            tipo_comprobante=tipo_comprobante,
            serie=tipo_comprobante.serie,
            numero=correlativo,
            **{key: validated_data[key] for key in ('cliente',) if key in validated_data},
        )

        for producto, cantidad, precio_unitario, linea_subtotal in items:
            stock_anterior = producto.stock
            stock_nuevo = stock_anterior - cantidad
            DetalleVenta.objects.create(
                venta=venta,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                subtotal=linea_subtotal,
            )
            producto.stock = stock_nuevo
            producto.save(update_fields=('stock',))
            MovimientoInventario.objects.create(
                producto=producto,
                usuario=request.user,
                venta=venta,
                tipo=MovimientoInventario.Tipo.SALIDA,
                cantidad=cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                fecha=fecha_hora,
            )

        for pago_data in pagos_data:
            monto = pago_data['monto']
            recibido = pago_data['monto_recibido']
            Pago.objects.create(
                venta=venta,
                metodo=pago_data['metodo'],
                monto=monto,
                monto_recibido=recibido,
                vuelto=recibido - monto,
                codigo_operacion=pago_data['codigo_operacion'],
            )

        return venta


class AnularVentaSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=1000, allow_blank=False, trim_whitespace=True)
