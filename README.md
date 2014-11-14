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

To deploy to production first change the `DATABASE` variable in the `app/scripts/main.js` to `empleos-pyve`.

Then, assuming you have a clone of the [PyVe's site sources](https://github.com/pyve/pyve.github.com/) in the parent dir:

    $ grunt build
    $ cp -r dist/* ../pyve.github.com/empleos/
    $ cat .git/refs/heads/master
    <copy this changeset>
    $ cd ../pyve.github.com/empleos/
    $ git add empleos/
    $ git commit -m "Desplegando empleos/ (<paste the changeset here>)"

## TODO ##

* Filters
* Pagination
* Share to social channels
* Mail digest
