from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.catalogo.models import Categoria, Marca, Producto, UnidadMedida
from apps.usuarios.models import Rol, Usuario

from .models import DetalleIngreso, Ingreso, MovimientoInventario, Proveedor


class InventarioApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.create(nombre=Rol.Nombre.ADMINISTRADOR)
        cls.usuario = Usuario.objects.create_user(
            'inventario-admin',
            password='A-long-password-47!',
            rol=rol,
        )
        cls.categoria = Categoria.objects.create(nombre='Materiales')
        cls.marca = Marca.objects.create(nombre='Marca de inventario')
        cls.unidad = UnidadMedida.objects.create(nombre='Metro', abreviatura='m')
        cls.producto = Producto.objects.create(
            codigo='CAB-001',
            nombre='Cable',
            precio_compra='2.00',
            precio_venta='3.00',
            stock='2.000',
            categoria=cls.categoria,
            marca=cls.marca,
            unidad=cls.unidad,
        )
        cls.proveedor = Proveedor.objects.create(
            ruc='20123456789',
            razon_social='Proveedor de prueba',
        )

    def setUp(self):
        self.client.force_authenticate(self.usuario)

    def test_supplier_crud_and_delete_are_soft(self):
        response = self.client.post(
            reverse('proveedor-list'),
            {'ruc': '20987654321', 'razon_social': 'Nuevo proveedor'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        supplier_id = response.data['id_proveedor']
        detail_url = reverse('proveedor-detail', args=(supplier_id,))
        delete_response = self.client.delete(detail_url)

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        supplier = Proveedor.objects.get(pk=supplier_id)
        self.assertFalse(supplier.estado)
        self.assertEqual(self.client.patch(detail_url, {'estado': True}).status_code, 200)

    def test_supplier_ruc_must_contain_eleven_digits(self):
        response = self.client.post(
            reverse('proveedor-list'),
            {'ruc': '1234', 'razon_social': 'RUC inválido'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Proveedor.objects.filter(razon_social='RUC inválido').exists())

    def test_income_creates_details_updates_stock_and_records_ledger_atomically(self):
        response = self.client.post(
            reverse('ingreso-list'),
            {
                'proveedor': self.proveedor.id_proveedor,
                'nro_documento': 'FACT-001',
                'detalles': [
                    {
                        'producto': self.producto.id_producto,
                        'cantidad': '1.250',
                        'costo_unitario': '2.00',
                    },
                    {
                        'producto': self.producto.id_producto,
                        'cantidad': '0.500',
                        'costo_unitario': '3.00',
                    },
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['total'], '4.00')
        self.assertEqual(len(response.data['items']), 2)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, Decimal('3.750'))
        self.assertEqual(DetalleIngreso.objects.count(), 2)
        self.assertEqual(MovimientoInventario.objects.count(), 2)
        movimientos = list(MovimientoInventario.objects.order_by('id_movimiento'))
        self.assertEqual(movimientos[0].stock_anterior, Decimal('2.000'))
        self.assertEqual(movimientos[0].stock_nuevo, Decimal('3.250'))
        self.assertEqual(movimientos[1].stock_anterior, Decimal('3.250'))
        self.assertEqual(movimientos[1].stock_nuevo, Decimal('3.750'))

    def test_income_requires_at_least_one_detail(self):
        response = self.client.post(
            reverse('ingreso-list'),
            {
                'proveedor': self.proveedor.id_proveedor,
                'nro_documento': 'FACT-002',
                'detalles': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Ingreso.objects.count(), 0)

    def test_overflow_rolls_back_income_details_stock_and_ledger(self):
        self.producto.stock = Decimal('9999999.999')
        self.producto.save(update_fields=('stock',))

        response = self.client.post(
            reverse('ingreso-list'),
            {
                'proveedor': self.proveedor.id_proveedor,
                'nro_documento': 'FACT-003',
                'detalles': [
                    {
                        'producto': self.producto.id_producto,
                        'cantidad': '1.000',
                        'costo_unitario': '2.00',
                    },
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Ingreso.objects.count(), 0)
        self.assertEqual(DetalleIngreso.objects.count(), 0)
        self.assertEqual(MovimientoInventario.objects.count(), 0)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, Decimal('9999999.999'))

    def test_kardex_is_read_only_and_requires_authentication(self):
        response = self.client.get(reverse('kardex-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(reverse('kardex-list'), {}, format='json').status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(reverse('kardex-list')).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

# Create your tests here.
