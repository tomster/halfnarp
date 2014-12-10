from os.path import abspath, expanduser
from pkg_resources import get_distribution
from colander import MappingSchema, SchemaNode
from colander import SequenceSchema
from colander import String, Integer

from cornice.service import Service
from cornice.resource import resource, view
from pyramid.exceptions import NotFound
from pyramid.response import FileResponse
from pyramid.settings import asbool
from sqlalchemy import func

from . import path, models

app_info = Service(name='appinfo', path=path(''), renderer='json', accept='application/json')


@app_info.get()
def get_app_info(request):
    settings = request.registry.settings
    result = dict(debug=asbool(settings.debug), version=get_distribution('halfnarp').version)
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
        return dict(uid=preference.uid, hashed_uid=preference.hashed_uid,
            update_url=self.request.route_url('talkpreference', uid=preference.uid),
            public_url=self.request.route_url('publictalkpreference', hash=preference.hashed_uid))

    @view(schema=TalkPreferenceSchema)
    def put(self):
        del self.request.validated['uid']
        self.context.update(**self.request.validated)
        return dict(uid=self.context.uid, hashed_uid=self.context.hashed_uid)

    def collection_get(self):
        return FileResponse(abspath(expanduser(self.request.registry.settings['talks_local'])),
            self.request,
            content_type='application/json')

    def get(self):
        return dict(uid=self.context.uid,
            talk_ids=self.context.talk_ids,
            hashed_uid=self.context.hashed_uid,
            public_url=self.request.route_url('publictalkpreference', hash=self.context.hashed_uid))


def hashed_uid_factory(request):
    if request.matchdict is not None and 'hash' in request.matchdict:
        context = models.TalkPreference.query.filter(func.encode(
            func.digest(func.text(models.TalkPreference.uid), 'sha256'), 'hex') == request.matchdict['hash']).first()
        if context is None:
            raise NotFound()
        return context
    return object()


@resource(path=path('talkpreferences/public/{hash}'), factory=hashed_uid_factory)
class PublicTalkPreference(object):

    def __init__(self, context, request):
        self.request = request
        self.context = context

    def get(self):
        return dict(hash=self.context.hashed_uid, talk_ids=self.context.talk_ids)
