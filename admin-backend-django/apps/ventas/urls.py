from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AnularVentaView,
    ClienteViewSet,
    MetodoPagoViewSet,
    TipoComprobanteViewSet,
    VentaDetailView,
    VentaListCreateView,
)

router = DefaultRouter()
router.register('clientes', ClienteViewSet, basename='cliente')
router.register('comprobantes', TipoComprobanteViewSet, basename='tipo-comprobante')
router.register('metodos-pago', MetodoPagoViewSet, basename='metodo-pago')

urlpatterns = [
    path('ventas/', VentaListCreateView.as_view(), name='venta-list'),
    path('ventas/<int:pk>/', VentaDetailView.as_view(), name='venta-detail'),
    path('ventas/<int:pk>/anular/', AnularVentaView.as_view(), name='venta-anular'),
    *router.urls,
]
