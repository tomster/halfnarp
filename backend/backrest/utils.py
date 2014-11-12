from os import environ
from pyramid.threadlocal import get_current_registry
from pyramid.threadlocal import get_current_request
from sqlalchemy import engine_from_config


def get_request():
    return get_current_request()


def get_settings():
    return get_current_registry().settings


def create_db_engine(prefix='sqlalchemy.', suffix='', project_name=None, **settings):
    key = prefix + 'url'
    url = 'postgresql:///%%s%s' % suffix
    if 'PGDATABASE' in environ:
        settings[key] = url % environ['PGDATABASE']
    elif key not in settings:
        settings[key] = url % project_name
    settings.setdefault(prefix + 'echo', bool(environ.get('SQLALCHEMY_ECHO')))
    return engine_from_config(settings, prefix=prefix)
