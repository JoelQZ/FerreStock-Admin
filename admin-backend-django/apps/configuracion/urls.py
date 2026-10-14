from django.urls import path

from .views import NegocioView

urlpatterns = [
    path('negocio/', NegocioView.as_view(), name='negocio'),
]
