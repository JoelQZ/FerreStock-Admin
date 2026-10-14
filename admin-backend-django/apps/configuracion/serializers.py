from rest_framework import serializers

from .models import Negocio


class NegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Negocio
        fields = (
            'id_negocio',
            'nombre',
            'ruc',
            'direccion',
            'telefono',
            'logo',
            'impresora',
            'igv_porcentaje',
        )
        read_only_fields = ('id_negocio',)

    def validate_ruc(self, value):
        if value and (not value.isdigit() or len(value) != 11):
            raise serializers.ValidationError('El RUC debe contener exactamente 11 dígitos.')
        return value

    def validate_igv_porcentaje(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('El IGV debe estar entre 0 y 100.')
        return value
