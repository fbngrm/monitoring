var assert = require("assert"),
	winston = require('winston'),
	logger = winston.loggers.get('winston'),
	should = require('should'),
    TimingDecorator = require('common/monitoring/TimingDecorator'),
	targets = require('./TestTargets');

var JSONUtils = require("common/JSONUtils.js");


describe('TimingDecorator', function() {

    it('should pass without errors', function(done){
    	var tar = new targets.TestTarget1();
	    var dec = new TimingDecorator(tar);
	    var cb = new targets.CallbackMock();
	    // test initialisation of objects
	    tar.should.have.ownProperty('first');
	    tar.should.have.ownProperty('second');
	    tar.should.have.ownProperty('third');
	    // generate and call methods ~ test if methods were generated correctly and check
	    var ret = dec.first('first', cb.cbTest('first', 'first arg'));
   	    tar.getGenerated().should.eql(['first']);
		dec.second('second');
   	    tar.getGenerated().should.eql(['first','second']);
	    dec.third('third', cb.cbTest('third', 'second arg'));
   	    tar.getGenerated().should.eql(['first','second','third']);
    	// test if callback argument is recognized in methodgeneration
	    process.nextTick(function(){
	    	// test if callback functions get called
	    	assert.deepEqual(cb.getCalled(), ['first','third']);
	    	assert.deepEqual(cb.getArgs(), ['first arg','second arg']);
		});
		done();
    });
    
    it('run TimingDecorator ', function(done){
    	var tar = new targets.TestTarget1();
	  	// initialize TimingDecorator without testMock
	    (function(){
		    var dec = new TimingDecorator(tar);
		}).should.not.throw('target is null!');
		
	  	// initialize TimingDecorator with 0
	    (function(){
		    var dec = new TimingDecorator(0);
		}).should.throw();

	  	// initialize TimingDecorator with null
	    (function(){
		    var dec = new TimingDecorator(null);
		}).should.throw('target is null!');
		
	  	// initialize TimingDecorator with Date
	    (function(){
		    var dec = new TimingDecorator(newDate());
		}).should.not.throw('target is null!');

		done();
    });
    
    it('should pass without errors', function(done){
    	var tar = new targets.TestTarget2();
	    var dec = new TimingDecorator(tar);
	    var cb = new targets.CallbackMock();

	    // test initialisation of objects
	    (function(){
	    	tar.should.be.an.instanceof(targets.TestTarget1);
	    }).should.throw();
	    (function(){
	    	tar.should.be.an.instanceof(targets.TestTarget2);
	    }).should.not.throw();
	    dec.should.be.an.instanceof(TimingDecorator);
	    tar.should.have.ownProperty('foo');
	    tar.should.have.ownProperty('bar');
	    tar.should.have.ownProperty('foofoo');
	    tar.should.have.ownProperty('barbar');
	    // generate and call methods ~ test if methods were generated correctly 
	    dec.foo('foo');
	    tar.getGenerated().should.eql(['foo']);
		dec.bar('bar', cb.cbTest('bar', 'bar arg'));
	    tar.getGenerated().should.not.eql(['foo']);
	    tar.getGenerated().should.eql(['foo','bar']);
	    dec.foofoo('foofoo', 'm', function(){}, cb.cbTest('foofoo', 'foofoo arg'));
	    tar.getGenerated().should.eql(['foo','bar','foofoo']);
	    dec.barbar(cb.cbTest('barbar', 'barbar arg'));
	    tar.getGenerated().should.eql(['foo','bar','foofoo', 'barbar']);
    	// test if callback argument is recognized in methodgeneration
	    
	    process.nextTick(function(){
	    	// test if callback functions get called
	    	assert.deepEqual(cb.getCalled(), ['bar','foofoo', 'barbar']);
	    	assert.deepEqual(cb.getArgs(), ['bar arg','foofoo arg', 'barbar arg']);
		});
		done();
    });

});
