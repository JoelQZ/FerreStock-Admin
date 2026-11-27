from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.caja.models import Turno
from apps.catalogo.models import Categoria, Marca, Producto, UnidadMedida
from apps.usuarios.models import Rol, Usuario
from apps.ventas.models import DetalleVenta, TipoComprobante, Venta


class IaApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.create(nombre=Rol.Nombre.ADMINISTRADOR)
        cls.usuario = Usuario.objects.create_user(
            'ia-admin',
            password='A-long-password-47!',
            rol=rol,
        )
        categoria = Categoria.objects.create(nombre='IA')
        marca = Marca.objects.create(nombre='Marca IA')
        unidad = UnidadMedida.objects.create(nombre='Unidad IA', abreviatura='und')
        datos_producto = {'precio_compra': '5.00', 'precio_venta': '10.00', 'categoria': categoria, 'marca': marca, 'unidad': unidad}
        cls.producto = Producto.objects.create(
            codigo='IA-001',
            nombre='Producto con ventas',
            stock=Decimal('2.000'),
            stock_minimo=Decimal('3.000'),
            **datos_producto,
        )
        Producto.objects.create(
            codigo='IA-002',
            nombre='Producto sin ventas y con stock',
            stock=Decimal('50.000'),
            stock_minimo=Decimal('5.000'),
            **datos_producto,
        )

        ahora = timezone.now()
        turno = Turno.objects.create(usuario=cls.usuario, apertura=ahora, monto_inicial='0.00')
        boleta = TipoComprobante.objects.create(nombre='Boleta IA', serie='B901')
        for numero, cantidad, estado in ((1, '30.000', Venta.Estado.COMPLETADA), (2, '60.000', Venta.Estado.ANULADA)):
            venta = Venta.objects.create(
                fecha_hora=ahora,
                subtotal='0.00',
                igv='0.00',
                total='0.00',
                estado=estado,
                usuario=cls.usuario,
                turno=turno,
                tipo_comprobante=boleta,
                serie='B901',
                numero=numero,
            )
            DetalleVenta.objects.create(
                venta=venta,
                producto=cls.producto,
                cantidad=Decimal(cantidad),
                precio_unitario='10.00',
                subtotal='0.00',
            )

    def setUp(self):
        self.client.force_authenticate(self.usuario)

    def test_calculates_prediction_from_completed_sales(self):
        response = self.client.get(reverse('prediccion-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        prediccion = response.data[0]
        self.assertEqual(prediccion['producto_codigo'], 'IA-001')
        self.assertEqual(prediccion['stock_actual'], '2.000')
        self.assertEqual(prediccion['demanda_estimada'], '1.000')
        self.assertEqual(prediccion['dias_para_agotarse'], 2)
        self.assertEqual(prediccion['cantidad_sugerida'], '16.000')

    def test_recalculates_without_duplicating_predictions(self):
        self.client.get(reverse('prediccion-list'))
        response = self.client.get(reverse('prediccion-list'))

        self.assertEqual(len(response.data), 1)

    def test_filters_predictions_and_rejects_invalid_query_params(self):
        response = self.client.get(
            reverse('prediccion-list'),
            {'producto': str(self.producto.id_producto), 'dias_maximos': '2'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(self.client.get(reverse('prediccion-list'), {'dias_maximos': '1'}).data, [])

        invalid = self.client.get(reverse('prediccion-list'), {'dias_maximos': 'tomorrow'})
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_products_are_excluded(self):
        self.producto.estado = False
        self.producto.save(update_fields=('estado',))

        response = self.client.get(reverse('prediccion-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
