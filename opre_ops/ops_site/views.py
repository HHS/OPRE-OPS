from django.shortcuts import render
from django.http import HttpResponse
import datetime

from django.views.generic import ListView
from ops_site.models import CommonAccountingNumber


def home(request):
    now = datetime.datetime.now()
    html = "<html><body><h1>OPRE OPS</h1><p>Page created at %s.</p></body></html>" % now
    return HttpResponse(html)


class CANInfoListView(ListView):
    model = CommonAccountingNumber
