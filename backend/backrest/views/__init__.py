from colander import MappingSchema, SchemaNode
from colander import SequenceSchema
from colander import String, Integer

from cornice.service import Service
from cornice.resource import resource, view
from pyramid.exceptions import NotFound
from pyramid.response import FileResponse
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


def uid_factory(request):
    if request.matchdict is not None and 'uid' in request.matchdict:
        context = models.TalkPreference.query.filter_by(uid=request.matchdict['uid']).first()
        if context is None:
            raise NotFound()
        return context
    return object()


@resource(collection_path=path('talkpreferences'), path=path('talkpreferences/{uid}'), factory=uid_factory)
class TalkPreference(object):

    def __init__(self, context, request):
        self.request = request
        self.context = context

    @view(schema=TalkPreferenceSchema)
    def collection_post(self):
        preference = models.TalkPreference(**self.request.validated)
        return dict(uid=preference.uid)

    @view(schema=TalkPreferenceSchema)
    def put(self):
        del self.request.validated['uid']
        self.context.update(**self.request.validated)
        return dict(uid=self.context.uid)

    def collection_get(self):
        return FileResponse(self.request.registry.settings['talks_local'],
            self.request,
            content_type='application/json')
