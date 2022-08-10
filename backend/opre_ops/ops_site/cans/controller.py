from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveAPIView

from opre_ops.ops_site.cans.models import CANFiscalYear
from opre_ops.ops_site.cans.models import CommonAccountingNumber
from opre_ops.ops_site.cans.models import Contract
from opre_ops.ops_site.cans.models import ContractLineItem
from opre_ops.ops_site.cans.models import ContractLineItemFiscalYear
from opre_ops.ops_site.cans.models import ContractLineItemFiscalYearPerCAN
from opre_ops.ops_site.cans.models import FundingPartner
from opre_ops.ops_site.models import Person


class MultipleFieldLookupMixin:
    """
    Apply this mixin to any view or viewset to get multiple field filtering
    based on a `lookup_fields` attribute, instead of the default single field
    filtering.
    """

    def get_object(self):
        queryset = self.get_queryset()  # Get the base queryset
        queryset = self.filter_queryset(queryset)  # Apply any filter backends
        filter = {}
        for field in self.lookup_fields:
            if self.kwargs[field]:  # Ignore empty fields.
                filter[field] = self.kwargs[field]
        obj = get_object_or_404(queryset, **filter)  # Lookup the object
        self.check_object_permissions(self.request, obj)
        return obj


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


class FundingPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundingPartner
        fields = "__all__"
        dept = 1


class FundingPartnerListController(ListAPIView):
    queryset = FundingPartner.objects.all()
    serializer_class = FundingPartnerSerializer


class FundingPartnerReadController(RetrieveAPIView):
    queryset = FundingPartner.objects.all()
    serializer_class = FundingPartnerSerializer


class CANFiscalYearSerializer(serializers.ModelSerializer):
    # can = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    can_lead = serializers.ReadOnlyField(source="person.id")

    class Meta:
        model = CANFiscalYear
        fields = "__all__"
        dept = 1


class CANFiscalYearListController(ListAPIView):
    queryset = CANFiscalYear.objects.all()
    serializer_class = CANFiscalYearSerializer


class CANFiscalYearByCanListController(ListAPIView):
    queryset = CANFiscalYear.objects.all()
    serializer_class = CANFiscalYearSerializer

    def get_queryset(self):
        return CANFiscalYear.objects.filter(
            can=self.kwargs["can_id"], fiscal_year=self.kwargs["fiscal_year"]
        )


class CANFiscalYearMultiListController(MultipleFieldLookupMixin, ListAPIView):
    queryset = CANFiscalYear.objects.all()
    serializer_class = CANFiscalYearSerializer
    lookup_fields = ["can", "fiscal_year"]


class CANFiscalYearReadController(RetrieveAPIView):
    queryset = CANFiscalYear.objects.all()
    serializer_class = CANFiscalYearSerializer


class ContractSerializer(serializers.ModelSerializer):
    cans = serializers.ReadOnlyField(source="cans.id")

    class Meta:
        model = Contract
        fields = "__all__"
        dept = 1


class ContractListController(ListAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer


class ContractReadController(RetrieveAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer


class ContractLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractLineItem
        fields = "__all__"
        dept = 1


class ContractLineItemListController(ListAPIView):
    queryset = ContractLineItem.objects.all()
    serializer_class = ContractLineItemSerializer


class ContractLineItemReadController(RetrieveAPIView):
    queryset = ContractLineItem.objects.all()
    serializer_class = ContractLineItemSerializer


class ContractLineItemFiscalYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractLineItemFiscalYear
        fields = "__all__"
        dept = 1


class ContractLineItemFiscalYearListController(ListAPIView):
    queryset = ContractLineItemFiscalYear.objects.all()
    serializer_class = ContractLineItemFiscalYearSerializer


class ContractLineItemFiscalYearReadController(RetrieveAPIView):
    queryset = ContractLineItemFiscalYear.objects.all()
    serializer_class = ContractLineItemFiscalYearSerializer


class ContractLineItemFiscalYearPerCANSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractLineItemFiscalYearPerCAN
        fields = "__all__"
        dept = 1


class ContractLineItemFiscalYearPerCANListController(ListAPIView):
    queryset = ContractLineItemFiscalYearPerCAN.objects.all()
    serializer_class = ContractLineItemFiscalYearPerCANSerializer


class ContractLineItemFiscalYearPerCANReadController(RetrieveAPIView):
    queryset = ContractLineItemFiscalYearPerCAN.objects.all()
    serializer_class = ContractLineItemFiscalYearPerCANSerializer


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = "__all__"
        dept = 1


class PersonListController(ListAPIView):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer


class PersonReadController(RetrieveAPIView):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
