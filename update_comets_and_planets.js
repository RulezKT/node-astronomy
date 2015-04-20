#!/usr/bin/env node

var request = require("downcache"),
	fs = require("fs");

var argv = require('minimist')(process.argv.slice(2));

function planets() {
	request("http://ssd.jpl.nasa.gov/txt/p_elem_t1.txt", function(err, resp, body) {
		// remove all the intro info
		body = body.split(/\-{3,200}\n/)[1];

		var fields =  ["name", "a", "e", "I", "L", "w", "node"];

		var planets = [],
			name;

		body.split(/\n/).forEach(function(line, l) {
			var planet = {}; 
			line.split(/\s+/).forEach(function(datum, d) {
				planet[fields[d]] = d === 0? datum : parseFloat(datum);
			});

			if (planet.name == "") {
				planet.name = name + "_Cy";
			} else {
				name = planet.name;
			}

			if (Object.keys(planet).length > 1 && (argv.pluto || name !== "Pluto")) {
				planets.push(planet);
			}
		});

		console.log("Found info for " + planets.length / 2 + " planets.");
		fs.writeFileSync(__dirname + "/data/planets.json", JSON.stringify(planets, null, 2));

	});
}

function comets() {
	var comets = [];
	request("http://ssd.jpl.nasa.gov/dat/ELEMENTS.COMET", function(err, resp, body) {
		var lines = body.split(/\n/);
		var headers = lines.shift().split(/\s{3,50}/);
		headers.shift(); // we'll deal with name separately

		lines.forEach(function(line, l) {
			var comet = {};
			line = line.replace("JPL ", "JPL_");
			var name = line.match(/^\s*(.*?)\s{3,100}/);
			if (name) {
				comet.name = name[1];
				line = line.replace(/^\s*.*?\s{3,100}/, "");
				line.split(/\s+/).forEach(function(datum,f) {
					if (datum.replace(/\d+/, "") == "") {
						comet[headers[f]] = parseInt(datum, 10);
					} else if (datum.replace(/[0-9\.]+/, "") == "") {
						comet[headers[f]] = parseFloat(datum, 10);
					} else {
						comet[headers[f]] = datum;
					}
				});
				comets.push(comet);
			}
		});

		console.log("Found info for " + comets.length + " comets.");
		fs.writeFileSync(__dirname + "/data/comets.json", JSON.stringify(comets, null, 2));
	});
}

if (argv._.length == 0) {
	console.log("You should supply either 'planets' or 'comets' as an argument.");
} else if (argv._[0] == "comet" || argv._[0] == "comets") {
	comets();
} else if (argv._[0] == "planet" || argv._[0] == "planets") {
	planets();
}