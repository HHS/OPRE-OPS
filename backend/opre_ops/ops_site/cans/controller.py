from opre_ops.ops_site.cans.models import CommonAccountingNumber
from rest_framework import serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView


class CommonAccountingNumberSerializer(serializers.ModelSerializer):
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
