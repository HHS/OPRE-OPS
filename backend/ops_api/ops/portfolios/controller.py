from django.db.models import Sum
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from ops_api.ops.cans.controller import CANSerializer
from ops_api.ops.cans.models import BudgetLineItem, BudgetLineItemStatus
from ops_api.ops.portfolios.models import Portfolio


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
        fiscal_year = request.query_params.get("fiscal_year")

        return Response(get_total_funding(portfolio, fiscal_year=fiscal_year))


def get_total_funding(portfolio, fiscal_year=None):
    budget_line_items = BudgetLineItem.objects.filter(can__portfolio=portfolio)

    if fiscal_year:
        budget_line_items = budget_line_items.filter(fiscal_year=fiscal_year)

    planned_funding = budget_line_items.filter(
        status=BudgetLineItemStatus.objects.get(status="Planned")
    ).aggregate(Sum("amount"))["amount__sum"]

    obligated_funding = budget_line_items.filter(
        status=BudgetLineItemStatus.objects.get(status="Obligated")
    ).aggregate(Sum("amount"))["amount__sum"]

    total_funding = portfolio.current_fiscal_year_funding

    return {
        "total_funding": total_funding,
        "planned_funding": planned_funding,
        "obligated_funding": obligated_funding,
        "available_funding": total_funding - planned_funding - obligated_funding,
    }
