from os import path
from pyramid.testing import DummyRequest
from pyramid.testing import setUp, tearDown
from pytest import fixture
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from transaction import abort
from urllib import unquote
from webtest import TestApp as TestAppBase

from . import project_name


def route_url(name, **kwargs):
    return unquote(DummyRequest().route_url(name, **kwargs))

# settings for test configuration
settings = {
    'testing': True,
    'debug': True,
    'talks_local': path.join(path.dirname(__file__), 'tests', 'dummy_talks.json'),
}


@fixture
def config(request, tmpdir):
    """ Sets up a Pyramid `Configurator` instance suitable for testing. """
    config = setUp(settings=dict(settings, filesafe=str(tmpdir)))
    request.addfinalizer(tearDown)
    return config


@fixture(scope='session')
def connection(models, request):
    """ Sets up an SQLAlchemy engine and returns a connection
        to the database.  The connection string used can be overriden
        via the `PGDATABASE` environment variable. """
    from .models import db_session, metadata
    from . import create_db_engine
    engine = create_db_engine(suffix='_test',
        project_name=project_name, **settings)
    try:
        connection = engine.connect()
    except OperationalError:
        # try to create the database...
        db_url = str(engine.url).replace(engine.url.database, 'template1')
        e = create_engine(db_url)
        c = e.connect()
        c.connection.connection.set_isolation_level(0)
        c.execute('create database %s' % engine.url.database)
        c.connection.connection.set_isolation_level(1)
        c.close()
        # ...and connect again
        connection = engine.connect()
    db_session.registry.clear()
    db_session.configure(bind=connection)
    metadata.bind = engine
    metadata.drop_all(connection.engine)
    metadata.create_all(connection.engine)
    connection.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
    return connection


@fixture
def db_session(config, connection, request):
    """ Returns a database session object and sets up a transaction
        savepoint, which will be rolled back after running a test. """
    trans = connection.begin()          # begin a non-orm transaction
    request.addfinalizer(trans.rollback)
    request.addfinalizer(abort)
    from .models import db_session
    return db_session()


class TestApp(TestAppBase):

    def get_json(self, url, params=None, headers=None, *args, **kw):
        if headers is None:
            headers = {}
        headers['Accept'] = 'application/json'
        return self.get(url, params, headers, *args, **kw)


@fixture(scope='session')
def testing():
    """ Returns the `testing` module. """
    from sys import modules
    return modules[__name__]    # `testing.py` has already been imported


@fixture(scope='session')
def models():
    """ Returns the `models` module. """
    from . import models
    return models


@fixture
def app(config):
    """ Returns WSGI application wrapped in WebTest's testing interface. """
    from . import configure
    return configure({}, **config.registry.settings).make_wsgi_app()


@fixture
def browser(db_session, app, request):
    extra_environ = dict(HTTP_HOST='events.ccc.de')
    browser = TestApp(app, extra_environ=extra_environ)
    return browser
