all: bin/pserve initdb

tests: bin/py.test
	bin/py.test

bin/pserve bin/py.test bin/dev-version: bin/python bin/pip setup.py
	bin/python setup.py dev

bin/python bin/pip:
	virtualenv .

sdist: rev = $(shell git describe --long --tags --dirty --always)
sdist: bin/python setup.py
	bin/python setup.py egg_info -b $(rev) sdist

initdb: name = 'halfnarp_backend'
initdb: bin/python initdb.sql
	@psql -c "" $(name) 2> /dev/null || createdb $(name) -E utf8 -T template0 && psql $(name) -c "CREATE EXTENSION pgcrypto;"

clean:
	git clean -fXd

.PHONY: initdb clean tests sdist
