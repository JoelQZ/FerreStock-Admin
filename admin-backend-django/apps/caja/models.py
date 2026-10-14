from django.db import models


class Turno(models.Model):
    class Estado(models.TextChoices):
        ABIERTO = 'ABIERTO', 'Abierto'
        CERRADO = 'CERRADO', 'Cerrado'

    id_turno = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(
        'usuarios.Usuario',
        db_column='id_usuario',
        on_delete=models.PROTECT,
        related_name='turnos',
    )
    apertura = models.DateTimeField()
    monto_inicial = models.DecimalField(max_digits=12, decimal_places=2)
    cierre = models.DateTimeField(blank=True, null=True)
    monto_esperado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monto_real = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    diferencia = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    estado = models.CharField(
        max_length=10,
        choices=Estado.choices,
        default=Estado.ABIERTO,
    )

    class Meta:
        db_table = 'turno'
        ordering = ['-apertura']

    def __str__(self):
        return f'Turno {self.id_turno} - {self.get_estado_display()}'


class MovimientoCaja(models.Model):
    class Tipo(models.TextChoices):
        INGRESO = 'INGRESO', 'Ingreso'
        EGRESO = 'EGRESO', 'Egreso'

    id_mov_caja = models.BigAutoField(primary_key=True)
    turno = models.ForeignKey(
        Turno,
        db_column='id_turno',
        on_delete=models.PROTECT,
        related_name='movimientos',
    )
    usuario = models.ForeignKey(
        'usuarios.Usuario',
        db_column='id_usuario',
        on_delete=models.PROTECT,
        related_name='movimientos_caja',
    )
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    motivo = models.CharField(max_length=255)
    fecha = models.DateTimeField()

    class Meta:
        db_table = 'movimiento_caja'
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.tipo} - {self.monto}'
