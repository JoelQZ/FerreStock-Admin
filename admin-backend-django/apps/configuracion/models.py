from django.db import models


class Negocio(models.Model):
    id_negocio = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    ruc = models.CharField(max_length=11, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    logo = models.CharField(max_length=255, blank=True)
    impresora = models.CharField(max_length=100, blank=True)
    igv_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=18)

    class Meta:
        db_table = 'negocio'
        verbose_name = 'negocio'
        verbose_name_plural = 'negocios'

    def __str__(self):
        return self.nombre
