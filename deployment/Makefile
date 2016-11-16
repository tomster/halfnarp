install: bin/ploy

build:
	$(MAKE) -C ../backend sdist

bin/devpi bin/ploy bin/ploy-ssh: bin/pip requirements.txt
	bin/pip install -r requirements.txt
	@touch $@

bin/python bin/pip:
	virtualenv --clear .

clean:
        git clean -fXd

.PHONY: clean
