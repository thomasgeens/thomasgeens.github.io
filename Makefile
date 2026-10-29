.PHONY: check-ruby install run serve-drafts build clean lint fmt

RUBY_WANTED := $(shell cat .ruby-version)
RUBY_ACTUAL := $(shell ruby -e 'print RUBY_VERSION' 2>/dev/null)

# Running bundler on the wrong Ruby silently re-resolves Gemfile.lock
check-ruby:
	@if [ "$(RUBY_ACTUAL)" != "$(RUBY_WANTED)" ]; then \
		echo "Ruby $(RUBY_WANTED) required (.ruby-version), found '$(RUBY_ACTUAL)'. Try: chruby $(RUBY_WANTED)"; \
		exit 1; \
	fi

install: check-ruby
	bundle install

run: check-ruby
	bundle exec jekyll serve

serve-drafts: check-ruby
	bundle exec jekyll serve --drafts

build: check-ruby
	bundle exec jekyll build

clean:
	bundle exec jekyll clean

lint:
	trunk check

fmt:
	trunk fmt
