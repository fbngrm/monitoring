var util = require('util'),
    raven = require('raven'),
    winston = require('winston'),
    _ = require('underscore');
    
var SentryTransport = function (properties) 
{
  // the properties defined in the config
  properties = properties || {};
  
  this.name        = 'SentryTransport';
  this.dsn         = properties.dsn || '';
  this.patchGlobal = properties.patchGlobal || false;
  this.sentry      = new raven.Client(this.dsn);
  this.logger      = properties.logger || 'root';

  if(this.sentry === undefined) 
  {
    throw 'sentry undefined!';
  }
  
  // catch errors globally
  if(this.patchGlobal) 
  {
    this.sentry.patchGlobal();
  }
  
  // define log levels
  this.levels_map = 
  {
    silly: 'debug',
    verbose: 'debug',
    info: 'info',
    debug: 'debug',
    warn: 'warning',
    error: 'error',
  }

  // set the level from properties
  this.level = properties.level || 'info';

  // handle errors
  this.sentry.on('error', function() {});
  
  this.log = function (level, msg, meta, callback) 
  {
    level = this.levels_map[level] || this.level;
    meta = meta || {};
    
    var extra = _.extend(meta, {
      'level': level,
      'logger': this.logger
    });
    
    try {
      if(level == 'error') {
        // Support exceptions logging
        this.sentry.captureError(new Error(msg), extra, function(err) {
          callback(null, true);
        });
      } else {
        this.sentry.captureMessage(msg, extra, function(err) {
          callback(null, true);
        });
      }
    } catch(err) {
    }
  };

  this.on = function(event, callback) {};
    
  this.removeListener = function() {};                
    
  // Inherit from `winston.Transport` so you can take advantage
  // of the base functionality and `.handleExceptions()`.
  util.inherits(SentryTransport, winston.Transport);
};

// register transport
winston.transports.SentryTransport = SentryTransport;