from setuptools import setup, find_packages

name = 'halfnarp'
version = '1.0.0'

setup(name=name,
    version=version,
    description='...',
    classifiers=[
        "Programming Language :: Python",
        "Framework :: Pylons",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
    ],
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'colander',
        'cornice == 0.15',
        'PasteDeploy',
        'psycopg2',
        'pyramid',
        'pyramid_tm',
        'requests',
        'waitress',
        'zope.sqlalchemy',
    ],
    extras_require={
        'development': [
            'webtest',
            'flake8',
            'mock',
            'pytest >= 2.4.2',
            'py >= 1.4.17',
            'pytest-flakes',
            'pytest-pep8',
            'pytest-cov',
            'readline',
            'tox',
            'setuptools-git',
        ],
    },
    entry_points="""
        [paste.app_factory]
        main = backrest:main
        [pytest11]
        backrest = backrest.testing
        [console_scripts]
        fetch-talks = backrest.commands:fetch_talks
        export-talks = backrest.commands:export_talk_preferences
    """,
)
