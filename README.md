# mesosdns-http-agent

A http.Agent which makes it possible to consume Mesos service resources by simply using the Mesos DNS service names.

## Usage

### Basic usage

To use the `mesosdns-http-agent` package together with the [request](https://www.npmjs.com/package/request) module, you can simple modify the `Request.defaults()`. 
This will then use the same configuration with every request. Minimally, you'll have to configure one or more Mesos DNS server IPs:

```
var MesosDNSAgent = require("mesosdns-http-agent"),
    Request = require("request");

var request = Request.defaults({
    agentClass: MesosDNSAgent,
    agentOptions: {
        "dnsServers": ["192.168.0.101", "192.168.0.101", "192.168.0.102"],
        "mesosTLD": ".mesos" // This is optional, the mesosdns-client default is .mesos
    },
    pool: {}
});

var start1 = new Date().getTime();
// Will just use the globalAgent because the TLD is not associated with Mesos DNS
request("http://pkg.freebsd.org/", function(error, response, body) {
    if (error) console.log(error);
    console.log("First call took " + (new Date().getTime()-start1));
});

var start2 = new Date().getTime();
// Will use the mesosdns-http-agent
request("http://web.marathon.mesos/", function(error, response, body) {
    if (error) {
        console.log(error);
    } else {
        console.log("Call took " + (new Date().getTime()-start2) + 'ms with status ' + response.statusCode);
        console.log(body);
    }
});
```

You can use all available options of the [mesosdns-client](https://github.com/tobilg/mesosdns-client#options) package.

### Advanced usage

By default, the `mesosdns-client` will always use the first port which is returned for each service (instance). There may be applications which require to use another exposed port,
for example if a dockerized app (in bridged mode) was started on Marathon which exposes multiple `containerPort` values. This is also important if you defined the `Request.defaults()`,
 but also want to be able to use other Marathon app's ports within the same Node.js application. 
 
Then, you can create an `options` object like the following to define the port index to be used by setting the `defaultPortIndex` property to the desired value (look in the Marathon UI to compare).

```
var MesosDNSAgent = require("mesosdns-http-agent"),
    request = require("request");
    
var options = {
    agentClass: MesosDNSAgent,
    agentOptions: {
        "dnsServers": ["192.168.0.101", "192.168.0.101", "192.168.0.102"],
        "defaultPortIndex": 1
    },
    url: "http://web.marathon.mesos/"
};

var start = new Date().getTime();
request(options, function(error, response, body) {
    if (error) console.log(error);
    console.log(body);
    console.log("Call took " + (new Date().getTime()-start));
});
```


