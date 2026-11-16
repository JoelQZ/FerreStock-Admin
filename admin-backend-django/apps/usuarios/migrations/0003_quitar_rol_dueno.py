from django.db import migrations, models


def pasar_duenos_a_administrador(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Usuario = apps.get_model('usuarios', 'Usuario')

    dueno = Rol.objects.filter(nombre='DUENO').first()
    if dueno is None:
        return

    administrador, _ = Rol.objects.get_or_create(
        nombre='ADMINISTRADOR',
        defaults={'descripcion': 'Administra el negocio desde el panel.'},
    )
    Usuario.objects.filter(rol=dueno).update(rol=administrador)
    dueno.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0002_rol_descripcion_usuario_creado_en_usuario_nombre'),
    ]

    operations = [
        migrations.RunPython(pasar_duenos_a_administrador, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='rol',
            name='nombre',
            field=models.CharField(
                choices=[('ADMINISTRADOR', 'Administrador'), ('CAJERO', 'Cajero')],
                max_length=20,
                unique=True,
            ),
        ),
    ]
