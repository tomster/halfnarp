# -*- coding: utf-8 -*-

from os import environ
from sqlalchemy import engine_from_config
from pyramid.config import Configurator
from transaction import commit

from .models import db_session, metadata


# project/package name
project_name = 'halfnarp'


def create_db_engine(prefix='sqlalchemy.', suffix='', project_name=None, **settings):
    key = prefix + 'url'
    url = 'postgresql:///%%s%s' % suffix
    if 'PGDATABASE' in environ:
        settings[key] = url % environ['PGDATABASE']
    elif key not in settings:
        settings[key] = url % project_name
    settings.setdefault(prefix + 'echo', bool(environ.get('SQLALCHEMY_ECHO')))
    return engine_from_config(settings, prefix=prefix)


def path(service):
    """ Return path — or route pattern — for the given REST service. """
    return '/-/{0}'.format(service.lower())


def configure(global_config, **settings):
    config = Configurator(settings=settings)
    config.begin()
    config.include('cornice')
    config.scan(ignore=['.testing', '.tests'])
    config.commit()
    return config


def db_setup(**settings):
    engine = create_db_engine(**settings)
    db_session.registry.clear()
    db_session.configure(bind=engine)
    metadata.bind = engine
    metadata.create_all(engine)
    # create custom index for hashed uid
    from sqlalchemy import func, Index
    Index('ix_talk_preferences_uid_sha256', func.encode(func.digest(metadata.tables['talk_preferences'].c.uid, 'sha256')))


def main(global_config, **settings):        # pragma: no cover, tests have own app setup
    config = configure(global_config, **settings)
    db_setup(**settings)
    commit()
    return config.make_wsgi_app()
