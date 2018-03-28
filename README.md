# Serverless Babel Plugin

The simplest way to start using ES2017+ in Lambda.

This fork of `serverless-babel-plugin` has been updated in a few ways now that [serverless/serverless-babel-plugin](https://github.com/serverless/serverless-babel-plugin) is unmaintained.

### Setup

1. `npm install headnote/serverless-babel-plugin --saveDev` or `yarn add -D headnote/serverless-babel-plugin`

2. Add plugin to `serverless.yml`
```
plugins:
  ...
  - serverless-babel-plugin
  ...
```

3. Create a `.babelrc` file (example below).

4. Test it with `serverless package`


### Targeting AWS Lambda

Thanks to `babel-preset-env` it is now very easy to target older versions of Node. As of writing this, the latest version of Node supported by Lambda is 6.10. Example `.babelrc`:

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

To log the `stdout` output from the Babel process (basically a list of all the files it processed), simply add this to `serverless.yml`. `stderr` will always be logged.

```
custom:
  serverlessBabel:
    stdout: true
```

To set file permissions before packaging, use the `permissions` option. This is not an ideal solution (ideally `unzip` or `unzip2` would fix this upstream)


```
custom:
  serverlessBabel:
    permissions:
      - myexecutable:
        path: 'bin/myexecutable'
        mode: '755'
```

### Changes in this fork
- Incorporates all bugs fixed on other forks (at the time of writing this)
- Now uses `babel-preset-env` instead of deprecated `babel-preset-latest`. This allows you to easily use targeting.
- Now uses a standard `.babelrc` file in your project root instead of limited babel configuration living in `serverless.yml`
- Less verbose and prettier output by default.
- Adds support for re-setting file permissions before packaging
