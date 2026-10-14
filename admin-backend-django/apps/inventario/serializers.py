from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.catalogo.models import Producto

from .models import DetalleIngreso, Ingreso, MovimientoInventario, Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = (
            'id_proveedor',
            'ruc',
            'razon_social',
            'telefono',
            'direccion',
            'estado',
        )
        read_only_fields = ('id_proveedor',)

    def validate_ruc(self, value):
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError('El RUC debe contener exactamente 11 dígitos.')
        return value


class DetalleIngresoInputSerializer(serializers.Serializer):
    producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.filter(estado=True),
    )
    cantidad = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        min_value=Decimal('0.001'),
    )
    costo_unitario = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal('0'),
    )


class DetalleIngresoSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = DetalleIngreso
        fields = (
            'id_detalle_ingreso',
            'producto',
            'producto_codigo',
            'producto_nombre',
            'cantidad',
            'costo_unitario',
            'subtotal',
        )
        read_only_fields = fields


class IngresoSerializer(serializers.ModelSerializer):
    proveedor = serializers.PrimaryKeyRelatedField(
        queryset=Proveedor.objects.filter(estado=True),
    )
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    detalles = DetalleIngresoInputSerializer(many=True, write_only=True)
    items = DetalleIngresoSerializer(source='detalles', many=True, read_only=True)

    class Meta:
        model = Ingreso
        fields = (
            'id_ingreso',
            'proveedor',
            'usuario',
            'nro_documento',
            'fecha',
            'total',
            'detalles',
            'items',
        )
        read_only_fields = ('id_ingreso', 'usuario', 'fecha', 'total')

    def validate_detalles(self, value):
        if not value:
            raise serializers.ValidationError('El ingreso debe contener al menos un producto.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        producto_ids = sorted({detalle['producto'].pk for detalle in detalles_data})
        productos = {
            producto.pk: producto
            for producto in Producto.objects.select_for_update()
            .filter(pk__in=producto_ids, estado=True)
            .order_by('pk')
        }
        if len(productos) != len(producto_ids):
            raise serializers.ValidationError(
                {'detalles': 'Uno o más productos ya no están disponibles.'}
            )

        items = []
        total = Decimal('0.00')
        for detalle in detalles_data:
            subtotal = (detalle['cantidad'] * detalle['costo_unitario']).quantize(
                Decimal('0.01'),
                rounding=ROUND_HALF_UP,
            )
            if subtotal > Decimal('9999999999.99'):
                raise serializers.ValidationError(
                    {'detalles': 'El subtotal de un producto excede el máximo permitido.'}
                )
            items.append((detalle, subtotal))
            total += subtotal
            if total > Decimal('9999999999.99'):
                raise serializers.ValidationError(
                    {'detalles': 'El total del ingreso excede el máximo permitido.'}
                )

        ingreso = Ingreso.objects.create(
            usuario=self.context['request'].user,
            fecha=timezone.now(),
            total=total,
            **validated_data,
        )

        for detalle, subtotal in items:
            producto = productos[detalle['producto'].pk]
            stock_anterior = producto.stock
            stock_nuevo = stock_anterior + detalle['cantidad']
            if stock_nuevo > Decimal('9999999.999'):
                raise serializers.ValidationError(
                    {'detalles': f'El ingreso excede el stock máximo de {producto.codigo}.'}
                )

            DetalleIngreso.objects.create(
                ingreso=ingreso,
                producto=producto,
                cantidad=detalle['cantidad'],
                costo_unitario=detalle['costo_unitario'],
                subtotal=subtotal,
            )
            producto.stock = stock_nuevo
            producto.save(update_fields=('stock',))
            MovimientoInventario.objects.create(
                producto=producto,
                usuario=self.context['request'].user,
                ingreso=ingreso,
                tipo=MovimientoInventario.Tipo.ENTRADA,
                cantidad=detalle['cantidad'],
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                fecha=ingreso.fecha,
            )

        return ingreso


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.usuario', read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = (
            'id_movimiento',
            'producto',
            'producto_codigo',
            'producto_nombre',
            'usuario',
            'usuario_nombre',
            'venta',
            'ingreso',
            'tipo',
            'cantidad',
            'stock_anterior',
            'stock_nuevo',
            'fecha',
        )
