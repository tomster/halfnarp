# -*- coding: utf-8 -*-
from pytest import fixture


@fixture
def url(testing, config):
    return testing.route_url('collection_talkpreference')


def test_user_posts_preferences_without_uid(browser, url, models):
    talk_ids = [23, 42]
    result = browser.post_json(url, dict(talk_ids=talk_ids)).json
    assert result['uid'] is not None
    # the client receives a url against which he can post updates
    assert result['update_url'] is not None
    refetched = models.TalkPreference.query.get(result['uid'])
    assert refetched.talk_ids == talk_ids


def test_user_posts_preferences_with_uid(browser, url, models):
    data = dict(uid=u'foobår', talk_ids=[23, 42])
    result = browser.post_json(url, data).json
    assert result['update_url'] is not None
    refetched = models.TalkPreference.query.get(result['uid'])
    assert refetched.talk_ids == data['talk_ids']
    assert refetched.uid == data['uid']


def test_user_updates_preferences_with_uid(testing, browser, url, models):
    created = browser.post_json(url, dict(talk_ids=[23, 42])).json
    # client receives a url against which updates can be posted
    updated = browser.put_json(created['update_url'], dict(talk_ids=[1, 2, 3])).json
    refetched = models.TalkPreference.query.get(updated['uid'])
    assert refetched.talk_ids == [1, 2, 3]


def test_client_fetches_list_of_talks(browser, url):
    talks = browser.get_json(url).json
    assert len(talks) == 11
    assert talks[-1]['track_id'] == 265


@fixture
def existing_preference(db_session, models):
    return models.TalkPreference(uid=u'foo', talk_ids=[23, 42])


def test_fetch_existing_preference(browser, existing_preference, testing):
    assert browser.get_json(testing.route_url('talkpreference', uid=existing_preference.uid)).json['talk_ids'] == existing_preference.talk_ids
