var logging = require("common/logging");
var winston = require('winston'),
    Mail = require('winston-mail').Mail,
    sentry = require('common/monitoring/SentryTransport'),
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



describe('SentryTransport', function() {

    
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

    // we want to mock dependencies of the SentryTransport on module level
        // here child_process
        var ravenMock = new function() {
            var _logs = [];

            this.Client = function(dsn) {
                this.captureError = function(error, extra, callback){
                    //pass
                };
                this.captureMessage = function(msg, extra, callback){
                    _logs.push(msg);
                }
                this.patchGlobal = function(){};
                this.on = function(){};
            };

            this.getLogs = function(){
                return _logs;
            }

            this.clear = function(){
                _logs = [];
            }
        };

        // load the module in a virtual context provided by node
        // this enables us to provide our own "require" function to a 
        // module and therefore can replace modules with mock implementations
        var ctx = moduleLoader.loadModule('common/monitoring/SentryTransport', 
                { winston : winston,
                  util : require('util'),
                  raven : ravenMock,
                  util : require('util'),
                  _ : require('underscore')
                }, 
                vmCtx);


    it('should configure the SentryLogger with the SentryTransport successfully', 
            withPreserveLogging(function(loggingConfig) {

        // test configuration
        var testConfig = {
            loggers : [
                {
                    id : "SentryLogger",
                    level : "warn",
                    transports : {
                        SentryTransport : {
                            level: 'info',
                            patchGlobal: true,
                            dsn: "http://d95ece701fa44adcbf5bcc6e8577df0d:04b29953c921486fa89581802b19f7bc@82.211.8.97:9000/2"
                        }    
                    }
                }
            ]
        };
        testConfig.root = loggingConfig.root;
        logging.configure(testConfig);
        
        // test the logger
        var sentryLogger = winston.loggers.get('SentryLogger');
        assert.equal("warn", sentryLogger.level);
        // test the transport
        var sentryLoggerTransport = sentryLogger.transports["SentryTransport"];

        assert.equal('info', sentryLoggerTransport.level);
        assert.equal(true, sentryLoggerTransport.patchGlobal);
        assert.equal("http://d95ece701fa44adcbf5bcc6e8577df0d:04b29953c921486fa89581802b19f7bc@82.211.8.97:9000/2", sentryLoggerTransport.dsn);
        assert.equal('SentryTransport', sentryLoggerTransport.name);
        // test log output
        sentryLogger.warn('sentry warn');
        assert.deepEqual(ravenMock.getLogs(), 
                ['[SentryLogger] sentry warn']);

        sentryLogger.info('sentry info');
        assert.deepEqual(ravenMock.getLogs(), 
                ['[SentryLogger] sentry warn',
                '[SentryLogger] sentry info']);

        sentryLogger.debug('sentry debug');
        assert.deepEqual(ravenMock.getLogs(), 
                ['[SentryLogger] sentry warn',
                '[SentryLogger] sentry info']);

        sentryLogger.error('sentry error');
        assert.deepEqual(ravenMock.getLogs(),
                ['[SentryLogger] sentry warn',
                '[SentryLogger] sentry info']);

        sentryLogger.silly('sentry silly==debug');
        assert.deepEqual(ravenMock.getLogs(), 
                ['[SentryLogger] sentry warn',
                '[SentryLogger] sentry info']);

    }));

    it('not log to the sentry interface because the dsn is not set', 
        withPreserveLogging( function(loggingConfig) {
        ravenMock.clear();

        // test configuration
        var testConfig = {
            loggers : [
                {
                    id : "SentryLogger2",
                    level : "debug",
                    transports : {
                        SentryTransport : {
                            level: 'error',
                            patchGlobal: false,
                        }    
                    }
                }
            ]
        };
        testConfig.root = loggingConfig.root;
        logging.configure(testConfig);
        
        // test the logger
        var sentryLogger2 = winston.loggers.get('SentryLogger2');
        assert.equal("debug", sentryLogger2.level);
        // test the transport
        var sentryLoggerTransport2 = sentryLogger2.transports["SentryTransport"];

        assert.equal('error', sentryLoggerTransport2.level);
        assert.equal(false, sentryLoggerTransport2.patchGlobal);
        assert.equal("", sentryLoggerTransport2.dsn);
        assert.equal('SentryTransport', sentryLoggerTransport2.name);
        // test log output
        sentryLogger2.warn('sentry warn');
        assert.deepEqual(ravenMock.getLogs(), 
                []);
    }));
    
    it('should configure the SentryLogger with the SentryTransport successfully', 
        withPreserveLogging(function(loggingConfig) {
        ravenMock.clear();        

        // test configuration
        var testConfig = {
            loggers : [
                {
                    id : "SentryLogger3",
                    level : "debug",
                    transports : {
                        SentryTransport : {
                            level: 'warn',
                            patchGlobal: false,
                            dsn: "http://d95ece701fa44adcbf5bcc6e8577df0d:04b29953c921486fa89581802b19f7bc@82.211.8.97:9000/2",
                        }    
                    }
                }
            ]
        };
        testConfig.root = loggingConfig.root;
        logging.configure(testConfig);
        

        // test the logger
        var sentryLogger3 = winston.loggers.get('SentryLogger3');
        assert.equal("debug", sentryLogger3.level);
        // test the transport
        var sentryLoggerTransport3 = sentryLogger3.transports["SentryTransport"];

        assert.equal('warn', sentryLoggerTransport3.level);
        assert.equal(false, sentryLoggerTransport3.patchGlobal);
        assert.equal("http://d95ece701fa44adcbf5bcc6e8577df0d:04b29953c921486fa89581802b19f7bc@82.211.8.97:9000/2", sentryLoggerTransport3.dsn);
        assert.equal('SentryTransport', sentryLoggerTransport3.name);
        // test log output
        sentryLogger3.warn('sentry warn');
        assert.deepEqual(["[SentryLogger3] sentry warn"], ravenMock.getLogs());

        sentryLogger3.error('sentry error');
        assert.deepEqual(ravenMock.getLogs(), 
                ["[SentryLogger3] sentry warn"]);

        sentryLogger3.warn('sentry warn');
        assert.deepEqual(ravenMock.getLogs(), 
                ["[SentryLogger3] sentry warn",
                "[SentryLogger3] sentry warn"]);

        // should not log
        sentryLogger3.silly('sentry silly');
        assert.deepEqual(ravenMock.getLogs(),
                ["[SentryLogger3] sentry warn",
                "[SentryLogger3] sentry warn"]);

        sentryLogger3.verbose('sentry verbose');
        assert.deepEqual(ravenMock.getLogs(), 
                ["[SentryLogger3] sentry warn",
                "[SentryLogger3] sentry warn"]);
    }));

});