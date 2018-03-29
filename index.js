'use strict';

const exec = require('node-exec-promise').exec;
const fs = require('fs');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const BbPromise = require('bluebird');
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
      'after:package:createDeploymentArtifacts': this.transform.bind(this),
      'after:package:function:packageFunction': this.transform.bind(this),
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

      const tmpFolder = 'tmpBabelDirectory'
      const tmpBabelDirectory = `.serverless/${tmpFolder}`;
      const bundleFilePath = path.join(servicePath, `.serverless/${bundleName}.zip`);

      // Called once files are unzipped and ready to process
      let processFiles = () => {
        // compile
        const args = [
          `--out-dir=${tmpFolder}`,
          `${tmpFolder}`,
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

        // Fix permissions
        if (settings && settings.permissions && settings.permissions.length) {
          settings.permissions.forEach((file) => {
            this.log('chmod: ' + file.path + ' set to ' + file.mode);
            fs.chmodSync(path.join(servicePath, tmpBabelDirectory, file.path), file.mode);
          })
        }

        // zip
        this.log('Packaging service from Babel output...');

        exec(`cd ${tmpBabelDirectory} && zip -qqFSr ../${bundleName}.zip . * && cd ../../`).then(() => {
          try {
            rimraf.sync(tmpBabelDirectory, { disableGlob: true });
          } catch (err) {
            reject(err);
          }
          resolve(bundleFilePath);
        }).catch((err) => {
          this.log(err)
          reject(err);
        })
      };

      // Unzip the serverless bundle
      exec(`unzip -qq ${path.join(servicePath, `.serverless/${bundleName}.zip`)} -d ${path.join(servicePath, '.serverless/tmpBabelDirectory')}`).then(() => {
        processFiles();
      }).catch((err) => {
        this.log(err)
        reject(err);
      });
    });
  }
}

module.exports = ServerlessPlugin;
