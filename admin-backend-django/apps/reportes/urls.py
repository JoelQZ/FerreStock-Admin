from django.urls import path

from .views import (
    MovimientosCajaReporteView,
    ProductosMasVendidosView,
    VentasPorPeriodoView,
)

urlpatterns = [
    path('ventas/', VentasPorPeriodoView.as_view(), name='reporte-ventas'),
    path(
        'productos-mas-vendidos/',
        ProductosMasVendidosView.as_view(),
        name='reporte-productos-mas-vendidos',
    ),
    path(
        'movimientos-caja/',
        MovimientosCajaReporteView.as_view(),
        name='reporte-movimientos-caja',
    ),
]
