from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.usuarios.models import Rol, Usuario

from .models import Negocio


class ConfiguracionApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.create(nombre=Rol.Nombre.ADMINISTRADOR)
        cls.usuario = Usuario.objects.create_user(
            'config-admin',
            password='A-long-password-47!',
            rol=rol,
        )

    def setUp(self):
        self.client.force_authenticate(self.usuario)

    def test_get_returns_not_found_until_business_is_configured(self):
        response = self.client.get(reverse('negocio'))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_creates_and_get_and_patch_update_business_settings(self):
        url = reverse('negocio')
        response = self.client.put(
            url,
            {
                'nombre': 'FerreStock',
                'ruc': '20123456789',
                'direccion': 'Lima',
                'telefono': '999111222',
                'logo': 'logo.svg',
                'impresora': 'Ticketera',
                'igv_porcentaje': '18.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['igv_porcentaje'], '18.00')
        self.assertEqual(self.client.get(url).data['nombre'], 'FerreStock')

        patch = self.client.patch(url, {'igv_porcentaje': '18.50'}, format='json')
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        self.assertEqual(patch.data['igv_porcentaje'], '18.50')
        self.assertEqual(Negocio.objects.count(), 1)

    def test_rejects_invalid_tax_rate_and_ruc(self):
        url = reverse('negocio')
        response = self.client.put(
            url,
            {'nombre': 'FerreStock', 'ruc': '1234', 'igv_porcentaje': '101.00'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Negocio.objects.count(), 0)

    def test_endpoint_requires_authentication(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(reverse('negocio')).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_cashier_can_read_but_cannot_update_business(self):
        negocio = Negocio.objects.create(nombre='FerreStock')
        rol_cajero = Rol.objects.create(nombre=Rol.Nombre.CAJERO)
        cajero = Usuario.objects.create_user(
            'config-cajero',
            password='A-long-password-47!',
            rol=rol_cajero,
        )
        self.client.force_authenticate(cajero)

        url = reverse('negocio')
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)
        response = self.client.patch(url, {'nombre': 'Cambio no autorizado'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        negocio.refresh_from_db()
        self.assertEqual(negocio.nombre, 'FerreStock')

# Create your tests here.
