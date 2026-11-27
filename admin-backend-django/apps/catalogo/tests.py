from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.usuarios.models import Rol, Usuario

from .models import Categoria, Marca, Producto, UnidadMedida


class CatalogoApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.create(nombre=Rol.Nombre.ADMINISTRADOR)
        cls.usuario = Usuario.objects.create_user(
            'catalogo-admin',
            password='A-long-password-47!',
            rol=rol,
        )
        cls.categoria = Categoria.objects.create(nombre='Herramientas')
        cls.marca = Marca.objects.create(nombre='Marca de prueba')
        cls.unidad = UnidadMedida.objects.create(nombre='Unidad', abreviatura='und')

    def setUp(self):
        self.client.force_authenticate(self.usuario)

    def producto_payload(self, **overrides):
        payload = {
            'codigo': 'TAL-001',
            'nombre': 'Taladro',
            'descripcion': '',
            'precio_compra': '50.00',
            'precio_venta': '75.00',
            'stock_minimo': '2.000',
            'categoria': self.categoria.id_categoria,
            'marca': self.marca.id_marca,
            'unidad': self.unidad.id_unidad,
        }
        payload.update(overrides)
        return payload

    def test_product_crud_uses_soft_delete_and_inventory_controls_stock(self):
        response = self.client.post(
            reverse('producto-list'),
            self.producto_payload(stock='12.000'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['stock'], '0.000')
        product = Producto.objects.get(codigo='TAL-001')

        detail_url = reverse('producto-detail', args=(product.id_producto,))
        delete_response = self.client.delete(detail_url)

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        product.refresh_from_db()
        self.assertFalse(product.estado)
        self.assertEqual(self.client.get(detail_url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.get(reverse('producto-list'), {'todos': '1'}).data[0]['estado'],
            False,
        )

    def test_product_filters_by_category_and_searches_code_or_name(self):
        matching = Producto.objects.create(
            codigo='CAB-010',
            nombre='Cable eléctrico',
            precio_compra='10.00',
            precio_venta='15.00',
            categoria=self.categoria,
            marca=self.marca,
            unidad=self.unidad,
        )
        Producto.objects.create(
            codigo='PIN-010',
            nombre='Pinza',
            precio_compra='12.00',
            precio_venta='18.00',
            categoria=self.categoria,
            marca=self.marca,
            unidad=self.unidad,
        )

        response = self.client.get(
            reverse('producto-list'),
            {'categoria': str(self.categoria.id_categoria), 'buscar': 'CAB'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['id_producto'] for item in response.data], [matching.id_producto])

    def test_invalid_category_filter_returns_bad_request(self):
        response = self.client.get(reverse('producto-list'), {'categoria': 'not-an-id'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_category_and_brand_delete_are_soft_deletes(self):
        category_url = reverse('categoria-detail', args=(self.categoria.id_categoria,))
        brand_url = reverse('marca-detail', args=(self.marca.id_marca,))

        self.assertEqual(
            self.client.delete(category_url).status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertEqual(
            self.client.delete(brand_url).status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.categoria.refresh_from_db()
        self.marca.refresh_from_db()
        self.assertFalse(self.categoria.estado)
        self.assertFalse(self.marca.estado)

    def test_units_can_be_created_and_edited_but_not_deleted(self):
        url = reverse('unidad-medida-list')

        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        creada = self.client.post(url, {'nombre': 'Metro', 'abreviatura': 'm'}, format='json')
        self.assertEqual(creada.status_code, status.HTTP_201_CREATED)

        detalle = reverse('unidad-medida-detail', args=(creada.data['id_unidad'],))
        editada = self.client.patch(detalle, {'abreviatura': 'mt'}, format='json')
        self.assertEqual(editada.status_code, status.HTTP_200_OK)
        self.assertEqual(editada.data['abreviatura'], 'mt')
        self.assertEqual(self.client.delete(detalle).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        repetida = self.client.post(url, {'nombre': 'metro', 'abreviatura': 'm'}, format='json')
        self.assertEqual(repetida.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_brand_names_are_unique_and_inactive_brands_are_hidden(self):
        url = reverse('marca-list')

        repetida = self.client.post(url, {'nombre': 'marca de prueba'}, format='json')
        self.assertEqual(repetida.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.delete(reverse('marca-detail', args=(self.marca.id_marca,)))
        self.assertEqual(self.client.get(url).data, [])
        self.assertEqual(len(self.client.get(url, {'todos': 1}).data), 1)

    def test_cashier_can_read_catalog_but_cannot_modify_it(self):
        cajero = Usuario.objects.create_user(
            'catalogo-cajero',
            password='A-long-password-47!',
            rol=Rol.objects.create(nombre=Rol.Nombre.CAJERO),
        )
        self.client.force_authenticate(cajero)

        self.assertEqual(self.client.get(reverse('categoria-list')).status_code, status.HTTP_200_OK)
        for nombre_url, datos in (
            ('categoria-list', {'nombre': 'Jardinería'}),
            ('marca-list', {'nombre': 'Truper'}),
            ('unidad-medida-list', {'nombre': 'Litro', 'abreviatura': 'l'}),
            ('producto-list', self.producto_payload()),
        ):
            respuesta = self.client.post(reverse(nombre_url), datos, format='json')
            self.assertEqual(respuesta.status_code, status.HTTP_403_FORBIDDEN, nombre_url)

# Create your tests here.

    def test_product_search_filter_uses_search_param(self):
        self.client.post(reverse('producto-list'), self.producto_payload(), format='json')
        self.client.post(
            reverse('producto-list'),
            self.producto_payload(codigo='MAR-001', nombre='Martillo'),
            format='json',
        )

        response = self.client.get(reverse('producto-list'), {'search': 'martillo'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['codigo'] for item in response.data], ['MAR-001'])

    def test_next_code_uses_category_prefix_and_highest_number(self):
        url = reverse('producto-siguiente-codigo')
        electricidad = Categoria.objects.create(nombre='Electricidad')
        manuales = Categoria.objects.create(nombre='Herramientas manuales')

        self.assertEqual(self.client.get(url, {'categoria': electricidad.id_categoria}).data['codigo'], 'ELEC-0001')
        self.assertEqual(self.client.get(url, {'categoria': manuales.id_categoria}).data['codigo'], 'HEMA-0001')

        self.client.post(
            reverse('producto-list'),
            self.producto_payload(codigo='ELEC-0007', categoria=electricidad.id_categoria),
            format='json',
        )
        self.client.post(
            reverse('producto-list'),
            self.producto_payload(codigo='7751234567890', nombre='Cable', categoria=electricidad.id_categoria),
            format='json',
        )

        response = self.client.get(url, {'categoria': electricidad.id_categoria})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['codigo'], 'ELEC-0008')
        self.assertEqual(self.client.get(url, {'categoria': 'abc'}).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.get(url, {'categoria': 9999}).status_code, status.HTTP_404_NOT_FOUND)
