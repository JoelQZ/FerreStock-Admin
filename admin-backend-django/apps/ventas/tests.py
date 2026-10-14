from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.caja.models import Turno
from apps.catalogo.models import Categoria, Marca, Producto, UnidadMedida
from apps.configuracion.models import Negocio
from apps.inventario.models import MovimientoInventario
from apps.usuarios.models import Rol, Usuario

from .models import Cliente, DetalleVenta, MetodoPago, Pago, TipoComprobante, Venta


class VentasApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.create(nombre=Rol.Nombre.CAJERO)
        cls.usuario = Usuario.objects.create_user(
            'cajero-ventas',
            password='A-long-password-47!',
            rol=rol,
            nombre='Cajero',
        )
        categoria = Categoria.objects.create(nombre='Ventas')
        marca = Marca.objects.create(nombre='Marca ventas')
        unidad = UnidadMedida.objects.create(nombre='Unidad', abreviatura='und')
        cls.producto = Producto.objects.create(
            codigo='VEN-001',
            nombre='Producto venta',
            precio_compra='5.00',
            precio_venta='10.00',
            stock='10.000',
            categoria=categoria,
            marca=marca,
            unidad=unidad,
        )
        cls.efectivo = MetodoPago.objects.create(nombre='Efectivo')
        cls.yape = MetodoPago.objects.create(
            nombre='Yape',
            requiere_codigo=True,
        )
        cls.comprobante = TipoComprobante.objects.create(
            nombre='Boleta',
            serie='B001',
        )
        cls.cliente = Cliente.objects.create(
            tipo_documento=Cliente.TipoDocumento.DNI,
            numero_documento='12345678',
            nombre_razon_social='Cliente de prueba',
        )
        Negocio.objects.create(nombre='FerreStock', igv_porcentaje=Decimal('18.00'))

    def setUp(self):
        self.client.force_authenticate(self.usuario)
        self.turno = Turno.objects.create(
            usuario=self.usuario,
            apertura='2026-10-13T10:00:00Z',
            monto_inicial=Decimal('50.00'),
        )

    def payload(self, **overrides):
        payload = {
            'tipo_comprobante': self.comprobante.id_tipo,
            'cliente': self.cliente.id_cliente,
            'detalles': [
                {'producto': self.producto.id_producto, 'cantidad': '2.000'},
            ],
            'pagos': [
                {
                    'metodo': self.efectivo.id_metodo,
                    'monto': '20.00',
                    'monto_recibido': '25.00',
                },
            ],
        }
        payload.update(overrides)
        return payload

    def test_sale_calculates_tax_records_payments_and_decrements_stock(self):
        response = self.client.post(
            reverse('venta-list'),
            self.payload(),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['subtotal'], '16.95')
        self.assertEqual(response.data['igv'], '3.05')
        self.assertEqual(response.data['total'], '20.00')
        self.assertEqual(response.data['numero'], 1)
        self.assertEqual(len(response.data['detalles']), 1)
        self.assertEqual(len(response.data['pagos']), 1)
        self.assertEqual(response.data['pagos'][0]['vuelto'], '5.00')
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, Decimal('8.000'))
        self.assertEqual(
            MovimientoInventario.objects.get(venta_id=response.data['id_venta']).tipo,
            MovimientoInventario.Tipo.SALIDA,
        )
        self.comprobante.refresh_from_db()
        self.assertEqual(self.comprobante.correlativo_actual, 1)

    def test_mixed_payments_are_reflected_in_cash_shift_summary(self):
        response = self.client.post(
            reverse('venta-list'),
            self.payload(pagos=[
                {
                    'metodo': self.efectivo.id_metodo,
                    'monto': '10.00',
                    'monto_recibido': '11.00',
                },
                {
                    'metodo': self.yape.id_metodo,
                    'monto': '10.00',
                    'codigo_operacion': 'YAPE-010',
                },
            ]),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        summary = self.client.get(reverse('turno-resumen', args=(self.turno.pk,)))

        self.assertEqual(summary.status_code, status.HTTP_200_OK)
        self.assertEqual(summary.data['ventas'], 1)
        self.assertEqual(summary.data['ventas_total'], '20.00')
        self.assertEqual(summary.data['efectivo_ventas'], '10.00')
        self.assertEqual(summary.data['otros_pagos'], '10.00')
        self.assertEqual(summary.data['monto_esperado'], '60.00')

    def test_mixed_payments_require_exact_total_and_operation_code(self):
        response = self.client.post(
            reverse('venta-list'),
            self.payload(pagos=[
                {'metodo': self.efectivo.id_metodo, 'monto': '10.00'},
                {'metodo': self.yape.id_metodo, 'monto': '10.00'},
            ]),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Venta.objects.count(), 0)

        response = self.client.post(
            reverse('venta-list'),
            self.payload(pagos=[
                {'metodo': self.efectivo.id_metodo, 'monto': '10.00'},
                {
                    'metodo': self.yape.id_metodo,
                    'monto': '10.00',
                    'codigo_operacion': 'YAPE-001',
                },
            ]),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_sale_requires_an_open_turn_and_sufficient_stock(self):
        self.turno.estado = Turno.Estado.CERRADO
        self.turno.save(update_fields=('estado',))
        response = self.client.post(reverse('venta-list'), self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.turno.estado = Turno.Estado.ABIERTO
        self.turno.save(update_fields=('estado',))
        response = self.client.post(
            reverse('venta-list'),
            self.payload(detalles=[
                {'producto': self.producto.id_producto, 'cantidad': '11.000'},
            ]),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Venta.objects.count(), 0)
        self.assertEqual(MovimientoInventario.objects.count(), 0)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, Decimal('10.000'))

    def test_sale_transaction_rolls_back_stock_and_correlativo_on_payment_error(self):
        response = self.client.post(
            reverse('venta-list'),
            self.payload(pagos=[
                {'metodo': self.efectivo.id_metodo, 'monto': '19.00'},
            ]),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Venta.objects.count(), 0)
        self.assertEqual(DetalleVenta.objects.count(), 0)
        self.assertEqual(Pago.objects.count(), 0)
        self.assertEqual(MovimientoInventario.objects.count(), 0)
        self.producto.refresh_from_db()
        self.comprobante.refresh_from_db()
        self.assertEqual(self.producto.stock, Decimal('10.000'))
        self.assertEqual(self.comprobante.correlativo_actual, 0)

    def test_sale_cancellation_restores_stock_and_cannot_repeat(self):
        response = self.client.post(reverse('venta-list'), self.payload(), format='json')
        venta_id = response.data['id_venta']

        cancel = self.client.post(
            reverse('venta-anular', args=(venta_id,)),
            {'motivo': 'Devolución de mercadería'},
            format='json',
        )

        self.assertEqual(cancel.status_code, status.HTTP_200_OK, cancel.data)
        self.assertEqual(cancel.data['estado'], Venta.Estado.ANULADA)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, Decimal('10.000'))
        self.assertEqual(
            MovimientoInventario.objects.filter(venta_id=venta_id).count(),
            2,
        )
        second_cancel = self.client.post(
            reverse('venta-anular', args=(venta_id,)),
            {'motivo': 'Repetición'},
            format='json',
        )
        self.assertEqual(second_cancel.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_and_read_only_reference_endpoints(self):
        clients_url = reverse('cliente-list')
        client_response = self.client.post(
            clients_url,
            {
                'tipo_documento': 'DNI',
                'numero_documento': '87654321',
                'nombre_razon_social': 'Otro cliente',
            },
            format='json',
        )
        self.assertEqual(client_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            self.client.get(reverse('metodo-pago-list')).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.post(
                reverse('metodo-pago-list'),
                {'nombre': 'Tarjeta'},
                format='json',
            ).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

# Create your tests here.
