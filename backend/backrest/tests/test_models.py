import hashlib


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
