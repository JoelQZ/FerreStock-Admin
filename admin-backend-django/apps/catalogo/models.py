from django.db import models


class Categoria(models.Model):
    id_categoria = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'categoria'
        ordering = ['nombre']
        verbose_name = 'categoría'
        verbose_name_plural = 'categorías'

    def __str__(self):
        return self.nombre


class Marca(models.Model):
    id_marca = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'marca'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class UnidadMedida(models.Model):
    id_unidad = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    abreviatura = models.CharField(max_length=10)

    class Meta:
        db_table = 'unidad_medida'
        ordering = ['nombre']
        verbose_name = 'unidad de medida'
        verbose_name_plural = 'unidades de medida'

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    id_producto = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    categoria = models.ForeignKey(
        Categoria,
        db_column='id_categoria',
        on_delete=models.PROTECT,
        related_name='productos',
    )
    marca = models.ForeignKey(
        Marca,
        db_column='id_marca',
        on_delete=models.PROTECT,
        related_name='productos',
    )
    unidad = models.ForeignKey(
        UnidadMedida,
        db_column='id_unidad',
        on_delete=models.PROTECT,
        related_name='productos',
    )
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'producto'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.codigo} - {self.nombre}'
