var util = require('util'),
    winston = require('winston'),
    exec = require('child_process').exec,
    child,
    _ = require('underscore'),
    fs = require('fs'),
    _logger = winston.loggers.get('nscaTransport');

// Define a custom logging handler to send passive check results to the send_nsca module of NAGIOS

// PASSIVE_CHECK_RESULT_COMMAND syntax:
// [<timestamp>] PROCESS_SERVICE_CHECK_RESULT;<host_name>;<description>;<return_code>;<plugin_output>

// timestamp is the time in time_t format (seconds since the UNIX epoch) that the service check was perfomed (or submitted). Please note the single space after the right bracket.
// host_name is the short name of the host associated with the service in the service definition
// description is the description of the service as specified in the service definition
// return_code is the return code of the check (0=OK, 1=WARNING, 2=CRITICAL, 3=UNKNOWN)
// plugin_output is the text output of the service check (i.e. the plugin output)

// see: send_nsca --help


var NSCATransport = function(properties) {
    
    // the properties defined in the config
    properties = properties || {}; 
    
    this.name = 'NSCATransport';
    this.level = properties.level || 'warn'; 
    // the registered service that is checked
    this.service = properties.service || 'unknown service';
    // the message for the service check
    this.output = properties.output || '';

    // absolute path to the send_nsca config file
    this.NSCA_CFG = properties.nsca_cfg || '/usr/local/nagios/etc/send_nsca.cfg';
    // absolute path to the send_nsca.sh file
    this.SEND_NSCA = properties.send_nsca || '/usr/local/nagios/bin/send_nsca';
    // name of the host that does the check (the host where this file is located)
    this.HOST = properties.host || '';
    // address of the NAGIOS / SHINKEN host
    this.REMOTE_HOST = properties.remote_host || '';

    this.levels_map = 
    {
      silly: 3,
      verbose: 3,
      info: 0,
      debug: 0,
      warn: 1,
      error: 2,
      unknown: 3,
    }    

    if(this.HOST === '') 
    {
      throw 'HOST is empty';
    }
    if(this.REMOTE_HOST === '') 
    {
      throw 'REMOTE_HOST is empty';
    }

    this.log = function(level, msg, metadata, callback) {

        metadata = metadata || {};

        // get the service description
        var service = metadata.service || this.service;
        // get return code
        var code = this.levels_map[level] || this.levels_map[this.level];
        // get output
        var output = metadata.output || '';

        // send the pscr to nagios
        this.send(service, code, msg);
    };
    
    this.on = function(event, callback) {
    };
    
    this.removeListener = function() {
    };                

    this.send = function(service, code, msg)
    {      
      var cmd = 'printf "'+ this.HOST +'\\t'+ service +'\\t' + code + '\\t' + msg + '\\n" | ' + this.SEND_NSCA + ' -H ' + this.REMOTE_HOST + ' -c ' + this.NSCA_CFG;
      child = exec(cmd,
        function (error, stdout, stderr) {
          _logger.debug('stdout: ' + stdout);
          _logger.debug('stderr: ' + stderr);
          if (error !== null) {
             _logger.error(error);
          }
      });
    };

  // inherit from winston.Transport so you can take advantage
  // of the base functionality and .handleExceptions()
  util.inherits(NSCATransport, winston.Transport);
};

// register transport
winston.transports.NSCATransport = NSCATransport;