from pytest import fixture


@fixture
def url(testing, config):
    return testing.route_url('appinfo')


def test_app_info_anonymous(browser, url):
    result = browser.get_json(url).json
    assert result['debug'] is True
