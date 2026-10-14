from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import IngresoListCreateView, KardexListView, ProveedorViewSet

router = DefaultRouter()
router.register('proveedores', ProveedorViewSet, basename='proveedor')

urlpatterns = [
    path('ingresos/', IngresoListCreateView.as_view(), name='ingreso-list'),
    path('kardex/', KardexListView.as_view(), name='kardex-list'),
    *router.urls,
]
