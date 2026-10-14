from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MovimientoCaja, Turno
from .serializers import (
    CierreTurnoSerializer,
    MontoPositivoSerializer,
    MovimientoCajaSerializer,
    ResumenTurnoSerializer,
    TurnoSerializer,
    cerrar_turno,
    obtener_resumen_turno,
)

Usuario = get_user_model()


class TurnoListView(generics.ListAPIView):
    serializer_class = TurnoSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = Turno.objects.select_related('usuario')
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(usuario=self.request.user)


class AbrirTurnoView(APIView):
    permission_classes = (IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        serializer = MontoPositivoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        Usuario.objects.select_for_update().get(pk=request.user.pk)
        if Turno.objects.filter(
            usuario=request.user,
            estado=Turno.Estado.ABIERTO,
        ).exists():
            raise ValidationError({'turno': 'Ya tienes un turno de caja abierto.'})

        turno = Turno.objects.create(
            usuario=request.user,
            apertura=timezone.now(),
            monto_inicial=serializer.validated_data['monto_inicial'],
            estado=Turno.Estado.ABIERTO,
        )
        return Response(TurnoSerializer(turno).data, status=status.HTTP_201_CREATED)


class CerrarTurnoView(APIView):
    permission_classes = (IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        serializer = CierreTurnoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        turno = Turno.objects.select_for_update().filter(
            usuario=request.user,
            estado=Turno.Estado.ABIERTO,
        ).first()
        if turno is None:
            raise ValidationError({'turno': 'No tienes un turno de caja abierto.'})

        turno, _ = cerrar_turno(turno, serializer.validated_data['monto_real'])
        return Response(TurnoSerializer(turno).data)


class ResumenTurnoView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        turno = get_object_or_404(
            Turno.objects.select_related('usuario'),
            pk=pk,
        )
        if turno.usuario_id != request.user.pk and not request.user.is_superuser:
            raise PermissionDenied('No tienes permiso para consultar este turno.')
        return Response(ResumenTurnoSerializer(obtener_resumen_turno(turno)).data)


class MovimientoCajaListCreateView(generics.ListCreateAPIView):
    serializer_class = MovimientoCajaSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = MovimientoCaja.objects.select_related('turno', 'usuario')
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(Q(usuario=self.request.user) | Q(turno__usuario=self.request.user))

    def perform_create(self, serializer):
        serializer.save()

# Create your views here.
