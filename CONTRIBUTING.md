# Contributing to Genetic Constructor

Contributions to this project are encouraged! All you need is a Github account to contribute.

Please ask questions by [opening an issue](https://github.com/autodesk-bionano/genome-designer/issues/new).

## Quickstart

To get started, as always: [open an issue](https://github.com/autodesk-bionano/genome-designer/issues/new).

Make your code changes, and submit a pull request. Add tests and update documentation when appropriate. Fill out the pull request template entirely on GitHub.

You must sign our Contributor License Agreement (CLA) before pull requests can be accepted, which will pop up as a comment after submitting your pull request.

All submissions must pass lint + unit test checks, which will be run automatically (Travis CI) when you make a pull request.

Admins will respond quickly, and may request changes, on the pull request.

## What Can I Do?

Here are some ideas:

**Create an Extension** - Constructor is built to support third parties adding functionality and easily plugging into the application.

**Contribute unit tests** - test that Constructors's functions work correctly in a variety of situations, and that they report errors when appropriate

**Bug fixes:** Found a typo in the code? Found that a function fails under certain conditions? Know how to fix it? Great! Go for it. Please [open an issue](https://github.com/autodesk-bionano/genome-designer/issues/new) so that we know you're working on it, and submit a pull request when you're ready.

**Whatever:** There's ALWAYS something to do.

### Pull requests are always welcome

All PRs should be documented as [GitHub issues](https://github.com/autodesk-bionano/genome-designer/issues), ideally BEFORE you start working on them.

## Submission Guidelines

### Project Roles

Maxwell Bates - Engineer

Duncan Meech - Engineer

Joe Lachoff - Designer

Florencio Mazzoldi - Business Owner

Cornelia Scheitz - Product Owner

### Timing

We will attempt to address all issues and pull requests within one week. It may a bit longer before pull requests are actually merged, as they must be inspected and tested.

### Issues

If your issue appears to be a bug, and hasn't been reported, open a new issue.
Help us to maximize the effort we can spend fixing issues and adding new features, by not reporting duplicate issues. A template is provided when submitting an issue, and providing the following information will increase the chances of your issue being dealt with quickly:

* **Overview of the Issue** - if an error is being thrown a non-minified stack trace helps
* **Motivation for or Use Case** - explain why this is a bug for you
* **Browsers and Operating System** - is this a problem with all browsers or only IE8?
* **Reproduce the Error** - provide a live example (using [Plunker][plunker] or
  [JSFiddle][jsfiddle]) or an unambiguous set of steps.
* **Related Issues** - has a similar issue been reported before?
* **Suggest a Fix** - if you can't fix the bug yourself, perhaps you can point to what might be
  causing the problem (line of code or commit)

### Pull Requests

Before you submit your pull request consider the following guidelines:

* Search GitHub for an open or closed Pull Request that relates to your submission. You don't want to duplicate effort.
* Make your changes in a new git branch:

     ```shell
     git checkout -b my-fix-branch master
     ```

* Create your patch.
* Commit your changes using a descriptive commit message.

     ```shell
     git commit -a
     ```
  Note: the optional commit `-a` command line option will automatically "add" and "rm" edited files.

* Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

* In GitHub, send a pull request to `genetic-constructor:master`.

### Coding Rules

* Please maintain a code style similar to that of the rest of the project, adhering the the styleguide (`.eslintrc`)
* Please document all public methods using JSDoc format comments.

### Tests

[Testing Documentation](tests/README.md)

Tests will be run to ensure no regressions are introduced in new code.

## Becoming a contributor

Frequent contributors can email the maintainers at geneticconstructor.maintainers@autodesk.com to become a project administrator, at the approval of existing project admins.
