from django.db import models


class Proveedor(models.Model):
    id_proveedor = models.BigAutoField(primary_key=True)
    ruc = models.CharField(max_length=11, unique=True)
    razon_social = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'proveedor'
        ordering = ['razon_social']

    def __str__(self):
        return self.razon_social


class Ingreso(models.Model):
    id_ingreso = models.BigAutoField(primary_key=True)
    proveedor = models.ForeignKey(
        Proveedor,
        db_column='id_proveedor',
        on_delete=models.PROTECT,
        related_name='ingresos',
    )
    usuario = models.ForeignKey(
        'usuarios.Usuario',
        db_column='id_usuario',
        on_delete=models.PROTECT,
        related_name='ingresos',
    )
    nro_documento = models.CharField(max_length=50)
    fecha = models.DateTimeField()
    total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'ingreso'
        ordering = ['-fecha']

    def __str__(self):
        return f'Ingreso {self.id_ingreso} - {self.nro_documento}'


class DetalleIngreso(models.Model):
    id_detalle_ingreso = models.BigAutoField(primary_key=True)
    ingreso = models.ForeignKey(
        Ingreso,
        db_column='id_ingreso',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey(
        'catalogo.Producto',
        db_column='id_producto',
        on_delete=models.PROTECT,
        related_name='detalles_ingreso',
    )
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'detalle_ingreso'

    def __str__(self):
        return f'{self.producto} x {self.cantidad}'


class MovimientoInventario(models.Model):
    class Tipo(models.TextChoices):
        ENTRADA = 'ENTRADA', 'Entrada'
        SALIDA = 'SALIDA', 'Salida'
        AJUSTE = 'AJUSTE', 'Ajuste'

    id_movimiento = models.BigAutoField(primary_key=True)
    producto = models.ForeignKey(
        'catalogo.Producto',
        db_column='id_producto',
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
    )
    usuario = models.ForeignKey(
        'usuarios.Usuario',
        db_column='id_usuario',
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
    )
    venta = models.ForeignKey(
        'ventas.Venta',
        db_column='id_venta',
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
        blank=True,
        null=True,
    )
    ingreso = models.ForeignKey(
        Ingreso,
        db_column='id_ingreso',
        on_delete=models.PROTECT,
        related_name='movimientos_inventario',
        blank=True,
        null=True,
    )
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)
    stock_anterior = models.DecimalField(max_digits=10, decimal_places=3)
    stock_nuevo = models.DecimalField(max_digits=10, decimal_places=3)
    fecha = models.DateTimeField()

    class Meta:
        db_table = 'movimiento_inventario'
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.tipo} - {self.producto} ({self.cantidad})'
