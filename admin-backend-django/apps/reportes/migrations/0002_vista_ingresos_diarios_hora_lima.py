from django.db import migrations

VISTA_HORA_LIMA = """
CREATE OR REPLACE VIEW vista_ingresos_diarios AS
SELECT
    DATE(v.fecha_hora) AS fecha,
    v.id_turno AS id_turno,
    mp.nombre AS metodo,
    COUNT(p.id_pago) AS cantidad_pagos,
    SUM(p.monto) AS total
FROM venta v
JOIN pago p ON p.id_venta = v.id_venta
JOIN metodo_pago mp ON mp.id_metodo = p.id_metodo
WHERE v.estado = 'COMPLETADA'
GROUP BY DATE(v.fecha_hora), v.id_turno, mp.nombre
"""

VISTA_ANTERIOR = """
CREATE OR REPLACE VIEW vista_ingresos_diarios AS
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


class Migration(migrations.Migration):
    dependencies = [
        ('reportes', '0001_vista_ingresos_diarios'),
    ]

    operations = [
        migrations.RunSQL(VISTA_HORA_LIMA, VISTA_ANTERIOR),
    ]
