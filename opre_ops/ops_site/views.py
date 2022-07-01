from django.shortcuts import render
from django.http import HttpResponse
import datetime

from django.views.generic import ListView
from django.views.generic import DetailView
from ops_site.models import CommonAccountingNumber

def home(request):
    return render(request, "ops_site/home.html")


class CANInfoListView(ListView):
    model = CommonAccountingNumber

class CANInfoDetailView(DetailView):

    queryset = CommonAccountingNumber.objects.all()

    def get_object(self):
        obj = super().get_object()
        return obj
