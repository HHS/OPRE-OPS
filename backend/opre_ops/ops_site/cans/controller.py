from __future__ import annotations

from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView

from opre_ops.ops_site.cans.models import CANFiscalYear
from opre_ops.ops_site.cans.models import CommonAccountingNumber


class CommonAccountingNumberSerializer(serializers.ModelSerializer):
    source = "fundingpartner.nickname"
    funding_source = serializers.ReadOnlyField(source=source)

    class Meta:
        model = CommonAccountingNumber
        fields = "__all__"
        depth = 1


class CanListController(ListAPIView):
    queryset = CommonAccountingNumber.objects.all()
    serializer_class = CommonAccountingNumberSerializer


class CanReadController(RetrieveAPIView):
    queryset = CommonAccountingNumber.objects.all()
    serializer_class = CommonAccountingNumberSerializer


class CANFiscalYearSerializer(serializers.ModelSerializer):
    can_lead = serializers.ReadOnlyField(source="person.id")

    class Meta:
        model = CANFiscalYear
        fields = "__all__"
        depth = 1


class CANFiscalYearByCanListController(ListAPIView):
    queryset = CANFiscalYear.objects.all()
    serializer_class = CANFiscalYearSerializer

    def get_queryset(self: CANFiscalYearByCanListController) -> list[CANFiscalYear]:
        return CANFiscalYear.objects.filter(
            can=self.kwargs["can_id"], fiscal_year=self.kwargs["fiscal_year"]
        )
