from rest_framework import serializers

from .models import Categoria, Marca, Producto, UnidadMedida


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ('id_categoria', 'nombre', 'descripcion', 'estado')
        read_only_fields = ('id_categoria',)


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ('id_marca', 'nombre', 'estado')
        read_only_fields = ('id_marca',)


class UnidadMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = ('id_unidad', 'nombre', 'abreviatura')
        read_only_fields = fields


class ProductoSerializer(serializers.ModelSerializer):
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.filter(estado=True),
    )
    marca = serializers.PrimaryKeyRelatedField(
        queryset=Marca.objects.filter(estado=True),
    )

    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    marca_nombre = serializers.CharField(source='marca.nombre', read_only=True)
    unidad_nombre = serializers.CharField(source='unidad.nombre', read_only=True)
    stock = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        read_only=True,
    )

    class Meta:
        model = Producto
        fields = (
            'id_producto',
            'codigo',
            'nombre',
            'descripcion',
            'precio_compra',
            'precio_venta',
            'stock',
            'stock_minimo',
            'categoria',
            'categoria_nombre',
            'marca',
            'marca_nombre',
            'unidad',
            'unidad_nombre',
            'estado',
        )
        read_only_fields = ('id_producto',)
        extra_kwargs = {'codigo': {'validators': []}}

    def validate_codigo(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('El código es obligatorio.')
        repetidos = Producto.objects.filter(codigo__iexact=value)
        if self.instance:
            repetidos = repetidos.exclude(pk=self.instance.pk)
        if repetidos.exists():
            raise serializers.ValidationError('Ya existe un producto con este código.')
        return value

    def validate_precio_compra(self, value):
        if value < 0:
            raise serializers.ValidationError('El precio de compra no puede ser negativo.')
        return value

    def validate_precio_venta(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio de venta debe ser mayor a cero.')
        return value

    def validate_stock_minimo(self, value):
        if value < 0:
            raise serializers.ValidationError('El stock mínimo no puede ser negativo.')
        return value
