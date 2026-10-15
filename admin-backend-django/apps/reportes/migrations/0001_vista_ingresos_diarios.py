from django.db import migrations

CREAR_VISTA = """
CREATE VIEW vista_ingresos_diarios AS
SELECT
    DATE(v.fecha_hora - INTERVAL 5 HOUR) AS fecha,
    v.id_turno AS id_turno,
    mp.nombre AS metodo,
    COUNT(p.id_pago) AS cantidad_pagos,
    SUM(p.monto) AS total
FROM venta v
JOIN pago p ON p.id_venta = v.id_venta
JOIN metodo_pago mp ON mp.id_metodo = p.id_metodo
WHERE v.estado = 'COMPLETADA'
GROUP BY DATE(v.fecha_hora - INTERVAL 5 HOUR), v.id_turno, mp.nombre
"""

ELIMINAR_VISTA = "DROP VIEW IF EXISTS vista_ingresos_diarios"


class Migration(migrations.Migration):
    dependencies = [
        ('ventas', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(CREAR_VISTA, ELIMINAR_VISTA),
    ]