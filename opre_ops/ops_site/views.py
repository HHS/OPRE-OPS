from django.shortcuts import render
from django.http import HttpResponse
import datetime

# Create your views here.

def home(request):
    now = datetime.datetime.now()
    html = "<html><body><h1>OPRE OPS</h1><p>Page created at %s.</p></body></html>" % now
    return HttpResponse(html)
