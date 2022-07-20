from rest_framework import serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView

from ops_site.cans.models import CommonAccountingNumber


class CommonAccountingNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonAccountingNumber
        fields = "__all__"


class CanListController(ListAPIView):
    queryset = CommonAccountingNumber.objects.all()
    serializer_class = CommonAccountingNumberSerializer


class CanReadController(RetrieveAPIView):
    queryset = CommonAccountingNumber.objects.all()
    serializer_class = CommonAccountingNumberSerializer
