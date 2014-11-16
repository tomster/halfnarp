from argparse import ArgumentParser
from pkg_resources import get_distribution
from subprocess import check_output
from pyramid.paster import get_app
import requests
from . import project_name


def fetch_talks(**kw):
    parser = ArgumentParser(description='Fetch talks from frab')
    parser.add_argument('-c', '--config', type=str, help='app configuration',
        default='development.ini')
    args = vars(parser.parse_args(**kw))
    settings = get_app(args['config']).registry.settings
    sess = requests.Session()
    login_data = dict()
    login_data['user[email]'] = settings['talks_user']
    login_data['user[password]'] = settings['talks_password']
    login_data['user[remember_me]'] = 1
    sess.post(settings['talks_login_url'], login_data, verify=False)
    talks_json = sess.get(settings['talks_url'], verify=False, stream=True)
    with open(settings['talks_local'], 'wb') as fd:
        for chunk in talks_json.iter_content(1024):
            fd.write(chunk)


def dev_version(**kw):
    parser = ArgumentParser(description='Print development version')
    parser.add_argument('-f', '--full', dest='full', action='store_true',
        help='output full version')
    args = parser.parse_args(**kw)
    cmd = 'git describe --long --tags --dirty --always'
    version = check_output(cmd.split()).strip()
    if not args.full:
        dist = get_distribution(project_name)
        version = version.replace(dist.version, '', 1)
    print(version)


def export_talk_preferences(**kw):
    parser = ArgumentParser(description='Export talk preferences to CSV')
    parser.add_argument('-c', '--config', type=str, help='app configuration',
        default='development.ini')
    args = vars(parser.parse_args(**kw))
    get_app(args['config']).registry.settings
    from .models import TalkPreference
    for preference in TalkPreference.query:
        print ','.join([str(talk_id) for talk_id in preference.talk_ids])
