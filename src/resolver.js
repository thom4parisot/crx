"use strict";

var path = require("path");

/**
 * @typedef {Object} PathMetadata
 * @property {string} path
 * @property {string} src
 */

/**
 * @param {string | Array.<string>} pathOrFiles
 * @returns Promise<PathMetadata>
 */
module.exports = function resolve(pathOrFiles) {
  return new Promise(function(resolve, reject) {
    // legacy and original mode
    if (typeof pathOrFiles === "string") {
      return resolve({
        path: path.resolve(pathOrFiles),
        src: "**"
      });
    }

    // new mode, with a list of files
    else if (Array.isArray(pathOrFiles)) {
      var manifestFile = "";

      pathOrFiles.some(function(f) {
        if (/(^|\/)manifest.json$/.test(f)) {
          manifestFile = f;
          return true;
        }
      });

      if (!manifestFile) {
        return reject(
          new Error("Unable to locate a manifest file in your list of files.")
        );
      }

      var manifestDir = path.dirname(manifestFile);

      return resolve({
        path: path.resolve(manifestDir),
        src:
          "{" +
          pathOrFiles
            .map(function(f) {
              return path.relative(manifestDir, f);
            })
            .join(",") +
          "}"
      });
    }

    //
    else {
      reject(
        new Error(
          "load path is none of a folder location nor a list of files to pack"
        )
      );
    }
  });
};
