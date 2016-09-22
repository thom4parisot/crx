'use strict';

var _ = require("lodash");
var path = require("path");
var join = path.join;
var Promise = require("es6-promise").Promise;

module.exports = function resolve(pathOrFiles) {
  return new Promise(function(resolve, reject){
    // legacy and original mode
    if (typeof pathOrFiles === 'string') {
      return resolve({
        path: pathOrFiles,
        src: '**',
      });
    }

    // new mode, with a list of files
    else if (Array.isArray(pathOrFiles)) {
      var manifestFile = _.find(pathOrFiles, function(f){
        return /(^|\/)manifest.json$/.test(f);
      });
      var manifestDir = path.dirname(manifestFile);

      return resolve({
        path: path.resolve(manifestDir),
        src: '{' + pathOrFiles.map(function(f){
          return path.relative(manifestDir, f);
        }).join(',') + '}'
      })
    }

    //
    else {
      reject(new Error('load path is none of a folder location nor a list of files to pack'))
    }
  });
}
