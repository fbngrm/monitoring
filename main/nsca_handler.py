import logging
import datetime, time
#import os

PSCR = ' PROCESS_SERVICE_CHECK_RESULT'

class NSCAHandler(logging.Handler):
    '''
    Define a custom logging handler to send passive check results to the send_nsca module of NAGIOS
    PASSIVE_CHECK_RESULT_COMMAND syntax:
    [<timestamp>] PROCESS_SERVICE_CHECK_RESULT;<host_name>;<description>;<return_code>;<plugin_output>

    timestamp is the time in time_t format (seconds since the UNIX epoch) that the service check was perfomed (or submitted). Please note the single space after the right bracket.
    host_name is the short name of the host associated with the service in the service definition
    description is the description of the service as specified in the service definition
    return_code is the return code of the check (0=OK, 1=WARNING, 2=CRITICAL, 3=UNKNOWN)
    plugin_output is the text output of the service check (i.e. the plugin output)
    '''
    
    def __init__(self):
        # run the regular Handler __init__
        logging.Handler.__init__(self)
        # formmater for the log record
        nsca_formatter = logging.Formatter('%(asctime)s LOGGER: %(name)s %(levelname)s HOST: %(host)s \
            SERVICE: %(desc)s %(message)s', datefmt='%m/%d/%Y %I:%M:%S')
        # set formatter
        self.setFormatter(nsca_formatter)


    def emit(self, record):
        try:
            self.format(record)
            print record.levelname
            timestamp = self.t_time(record.asctime)
            host_name = record.host
            description = record.desc
            return_code = self.code(record.levelname)
            plugin_output = record.message
            pscr = '[%s]%s;%s;%s;%s;%s;' % (timestamp, PSCR, host_name, description, return_code, plugin_output)
            self.send(pscr)
        except Exception as e:
            print 'Exception in NSCAHandler'
            print e
            pass
        return

    def t_time(self, asctime):
        # timeformat have to match %m/%d/%Y %I:%M:%S
        try:
            timestamp = datetime.datetime.strptime(asctime, "%m/%d/%Y %I:%M:%S")
            print timestamp
        except ValueError as err:
            print (err)
            timestamp = datetime.datetime.now()
        # get the time in time_t format (sgeh auf view und dann auf ''econds since the UNIX epoch)
        epoch = time.mktime(timestamp.timetuple())
        #print time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(epoch))
        return epoch

    def code(self, levelname):
        # get the error level as integer
        return {
            'INFO': 0,
            'DEBUG': 0,
            'WARNING': 1,
            'ERROR': 2,
            'CRITICAL': 2,
            }.get(levelname.strip().upper(), 3) 
    
    def send(self, pscr):
        #TO DO: insert send_nsca commandtools -> 
        #cmd = 'send_nsca'
        #os.system(cmd)
        print pscr
    
    
    
if __name__ == '__main__':

    nsca_logger = logging.getLogger('nsca')
    nsca_logger.setLevel(logging.DEBUG)
    nsca_logger_adapter = logging.LoggerAdapter(nsca_logger,
                                   { 'host' : '123.231.231.123', 'desc' : 'check api' })
    nsca_logger.addHandler(NSCAHandler())
    
    nsca_logger_adapter.debug('debug message')
    nsca_logger_adapter.log(10, 'debug message')
    nsca_logger_adapter.info('info message')
    nsca_logger_adapter.log(20, 'info message')
    nsca_logger_adapter.warning('warning message')
    nsca_logger_adapter.log(30, 'warning message')
    nsca_logger_adapter.critical('critical message')
    nsca_logger_adapter.log(40, 'critical message')
    nsca_logger_adapter.error('error message')
    nsca_logger_adapter.log(50, 'error message')
    nsca_logger_adapter.log(60, 'unknown message')
    

         
