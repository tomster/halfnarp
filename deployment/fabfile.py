# coding: utf-8
from datetime import datetime
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
        fab.sudo('bin/pip install --upgrade  -r requirements.txt', user='halfnarp')
        fab.sudo('bin/pip install --upgrade --force-reinstall --no-deps /tmp/backend.tgz', user='halfnarp')

    fab.sudo('service halfnarp_backend restart', warn_only=True)


@task
def update_frontend(clean=False, build=True, config_path='production.ini', **kwargs):
    """
    upload the frontend to the remote server
    """
    rsync('-av', '--delete', '../frontend/', '{host_string}:/home/halfnarp/frontend/')


@task
def download_db(cleanup=True):
    hostname = env.host_string.split('@')[-1]
    timestamp = datetime.now().strftime('%Y%m%d-%H%M')
    dump_file_name = '{hostname}-{timestamp}.sql.gz'.format(**locals())
    remote_dump = '/tmp/{dump_file_name}'.format(**locals())
    local_dump = './downloads/{dump_file_name}'.format(**locals())
    latest_dump = './downloads/{hostname}-latest.sql.gz'.format(**locals())
    dumped = fab.sudo('pg_dump -c halfnarp_backend | gzip -c > {remote_dump}'.format(**locals()), user='halfnarp')
    if dumped.succeeded:
        rsync('-av', '{host_string}:%s' % remote_dump, local_dump)
        fab.run('rm {remote_dump}'.format(remote_dump=remote_dump))
        fab.local('ln -sf {dump_file_name} {latest_dump}'.format(**locals()))
        print("Downloaded dump available at '{local_dump}'".format(**locals()))
