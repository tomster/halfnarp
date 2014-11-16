# -*- coding: utf-8 -*-
from pytest import fixture


@fixture
def url(testing, config):
    return testing.route_url('collection_talkpreference')


def test_user_posts_preferences_without_uid(browser, url, models):
    talk_ids = [23, 42]
    result = browser.post_json(url, dict(talk_ids=talk_ids)).json
    assert result['uid'] is not None
    refetched = models.TalkPreference.query.get(result['uid'])
    assert refetched.talk_ids == talk_ids


def test_user_posts_preferences_with_uid(browser, url, models):
    data = dict(uid=u'foobår', talk_ids=[23, 42])
    result = browser.post_json(url, data).json
    assert result['uid'] is not None
    refetched = models.TalkPreference.query.get(result['uid'])
    assert refetched.talk_ids == data['talk_ids']
    assert refetched.uid == data['uid']
