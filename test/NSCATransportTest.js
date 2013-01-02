
var logging = require("common/logging");
var winston = require('winston'),
    assert = require('assert');
var testLoggingConfigure = require('common/test/util/testLoggingConfigure');
testLoggingConfigure.configure();

var moduleLoader = require('common/test/util/mockModuleLoader')

// globals for the VM used to mock module dependencies
var vmCtx = {};
// we add global jscoverage if defined to allow coverage statistics
if (typeof _$jscoverage != 'undefined') {
    vmCtx['_$jscoverage'] = _$jscoverage;
}

// TO DO:
// write a test for the send_nsca call

describe('NSCATransport', function() {


    var _currentConfig = null;

    var withPreserveLogging = function(target) {
        return function() {
            _currentConfig = logging.getCurrentConfig();
            target(_currentConfig);
            if (_currentConfig != null) {
                logging.configure(_currentConfig);
            }   
        };
    };
    
    it('should configure the NSCALogger with the NSCATransport successfully and log to NAGIOS/SHINKEN', 
            withPreserveLogging(function(loggingConfig) {
        
        // we want to mock dependencies of the NSCATransport on module level
        // here child_process
        var childProcess = new function() {
            var cmds = [];
            var _error = null;

            this.setError = function(error) {
                _error = error;
            };

            this.exec = function(cmd, callback) {
                cmds.push(cmd);
            };

            this.getCmdCalls = function() {
                return cmds;
            }
        };
        childProcess.setError("Unable to connect!");

        
        // load the module in a virtual context provided by node
        // this enables us to provide our own "require" function to a 
        // module and therefore can replace modules with mock implementations
        var ctx = moduleLoader.loadModule('common/monitoring/NSCATransport', 
                { winston : winston,
                  util : require('util'),
                  child_process : childProcess,
                  fs : require('fs')
                }, 
                vmCtx);
        
        // test configuration
        var testConfig = {
            loggers : [
                {
                    id : "NSCATestLogger",
                    level : "info",
                    transports : {
                        NSCATransport : {
                            level : 'warn',
                            host : 'Amazon staging server',
                            remote_host : '10.235.85.207',
                        }
                    }
                }
            ]
        };
        testConfig.root = loggingConfig.root;
        logging.configure(testConfig);


        // test the logger
        var testNscaLogger = winston.loggers.get('NSCATestLogger');
        assert.equal("info", testNscaLogger.level);
        // test the transport
        var testNscaTransport = testNscaLogger.transports["NSCATransport"];

        assert.equal('warn', testNscaTransport.level);
        assert.equal('Amazon staging server', testNscaTransport.HOST);
        assert.equal('unknown service', testNscaTransport.service);
        assert.equal('NSCATransport', testNscaTransport.name);
        assert.equal('', testNscaTransport.output);
        // test log putput
        testNscaLogger.warn('Http response time: 150 ms');

        assert.deepEqual(childProcess.getCmdCalls(), 
            ['printf "Amazon staging server\\tunknown service\\t1\\t[NSCATestLogger] Http response time: 150 ms\\n"' +
            ' | /usr/local/nagios/bin/send_nsca -H 10.235.85.207 -c /usr/local/nagios/etc/send_nsca.cfg']);

        testNscaLogger.warn('Http response time:', {output:'250'});
        assert.deepEqual(childProcess.getCmdCalls(), 
            ['printf "Amazon staging server\\tunknown service\\t1\\t[NSCATestLogger] Http response time: 150 ms\\n"' +
            ' | /usr/local/nagios/bin/send_nsca -H 10.235.85.207 -c /usr/local/nagios/etc/send_nsca.cfg',
            'printf "Amazon staging server\\tunknown service\\t1\\t[NSCATestLogger] Http response time:\\n"' +
            ' | /usr/local/nagios/bin/send_nsca -H 10.235.85.207 -c /usr/local/nagios/etc/send_nsca.cfg']);

        testNscaLogger.error('Http response time:', 
            {output:'350', service:'Test NSCA'});
        assert.deepEqual(childProcess.getCmdCalls(), 
            ['printf "Amazon staging server\\tunknown service\\t1\\t[NSCATestLogger] Http response time: 150 ms\\n"' +
            ' | /usr/local/nagios/bin/send_nsca -H 10.235.85.207 -c /usr/local/nagios/etc/send_nsca.cfg',
            'printf "Amazon staging server\\tunknown service\\t1\\t[NSCATestLogger] Http response time:\\n"' +
            ' | /usr/local/nagios/bin/send_nsca -H 10.235.85.207 -c /usr/local/nagios/etc/send_nsca.cfg',
            'printf "Amazon staging server\\tTest NSCA\\t2\\t[NSCATestLogger] Http response time:\\n"' +
            ' | /usr/local/nagios/bin/send_nsca -H 10.235.85.207 -c /usr/local/nagios/etc/send_nsca.cfg']);
    }));

    it('should configure the NSCALogger with the NSCATransport successfully and log to NAGIOS/SHINKEN', 
            withPreserveLogging(function(loggingConfig) {

        // we want to mock dependencies of the NSCATransport on module level
        // here child_process
        var childProcess = new function() {
            var cmds = [];
            var _error = null;

            this.setError = function(error) {
                _error = error;
            };

            this.exec = function(cmd, callback) {
                cmds.push(cmd);
                callback(_error, 'stdout', 'stderr');
            };

            this.getCmdCalls = function() {
                return cmds;
            }
        };

        childProcess.setError("Unable to connect!");
        
        // load the module in a virtual context provided by node
        // this enables us to provide our own "require" function to a 
        // module and therefore can replace modules with mock implementations
        var ctx = moduleLoader.loadModule('common/monitoring/NSCATransport', 
                { winston : winston,
                  util : require('util'),
                  child_process : childProcess,
                  fs : require('fs')
                }, 
                vmCtx);

        // test configuration
        // test configuration
        var testConfig = {
            loggers : [
                {
                    id : "NSCATestLogger2",
                    level : "warn",
                    transports : {
                        NSCATransport : {
                            level : 'debug',
                            host : 'Amazon staging server',
                            service : 'api check',
                            remote_host : '10.235.85.207'
                        
                        }
                    }
                }
            ]
        };
        testConfig.root = loggingConfig.root;
        logging.configure(testConfig);

        // test the logger
        var testNscaLogger = winston.loggers.get('NSCATestLogger2');
        assert.equal("warn", testNscaLogger.level);
        // test the transport
        var testNscaTransport = testNscaLogger.transports["NSCATransport"];
        assert.equal('debug', testNscaTransport.level);
        assert.equal('Amazon staging server', testNscaTransport.HOST);
        assert.equal('api check', testNscaTransport.service);
        assert.equal('NSCATransport', testNscaTransport.name);
        assert.equal('', testNscaTransport.output);
    }));

});