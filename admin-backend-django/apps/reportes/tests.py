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

    def test_sales_report_matches_payments_by_method_shift_and_lima_date(self):
        yape = MetodoPago.objects.create(nombre='Yape', requiere_codigo=True)
        turno_noche = Turno.objects.create(
            usuario=self.cajero,
            apertura=datetime(2026, 10, 13, 22, tzinfo=timezone.utc),
            monto_inicial=Decimal('0.00'),
        )
        venta_noche = Venta.objects.create(
            fecha_hora=datetime(2026, 10, 14, 1, tzinfo=timezone.utc),
            subtotal=Decimal('25.42'),
            igv=Decimal('4.58'),
            total=Decimal('30.00'),
            usuario=self.cajero,
            turno=turno_noche,
            tipo_comprobante=self.venta.tipo_comprobante,
            serie='BR01',
            numero=3,
        )
        Pago.objects.create(
            venta=venta_noche,
            metodo=self.efectivo,
            monto=Decimal('10.00'),
            monto_recibido=Decimal('10.00'),
        )
        Pago.objects.create(
            venta=venta_noche,
            metodo=yape,
            monto=Decimal('20.00'),
            monto_recibido=Decimal('20.00'),
            codigo_operacion='YAPE-001',
        )

        response = self.client.get(
            reverse('reporte-ventas'),
            {'desde': '2026-10-13', 'hasta': '2026-10-13'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['resumen']['cantidad_ventas'], 2)
        self.assertEqual(response.data['resumen']['total'], '53.60')
        por_metodo = {fila['metodo']: fila for fila in response.data['por_metodo_pago']}
        self.assertEqual(por_metodo['Efectivo']['total'], '33.60')
        self.assertEqual(por_metodo['Efectivo']['cantidad_ventas'], 2)
        self.assertEqual(por_metodo['Yape']['total'], '20.00')
        self.assertEqual(por_metodo['Yape']['cantidad_ventas'], 1)
        suma_metodos = sum(Decimal(fila['total']) for fila in response.data['por_metodo_pago'])
        self.assertEqual(suma_metodos, Decimal(response.data['resumen']['total']))

        response = self.client.get(reverse('reporte-ventas'), {'turno': turno_noche.pk})

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['resumen']['cantidad_ventas'], 1)
        self.assertEqual(response.data['resumen']['total'], '30.00')

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

# Create your tests here.
