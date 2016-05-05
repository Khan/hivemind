# Hivemind

Hivemind is an experimental knowledge-management system built to help Khan Academy's Long-term Research group share intellectual context.

In the course of our research, we review lots of papers, books, games, toys, etc. We’re mining for quotes, great ideas, other promising resources, inspiration. When we find something great, that becomes part of our research team’s shared intellectual context—one of the most valuable things we build!

![Screenshot as of May 5th, 2016](screenshot.png)

Disclaimers: The project is still very young, and it's probably not useful outside of Khan Academy. It's still in a rough prototype stage, intentionally not yet robustly architected.

## Running a local server

First, [install Meteor](https://www.meteor.com/install): `curl https://install.meteor.com/ | sh`

This app connects to Amazon S3 and Google OAuth and requires credentials for both.

If you're at Khan Academy, copy the [secrets from Phabricator](https://phabricator.khanacademy.org/K145) into `settings.json` in the root of the project directory. If you're not, modify `settings.template.json` to use your secrets.

Run a local server with `meteor --settings settings.json`.
