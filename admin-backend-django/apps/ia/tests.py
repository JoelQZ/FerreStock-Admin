from datetime import datetime, timezone
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.catalogo.models import Categoria, Marca, Producto, UnidadMedida
from apps.usuarios.models import Rol, Usuario

from .models import PrediccionReposicion


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
        cls.producto = Producto.objects.create(
            codigo='IA-001',
            nombre='Producto con predicción',
            precio_compra='5.00',
            precio_venta='10.00',
            stock=Decimal('2.000'),
            stock_minimo=Decimal('3.000'),
            categoria=categoria,
            marca=marca,
            unidad=unidad,
        )
        cls.prediccion = PrediccionReposicion.objects.create(
            producto=cls.producto,
            fecha_calculo=datetime(2026, 10, 13, tzinfo=timezone.utc),
            demanda_estimada=Decimal('1.250'),
            dias_para_agotarse=2,
            cantidad_sugerida=Decimal('8.000'),
        )

    def setUp(self):
        self.client.force_authenticate(self.usuario)

    def test_lists_prediction_with_current_product_stock(self):
        response = self.client.get(reverse('prediccion-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['producto_codigo'], 'IA-001')
        self.assertEqual(response.data[0]['stock_actual'], '2.000')
        self.assertEqual(response.data[0]['cantidad_sugerida'], '8.000')

    def test_filters_predictions_and_rejects_invalid_query_params(self):
        response = self.client.get(
            reverse('prediccion-list'),
            {'producto': str(self.producto.id_producto), 'dias_maximos': '2'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        invalid = self.client.get(reverse('prediccion-list'), {'dias_maximos': 'tomorrow'})
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_products_are_excluded(self):
        self.producto.estado = False
        self.producto.save(update_fields=('estado',))

        response = self.client.get(reverse('prediccion-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

# Create your tests here.
