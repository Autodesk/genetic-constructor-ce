# Path to executables
MOCHA = ./node_modules/.bin/mocha

MOCHA_OPTS = --recursive
TEST = $(MOCHA) \
	-u bdd \
	--reporter spec \
	--timeout 5000 \
	$(MOCHA_OPTS)

REPORT_OUTPUT=$(TEST_OUTPUT_PATH)
ifndef TEST_OUTPUT_PATH
	REPORT_OUTPUT=.
endif

check: test

test:
	@$(TEST)

jenkins:
	@JUNIT_REPORT_PATH=$(REPORT_OUTPUT)/report.xml $(MOCHA) \
		--no-colors \
		--timeout 5000 \
		-u bdd --reporter mocha-jenkins-reporter $(MOCHA_OPTS) \
		|| true

.PHONY: test jenkins
