from datetime import datetime, timezone
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.caja.models import MovimientoCaja, Turno
from apps.catalogo.models import Categoria, Marca, Producto, UnidadMedida
from apps.usuarios.models import Rol, Usuario
from apps.ventas.models import DetalleVenta, MetodoPago, Pago, TipoComprobante, Venta


class ReportesApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol_dueno = Rol.objects.create(nombre=Rol.Nombre.DUENO)
        cls.dueno = Usuario.objects.create_user(
            'dueno-reportes',
            password='A-long-password-47!',
            rol=rol_dueno,
        )
        rol_cajero = Rol.objects.create(nombre=Rol.Nombre.CAJERO)
        cls.cajero = Usuario.objects.create_user(
            'cajero-reportes',
            password='A-long-password-47!',
            rol=rol_cajero,
        )
        categoria = Categoria.objects.create(nombre='Reportes')
        marca = Marca.objects.create(nombre='Marca reportes')
        unidad = UnidadMedida.objects.create(nombre='Unidad reportes', abreviatura='und')
        cls.producto = Producto.objects.create(
            codigo='REP-001',
            nombre='Producto reporte',
            precio_compra='5.00',
            precio_venta='10.00',
            stock='10.000',
            categoria=categoria,
            marca=marca,
            unidad=unidad,
        )
        cls.turno = Turno.objects.create(
            usuario=cls.cajero,
            apertura=datetime(2026, 10, 13, 8, tzinfo=timezone.utc),
            monto_inicial=Decimal('20.00'),
        )
        comprobante = TipoComprobante.objects.create(nombre='Boleta reporte', serie='BR01')
        cls.efectivo = MetodoPago.objects.create(nombre='Efectivo')
        cls.venta = Venta.objects.create(
            fecha_hora=datetime(2026, 10, 13, 10, tzinfo=timezone.utc),
            subtotal=Decimal('20.00'),
            igv=Decimal('3.60'),
            total=Decimal('23.60'),
            usuario=cls.cajero,
            turno=cls.turno,
            tipo_comprobante=comprobante,
            serie='BR01',
            numero=1,
        )
        DetalleVenta.objects.create(
            venta=cls.venta,
            producto=cls.producto,
            cantidad=Decimal('2.000'),
            precio_unitario=Decimal('10.00'),
            subtotal=Decimal('20.00'),
        )
        Pago.objects.create(
            venta=cls.venta,
            metodo=cls.efectivo,
            monto=Decimal('23.60'),
            monto_recibido=Decimal('25.00'),
            vuelto=Decimal('1.40'),
        )
        MovimientoCaja.objects.create(
            turno=cls.turno,
            usuario=cls.cajero,
            tipo=MovimientoCaja.Tipo.INGRESO,
            monto=Decimal('5.00'),
            motivo='Fondo adicional',
            fecha=datetime(2026, 10, 13, 11, tzinfo=timezone.utc),
        )
        cls.venta_anulada = Venta.objects.create(
            fecha_hora=datetime(2026, 10, 13, 12, tzinfo=timezone.utc),
            subtotal=Decimal('10.00'),
            igv=Decimal('1.80'),
            total=Decimal('11.80'),
            estado=Venta.Estado.ANULADA,
            usuario=cls.cajero,
            turno=cls.turno,
            tipo_comprobante=comprobante,
            serie='BR01',
            numero=2,
        )

    def setUp(self):
        self.client.force_authenticate(self.dueno)

    def test_sales_report_aggregates_period_and_excludes_cancelled_sales(self):
        response = self.client.get(
            reverse('reporte-ventas'),
            {'desde': '2026-10-13', 'hasta': '2026-10-13'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['resumen']['cantidad_ventas'], 1)
        self.assertEqual(response.data['resumen']['total'], '23.60')
        self.assertEqual(response.data['periodos'][0]['fecha'], '2026-10-13')

    def test_top_products_report_aggregates_quantity_and_revenue(self):
        response = self.client.get(
            reverse('reporte-productos-mas-vendidos'),
            {'desde': '2026-10-13', 'hasta': '2026-10-13', 'limite': '5'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['productos'][0]['codigo'], 'REP-001')
        self.assertEqual(response.data['productos'][0]['cantidad_vendida'], '2.000')
        self.assertEqual(response.data['productos'][0]['total_vendido'], '20.00')

    def test_cash_movement_report_returns_totals_by_day_and_type(self):
        response = self.client.get(
            reverse('reporte-movimientos-caja'),
            {'desde': '2026-10-13', 'hasta': '2026-10-13'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['resumen']['cantidad_movimientos'], 1)
        self.assertEqual(response.data['resumen']['ingresos'], '5.00')
        self.assertEqual(response.data['resumen']['egresos'], '0.00')
        self.assertEqual(response.data['movimientos'][0]['tipo'], 'INGRESO')

    def test_reports_validate_dates_and_restrict_access_to_admin_or_owner(self):
        bad_period = self.client.get(
            reverse('reporte-ventas'),
            {'desde': '2026-10-14', 'hasta': '2026-10-13'},
        )
        self.assertEqual(bad_period.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.cajero)
        forbidden = self.client.get(reverse('reporte-ventas'))
        self.assertEqual(forbidden.status_code, status.HTTP_403_FORBIDDEN)


class ReportePrecisionTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        rol_dueno = Rol.objects.create(nombre=Rol.Nombre.DUENO)
        rol_cajero = Rol.objects.create(nombre=Rol.Nombre.CAJERO)
        cls.dueno = Usuario.objects.create_user(
            'dueno-precision',
            password='A-long-password-47!',
            rol=rol_dueno,
        )
        cls.cajero = Usuario.objects.create_user(
            'cajero-precision',
            password='A-long-password-47!',
            rol=rol_cajero,
        )
        cls.turno_a = Turno.objects.create(
            usuario=cls.cajero,
            apertura=datetime(2026, 10, 14, 13, tzinfo=timezone.utc),
            monto_inicial=Decimal('20.00'),
        )
        cls.turno_b = Turno.objects.create(
            usuario=cls.cajero,
            apertura=datetime(2026, 10, 14, 19, tzinfo=timezone.utc),
            monto_inicial=Decimal('30.00'),
        )
        cls.comprobante = TipoComprobante.objects.create(
            nombre='Boleta precision',
            serie='BP01',
        )
        cls.efectivo = MetodoPago.objects.create(nombre='Efectivo')
        cls.yape = MetodoPago.objects.create(nombre='Yape', requiere_codigo=True)

        venta_1 = cls.crear_venta(cls.turno_a, 1, '65.93', '11.87', '77.80', 15)
        Pago.objects.create(
            venta=venta_1,
            metodo=cls.efectivo,
            monto=Decimal('77.80'),
            monto_recibido=Decimal('100.00'),
            vuelto=Decimal('22.20'),
        )
        venta_2 = cls.crear_venta(cls.turno_a, 2, '42.37', '7.63', '50.00', 16)
        Pago.objects.create(
            venta=venta_2,
            metodo=cls.efectivo,
            monto=Decimal('20.00'),
            monto_recibido=Decimal('20.00'),
        )
        Pago.objects.create(
            venta=venta_2,
            metodo=cls.yape,
            monto=Decimal('30.00'),
            monto_recibido=Decimal('30.00'),
            codigo_operacion='YP-001',
        )
        venta_3 = cls.crear_venta(cls.turno_b, 3, '100.00', '18.00', '118.00', 20)
        Pago.objects.create(
            venta=venta_3,
            metodo=cls.yape,
            monto=Decimal('118.00'),
            monto_recibido=Decimal('118.00'),
            codigo_operacion='YP-002',
        )
        venta_anulada = cls.crear_venta(
            cls.turno_a,
            4,
            '25.42',
            '4.58',
            '30.00',
            17,
            Venta.Estado.ANULADA,
        )
        Pago.objects.create(
            venta=venta_anulada,
            metodo=cls.efectivo,
            monto=Decimal('30.00'),
            monto_recibido=Decimal('30.00'),
        )

    @classmethod
    def crear_venta(cls, turno, numero, subtotal, igv, total, hora, estado=Venta.Estado.COMPLETADA):
        return Venta.objects.create(
            fecha_hora=datetime(2026, 10, 14, hora, tzinfo=timezone.utc),
            subtotal=Decimal(subtotal),
            igv=Decimal(igv),
            total=Decimal(total),
            estado=estado,
            usuario=cls.cajero,
            turno=turno,
            tipo_comprobante=cls.comprobante,
            serie='BP01',
            numero=numero,
        )

    def setUp(self):
        self.client.force_authenticate(self.dueno)

    def pedir_reporte(self, **extra):
        params = {'desde': '2026-10-14', 'hasta': '2026-10-14'}
        params.update(extra)
        response = self.client.get(reverse('reporte-ventas'), params)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        return response

    def metodos(self, response):
        return {
            fila['metodo']: (fila['cantidad_pagos'], fila['total'])
            for fila in response.data['por_metodo_pago']
        }

    def test_report_matches_known_sales_totals_and_ignores_cancelled(self):
        response = self.pedir_reporte()

        resumen = response.data['resumen']
        self.assertEqual(resumen['cantidad_ventas'], 3)
        self.assertEqual(resumen['subtotal'], '208.30')
        self.assertEqual(resumen['igv'], '37.50')
        self.assertEqual(resumen['total'], '245.80')
        self.assertEqual(response.data['periodos'][0]['fecha'], '2026-10-14')
        self.assertEqual(response.data['periodos'][0]['total'], '245.80')

    def test_payment_breakdown_splits_mixed_payments_and_ignores_change(self):
        response = self.pedir_reporte()

        self.assertEqual(
            self.metodos(response),
            {'Efectivo': (2, '97.80'), 'Yape': (2, '148.00')},
        )

    def test_payment_breakdown_adds_up_to_sales_total(self):
        response = self.pedir_reporte()

        suma_metodos = sum(
            Decimal(fila['total']) for fila in response.data['por_metodo_pago']
        )
        self.assertEqual(suma_metodos, Decimal(response.data['resumen']['total']))

    def test_turno_filter_limits_sales_and_payments(self):
        turno_a = self.pedir_reporte(turno=self.turno_a.pk)
        self.assertEqual(turno_a.data['turno'], self.turno_a.pk)
        self.assertEqual(turno_a.data['resumen']['cantidad_ventas'], 2)
        self.assertEqual(turno_a.data['resumen']['subtotal'], '108.30')
        self.assertEqual(turno_a.data['resumen']['igv'], '19.50')
        self.assertEqual(turno_a.data['resumen']['total'], '127.80')
        self.assertEqual(
            self.metodos(turno_a),
            {'Efectivo': (2, '97.80'), 'Yape': (1, '30.00')},
        )

        turno_b = self.pedir_reporte(turno=self.turno_b.pk)
        self.assertEqual(turno_b.data['resumen']['cantidad_ventas'], 1)
        self.assertEqual(turno_b.data['resumen']['total'], '118.00')
        self.assertEqual(self.metodos(turno_b), {'Yape': (1, '118.00')})

    def test_unknown_turno_returns_an_empty_report(self):
        response = self.pedir_reporte(turno=999999)

        self.assertEqual(response.data['resumen']['cantidad_ventas'], 0)
        self.assertEqual(response.data['resumen']['total'], '0.00')
        self.assertEqual(response.data['por_metodo_pago'], [])

    def test_invalid_turno_is_rejected(self):
        for valor in ('0', 'abc'):
            response = self.client.get(reverse('reporte-ventas'), {'turno': valor})
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                valor,
            )