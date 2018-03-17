'use strict';

const unzip = require('unzip2');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const spawnSync = require('child_process').spawnSync;
const BbPromise = require('bluebird');
const glob = require('glob-all');
const rimraf = require('rimraf');
const _ = require('lodash');
const isWin = /^win/.test(process.platform);
const isLinux = /^linux/.test(process.platform);
const isMac = /^darwin/.test(process.platform);

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'after:deploy:createDeploymentArtifacts': this.transform.bind(this),
      'after:deploy:function:packageFunction': this.transform.bind(this),
    };
  }

  log(msg) {
    this.serverless.cli.log(`[serverless-babel-plugin]: ${msg}`);
  }

  transform() {
    return new BbPromise((resolve, reject) => {
      this.log('Running Babel...')
      const servicePath = this.serverless.config.servicePath;

      let bundleName = this.serverless.service.service;

      // determine if we are deploying a single function or the entire service
      if (this.options && this.options.f !== undefined) {
        bundleName = `${bundleName}-${this.options.stage}-${this.options.f}`;
      }

      // unzip
      const stream = fs.createReadStream(path.join(servicePath, `.serverless/${bundleName}.zip`))
        .pipe(unzip.Extract({ path: path.join(servicePath, '.serverless/tmpBabelDirectory') }));

      stream.on('error', (error) => {
        reject(error);
      });

      // unzip2 actually emits close when completed. When unzipping a large file, using finish will cause this plugin to run prematurely
      stream.on('close', () => {
        // compile
        const args = [
          '--out-dir=tmpBabelDirectory',
          'tmpBabelDirectory',
          '--ignore=node_modules'
        ];
        const options = {
          cwd: path.join(servicePath, '.serverless'),
        };
        let execPath = path.join(__dirname, '..', '.bin/babel');
        if (isWin) execPath += '.cmd';
        const result = spawnSync(execPath, args, options);
        if (result.error) {
          return reject(result.error);
        }
        const settings = this.serverless.service.custom.serverlessBabel;
        const stdout = settings && settings.stdout && result && result.stdout && result.stdout.toString();
        const sterr = result && result.stderr && result.stderr.toString();
        if (stdout) {
          this.log(`Babel output:\n${stdout}`);
        }
        if (sterr) {
          return reject(sterr);
        }

        // zip
        this.log('Packaging service from Babel output...');
        const patterns = ['**'];
        const tmpBabelDirectory = '.serverless/tmpBabelDirectory';
        const zip = archiver.create('zip');

        const artifactFilePath = `.serverless/${bundleName}.zip`;
        this.serverless.utils.writeFileDir(artifactFilePath);

        const output = fs.createWriteStream(artifactFilePath);

        output.on('open', () => {
          zip.pipe(output);

          const files = glob.sync(patterns, {
            cwd: tmpBabelDirectory,
            dot: true,
            silent: true,
            follow: true,
          });

          files.forEach((filePath) => {
            const fullPath = path.resolve(tmpBabelDirectory, filePath);

            const stats = fs.statSync(fullPath);

            if (!stats.isDirectory(fullPath)) {
              zip.append(fs.readFileSync(fullPath), {
                name: filePath,
                mode: stats.mode,
              });
            }
          });

          zip.finalize();
        });

        zip.on('error', err => reject(err));

        output.on('close', () => {
          try {
            rimraf.sync(tmpBabelDirectory, { disableGlob: true });
          } catch (err) {
            reject(err);
          }
          resolve(artifactFilePath);
        });
      });
    });
  }
}

module.exports = ServerlessPlugin;
