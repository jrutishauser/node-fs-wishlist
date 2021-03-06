(function (chai, chaiAsPromised, dirtyChai, Promise, lib, fs, extend, helper) {
    'use strict';

    fs = Promise.promisifyAll(fs);

    chai.use(chaiAsPromised);
    chai.use(dirtyChai);

    var expect = chai.expect;
    var testFolder = 'test/mock';
    var mixedFs = lib.mixin(fs);

    describe('#rmdirp', function () {
        beforeEach(function () {
            return mixedFs.rmdirp(testFolder)
                .then(function () {
                    return mixedFs.mkdirp(testFolder);
                });
        });
        it('should mixin rmdirp by default', function () {
            expect(lib.mixin(fs)).to.have.property('rmdirp');
        });
        it('shouldn\'t mixin rmdirp when already implemented', function () {
            var rmdirpFunc = function () {
            };
            expect(lib.mixin(extend({}, fs, {rmdirp: rmdirpFunc})).rmdirp).to.equal(rmdirpFunc);
        });
        it('should mixin rmdirp when included', function () {
            expect(lib.mixin(fs, {mixins: {rmdirp: true}})).to.have.property('rmdirp');
        });
        it('shouldn\'t mixin rmdirp when excluded', function () {
            expect(lib.mixin(fs, {mixins: {rmdirp: false}})).to.not.have.property('rmdirp');
        });
        it('should be able to recursively remove directories', function () {
            return helper.createDirectories(fs, [
                testFolder + '/one',
                testFolder + '/one/two',
                testFolder + '/one/two/three',
                testFolder + '/one/two/three/four',
                testFolder + '/one/two/three/four/five'
            ]).then(function () {
                return Promise.all([
                    fs.writeFileAsync(testFolder + '/1.txt', 'The impossible often has a kind of integrity to it which the merely improbable lacks.'),
                    fs.writeFileAsync(testFolder + '/one/2.txt', 'It can be very dangerous to see things from somebody else\'s point of view without the proper training.'),
                    fs.writeFileAsync(testFolder + '/one/two/3.txt', 'He was a dreamer, a thinker, a speculative philosopher... or, as his wife would have it, an idiot.'),
                    fs.writeFileAsync(testFolder + '/one/two/three/4.txt', 'See first, think later, then test. But always see first. Otherwise you will only see what you were expecting. Most scientists forget that.'),
                    fs.writeFileAsync(testFolder + '/one/two/three/four/5.txt', 'One is never alone with a rubber duck.'),
                    fs.writeFileAsync(testFolder + '/one/two/three/four/6.txt', 'Anything that thinks logically can be fooled by something else that thinks at least as logically as it does.')
                ]);
            }).then(function () {
                return lib.mixin(fs).rmdirp(testFolder + '/one');
            }).then(function () {
                return expect(helper.pathsExist(fs, [
                    testFolder + '/1.txt',
                    testFolder + '/one',
                    testFolder + '/one/2.txt',
                    testFolder + '/one/two',
                    testFolder + '/one/two/3.txt',
                    testFolder + '/one/two/three',
                    testFolder + '/one/two/three/4.txt',
                    testFolder + '/one/two/three/four',
                    testFolder + '/one/two/three/four/5.txt',
                    testFolder + '/one/two/three/four/6.txt',
                    testFolder + '/one/two/three/four/five'
                ])).to.eventually.deep.equal([true, false, false, false, false, false, false, false, false, false, false]);
            });
        });
        it('should be able to recursively remove directories with a callback', function () {
            return fs.mkdirAsync(testFolder + '/one').then(function () {
                return new Promise(function (resolve, reject) {
                    lib.mixin(fs).rmdirp(testFolder + '/one', function (err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
            }).then(function () {
                return expect(helper.pathsExist(fs, [testFolder + '/one'])).to.eventually.deep.equal([false]);
            });
        });
        it('shouldn\'t be able to remove a directory that already exists and isn\'t a directory', function () {
            return fs.writeFileAsync(testFolder + '/one', 'The ships hung in the sky in much the same way bricks don\'t.').then(function () {
                return expect(lib.mixin(fs).rmdirp(testFolder + '/one')).to.eventually.be.rejectedWith(Error, /ENOTDIR/);
            });
        });
        it('should be able to remove a directory that doesn\'t exist', function () {
            return expect(lib.mixin(fs).rmdirp(testFolder + '/one')).to.eventually.be.fulfilled();
        });
        it('should propagate an error from a stats call', function () {
            var xfs = extend({}, lib.mixin(fs), {
                stat: function (dir, cb) {
                    cb(new Error('Some Stats Error'));
                }
            });
            return Promise.all([
                fs.mkdirAsync(testFolder + '/one'),
                fs.writeFileAsync(testFolder + '/one/1.txt', 'In an infinite Universe anything can happen.')
            ]).then(function () {
                return expect(xfs.rmdirp(testFolder + '/one')).to.eventually.be.rejectedWith(Error, 'Some Stats Error');
            });
        });
        it('should propagate an error from an unlink call', function () {
            var xfs = extend({}, lib.mixin(fs), {
                unlink: function (dir, cb) {
                    cb(new Error('Some Unlink Error'));
                }
            });
            return Promise.all([
                fs.mkdirAsync(testFolder + '/one'),
                fs.writeFileAsync(testFolder + '/one/1.txt', 'In an infinite Universe anything can happen.')
            ]).then(function () {
                return expect(xfs.rmdirp(testFolder + '/one')).to.eventually.be.rejectedWith(Error, 'Some Unlink Error');
            });
        });
        it('should propagate an error from a rmdir call', function () {
            var xfs = extend({}, lib.mixin(fs), {
                rmdir: function (dir, cb) {
                    cb(new Error('Some Rmdir Error'));
                }
            });
            return fs.mkdirAsync(testFolder + '/one').then(function () {
                return expect(xfs.rmdirp(testFolder + '/one')).to.eventually.be.rejectedWith(Error, 'Some Rmdir Error');
            });
        });
    });
}(require('chai'), require('chai-as-promised'), require('dirty-chai'), require('bluebird'), require('../index'), require('fs'), require('extend'), require('./helper')));