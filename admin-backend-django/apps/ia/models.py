from django.db import models


class PrediccionReposicion(models.Model):
    id_prediccion = models.BigAutoField(primary_key=True)
    producto = models.ForeignKey(
        'catalogo.Producto',
        db_column='id_producto',
        on_delete=models.CASCADE,
        related_name='predicciones_reposicion',
    )
    fecha_calculo = models.DateTimeField()
    demanda_estimada = models.DecimalField(max_digits=10, decimal_places=3)
    dias_para_agotarse = models.PositiveIntegerField()
    cantidad_sugerida = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        db_table = 'prediccion_reposicion'
        ordering = ['-fecha_calculo']

    def __str__(self):
        return f'Predicción de reposición: {self.producto}'
