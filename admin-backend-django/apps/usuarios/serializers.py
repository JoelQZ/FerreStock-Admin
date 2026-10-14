from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Rol, Usuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ('id', 'nombre', 'descripcion')
        read_only_fields = ('id',)


class UsuarioSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(max_length=150)
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        trim_whitespace=False,
    )

    class Meta:
        model = Usuario
        fields = (
            'id',
            'nombre',
            'usuario',
            'rol',
            'rol_nombre',
            'estado',
            'password',
            'last_login',
            'creado_en',
        )
        read_only_fields = ('id', 'last_login', 'creado_en')

    def validate_password(self, value):
        validate_password(value, self.instance)
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Este campo es obligatorio.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario = validated_data.pop('usuario')
        return Usuario.objects.create_user(usuario, password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=('password',))
        return instance


class UsuarioActualSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source='rol.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = ('id', 'nombre', 'usuario', 'rol')


class UsuarioTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['usuario'] = user.usuario
        token['rol'] = user.rol.nombre
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['usuario'] = UsuarioActualSerializer(self.user).data
        return data
