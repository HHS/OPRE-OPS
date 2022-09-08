from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView

from opre_ops.ops_site.cans.controller import CANSerializer
from opre_ops.ops_site.portfolios.models import Portfolio


class PortfolioSerializer(serializers.ModelSerializer):
    cans = CANSerializer(many=True, read_only=True)

    class Meta:
        model = Portfolio
        fields = "__all__"
        depth = 1


class PortfolioListController(ListAPIView):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer


class PortfolioReadController(RetrieveAPIView):
    queryset = Portfolio.objects.prefetch_related("cans")
    serializer_class = PortfolioSerializer
