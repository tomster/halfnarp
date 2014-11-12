# -*- coding: utf-8 -*-

from pyramid.config import Configurator
from transaction import commit

from .models import db_session, metadata
from .utils import create_db_engine


# project/package name
project_name = 'halfnarp'


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


def main(global_config, **settings):        # pragma: no cover, tests have own app setup
    config = configure(global_config, **settings)
    db_setup(**settings)
    commit()
    return config.make_wsgi_app()
