from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.usuarios.models import Rol, Usuario

from .models import MovimientoCaja, Turno


class CajaApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.create(nombre=Rol.Nombre.CAJERO)
        cls.usuario = Usuario.objects.create_user(
            'cajero-caja',
            password='A-long-password-47!',
            rol=rol,
            nombre='Cajero',
        )

    def setUp(self):
        self.client.force_authenticate(self.usuario)

    def abrir_turno(self, monto='50.00'):
        return self.client.post(
            reverse('turno-abrir'),
            {'monto_inicial': monto},
            format='json',
        )

    def test_open_turn_requires_positive_or_zero_amount_and_only_one_open(self):
        response = self.abrir_turno()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['estado'], Turno.Estado.ABIERTO)
        self.assertEqual(response.data['monto_inicial'], '50.00')
        self.assertEqual(self.abrir_turno().status_code, status.HTTP_400_BAD_REQUEST)

    def test_open_turn_rejects_negative_amount(self):
        response = self.abrir_turno('-1.00')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Turno.objects.count(), 0)

    def test_cash_movements_are_attached_to_open_turn_and_summarized(self):
        self.abrir_turno()
        response = self.client.post(
            reverse('movimiento-caja-list'),
            {'tipo': 'INGRESO', 'monto': '10.00', 'motivo': 'Cambio inicial'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['usuario'], self.usuario.id)
        self.assertIsNotNone(response.data['turno'])
        resumen = self.client.get(
            reverse('turno-resumen', args=(response.data['turno'],))
        )
        self.assertEqual(resumen.status_code, status.HTTP_200_OK)
        self.assertEqual(resumen.data['ingresos_caja'], '10.00')
        self.assertEqual(resumen.data['monto_esperado'], '60.00')

    def test_movimiento_requires_open_turn_and_positive_amount(self):
        url = reverse('movimiento-caja-list')
        no_turno = self.client.post(
            url,
            {'tipo': 'EGRESO', 'monto': '2.00', 'motivo': 'Compra menor'},
            format='json',
        )
        self.assertEqual(no_turno.status_code, status.HTTP_400_BAD_REQUEST)

        self.abrir_turno()
        invalid = self.client.post(
            url,
            {'tipo': 'EGRESO', 'monto': '0.00', 'motivo': 'Compra menor'},
            format='json',
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(MovimientoCaja.objects.count(), 0)

    def test_close_calculates_expected_cash_and_difference(self):
        turno = Turno.objects.create(
            usuario=self.usuario,
            apertura='2026-10-13T10:00:00Z',
            monto_inicial=Decimal('50.00'),
        )
        MovimientoCaja.objects.create(
            turno=turno,
            usuario=self.usuario,
            tipo=MovimientoCaja.Tipo.INGRESO,
            monto=Decimal('10.00'),
            motivo='Ingreso',
            fecha='2026-10-13T11:00:00Z',
        )
        MovimientoCaja.objects.create(
            turno=turno,
            usuario=self.usuario,
            tipo=MovimientoCaja.Tipo.EGRESO,
            monto=Decimal('3.00'),
            motivo='Egreso',
            fecha='2026-10-13T11:00:00Z',
        )

        response = self.client.post(
            reverse('turno-cerrar'),
            {'monto_real': '60.00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['monto_esperado'], '57.00')
        self.assertEqual(response.data['diferencia'], '3.00')
        self.assertEqual(response.data['estado'], Turno.Estado.CERRADO)
        self.assertEqual(
            self.client.post(
                reverse('turno-cerrar'),
                {'monto_real': '60.00'},
                format='json',
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

# Create your tests here.
