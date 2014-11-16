from colander import MappingSchema, SchemaNode
from colander import SequenceSchema
from colander import String, Integer

from cornice.service import Service
from cornice.resource import resource, view
from pyramid.settings import asbool

from .. import path, models

app_info = Service(name='appinfo', path=path(''), renderer='json', accept='application/json')


@app_info.get()
def get_app_info(request):
    settings = request.registry.settings
    result = dict(debug=asbool(settings.debug))
    return result


class IntegerSequence(SequenceSchema):

    _ = SchemaNode(Integer())


class TalkPreferenceSchema(MappingSchema):
    uid = SchemaNode(String(), missing=None)
    talk_ids = IntegerSequence()


@resource(collection_path=path('talkpreferences'), path=path('talkpreferences/{uid}'))
class TalkPreference(object):

    def __init__(self, request):
        self.request = request

    @view(schema=TalkPreferenceSchema)
    def collection_post(self):
        preference = models.TalkPreference(**self.request.validated)
        return dict(uid=preference.uid)
