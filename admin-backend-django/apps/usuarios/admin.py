from django.contrib import admin

from .models import Rol, Usuario


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'nombre', 'rol', 'estado', 'is_staff')
    list_filter = ('rol', 'estado', 'is_staff')
    search_fields = ('usuario', 'nombre')
    readonly_fields = ('last_login', 'creado_en')
