from ops_api.ops.cans.controller import CANSerializer
from ops_api.ops.portfolios.models import Portfolio
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView


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


class PortfolioFundingView(APIView):
    queryset = Portfolio.objects.all()

    def get(self, request, pk):
        portfolio = self.queryset.get(pk=pk)
        return Response({"total_funding": portfolio.current_fiscal_year_funding})
