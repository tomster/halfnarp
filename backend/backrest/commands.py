from argparse import ArgumentParser
from pyramid.paster import get_app
import requests
from lxml import etree

def fetch_talks(**kw):
    parser = ArgumentParser(description='Fetch talks from frab')
    parser.add_argument('-c', '--config', type=str, help='app configuration',
        default='development.ini')
    args = vars(parser.parse_args(**kw))
    settings = get_app(args['config']).registry.settings
    sess = requests.Session()
    new_session_page = sess.get(settings['talks_new_session_url'])
    tree = etree.HTML( new_session_page.text )
    auth_token = tree.xpath( "//meta[@name='csrf-token']" )[0].get("content")
    login_data = dict()
    login_data['user[email]'] = settings['talks_user']
    login_data['user[password]'] = settings['talks_password']
    login_data['user[remember_me]'] = 1
    login_data['authenticity_token'] = auth_token
    sess.post(settings['talks_login_url'], login_data, verify=False)
    talks_json = sess.get(settings['talks_url'], verify=False, stream=True)
    talks_full = ''
    with open(settings['talks_full'], 'wb') as fd:
        for chunk in talks_json.iter_content(1024):
            fd.write(chunk)
            talks_full += chunk
    talks_full = json.loads(talks_full)
    talks_filtered = [{ key: x[key] for key in [ 'event_id', 'track_id', 'room_id', 'duration', 'start_time', 'title', 'abstract', 'language', 'speaker_names', 'language' ] } for x in talks_full ]
    with open(settings['talks_local', 'wb'] as fd:
        json.dump(talks_filtered, fd)

def export_talk_preferences(**kw):
    parser = ArgumentParser(description='Export talk preferences to CSV')
    parser.add_argument('-c', '--config', type=str, help='app configuration',
        default='development.ini')
    args = vars(parser.parse_args(**kw))
    get_app(args['config']).registry.settings
    from .models import TalkPreference
    for preference in TalkPreference.query:
        print ','.join([str(talk_id) for talk_id in preference.talk_ids])
