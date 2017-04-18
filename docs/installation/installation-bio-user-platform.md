## bio-user-platform

**Installing the bio-user-platform requires access to the private Autodesk GitHub.**

After setting up the user auth platform locally, authentication can be enabled by setting the `BIO_NANO_AUTH`
environment variable to `1` or by using the `auth-test` npm target.

```
npm run auth
```

Running this command will attempt to access `git.autodesk.com`. [gotcha][]

#### manual user authentication setup

If you want to use/test user authentication locally, do the following:

1) clone the Bio/Nano User Platform repo locally.

```
git clone https://git.autodesk.com/bionano/bio-user-platform.git ~/src/bio-user-platform
cd ~/src/bio-user-platform
git checkout genome-designer
```

2) Install Docker (Don't use brew, go [here](https://docs.docker.com/engine/installation/mac/).)

3) Install Bio/Nano User Platform dependencies

```
cd ~/src/bio-user-platform
npm install
```

4) Start the Authentication Service locally. Choose method:
    1) Docker storage and Docker node
    2) Docker storage + local node (easier debugging)

```
# Method i
# cd ~/src/bio-user-platform
eval "$(docker-machine env default)"
docker-compose up
```

```
# Method ii
# in one terminal:
cd ~/src/bio-user-platform
bash /Applications/Docker/Docker\ Quickstart\ Terminal.app/Contents/Resources/Scripts/start.sh
eval "$(docker-machine env default)"
npm run storage
#
#in another terminal:
cd ~/src/bio-user-platform
npm start
```

5) Start the Genome Designer Application

If you've chosen `method ii` above, you start the Genome Designer normally with `npm run auth`

If you've chosen `method i` above, you need to tell the Genome Designer application to look for the Auth Service on
your docker host.

```
API_END_POINT="http://$(docker-machine ip default):8080/api" npm run auth
```

#### user authentication tests

Currently authentication tests in `test/server/auth/REST.spec.js` require access to an Authentication Server.

#### npm install from git.autodesk.com authentication fails [gotcha] ####

Currently npm won't prompt for username and password when attempting to install a package from a private GitHub
repository. So, if you haven't saved credentials for `git.autodesk.com` into your git credential cache, running
`npm run auth` or `npm run auth-test` will fail when it tries to pull the authentication package from `git.autodesk.com`.
The easiest way to save git credentials is to clone a repository. Instructions for setting up credential caching
can be found [here](https://help.github.com/articles/caching-your-github-password-in-git/).
FYI: After installing you will still need to set your credentials...try something like: 'git clone https://git.autodesk.com/bionano/bio-user-platform.git temp' to force git prompt you for them
