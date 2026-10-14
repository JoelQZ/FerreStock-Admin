from django.urls import path

from .views import (
    AbrirTurnoView,
    CerrarTurnoView,
    MovimientoCajaListCreateView,
    ResumenTurnoView,
    TurnoListView,
)

urlpatterns = [
    path('turnos/', TurnoListView.as_view(), name='turno-list'),
    path('turnos/abrir/', AbrirTurnoView.as_view(), name='turno-abrir'),
    path('turnos/cerrar/', CerrarTurnoView.as_view(), name='turno-cerrar'),
    path('turnos/<int:pk>/resumen/', ResumenTurnoView.as_view(), name='turno-resumen'),
    path('movimientos/', MovimientoCajaListCreateView.as_view(), name='movimiento-caja-list'),
]
