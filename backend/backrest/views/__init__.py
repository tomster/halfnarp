from cornice.service import Service
from pyramid.settings import asbool

from .. import path


app_info = Service(name='appinfo', path=path(''), renderer='json', accept='application/json')


@app_info.get()
def get_app_info(request):
    settings = request.registry.settings
    result = dict(debug=asbool(settings.debug))
    return result
