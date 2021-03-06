(function (chai, chaiAsPromised, dirtyChai, Promise, lib, fs, extend, helper) {
    'use strict';

    fs = Promise.promisifyAll(fs);

    chai.use(chaiAsPromised);
    chai.use(dirtyChai);

    var expect = chai.expect;
    var testFolder = 'test/mock';
    var mixedFs = lib.mixin(fs);

    describe('#mkdirp', function () {
        beforeEach(function () {
            return mixedFs.rmdirp(testFolder)
                .then(function () {
                    return mixedFs.mkdirp(testFolder);
                });
        });
        it('should mixin mkdirp by default', function () {
            expect(lib.mixin(fs)).to.have.property('mkdirp');
        });
        it('shouldn\'t mixin mkdirp when already implemented', function () {
            var mkdirpFunc = function () {
            };
            expect(lib.mixin(extend({}, fs, {mkdirp: mkdirpFunc})).mkdirp).to.equal(mkdirpFunc);
        });
        it('should mixin mkdirp when included', function () {
            expect(lib.mixin(fs, {mixins: {mkdirp: true}})).to.have.property('mkdirp');
        });
        it('shouldn\'t mixin mkdirp when excluded', function () {
            expect(lib.mixin(fs, {mixins: {mkdirp: false}})).to.not.have.property('mkdirp');
        });
        it('should be able to recursively make directories', function () {
            return lib.mixin(fs).mkdirp(testFolder + '/one/two/three/four').then(function () {
                return expect(helper.pathsExist(fs, [
                    testFolder + '/one',
                    testFolder + '/one/two',
                    testFolder + '/one/two/three',
                    testFolder + '/one/two/three/four'
                ])).to.eventually.deep.equal([true, true, true, true]);
            });
        });
        it('should be able to recursively make directories with a callback', function () {
            return new Promise(function (resolve, reject) {
                lib.mixin(fs).mkdirp(testFolder + '/one', function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(expect(helper.pathsExist(fs, [testFolder + '/one'])).to.eventually.deep.equal([true]));
                });
            });
        });
        it('should be able to recursively make directories with a mode', function () {
            var mode = parseInt('0776', 8);
            return lib.mixin(fs).mkdirp(testFolder + '/one/two', mode).then(function () {
                return helper.pathsExist(fs, [
                    testFolder + '/one',
                    testFolder + '/one/two'
                ]).spread(function (one, two) {
                    expect(one).to.be.ok();
                    expect(two).to.be.ok();

                    return Promise.all([
                        fs.statAsync(testFolder + '/one'),
                        fs.statAsync(testFolder + '/one/two')
                    ]).spread(function (oneStats, twoStats) {
                        return new Promise(function (resolve) {
                            expect(oneStats).to.be.ok();
                            expect(twoStats).to.be.ok();

                            expect(oneStats.mode & mode).to.equal(mode & ~process.umask());
                            expect(twoStats.mode & mode).to.equal(mode & ~process.umask());

                            resolve();
                        });
                    });
                });
            });
        });
        it('should be able to recursively make directories with a mode and callback', function () {
            var mode = parseInt('0776', 8);
            return new Promise(function (resolve, reject) {
                lib.mixin(fs).mkdirp(testFolder + '/one', mode, function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(helper.pathsExist(fs, [testFolder + '/one']).spread(function (exists) {
                        expect(exists).to.be.ok();

                        return fs.statAsync(testFolder + '/one').then(function (stats) {
                            expect(stats.mode & mode).to.equal(mode & ~process.umask());
                        });
                    }));
                });
            });
        });
        it('shouldn\'t be able to overwrite a directory that already exists and isn\'t a directory', function () {
            return fs.writeFileAsync(testFolder + '/one').then(function () {
                return expect(lib.mixin(fs).mkdirp(testFolder + '/one')).to.eventually.be.rejectedWith(Error, 'Path test/mock/one already exists and is not a directory');
            });
        });
        it('should be able to able to create a directory that already exists', function () {
            return fs.mkdirAsync(testFolder + '/one').then(function () {
                return expect(lib.mixin(fs).mkdirp(testFolder + '/one')).to.eventually.be.fulfilled();
            });
        });
        it('should propagate an error from a stats call', function () {
            var xfs = extend({}, lib.mixin(fs), {
                stat: function (dir, cb) {
                    cb(new Error('Some Stats Error'));
                }
            });
            return fs.mkdirAsync(testFolder + '/one').then(function () {
                return expect(xfs.mkdirp(testFolder + '/one')).to.eventually.be.rejectedWith(Error, 'Some Stats Error');
            });
        });
    });
}(require('chai'), require('chai-as-promised'), require('dirty-chai'), require('bluebird'), require('../index'), require('fs'), require('extend'), require('./helper')));