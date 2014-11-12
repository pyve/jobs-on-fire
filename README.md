# Jobs on Fire #

Python Venezuela's simple job board application.

## See it live ##

**Production**: https://pyve.github.io/empleos/
**Staging**: https://jobs-on-fire.firebaseapp.com

## Staging ##

    $ grunt build
    $ firebase deploy


## Deploy to Production ##

    $ cp -r dist/* ../pyve.github.com/empleos/
    $ cat .git/refs/heads/master
    <copy this changeset>
    $ cd ../pyve.github.com/empleos/
    $ git add empleos/
    $ git commit -m "Desplegando empleos/ (<paste the changeset here>)"
