# Serverless Babel Plugin

This fork of `serverless-babel-plugin` has been updated in a few ways now that [serverless/serverless-babel-plugin](https://github.com/serverless/serverless-babel-plugin) is unmaintained.

### Changes
- Incorporates all bugs fixed on other forks (at the time of writing this)
- Now uses `babel-preset-env` instead of deprecated `babel-preset-latest`. This allows you to easily use targeting.
- Now uses a standard `.babelrc` file in your project root instead of limited babel configuration living in `serverless.yml`
- Less verbose and prettier output by default.

### Targeting AWS Lambda

Thanks to `babel-preset-env` is is now very easy to target older versions of Node. As of writing this, the latest version of Node supported by Lamda is 6.10, so your `.babelrc` should look something like this

```
{
  "presets": [
    ["env", {
      "targets": {
        "node": "6.10"
      }
    }]
  ]
}
```

### Options

`stdout` from Babel is no longer logged by default in order to keep logs clean. To log `stdout` from the Babel process (basically a list of all the files it processed), simply add this to `serverless.yml`. `stderr` will always be logged.

```
custom:
  serverlessBabel:
    stdout: true
```
