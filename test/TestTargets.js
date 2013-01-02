var winston = require('winston');
var _logger = winston.loggers.get('winston');

/********************************/
/*  Test function for callbacks */
/********************************/

var CallbackMock = function() 
{
    var _called = [];
    var _args   = [];

    this.cbTest = function(name, args) 
    {
        var cb = function()
        {
            _logger.info('Callback function of "' + name + '" ... finished.');
            _called.push(name);
            if (args === undefined || args === '') return;
            _args.push(args);

            return name;
        }

        return callback(cb, args);
    }

    this.getCalled = function()
    {
        return _called;
    }
    
    this.getArgs = function()
    {
        return _args;
    }
}

/********************************/
/*         Test target          */
/********************************/
var TestTarget1 = function()
{
    var _generatedMethods = [];

    this.first = function(n, cb)
    {
        _logger.info('Sleep... ');
         // do nothing
        var now = new Date().getTime();
        while(new Date().getTime() < now + 11) {}
        process.nextTick(cb);
        _generatedMethods.push('first');
    }
    this.second = function(n)
    {
        _logger.info('Sleep... ');
         // do nothing
        var now = new Date().getTime();
        while(new Date().getTime() < now + 33) {}
        _generatedMethods.push('second');
    }
    this.third = function(n, cb)
    {
        _logger.info('Sleep... ');
         // do nothing
        var now = new Date().getTime();
        while(new Date().getTime() < now + 234) {}
        process.nextTick(cb);
        _generatedMethods.push('third');
    }

    this.getGenerated = function()
    {
        return _generatedMethods;
    }
}

var TestTarget2 = function()
{
    var _generatedMethods = [];

    this.foo = function(n)
    {
        _logger.info('Sleep... ');
         // do nothing
        var now = new Date().getTime();
        while(new Date().getTime() < now + 30) {}
        _generatedMethods.push('foo');
    }
    this.bar = function(n, cb)
    {
        _logger.info('Sleep... ');
         // do nothing
        var now = new Date().getTime();
        while(new Date().getTime() < now + 20) {}
        process.nextTick(cb);
        _generatedMethods.push('bar');
    }
    this.foofoo = function(n, m, func, cb)
    {
        _logger.info('Sleep... ');
         // do nothing
        var now = new Date().getTime();
        while(new Date().getTime() < now + 0) {}
        process.nextTick(cb);
        _generatedMethods.push('foofoo');
    }
    this.barbar = function(cb)
    {
        _logger.info('Sleep... ');
         // do nothing
        var now = new Date().getTime();
        while(new Date().getTime() < now + 500) {}
        process.nextTick(cb);
        _generatedMethods.push('barbar');
    }

    this.getGenerated = function()
    {
        return _generatedMethods;
    }
}

/**
* @param {Function} func the callback function
* @param {Object} opts an object literal with the following
* properties (all optional):
* scope: the object to bind the function to (what the "this" keyword will refer to)
* args: an array of arguments to pass to the function when it is called, these will be
* appended after any arguments passed by the caller
* suppressArgs: boolean, whether to supress the arguments passed
* by the caller. This default is false.
*/
     
function callback(func, opts){  
    var opts = opts ? opts : {};
    var cb = function(){
        var args = opts.args ? opts.args : [];
        var scope = opts.scope ? opts.scope : this;
        var fargs = opts.supressArgs === true ?
            [] : toArray(arguments);
        func.apply(scope,fargs.concat(args));
    }
    return cb;
}
     
// Helper function for callback
function toArray(arrayLike){
    var arr = [];
    for(var i = 0; i < arrayLike.length; i++){
        arr.push(arrayLike[i]);
    }
    return arr;
}

module.exports.TestTarget2  = TestTarget2;
module.exports.TestTarget1  = TestTarget1;
module.exports.CallbackMock = CallbackMock;
