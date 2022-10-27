import typing

from django.db.models import Sum
from rest_framework import serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from ops_api.ops.cans.controller import CANSerializer
from ops_api.ops.cans.models import BudgetLineItem, BudgetLineItemStatus, CANFiscalYear
from ops_api.ops.portfolios.models import Portfolio


class PortfolioSerializer(serializers.ModelSerializer):
    internal_can = CANSerializer(many=True, read_only=True)

    class Meta:
        model = Portfolio
        fields = "__all__"
        depth = 1


class PortfolioListController(ListAPIView):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer


class PortfolioReadController(RetrieveAPIView):
    queryset = Portfolio.objects.prefetch_related("internal_can")
    serializer_class = PortfolioSerializer


class PortfolioFundingView(APIView):
    queryset = Portfolio.objects.all()

    def get(self, request, pk):
        portfolio = self.queryset.get(pk=pk)
        fiscal_year = request.query_params.get("fiscal_year")

        return Response(get_total_funding(portfolio, fiscal_year=fiscal_year))


class FundingLineItem(typing.TypedDict):
    """Dict type hint for line items in total funding."""

    amount: float
    label: str


class TotalFunding(typing.TypedDict):
    """Dict type hint for total funding."""

    total_funding: FundingLineItem
    planned_funding: FundingLineItem
    obligated_funding: FundingLineItem
    in_execution_funding: FundingLineItem
    available_funding: FundingLineItem


def get_total_funding(
    portfolio: Portfolio,
    fiscal_year: typing.Optional[int] = None,
) -> TotalFunding:
    budget_line_items = BudgetLineItem.objects.filter(can__managing_portfolio=portfolio)

    if fiscal_year:
        budget_line_items = budget_line_items.filter(fiscal_year=fiscal_year)

    planned_funding = (
        budget_line_items.filter(
            status=BudgetLineItemStatus.objects.get(status="Planned")
        ).aggregate(Sum("amount"))["amount__sum"]
        or 0
    )

    obligated_funding = (
        budget_line_items.filter(
            status=BudgetLineItemStatus.objects.get(status="Obligated")
        ).aggregate(Sum("amount"))["amount__sum"]
        or 0
    )

    in_execution_funding = (
        budget_line_items.filter(
            status=BudgetLineItemStatus.objects.get(status="In Execution")
        ).aggregate(Sum("amount"))["amount__sum"]
        or 0
    )

    total_funding = (
        CANFiscalYear.objects.filter(can__managing_portfolio=portfolio).aggregate(
            Sum("total_fiscal_year_funding")
        )["total_fiscal_year_funding__sum"]
        or 0
    )

    total_accounted_for = sum(
        (
            planned_funding,
            obligated_funding,
            in_execution_funding,
        )
    )

    available_funding = float(total_funding) - float(total_accounted_for)

    return {
        "total_funding": {
            "amount": float(total_funding),
            "percent": "Total",
        },
        "planned_funding": {
            "amount": planned_funding,
            "percent": f"{round(float(planned_funding) / float(total_funding), 2) * 100}",
        },
        "obligated_funding": {
            "amount": obligated_funding,
            "percent": f"{round(float(obligated_funding) / float(total_funding), 2) * 100}",
        },
        "in_execution_funding": {
            "amount": in_execution_funding,
            "percent": f"{round(float(in_execution_funding) / float(total_funding), 2) * 100}",
        },
        "available_funding": {
            "amount": available_funding,
            "percent": f"{round(float(available_funding) / float(total_funding), 2) * 100}",
        },
    }
