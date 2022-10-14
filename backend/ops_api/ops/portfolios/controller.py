import typing

from django.db.models import Sum
from ops_api.ops.cans.controller import CANSerializer
from ops_api.ops.cans.models import BudgetLineItem, BudgetLineItemStatus
from ops_api.ops.helpers.type_hints import TotalFunding
from ops_api.ops.portfolios.models import Portfolio
from rest_framework import serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView
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
        fiscal_year = request.query_params.get("fiscal_year")

        return Response(get_total_funding(portfolio, fiscal_year=fiscal_year))


def get_total_funding(
    portfolio: Portfolio,
    fiscal_year: typing.Optional[float] = None,
) -> TotalFunding:
    budget_line_items = BudgetLineItem.objects.filter(can__portfolio=portfolio)

    if fiscal_year:
        budget_line_items = budget_line_items.filter(fiscal_year=fiscal_year)

    planned_funding = budget_line_items.filter(
        status=BudgetLineItemStatus.objects.get(status="Planned")
    ).aggregate(Sum("amount"))["amount__sum"]

    obligated_funding = budget_line_items.filter(
        status=BudgetLineItemStatus.objects.get(status="Obligated")
    ).aggregate(Sum("amount"))["amount__sum"]

    in_execution_funding = budget_line_items.filter(
        status=BudgetLineItemStatus.objects.get(status="In Execution")
    ).aggregate(Sum("amount"))["amount__sum"]

    total_funding = portfolio.current_fiscal_year_funding

    available_funding = total_funding - sum(
        (
            planned_funding,
            obligated_funding,
            in_execution_funding,
        )
    )

    return {
        "total_funding": {
            "amount": total_funding,
            "label": "Total",
        },
        "planned_funding": {
            "amount": planned_funding,
            "label": f"Planned {planned_funding / total_funding:%.2}",
        },
        "obligated_funding": {
            "amount": obligated_funding,
            "label": f"Obligated {obligated_funding / total_funding:%.2}",
        },
        "in_execution_funding": {
            "amount": in_execution_funding,
            "label": f"In Execution {in_execution_funding / total_funding:%.2}",
        },
        "available_funding": {
            "amount": available_funding,
            "label": f"Available {available_funding / total_funding:%.2}",
        },
    }
