from rest_framework.routers import DefaultRouter

from .views import (
    CategoriaViewSet,
    MarcaViewSet,
    ProductoViewSet,
    UnidadMedidaViewSet,
)

router = DefaultRouter()
router.register('categorias', CategoriaViewSet, basename='categoria')
router.register('marcas', MarcaViewSet, basename='marca')
router.register('unidades', UnidadMedidaViewSet, basename='unidad-medida')
router.register('productos', ProductoViewSet, basename='producto')

urlpatterns = router.urls
