from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView

from opre_ops.ops_site.cans.models import CAN, CANFiscalYear


class CANSerializer(serializers.ModelSerializer):
    source = "fundingpartner.nickname"
    funding_source = serializers.ReadOnlyField(source=source)

    class Meta:
        model = CAN
        fields = "__all__"
        depth = 1


class CanListController(ListAPIView):
    queryset = CAN.objects.all()
    serializer_class = CANSerializer


class CanReadController(RetrieveAPIView):
    queryset = CAN.objects.all()
    serializer_class = CANSerializer


class CANFiscalYearSerializer(serializers.ModelSerializer):
    can_lead = serializers.ReadOnlyField(source="person.id")

    class Meta:
        model = CANFiscalYear
        fields = "__all__"
        depth = 1


class CANFiscalYearByCanListController(ListAPIView):
    queryset = CANFiscalYear.objects.all()
    serializer_class = CANFiscalYearSerializer

    def get_queryset(self) -> list[CANFiscalYear]:
        return CANFiscalYear.objects.filter(
            can=self.kwargs["can_id"], fiscal_year=self.kwargs["fiscal_year"]
        )
