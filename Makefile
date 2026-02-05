.PHONY: install run serve-drafts build clean lint fmt

install:
	bundle install

run:
	bundle exec jekyll serve

serve-drafts:
	bundle exec jekyll serve --drafts

build:
	bundle exec jekyll build

clean:
	bundle exec jekyll clean

lint:
	trunk check

fmt:
	trunk fmt
