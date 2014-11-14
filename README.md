# Jobs on Fire #

Python Venezuela's simple job board application.

## See it live ##

**Production**: https://pyve.github.io/empleos/
**Staging**: https://jobs-on-fire.firebaseapp.com

## Development ##

Clone this repo, run `npm install`, `bower install` and `grunt serve`. Hack.

## Deployment ##

### Staging ###

You'll need access to the application in Firebase and the `firebase-tools`.

    $ grunt build
    $ firebase deploy

### Deploy to Production ###

**IMPORTANT**

To deploy to production first change the `DATABASE` variable in the `app/scripts/main.js` to `empleos-pyve`. If you don't do this, the job postings from the production database will not show up and the staging database contents will show up instead. This should not be pushed to this repo.

Then, assuming you have a clone of the [PyVe's site sources](https://github.com/pyve/pyve.github.com/) in the parent dir:

    $ grunt build
    $ cp -r dist/* ../pyve.github.com/empleos/
    $ cat .git/refs/heads/master
    <copy this changeset>
    $ cd ../pyve.github.com/empleos/
    $ git add empleos/
    $ git commit -m "Desplegando empleos/ (<paste the changeset here>)"

## TODO ##

* Markdown with editor for description
* Filter out expired postings
* Filters
* Pagination
* Share to social channels
* Mail digest
