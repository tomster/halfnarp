from twisted.web import server
from twisted.web.server import Site
from twisted.web.resource import Resource
from twisted.internet import reactor, task
import json
import time
import os

class InfoServer(Resource):
    isLeaf = True
    def __init__(self):
        # throttle in seconds to check app for new data
        self.throttle = 5
        # define a list to store client requests
        self.delayed_requests = []
        # setup a loop to process delayed requests
        loopingCall = task.LoopingCall(self.processDelayedRequests)
        loopingCall.start(self.throttle, False)
        # initialize parent
        Resource.__init__(self)

        newest_version = sorted(os.listdir('versions/'))[-1]
        if newest_version:
            self.current_version = int(newest_version.replace('fullnarp_','').replace('.json',''))
            print 'Resuming from version: ' + str(self.current_version)
            with open('versions/' + newest_version) as data_file:
                self.fullnarp_events = json.load(data_file)
        else:
            self.fullnarp_events={}
            self.current_version=0

    def render(self, request):
        """
        Handle a new request
        """
        # set the request content type
        request.setHeader('Content-Type', 'application/json')

        print request
        # set args
        args = request.args

        # set jsonp callback handler name if it exists
        if 'callback' in args:
            request.jsonpcallback = args['callback'][0]

        # set lastupdate if it exists
        if 'lastupdate' in args:
            request.lastupdate = args['lastupdate'][0]
        else:
            request.lastupdate = 0

        # Check if we were served an update
        if 'setevent' in args:
            eventid = args['setevent'][0]
            day     = args['day'][0]
            room    = args['room'][0]
            time    = args['time'][0]

            self.current_version += 1
            print 'Moving event: ' + eventid + ' to day ' + day + 'at ' + time + ' in room ' + room + ' newcurrentversion ' + str(self.current_version)

            if not eventid in self.fullnarp_events or self.fullnarp_events[eventid]['lastupdate'] < request.lastupdate:
                self.fullnarp_events[eventid] = { 'day': day, 'room': room, 'time': time, 'lastupdate': int(self.current_version) }
                with open('versions/fullnarp_' + str(self.current_version).zfill(5) + '.json', 'w') as outfile:
                    copy = self.fullnarp_events
                    json.dump(copy, outfile)

        # if we have data now, send it
        data = self.getData(request)
        if len(data) > 0 or 'setevent' in args:
            return self.__format_response(request, 1, data)

        # otherwise, put it in the delayed request list
        self.delayed_requests.append(request)

        # tell the client we're not done yet
        return server.NOT_DONE_YET

    def getData(self, request):
        return { k:v for k,v in self.fullnarp_events.items() if v['lastupdate'] > int(request.lastupdate) }

    def processDelayedRequests(self):
        """
        Processes the delayed requests that did not have
        any data to return last time around.
        """
        # run through delayed requests
        for request in self.delayed_requests:
            # attempt to get data again
            data = self.getData(request)

            # write response and remove request from list if data is found
            if len(data) > 0:
                try:
                    request.write(self.__format_response(request, 1, data))
                    request.finish()
                except:
                    # Connection was lost
                    print 'connection lost before complete.'
                finally:
                    # Remove request from list
                    self.delayed_requests.remove(request)

    def __format_response(self, request, status, data):
        """
        Format responses uniformly
        """
        # Set the response in a json format
        response = json.dumps({'status':status,'current_version': self.current_version, 'data':data})

        # Format with callback format if this was a jsonp request
        if hasattr(request, 'jsonpcallback'):
            return request.jsonpcallback+'('+response+')'
        else:
            return response

#############################################
if __name__ == '__main__':
    resource = InfoServer()
    factory = Site(resource)
    reactor.listenTCP(8001, factory)
    reactor.run()
