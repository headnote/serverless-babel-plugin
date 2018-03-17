# Serverless Babel Plugin

This fork of `serverless-babel-plugin` has been updated to fix a few bugs and update dependencies. It also now relies on a `.babelrc` file in your project root instead of command line arguments.

The default behavior is now to not print `stdout` returned from babel (just a list of all the files that were compiled), but you can enable output easily using the following.

```
custom:
  serverlessBabel:
    stdout: true
```
