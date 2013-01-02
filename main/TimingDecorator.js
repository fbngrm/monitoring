var winston = require('winston');
var _logger = winston.loggers.get('timing decorator');
  

 var TimingDecorator = function(target) {

    if(target == null || target === 0) throw new Error('target is null!');
    
    var _target = target;
    var _this   = this; 


    this.getThis = function() {
        return _this;
    }

    // Timer object for time measurement
    var timer = function(methodName)
    {
        var name      = methodName;
        var startTime = 0;
        var stopTime  = 0;
        var delta     = 0;

        this.start = function()
        {
            startTime = new Date().getTime();
            _logger.info('Start: ' + startTime);
        }
        this.stop = function()
        {
            stopTime = new Date().getTime();
            _logger.info('Stop: ' + stopTime);
        }
        this.getDelta = function()
        {
            delta = stopTime - startTime;
            _logger.info('Delta ' + delta + ' ms');
            _logger.info('FUNCTION "' + name + '" TERMINATED AFTER: ' + delta + ' ms\n');

            return delta;
        }
    }

    /**
     * Generate method and decorate the callback function with time measurement
     * Assume that the last parameter of the generated method is the callback function
     */
    var generateMethod = function(methodName)
    {
        _this[methodName] = function () {

            var t = new timer(methodName);
            // get the last argument
            var len  = arguments.length;
            var last = len > 0 ? arguments[len-1] : 0;
            // check if the last argument is (the callback) function
            if (typeof last == 'function') 
            {
                // decorate the callback function
                arguments[len-1] = callbackDecorator(t, last, methodName);

                _logger.info('Method "' + methodName + '" has a callback');
                // return the decorated function
                return methodDecorator(t, true, methodName, arguments);
            }

            _logger.info('Method: "' + methodName + '" has no callback');
            return methodDecorator(t, false, methodName, arguments);
        };   
    }

    var deleteMethod = function(methodName) {
        delete _this[methodName];
        _logger.info('Deleted method name: ' + methodName);
    };

    /**
     * Generates module methods for each method found in the instance we retrieve
     * by getInstance.
     */
    var generateMethods = function() {
        _logger.info('Generate methods');
        // create delegates
        if (_target != null) {
            for (var methodName in _target) {
                if (typeof _target[methodName] == "function"
                        && _target.hasOwnProperty(methodName)) {
                    _logger.info('Generate method(' + methodName + ')');
                    generateMethod(methodName);
                }
            }
        }
    };

    /**
     * Decorate the callback function with the time measurement
     * Log the timestamp in time_t format(seconds since UNIX epoch)
     */
    var callbackDecorator = function(timer, callback, methodName)
    {             
        // return the decorated callback function
        return function()
        {
            _logger.info('Called callback function of "' + methodName + '"');

            var args = Array.prototype.slice.call(arguments);
            if(args != '') _logger.info('Callback has arguments: ' + args);

            // call the callback function
            var res = callback.apply(null, args);

            // stop the timer after the callback 
            _logger.info('Stop timer in method: "' + methodName + '"');
            timer.stop(); 
            // DEBUG
            timer.getDelta();
            return res;
        }
    };

    /**
     * Decorate the method function with the time measurement
     * Log the timestamp in time_t format(seconds since UNIX epoch)
     */
    var methodDecorator = function(timer, hasCallback, methodName, args)
    {
            // start the timer before calling the method
            _logger.info('Start timer in method "' + methodName + '"');
            timer.start();

            // call the method 
            var result = _target[methodName].apply(_target, args);

            // if the method doesn't have any callback function, stop 
            //the timer after calling the method
            if (hasCallback === false)
            {
                timer.stop();
                _logger.info('Stop timer in method "' + methodName + '"');
                timer.getDelta(); 
                return result;
            }
    };

    // generate the proxy methods
    generateMethods();
}

module.exports = TimingDecorator;