var sf = require('slice-file')
	, Analyser = require('./lib/analyser')
	, parse = require('./lib/parser')
	, api = require('./lib/api')
	, cluster = require('cluster');

var lines = 2000;

var chans = {
	'cb2': 'IRCnet/#cb2.log',
	'coolbasic': 'IRCnet/#coolbasic.log',
	'javascript.fi': 'IRCnet/#javascript.fi.log',
	'node.js': 'Freenode/#node.js.log',
	'kapsi.fi': 'IRCnet/#kapsi.fi.log',
	'assembly': 'IRCnet/!assembly.log',
	'minecraft': 'IRCnet/#minecraft.log'
};

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < 5; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
} else {
	Object.keys(chans).forEach(function (id) {
		var analyser = new Analyser();

		analyser.addHeuristic('adjacency');

		sf('../../irclogs/' + chans[id]).follow(-lines).on('data', processChunk.bind(analyser));

		chans[id] = analyser;
	});

	function processChunk(chunk) {
		var data = parse(chunk);
		if (data) {
			this.infer(data);
		}
	}

	var web = new api(chans, {port: 36536}).start();
}