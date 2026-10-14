from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import PrediccionReposicion
from .serializers import FiltroPrediccionSerializer, PrediccionReposicionSerializer


class PrediccionReposicionListView(generics.ListAPIView):
    serializer_class = PrediccionReposicionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        filtros = FiltroPrediccionSerializer(data=self.request.query_params)
        filtros.is_valid(raise_exception=True)
        queryset = PrediccionReposicion.objects.select_related('producto').filter(
            producto__estado=True
        )

        producto = filtros.validated_data.get('producto')
        if producto is not None:
            queryset = queryset.filter(producto_id=producto)

        dias_maximos = filtros.validated_data.get('dias_maximos')
        if dias_maximos is not None:
            queryset = queryset.filter(dias_para_agotarse__lte=dias_maximos)

        return queryset
