# -*- coding: utf-8 -*-
from argparse import ArgumentParser
import requests
import json
from datetime import datetime

url = 'http://localhost:6543'
jar = dict()


class Timer:
    def __enter__(self):
        self.start = datetime.now()
        return self

    def __exit__(self, *args):
        self.end = datetime.now()
        self.interval = self.end - self.start
        print(self.interval)


def dumps(data):
    if isinstance(data, unicode):
        return data.encode('utf-8')
    elif isinstance(data, str):
        return data
    else:
        return json.dumps(data)


def get_json(path):
    return requests.get(url + path, cookies=jar)


def put_json(path, data=None):
    if data is None:
        data = dict()
    return requests.put(url + path, data=dumps(data), cookies=jar)


def post_json(path, data):
    return requests.post(url + path, data=dumps(data), cookies=jar, timeout=3)


def debug(**kw):
    global url
    parser = ArgumentParser(description='debug restful targets')
    parser.add_argument('-u', '--url', default=url, help='target url')

    args = vars(parser.parse_args(**kw))
    url = args['url']

    with Timer():
        print post_json('/-/talkpreferences', dict(talk_ids=[23, 43])).json()
