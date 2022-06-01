from django.shortcuts import render
from django.http import HttpResponse
import datetime

from django.views.generic import ListView
from django.views.generic import DetailView
from ops_site.models import CANInfo

def home(request):
    now = datetime.datetime.now()
    html = "<html><body><h1>OPRE OPS</h1><p>Page created at %s.</p></body></html>" % now
    return HttpResponse(html)

class CANInfoListView(ListView):
    model = CANInfo

class CANInfoDetailView(DetailView):

    queryset = CANInfo.objects.all()

    def get_object(self):
        obj = super().get_object()
        return obj
