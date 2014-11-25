# coding: utf-8
from fabric import api as fab
from fabric.api import env, task
from ploy.config import value_asbool
from bsdploy.fabutils import rsync


env.shell = '/bin/sh -c'


@task
def update_backend(clean=False, build=True, config_path='production.ini', **kwargs):
    """
    Build the backend, upload it to the remote server, install it there and restart it
    """
    with fab.lcd('../backend'):
        fab.put(config_path, '/home/halfnarp/backend/production.ini')
        if value_asbool(build):
            with fab.settings(warn_only=True):
                fab.local('rm dist/*.tar.gz')
            fab.local('make sdist')
        fab.put('dist/*.tar.gz', '/tmp/backend.tgz')
        fab.put('requirements.txt', '/home/halfnarp/backend/requirements.txt')
    with fab.cd('/home/halfnarp/backend/'):
        fab.sudo('bin/pip install --upgrade --allow-external argparse -r requirements.txt', user='halfnarp')
        fab.sudo('bin/pip install --upgrade --force-reinstall --no-deps /tmp/backend.tgz', user='halfnarp')

    fab.sudo('service halfnarp_backend restart', warn_only=True)


@task
def update_frontend(clean=False, build=True, config_path='production.ini', **kwargs):
    """
    upload the frontend to the remote server
    """
    rsync('-av', '--delete', '../frontend/', '{host_string}:/home/halfnarp/frontend/')
