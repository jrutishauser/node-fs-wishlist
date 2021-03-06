(function (Promise) {
    'use strict';

    function readFiles(fs, files) {
        return Promise.map(files, function(file) {
           return fs.readFileAsync(file);
        });
    }

    function createDirectories(fs, directories) {
        return Promise.each(directories, function (directory) {
            return fs.mkdirAsync(directory);
        });
    }

    function deleteDirectories(fs, directories) {
        return Promise.each(directories, function (directory) {
            return fs.rmdirAsync(directory);
        });
    }

    function unlinkPaths(fs, paths) {
        return Promise.each(paths, function (path) {
            return fs.unlinkAsync(path);
        });
    }

    function pathsExist(fs, paths) {
        return Promise.all(paths.map(function (path) {
            return new Promise(function (resolve) {
                fs.exists(path, resolve);
            });
        }));
    }

    module.exports = {
        readFiles: readFiles,
        createDirectories: createDirectories,
        deleteDirectories: deleteDirectories,
        pathsExist: pathsExist,
        unlinkPaths: unlinkPaths
    };
}(require('bluebird')));