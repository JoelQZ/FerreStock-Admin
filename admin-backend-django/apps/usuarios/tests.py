from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from .models import Rol, Usuario


class UsuarioApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.rol_admin = Rol.objects.create(
            nombre=Rol.Nombre.ADMINISTRADOR,
            descripcion='Administra el sistema',
        )
        cls.rol_cajero = Rol.objects.create(nombre=Rol.Nombre.CAJERO)
        cls.admin = Usuario.objects.create_user(
            'admin',
            password='A-long-password-47!',
            nombre='Administradora',
            rol=cls.rol_admin,
        )
        cls.cajero = Usuario.objects.create_user(
            'cajero',
            password='A-long-password-47!',
            nombre='Cajero de prueba',
            rol=cls.rol_cajero,
        )

    def authenticate_as_admin(self):
        refresh = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_login_returns_tokens_and_uses_usuario_as_username(self):
        response = self.client.post(
            reverse('auth-login'),
            {'usuario': 'admin', 'password': 'A-long-password-47!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(AccessToken(response.data['access'])['rol'], Rol.Nombre.ADMINISTRADOR)
        self.assertEqual(AccessToken(response.data['access'])['usuario'], 'admin')

    def test_inactive_user_cannot_obtain_tokens(self):
        self.cajero.estado = False
        self.cajero.save(update_fields=('estado',))

        response = self.client.post(
            reverse('auth-login'),
            {'usuario': 'cajero', 'password': 'A-long-password-47!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_yo_requires_authentication_and_returns_user_profile(self):
        url = reverse('auth-yo')
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        self.authenticate_as_admin()
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {
                'id': self.admin.id,
                'nombre': 'Administradora',
                'usuario': 'admin',
                'rol': Rol.Nombre.ADMINISTRADOR,
            },
        )

    def test_session_authentication_can_access_yo(self):
        self.client.force_login(self.cajero)

        response = self.client.get(reverse('auth-yo'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['usuario'], 'cajero')

    def test_admin_can_create_user_without_exposing_password(self):
        self.authenticate_as_admin()

        response = self.client.post(
            reverse('usuario-list'),
            {
                'nombre': 'Nueva persona',
                'usuario': 'nuevo',
                'rol': self.rol_cajero.id,
                'password': 'A-different-password-83!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('password', response.data)
        user = Usuario.objects.get(usuario='nuevo')
        self.assertTrue(user.check_password('A-different-password-83!'))

    def test_non_admin_cannot_manage_users(self):
        refresh = RefreshToken.for_user(self.cajero)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        response = self.client.get(reverse('usuario-list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_deleting_user_deactivates_instead_of_removing(self):
        self.authenticate_as_admin()

        response = self.client.delete(reverse('usuario-detail', args=(self.cajero.id,)))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.cajero.refresh_from_db()
        self.assertFalse(self.cajero.estado)

    def test_refresh_rejects_inactive_user(self):
        refresh = RefreshToken.for_user(self.cajero)
        self.cajero.estado = False
        self.cajero.save(update_fields=('estado',))

        response = self.client.post(
            reverse('auth-refresh'),
            {'refresh': str(refresh)},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_role_cannot_be_deleted_while_assigned(self):
        self.authenticate_as_admin()

        response = self.client.delete(reverse('rol-detail', args=(self.rol_cajero.id,)))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
