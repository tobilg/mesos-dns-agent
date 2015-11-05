var HttpAgent = require('http').Agent,
    Util = require('util'),
    MesosDNSClient = require('mesosdns-client');

var MesosDNSAgent = function MesosDNSAgent(options) {
    HttpAgent.call(this, options);

    var self = this;
    self.dnsClient = new MesosDNSClient(options);

};

// Inherit from HttpAgent
Util.inherits(MesosDNSAgent, HttpAgent);

MesosDNSAgent.prototype.addRequest = function (req, optionsArg) {
    var args = arguments,
        options = optionsArg,
        self = this;

    // Support legacy API: addRequest(req, host, port, localAddress)
    if (typeof options === 'string') {
        options = {
            host: options,
            port: arguments[2],
            localAddress: arguments[3]
        };
    }

    // Check if a URL containing the specific Mesos domain is requested
    if (options.host.indexOf(self.dnsClient.mesosTLD || ".mesos") > -1) {

        self.dnsClient.get(options.host, self.dnsClient.defaultPortIndex, function(err, endpointResult) {

            if (err) {
                // Forward error to outer http.Agent
                return MesosDNSAgent.super_.prototype.addRequest.apply(self, args);
            }

            // Regenerating stored HTTP header string for request
            // Note: blatantly ripped from http-proxy-agent
            req._header = null;
            req.setHeader('host', endpointResult.host + ':' + (endpointResult.port || options.port));
            req._implicitHeader();
            var hasOutput = req.output && req.output.length > 0;
            if (hasOutput) {
                // patching connection write() output buffer with updated header
                // the _header has already been queued to be written to the socket
                var first = req.output[0];
                var endOfHeaders = first.indexOf('\r\n\r\n') + 4;
                req.output[0] = req._header + first.substring(endOfHeaders);
            }

            return MesosDNSAgent.super_.prototype.addRequest.call(self, req, endpointResult.host, endpointResult.port || options.port, options.localAddress);

        });

    // If not, just use the globalAgent
    } else {
        return MesosDNSAgent.super_.prototype.addRequest.apply(self, args);
    }

};

module.exports = MesosDNSAgent;
