import hashlib
from pytest import fixture


def test_talk_preference_instance_without_given_uid(db_session, models):
    preference = models.TalkPreference(ip_address=u'127.0.0.1')
    assert preference.uid is not None


def test_talk_preference_instance_with_given_uid_is_hashed(db_session, models):
    uid = 'foo'
    preference = models.TalkPreference(uid=uid)
    assert preference.uid == uid


def test_talk_preference_instance_hashes_ip_address(db_session, models):
    ip_address = u'127.0.0.1'
    preference = models.TalkPreference(ip_address=ip_address)
    assert preference.uid is not None
    assert preference.ip_hash == hashlib.sha1(ip_address).hexdigest()


def test_talk_preference_instance_stores_talk_ids(db_session, models):
    talk_ids = [23, 34, 566, 2]
    preference = models.TalkPreference(talk_ids=talk_ids)
    refetched = models.TalkPreference.query.get(preference.uid)
    assert refetched.talk_ids == talk_ids


@fixture
def talk_preference(db_session, models):
    return models.TalkPreference(talk_ids=[])


def test_talk_preference_has_hashed_uid(talk_preference):
    assert talk_preference.hashed_uid == hashlib.sha256(talk_preference.uid).hexdigest()


def test_get_talk_by_hashed_uid(models, talk_preference):
    from sqlalchemy import func
    assert models.TalkPreference.query.filter(
        func.encode(func.digest(func.text(models.TalkPreference.uid), 'sha256'), 'hex')
        == talk_preference.hashed_uid).one() == talk_preference
