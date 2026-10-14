from rest_framework import serializers

from .models import PrediccionReposicion


class FiltroPrediccionSerializer(serializers.Serializer):
    producto = serializers.IntegerField(required=False, min_value=1)
    dias_maximos = serializers.IntegerField(required=False, min_value=0)


class PrediccionReposicionSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    stock_actual = serializers.DecimalField(
        source='producto.stock',
        max_digits=10,
        decimal_places=3,
        read_only=True,
    )
    stock_minimo = serializers.DecimalField(
        source='producto.stock_minimo',
        max_digits=10,
        decimal_places=3,
        read_only=True,
    )

    class Meta:
        model = PrediccionReposicion
        fields = (
            'id_prediccion',
            'producto',
            'producto_codigo',
            'producto_nombre',
            'stock_actual',
            'stock_minimo',
            'fecha_calculo',
            'demanda_estimada',
            'dias_para_agotarse',
            'cantidad_sugerida',
        )
        read_only_fields = fields
