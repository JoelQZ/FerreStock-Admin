from django.db import models


class Cliente(models.Model):
    class TipoDocumento(models.TextChoices):
        DNI = 'DNI', 'DNI'
        RUC = 'RUC', 'RUC'
        OTRO = 'OTRO', 'Otro'

    id_cliente = models.BigAutoField(primary_key=True)
    tipo_documento = models.CharField(max_length=10, choices=TipoDocumento.choices)
    numero_documento = models.CharField(max_length=15, unique=True)
    nombre_razon_social = models.CharField(max_length=150)
    direccion = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'cliente'
        ordering = ['nombre_razon_social']

    def __str__(self):
        return self.nombre_razon_social


class TipoComprobante(models.Model):
    id_tipo = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    serie = models.CharField(max_length=10)
    correlativo_actual = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'tipo_comprobante'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class MetodoPago(models.Model):
    id_metodo = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    requiere_codigo = models.BooleanField(default=False)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'metodo_pago'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Venta(models.Model):
    class Estado(models.TextChoices):
        COMPLETADA = 'COMPLETADA', 'Completada'
        ANULADA = 'ANULADA', 'Anulada'

    id_venta = models.BigAutoField(primary_key=True)
    fecha_hora = models.DateTimeField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    igv = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(
        max_length=12,
        choices=Estado.choices,
        default=Estado.COMPLETADA,
    )
    usuario = models.ForeignKey(
        'usuarios.Usuario',
        db_column='id_usuario',
        on_delete=models.PROTECT,
        related_name='ventas',
    )
    turno = models.ForeignKey(
        'caja.Turno',
        db_column='id_turno',
        on_delete=models.PROTECT,
        related_name='ventas',
    )
    cliente = models.ForeignKey(
        Cliente,
        db_column='id_cliente',
        on_delete=models.PROTECT,
        related_name='ventas',
        blank=True,
        null=True,
    )
    tipo_comprobante = models.ForeignKey(
        TipoComprobante,
        db_column='id_tipo_comprobante',
        on_delete=models.PROTECT,
        related_name='ventas',
    )
    serie = models.CharField(max_length=10)
    numero = models.PositiveIntegerField()
    motivo_anulacion = models.TextField(blank=True)
    fecha_anulacion = models.DateTimeField(blank=True, null=True)
    usuario_anula = models.ForeignKey(
        'usuarios.Usuario',
        db_column='id_usuario_anula',
        on_delete=models.PROTECT,
        related_name='ventas_anuladas',
        blank=True,
        null=True,
    )

    class Meta:
        db_table = 'venta'
        ordering = ['-fecha_hora']
        constraints = [
            models.UniqueConstraint(
                fields=['tipo_comprobante', 'serie', 'numero'],
                name='uq_venta_comprobante_serie_numero',
            ),
        ]

    def __str__(self):
        return f'{self.serie}-{self.numero}'


class DetalleVenta(models.Model):
    id_detalle = models.BigAutoField(primary_key=True)
    venta = models.ForeignKey(
        Venta,
        db_column='id_venta',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey(
        'catalogo.Producto',
        db_column='id_producto',
        on_delete=models.PROTECT,
        related_name='detalles_venta',
    )
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'detalle_venta'

    def __str__(self):
        return f'{self.producto} x {self.cantidad}'


class Pago(models.Model):
    id_pago = models.BigAutoField(primary_key=True)
    venta = models.ForeignKey(
        Venta,
        db_column='id_venta',
        on_delete=models.CASCADE,
        related_name='pagos',
    )
    metodo = models.ForeignKey(
        MetodoPago,
        db_column='id_metodo',
        on_delete=models.PROTECT,
        related_name='pagos',
    )
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    monto_recibido = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vuelto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    codigo_operacion = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'pago'

    def __str__(self):
        return f'{self.metodo}: {self.monto}'
