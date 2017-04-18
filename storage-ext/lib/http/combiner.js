"use strict";

var combiner = function() {
  var handlers = arguments;
  return function(req, res, callback) {
    var i = 0;
    next();

    function next(err) {
      if (err) {
        return callback(err);
      }

      var handler = handlers[i];
      i += 1;

      if ( ! handler) {
        return callback();
      }

      handler(req, res, next);
    }
  };
};

module.exports = combiner;