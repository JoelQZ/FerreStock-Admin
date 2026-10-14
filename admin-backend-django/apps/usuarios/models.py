from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class Rol(models.Model):
    class Nombre(models.TextChoices):
        ADMINISTRADOR = 'ADMINISTRADOR', 'Administrador'
        CAJERO = 'CAJERO', 'Cajero'
        DUENO = 'DUENO', 'Dueño'

    nombre = models.CharField(max_length=20, choices=Nombre.choices, unique=True)

    class Meta:
        db_table = 'rol'

    def __str__(self):
        return self.get_nombre_display()


class UsuarioManager(BaseUserManager):
    def create_user(self, usuario, password=None, **extra_fields):
        if not usuario:
            raise ValueError('El nombre de usuario es obligatorio.')
        user = self.model(usuario=usuario, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, usuario, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('estado', True)

        if extra_fields['is_staff'] is not True:
            raise ValueError('Un superusuario debe tener is_staff=True.')
        if extra_fields['is_superuser'] is not True:
            raise ValueError('Un superusuario debe tener is_superuser=True.')

        return self.create_user(usuario, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name='usuarios')
    usuario = models.CharField(max_length=150, unique=True)
    estado = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'usuario'
    REQUIRED_FIELDS = ['rol']

    class Meta:
        db_table = 'usuario'

    @property
    def is_active(self):
        return self.estado

    def __str__(self):
        return self.usuario
