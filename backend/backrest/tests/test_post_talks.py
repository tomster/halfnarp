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


@fixture
def talk_preference(db_session, models):
    return models.TalkPreference(uid=u'223132332rda', talk_ids=[23, 34, 566, 2])


def test_user_updates_preferences_with_uid(testing, browser, talk_preference, models):
    url = testing.route_url('talkpreference', uid=talk_preference.uid)
    uid = talk_preference.uid
    data = dict(uid=uid, talk_ids=[23, 42])
    result = browser.put_json(url, data).json
    assert result['uid'] == talk_preference.uid
    refetched = models.TalkPreference.query.get(result['uid'])
    assert refetched.talk_ids == data['talk_ids']
    assert refetched.uid == data['uid']
    assert refetched.talk_ids == data['talk_ids']
