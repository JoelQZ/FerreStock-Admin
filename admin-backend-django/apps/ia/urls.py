from django.urls import path

from .views import PrediccionReposicionListView

urlpatterns = [
    path('predicciones/', PrediccionReposicionListView.as_view(), name='prediccion-list'),
]
