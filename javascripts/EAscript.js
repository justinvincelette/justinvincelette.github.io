$(document).ready(function() {
$(document).scrollTop(0);
//////////////////////////////////////////////////////////////////////
/////////////////////////////// SET UP ///////////////////////////////
//////////////////////////////////////////////////////////////////////
var loggedIn = false;

var headerImage = 1;

var countriesVisited = 0;
var statesVisited = 0;
var continentsVisited = 0;

var statePercentage = 0;
var countryPercentage = 0;

var countryNames = Object.keys(countries);
var sortedCountries = countryNames.slice();
sortedCountries.sort();
var countryCount = countryNames.length;
var stateNames = Object.keys(states);
var continentNames = Object.keys(continents);
var otherCountries, otherStates, otherContinents;

var compareClicked = false;
var resetting = false;
var loggingOut = false;

var config = {
    apiKey: "AIzaSyAIvuE2H5AquKrMjM1xVvxciAfhSrJwpS8",
    authDomain: "endlessadventure-a2bd6.firebaseapp.com",
    databaseURL: "https://endlessadventure-a2bd6.firebaseio.com",
    storageBucket: "endlessadventure-a2bd6.appspot.com",
  };
  firebase.initializeApp(config);

const dbRef = firebase.database().ref();
const users = dbRef.child('users');
var userID, compareUserId;

$("#loginSignupDialog").dialog({
	show: "blind",
	hide: "blind",
	autoOpen: false,
	mexHeight: 200,
	modal: true,
	resizable: false
});  

$(".confirmPW").hide();

$("#welcomeDialog").dialog({
	show: "blind",
	hide: "blind",
	autoOpen: false,
	mexHeight: 200,
	modal: true,
	resizable: false,
	buttons: {
		"Log In": function() {
			$("#welcomeDialog").dialog("close");
			$(".confirmPW").hide();
			$(document).scrollTop(0);
			$("#loginSignupDialog").dialog({
				title: "Log In",
				buttons: {
					Back: function() {
						$("#loginSignupDialog").dialog("close");
						$(document).scrollTop(0);
						$("#welcomeDialog").dialog("open");
						$("#errorText").html("");
					},
					Submit: function() {
						var email = $("#email").val();
						var password = $("#password").val();
						userID = email.replace(".", "_");
						
						const auth = firebase.auth();
		
						const promise = auth.signInWithEmailAndPassword(email, password);
						promise.catch(e => $("#errorText").html(e.toString()));
					}
				}
			}).dialog("open");
		},
		"Sign Up": function() {
			$("#welcomeDialog").dialog("close");
			$(".confirmPW").show();
			$(document).scrollTop(0);
			$("#loginSignupDialog").dialog({
				title: "Sign Up",
				buttons: {
					Back: function() {
						$("#loginSignupDialog").dialog("close");
						$(document).scrollTop(0);
						$("#welcomeDialog").dialog("open");
						$("#errorText").html("");
						$("#password").val("");
						$("#confirmPW").val("");
					},
					Submit: function() {
						var email = $("#email").val();
						var password = $("#password").val();
						var password2 = $("#confirmPW").val();
						
						if (password !== password2) {
							$("#errorText").html("Passwords do not match. Please try typing them in again.")
						} else {
							userID = email.replace(".", "_");
							
							const auth = firebase.auth();
			
							const promise = auth.createUserWithEmailAndPassword(email, password);
							promise.catch(e => $("#errorText").html(e.toString()));
						}
					}
				}
			}).dialog("open");
		},
		"Continue without Account": function() {
			loggedIn = false;
			$(".logout").html("Log In");
			userID = "";
			$("#welcomeDialog").dialog("close");
			$('body').css('overflow', 'auto');
			$(document).scrollTop(0);
		}
	}
});

 firebase.auth().onAuthStateChanged(firebaseUser => {
	if (firebaseUser) {
		loggedIn = true;
		$(".logout").html("Log Out");
		$("#loginSignupDialog").dialog("close");
		$('body').css('overflow', 'auto');
		$(document).scrollTop(0);
		$("#password").val("");
		userID = firebase.auth().currentUser.email.replace(".", "_");
		users.child(userID).once("value").then(function(snapshot) {
			if (snapshot.val() === null) {
				users.child(userID).set({
							countries: countries,
							states: states,
							continents: continents
						});
			} else {
				for (var key in snapshot.val().countries) {
					if (snapshot.val().countries[key].visited) {
						fillInCountry(key);
					}
				}
				for (var key in snapshot.val().states) {
					if (snapshot.val().states[key].visited) {
						fillInState(key);
					}
				}
			}
		});
	} else {
		loggedIn = false;
		$(".logout").html("Log In");
		$("#welcomeDialog").dialog("open");
		$('body').css('overflow', 'hidden');
	}
});

var width = window.innerWidth * 0.6,
    height = Math.max(window.innerHeight * 0.7, 500);

var projection = d3.geo.mercator()
    .translate([0, 0])
    .scale(width / 2 / Math.PI);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 14])
    .on("zoom", move);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map").append("svg")
	.attr({
		preserveAspectRatio: "xMinYMin meet",
		viewBox: "0 0 " + width + " " + height,
		class: "map"
	})
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .call(zoom);
	
svg.append("rect")
	.attr({
		class: "overlay",
		x: -width / 2,
		y: -height / 2,
		width: width,
		height: height,
		stroke: "#e6e6e6",
		fill: "#050505" 
	});
	
var g = svg.append("g");
		
//////////////////////////////////////////////////////////////////////
//////////////////////// CREATE MAP FROM DATA ////////////////////////
//////////////////////////////////////////////////////////////////////

d3.json("../json/world-50m.json", function(error, world) {
	if (error) throw error;

	g.selectAll("path")
			.data(topojson.feature(world, world.objects.countries).features)
			.enter().append("path")
			.filter(function(d) { return d.id !== 840; })
			.attr({
				d: path,
				class: "land",
				fill: "white"
			})
			.on("click", function(d) {
				if (d3.event.defaultPrevented) return; // Prevent the following from happening if drag event
				var name = binarySearch(countryNames, d.id, "countries");
				fillInCountry(name);
			})
			.on("mouseenter", function(d) {
				var name = binarySearch(countryNames, d.id, "countries");
				svg.selectAll(".name").remove();
				svg.append("text")
					.text("")
					.attr({
						x: -width/2 + 5,
						y: height/2 - 5,
						fill: "#ff3333",
						class: "name",
						"font-size": "24px"
					});
				$("text.name").typed({
					strings: [name],
					typeSpeed: 30
				});
			})
			.on("mouseleave", function() {
				svg.selectAll(".name").
					transition().duration(750)
					.style({
						opacity: 0
					});
			});
	
	g.append("path")
		.datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
		.attr({
			class: "boundary",
			d: path
		});
        
        d3.json("../json/us-states.json", function(error, us) {
                if (error) throw error;
                
                g.selectAll("path.states")
                .data(topojson.feature(us, us.objects.states).features)
                .enter().append("path")
                .attr({
                      d: path,
                      class: "states",
                      fill: "white"
                      })
                .on("click", function(d) {
                    if (d3.event.defaultPrevented) return; // Prevent the following from happening if drag event
                    var name = binarySearch(stateNames, d.id, "states");
                    fillInState(name);
                    })
                .on("mouseenter", function(d) {
                    var name = binarySearch(stateNames, d.id, "states");
                    nameTyped = name;
                    svg.selectAll(".name").remove();
                    svg.append("text")
                    .text("")
                    .attr({
                          x: -width/2 + 5,
                          y: height/2 - 5,
                          fill: "#ff3333",
                          class: "name",
                          "font-size": "24px"
                          });
                    $("text.name").typed({
                                         strings: [name],
                                         typeSpeed: 30
                                         });
                    })
                .on("mouseleave", function() {
                    svg.selectAll(".name").
                    transition().duration(750)
                    .style({
                           opacity: 0
                           });
                    });
                
                g.append("path")
                .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
                .attr({
                      class: "boundary",
                      d: path
                      });
                });
        
        });
                  
                  
                  
                  //////////////////////////////////////////////////////////////////////
/////////////////////////////// JQUERY ///////////////////////////////
//////////////////////////////////////////////////////////////////////

//setTimeout(carousel, 3000);

// Set up auto complete input box
$("#inputBox").autocomplete({
	source: Object.keys(states).concat(Object.keys(countries)),
	select: function(event, ui) {
		fillInCountry(ui.item.value);
	}
});

$(".pieButton").click(function() {
	barGraph.transition().duration(3000).attr({transform: "translate(" + -width*1.1 + "," + 0 + ")"});
	pieChart.transition().duration(3000).attr({transform: "translate(" + width/2 + "," + chartsHeight/2 + ")"});
});
$(".barButton").click(function() {
	barGraph.transition().duration(3000).attr({transform: "translate(0,0)"});
	pieChart.transition().duration(3000).attr({transform: "translate(" + width*1.3 + "," + chartsHeight/2 + ")"});
})

$("#dialog").dialog({
	show: "blind",
	hide: "blind",
	autoOpen: false,
	maxHeight: 500,
	modal: true
});

$("[id=statesVisitedLabel]").on("click", function() {
	$("#dialog").html(function() {
		var str = "";
		for (var i = 0; i < stateNames.length; i++) {
			if (compareClicked) {
				if (states[stateNames[i]].visited && otherStates[stateNames[i]].visited) {
					str += "<font color=\"#00b386\">" + stateNames[i] + "</font>";
				}
				else if (states[stateNames[i]].visited) {
					str += "<font color=\"#00b33c\">" + stateNames[i] + "</font>";
				} else if (otherStates[stateNames[i]].visited){
					str += "<font color=\"#0059b3\">" + stateNames[i] + "</font>";
				} else {
					str += "<font color=\"red\">" + stateNames[i] + "</font>";
				}
			} else {
				if (states[stateNames[i]].visited) {
					str += "<font color=\"#00b33c\">" + stateNames[i] + "</font>";
				} else {
					str += "<font color=\"red\">" + stateNames[i] + "</font>";
				}
			}
			str += "<br>";
		}
		return str;
	});
	$("#dialog").dialog({
		title: "U.S. States"
	}).dialog("open");
}).on("mouseenter", function() {
	$("[id=statesVisitedLabel]").css("color", "#e6b800");
}).on("mouseleave", function() {
	$("[id=statesVisitedLabel]").css("color", "black");
});

$("[id=countriesVisitedLabel]").on("click", function() {
	$("#dialog").html(function() {
		var str = "";
		for (var i = 0; i < sortedCountries.length; i++) {
			if (compareClicked) {
				if (countries[sortedCountries[i]].visited && otherCountries[sortedCountries[i]].visited) {
					str += "<font color=\"#00b386\">" + sortedCountries[i] + "</font>";
				}
				else if (countries[sortedCountries[i]].visited) {
					str += "<font color=\"#00b33c\">" + sortedCountries[i] + "</font>";
				} else if (otherCountries[sortedCountries[i]].visited){
					str += "<font color=\"#0059b3\">" + sortedCountries[i] + "</font>";
				} else {
					str += "<font color=\"red\">" + sortedCountries[i] + "</font>";
				}
			} else {
				if (countries[sortedCountries[i]].visited) {
					str += "<font color=\"#00b33c\">" + sortedCountries[i] + "</font>";
				} else {
					str += "<font color=\"red\">" + sortedCountries[i] + "</font>";
				}
			}
			str += "<br>";
		}
		return str;
	});
	$("#dialog").dialog({
		title: "Countries"
	}).dialog("open");
}).on("mouseenter", function() {
	$("[id=countriesVisitedLabel]").css("color", "#e6b800");
}).on("mouseleave", function() {
	$("[id=countriesVisitedLabel]").css("color", "black");
});

$('#dialog').on('dialogopen', function(){
    $('body').css('overflow', 'hidden');
}).on('dialogclose', function(){
    $('body').css('overflow', 'auto');
});

$("[id=continentsVisitedLabel]").on("click", function() {
	$("#dialog").html(function() {
		var str = "";
		for (var i = 0; i < continentNames.length; i++) {
			if (compareClicked) {
				if (continents[continentNames[i]] > 0 && otherContinents[continentNames[i]] > 0) {
					str += "<font color=\"#00b386\">" + continentNames[i] + "</font>";
				}
				else if (continents[continentNames[i]] > 0) {
					str += "<font color=\"#00b33c\">" + continentNames[i] + "</font>";
				} else if (otherContinents[continentNames[i]] > 0) {
					str += "<font color=\"#0059b3\">" + continentNames[i] + "</font>";
				} else {
					str += "<font color=\"red\">" + continentNames[i] + "</font>";
				}
			} else {
				if (continents[continentNames[i]] > 0) {
					str += "<font color=\"#00b33c\">" + continentNames[i] + "</font>";
				} else {
					str += "<font color=\"red\">" + continentNames[i] + "</font>";
				}
			}
			str += "<br>";
		}
		return str;
	});
	$("#dialog").dialog({
		title: "Continents"
	}).dialog("open");
}).on("mouseenter", function() {
	$("[id=continentsVisitedLabel]").css("color", "#e6b800");
}).on("mouseleave", function() {
	$("[id=continentsVisitedLabel]").css("color", "black");
});

$("#resetDialog").dialog({
	show: "blind",
	hide: "blind",
	autoOpen: false,
	mexHeight: 200,
	modal: true,
	resizable: false,
	buttons: {
		"Yes, reset": function() { 
			reset(),		
			$(this).dialog("close");
			$('body').css('overflow', 'auto');
		},
		Cancel: function() {
			$(this).dialog("close");
			$('body').css('overflow', 'auto');
		}
	}
});

$(".logout").on("click", function() {
	loggingOut = true;
	$(document).scrollTop(0);
	if (loggedIn) {
		firebase.auth().signOut();
	} else {
		$("#welcomeDialog").dialog("open");
		$('body').css('overflow', 'hidden');
	}
	loggedIn = false;
	$(".logout").html("Log In");
	userID = "";
	reset();
	loggingOut = false;
});

$(".reset").on("click", function() {
	$("#resetDialog").dialog("open");
	$('body').css('overflow', 'hidden');
});

$(".help").on("click", function() {
	$("#dialog").html("Click on (or type into the box below the map) all of the states and countries that you have visited, and watch as the data visualizations " + 
		"update to show stats about your travels.<br><br>If you are logged in, your data is automatically saved in real time and will be waiting for you next time you sign in. " +
		"<br><br>To see a list of each type of territory, click on 'States visited', 'Countries visited' or 'Continents visited'.<br><br>Click on the 'Bar' or 'Pie' buttons " +
		"to change the type of graph showing your data.<br><br>To see how the places you've visited stack up against your friends, click on the 'Compare' button and enter in your " +
		"friends email (They must already have an account). Click 'Compare' again to return to only your data.<br><br>If you would like to start fresh, click the 'Reset' button.<br><br>" +
		"Now go get started, and when you are finished, go back out into the world to continue living an Endless Adventure!");
	$("#dialog").dialog({
		title: "Help"
	}).dialog("open");
	$('body').css('overflow', 'hidden');
});

$("#compareDialog").dialog({
	show: "blind",
	hide: "blind",
	autoOpen: false,
	mexHeight: 200,
	modal: true,
	resizable: false,
	buttons: {
		Submit: function() {
			compareUserId = $("#compareEmail").val().replace(".", "_");
			users.child(compareUserId).once("value").then(function(snapshot) {
				if (snapshot.val() === null) {
					$("#compareError").html("There is no user with that email, please try again.");
				} else {
					$("#compareDialog").dialog("close");
					$('body').css('overflow', 'auto');
					$("#compareError").html("");
					otherCountries = snapshot.val().countries;
					otherStates = snapshot.val().states;
					otherContinents = snapshot.val().continents;
					compare();
				}
			});
		}
	}
});

$(".compare").on("click", function() {
	if (compareClicked) {
		removeCompare();
	} else {
		$("#compareDialog").dialog("open");
		$('body').css('overflow', 'hidden');
	}
});

$(".compareDiv").hide();
var compareHeight = 0;
var compareSVG = d3.select(".compareDiv").append("svg")
					.attr({
						preserveAspectRatio: "xMinYMin meet",
						viewBox: "0 0 " + width + " " + compareHeight
					});


//////////////////////////////////////////////////////////////////////
///////////////////////////// Percentages ////////////////////////////
//////////////////////////////////////////////////////////////////////

var redYellowGreen = d3.scale.linear()
						.domain([0, 50, 100])
						.range(["red", "yellow", "green"]);

var tau = 2 * Math.PI;
var percentWidth = 100, percentHeight = 100;
var arc = d3.svg.arc()
    .innerRadius((percentWidth/2) - (percentWidth*0.1))
    .outerRadius(percentWidth/2)
    .startAngle(0);

// State Percent
var statePercentSVG = d3.select("#statePercent").append("svg")
	.attr({
		preserveAspectRatio: "xMinYMin meet",
		viewBox: "0 0 " + percentWidth + " " + percentHeight,
		class: "statePercent"
	});
	
var stateG = statePercentSVG.append("g").attr("transform", "translate(" + percentWidth/2 + "," + percentHeight/2 + ")");
	
var backgroundArc = stateG.append("path")
    .datum({endAngle: tau})
    .style("fill", "#ddd")
    .attr("d", arc);

var foreground = stateG.append("path")
    .datum({endAngle: statePercentage * tau})
    .style("fill", "black")
    .attr("d", arc);

stateG.append("text")
	.text("Percent of States travelled to")
	.attr({
		x: 0,
		y: -percentHeight/4,
		"font-size": "10px",
		"text-anchor": "middle"
	});
	
stateG.append("text")
	.text((statePercentage*100) + "%")
	.attr({
		x: 0,
		y: percentHeight/7,
		"font-size": "40px",
		"text-anchor": "middle",
		"class": "statePercent"
	})
	
// Country Percent
var countryPercentSVG  = d3.select("#countryPercent").append("svg")
	.attr({
		preserveAspectRatio: "xMinYMin meet",
		viewBox: "0 0 " + percentWidth + " " + percentHeight,
		class: "countryPercent"
	});
	
var countryG = countryPercentSVG.append("g").attr("transform", "translate(" + percentWidth/2 + "," + percentHeight/2 + ")");
	
var backgroundArc2 = countryG.append("path")
    .datum({endAngle: tau})
    .style("fill", "#ddd")
    .attr("d", arc);
	
var foreground2 = countryG.append("path")
    .datum({endAngle: countryPercentage * tau})
    .style("fill", "black")
    .attr("d", arc);

countryG.append("text")
	.text("Percent of Countries travelled to")
	.attr({
		x: 0,
		y: -percentHeight/4,
		"font-size": "10px",
		"text-anchor": "middle"
	});
	
countryG.append("text")
	.text((countryPercentage*100) + "%")
	.attr({
		x: 0,
		y: percentHeight/7,
		"font-size": "40px",
		"text-anchor": "middle",
		"class": "countryPercent"
	})

// Function taken from Mike Bostock's arc tween - https://bl.ocks.org/mbostock/5100636
function arcTween(newAngle) {
  return function(d) {
    var interpolate = d3.interpolate(d.endAngle, newAngle);
    return function(t) {
      d.endAngle = interpolate(t);
      return arc(d);
    };
  };
}	

//////////////////////////////////////////////////////////////////////
/////////////////////////////// CHARTS ///////////////////////////////
//////////////////////////////////////////////////////////////////////

// Bar Chart
var colors = d3.scale.ordinal()
				//.range(["#05052B", "#000A51", "#012082", "#004799", "#00A3AA", "#07E8B0", "#52fad0"]);
				.range(["#001a09", "#004d1a", "#00802b", "#00b33c", "#00e64d", "#1aff66", "#4dff88", "#ddd"]);
var compareColors = d3.scale.ordinal()
				.range(["#4da6ff","#1a8cff","#0073e6","#0059b3","#004080","#00264d","#000d1a"]);
				//.range(["#000d1a","#00264d","#004080","#0059b3","#0073e6","#1a8cff","#4da6ff"])

				
var chartsHeight = 300;
var margins = {
	left: 200,
	right: 200,
	top: 30,
	bottom: 30
};
var charts = d3.select("#charts").append("svg")
				.attr({
					preserveAspectRatio: "xMinYMin meet",
					viewBox: "0 0 " + width + " " + chartsHeight,
					class: "charts"
				});

charts.append("rect")
	.attr({
		class: "background",
		width: width,
		height: chartsHeight,
		fill: "#e6e6e6" 
	});

var barX = 100;
var marginBottom = 50; 
var xMax = 10;
var prevXMax = 10;
var xScale = d3.scale.linear()
	.domain([0, xMax])
	.range([0, width-margins.left-margins.right]);
var yScale = d3.scale.ordinal().domain(continentNames).rangeRoundBands([margins.top, chartsHeight-margins.bottom], 0.25, 0.1);
var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6);
var yAxis = d3.svg.axis().scale(yScale).orient("left");

var barGraph = charts.append("g");

var bars = barGraph.selectAll(".bar")
				.data(continentNames)
				.enter().append("rect")
				.attr({
					class: "bar",
					x: margins.left,
					y: function(d) { return yScale(d); },
					width: function(d) { return xScale(continents[d]); },
					height: function (d) { return yScale.rangeBand(); },
					id: function (d, i) { return i; },
					fill: function(d,i) { return colors(i); }
				});
				
// X axis
barGraph.append("g")
	.attr({class: "xAxis", transform: "translate(" + margins.left + "," + (chartsHeight-margins.bottom) + ")"})
	.call(xAxis);
		
// Y axis
barGraph.append("g")
	.attr({class: "yAxis", transform: "translate(" + margins.left + "," + 0 + ")"})
	.call(yAxis);

	
// Pie Chart
var pieData = [
	{continent:"Africa", count: 0},
	{continent:"Asia", count: 0},
	{continent:"Europe", count: 0},
	{continent:"North America", count: 0},
	{continent:"Oceania", count: 0},
	{continent:"South America", count: 0},
	{continent:"Antarctica", count: 0},
	{continent:"BLANK", count: 1} // Make it so there's a circle even when no continents have been added to 
];

var radius = Math.min(width, chartsHeight) / 2;
var pie = d3.layout.pie()
			.value(function(d) { return d.count; })
			.sort(null);
var pieArc = d3.svg.arc()
			.innerRadius(0)
			.outerRadius(radius-20);

var pieChart = charts.append("g")
				.attr({
					transform: "translate(" + width/2 + "," + chartsHeight/2 + ")"
				});

var piePath = pieChart.datum(pieData).selectAll("path.pie")
			.data(pie)
			.enter().append("path")
			.attr({
				fill: function(d, i) { return colors(i); },
				d: pieArc
			})
			.on("mouseover", function(d) {
				var name = d.data.continent;
				if (name !== "BLANK") {
					pieChart.append("text").text(name)
						.attr({
							x: radius,
							fill: "black",
							class: "pieLabel"
						});
				}
			})
			.on("mouseleave", function(d) {
				pieChart.selectAll("text.pieLabel").remove();
			})
			.each(function(d) { this._current = d; });

function pieTween(a) { 
	var i = d3.interpolate(this._current, a);
	this._current = i(0);
	return function(t) {
		return pieArc(i(t));
	};
}

pieChart.attr({
	transform: "translate(" + width*1.3 + "," + chartsHeight/2 + ")"
})


	
//////////////////////////////////////////////////////////////////////
////////////////////////// EXTRA FUNCTIONS ///////////////////////////
//////////////////////////////////////////////////////////////////////

function carousel() {
	console.log($("header").css("background-image"));
	if (headerImage === 0) {
		$("header").css("background-image", "url(\"header.jpg\")");
	} else if (headerImage === 1) {
		$("header").css("background-image", "url(\"header2.jpg\")");
	}
	headerImage++;
	headerImage = headerImage % 2;
	setTimeout(carousel, 3000);
}

function move() {
  var t = d3.event.translate,
      s = d3.event.scale;
  t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
  t[1] = Math.min(height / 2 * (s - 1) + 230 * s, Math.max(height / 2 * (1 - s) - 150 * s, t[1]));
  zoom.translate(t);
  g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
}

function fillInCountry(country) {
	if(!countries[country]) {
		fillInState(country);
		return;
	}
	
	var id = countries[country].id;
	var visited = countries[country].visited;
	var continent = countries[country].continent;
	var countryOnMap = g.selectAll("path.land")
		.filter(function(d) { return d.id === id; });
	
	if (visited) {
		if (compareClicked && otherCountries[country].visited) {
			countryOnMap.attr("fill", "#0059b3");
		} else {
			countryOnMap.attr("fill", "white");
		}
		countries[country].visited = false;
		countriesVisited--;
		continents[continent]--;
		if (continents[continent] === 0) {
			continentsVisited--;
		}
	} else {
		if (compareClicked && otherCountries[country].visited) {
			countryOnMap.attr("fill", "#00b386")
		} else {
			countryOnMap.attr("fill", "#00b33c");
		}
		countries[country].visited = true;
		countriesVisited++;
		if (continents[continent] === 0) {
			continentsVisited++;
		}
		continents[continent]++;
	}
	update();
	if (loggedIn) {
		users.child(userID).update({
								countries: countries,
								continents: continents
							});
	}
}

function fillInState(state) {
	var id = states[state].id;
	var visited = states[state].visited;
	var stateOnMap = g.selectAll("path.states")
		.filter(function(d) { return d.id === id});
	
	if (visited) {
		if (compareClicked && otherStates[state].visited) {
			stateOnMap.attr("fill", "#0059b3");
		} else {
			stateOnMap.attr("fill", "white");
		}
		states[state].visited = false;
		statesVisited--;
		if (statesVisited === 0) {
			countriesVisited--;
			continents["North America"]--;
			if (continents["North America"] === 0) {
				continentsVisited--;
			}
		}
	} else {
		if (compareClicked && otherStates[state].visited) {
			stateOnMap.attr("fill", "#00b386")
		} else {
			stateOnMap.attr("fill", "#00b33c");
		}
		states[state].visited = true;
		if (statesVisited === 0) {
			countriesVisited++;
			if (continents["North America"] === 0) {
				continentsVisited++;
			}
			continents["North America"]++;
		}
		statesVisited++;
	}
	update();
	if (loggedIn) {
		users.child(userID).update({
								states: states,
								continents: continents
							});
	}
}

function update() {
	updateOdometers();
	updateBarChart();
	updatePieChart();
	updatePercents();
	if (compareClicked) {
		updateCompareCircles();
	}
}

function updateOdometers() {
	countryOdometer.innerHTML = countriesVisited;
	stateOdometer.innerHTML = statesVisited;
	continentOdometer.innerHTML = continentsVisited;
}

function updateBarChart() {
	for (var key in continents) {
		if (continents[key] === xMax) {
			xMax += 10;
			xScale.domain([0, xMax]);
			xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6);
			barGraph.select(".xAxis").remove();
			barGraph.append("g")
				.attr({class: "xAxis", transform: "translate(" + margins.left + "," + (chartsHeight-margins.bottom) + ")"})
				.call(xAxis);
		}
	}
	bars.transition().duration(750)
		.attr("width", function(d) { return xScale(continents[d]); });
}

function updatePieChart() {
	var allZero = true;
	for (var i = 0; i < pieData.length - 1; i++) {
		var name = pieData[i].continent;
		pieData[i].count = continents[name];
		if (pieData[i].count > 0) {
			allZero = false;
		}
	}
	if (allZero) {
		pieData[7].count = 1; // Add blank data holder
	} else {
		pieData[7].count = 0; // Remove blank data holder
	}
	piePath = piePath.data(pie); // compute the new angles
	piePath.transition().duration(750).attrTween("d", pieTween); // redraw the arcs
}

function updatePercents() {
	statePercentage = statesVisited / 50;
	foreground.transition()
		.duration(750)
		.attrTween("d", arcTween(statePercentage * tau))
		.style("fill", redYellowGreen(Math.floor((statePercentage*100))));
	stateG.select("text.statePercent")
		.text(Math.floor((statePercentage*100)) + "%")
		.transition()
		.duration(750)
		.attr("fill", redYellowGreen(Math.floor((statePercentage*100))));
		
	countryPercentage = countriesVisited / countryCount;
	foreground2.transition()
		.duration(750)
		.attrTween("d", arcTween(countryPercentage * tau))
		.style("fill", redYellowGreen(Math.floor((countryPercentage*100))));
	countryG.select("text.countryPercent")
		.text((countryPercentage * 100).toFixed(1) + "%")
		.transition()
		.duration(750)
		.attr("fill", redYellowGreen(Math.floor((countryPercentage*100))));
}

function binarySearch(array, id, type) {
	var newArray = [];
	
	var half = Math.floor(array.length / 2);
	var name = array[half];
	var currID = "";
	if (type === "countries") {
		currID = countries[name].id;
	} else if (type === "states") {
		currID = states[name].id;
	}
	if (id === currID) {
		return name;
	} else if (id < currID) {
		newArray = array.slice(0, half);
		return binarySearch(newArray, id, type);
	} else {
		newArray = array.slice(half+1, array.length);
		return binarySearch(newArray, id, type);
	}
	return -1;
}

function compare() {
	$(".odometers").slideUp(500);
	$(".percentages").slideUp(500);
	var otherCountriesVisited = 0, otherStatesVisited = 0, otherContinentsVisited = 0;
	
	
	compareClicked = true;
	svg.selectAll("path.land")
		.attr("fill", function(d) {
			var name = binarySearch(countryNames, d.id, "countries");
			if (countries[name].visited && otherCountries[name].visited) {
				otherCountriesVisited++;
				return "#00b386";
			} else if (countries[name].visited) {
				return "#00b33c";
			} else if (otherCountries[name].visited) {
				otherCountriesVisited++;
				return "#0059b3";
			} else {
				return "white";
			}
		});
		
	svg.selectAll("path.states")
		.attr("fill", function(d) {
			var name = binarySearch(stateNames, d.id, "states");
			if (states[name].visited && otherStates[name].visited) {
				otherStatesVisited++;
				return "#00b386";
			} else if (states[name].visited) {
				return "#00b33c";
			} else if (otherStates[name].visited) {
				otherStatesVisited++;
				return "#0059b3";
			} else {
				return "white";
			}
		});
		
	var compareMax = 0;
	for (var key in continents) {
		if (otherContinents[key] > compareMax) {
			compareMax = otherContinents[key];
		}
		if (otherContinents[key] !== 0) {
			otherContinentsVisited++;
		}
	}
	if (compareMax > xMax) {
		prevXMax = xMax;
		xMax = compareMax;
		xScale.domain([0, xMax]);
			xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6);
			barGraph.select(".xAxis").remove();
			barGraph.append("g")
				.attr({class: "xAxis", transform: "translate(" + margins.left + "," + (chartsHeight-margins.bottom) + ")"})
				.call(xAxis);
	}
		
	bars
		.transition()
		.duration(750)
		.attr("height", function (d) { return yScale.rangeBand() / 2; })
		.attr("width", function(d) { return xScale(continents[d]); });
		
	var compareBars = barGraph.selectAll(".compareBars")
				.data(continentNames)
				.enter().append("rect")
				.attr({
					class: "compareBars",
					x: margins.left,
					y: function(d) { return yScale(d) + yScale.rangeBand()/2; },
					width: function(d) { return xScale(otherContinents[d]); },
					height: function (d) { return yScale.rangeBand() / 2; },
					id: function (d, i) { return i; },
					fill: function(d,i) { return compareColors(i); },
					opacity: 0
				});
	compareBars.transition().duration(750).attr("opacity", 1);
	
	setUpCompareCircles(otherStatesVisited, otherCountriesVisited, otherContinentsVisited);
	$(".compareDiv").slideDown(500);
}

function removeCompare() {
	$(".odometers").slideDown(500);
	$(".percentages").slideDown(500);
	$(".compareDiv").slideUp(500);
	if (!loggingOut) {
		$("html, body").animate({ scrollTop: $(document).height() }, 500);
	}
	
	svg.selectAll("path.land")
		.attr("fill", function(d) {
			var name = binarySearch(countryNames, d.id, "countries");
			if (countries[name].visited) {
				return "#00b33c";
			} else {
				return "white";
			}
		});
	svg.selectAll("path.states")
		.attr("fill", function(d) {
			var name = binarySearch(stateNames, d.id, "states");
			if (states[name].visited) {
				return "#00b33c";
			} else {
				return "white";
			}
		});
	xMax = prevXMax;
	xScale.domain([0, xMax]);
	xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6);
	barGraph.select(".xAxis").remove();
	barGraph.append("g")
			.attr({class: "xAxis", transform: "translate(" + margins.left + "," + (chartsHeight-margins.bottom) + ")"})
			.call(xAxis);
		
	
	if (resetting) {
		barGraph.selectAll(".bar").transition().delay(750)
		.attr("height", function (d) { return yScale.rangeBand(); });
	} else {
		barGraph.selectAll(".bar")
		.transition()
		.duration(750)
		.attr("height", function (d) { return yScale.rangeBand(); })
		.attr("width", function(d) { return xScale(continents[d]); });
	}
	
	barGraph.selectAll(".compareBars").remove();
	
	compareClicked = false;
}

function setUpCompareCircles(otherStatesVisited, otherCountriesVisited, otherContinentsVisited) {
	compareSVG.selectAll("circle.myStates").remove();
	compareSVG.selectAll("circle.otherStates").remove();
	compareSVG.selectAll("circle.myCountries").remove();
	compareSVG.selectAll("circle.otherCountries").remove();
	compareSVG.selectAll("circle.myContinents").remove();
	compareSVG.selectAll("circle.otherContinents").remove();
	var spacing = 20;
	var radius = 10;
	for (var i = 0; i < statesVisited; i++) {
		var x = (spacing * (i%5)) + radius;
		var y =  Math.floor(i / 5) * spacing + radius;
		if (y+radius > compareHeight) {
			compareHeight += radius*2;
			compareSVG.attr({viewBox: "0 0 " + width + " " + compareHeight});
		}
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#00b33c",
				id: "myStates" + i,
				class: "myStates"
			});
	}
	for (var i = 0; i < otherStatesVisited; i++) {
		var x = (spacing * (i%5)) + radius + (spacing*5);
		var y =  Math.floor(i / 5) * spacing + radius;
		if (y+radius > compareHeight) {
			compareHeight += radius*2;
			compareSVG.attr({viewBox: "0 0 " + width + " " + compareHeight});
		}
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#0059b3",
				id: "otherStates" + i,
				class: "otherStates"
			});
	}
	var middle = (width/2) - (radius * 10);
	for (var i = 0; i < countriesVisited; i++) {
		var x = (spacing * (i%5)) + radius + middle;
		var y =  Math.floor(i / 5) * spacing + radius;
		if (y+radius > compareHeight) {
			compareHeight += radius*2;
			compareSVG.attr({viewBox: "0 0 " + width + " " + compareHeight});
		}
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#00b33c",
				id: "myCountries" + i,
				class: "myCountries"
			});
	}
	for (var i = 0; i < otherCountriesVisited; i++) {
		var x = (spacing * (i%5)) + radius + middle + (spacing*5);
		var y =  Math.floor(i / 5) * spacing + radius;
		if (y+radius > compareHeight) {
			compareHeight += radius*2;
			compareSVG.attr({viewBox: "0 0 " + width + " " + compareHeight});
		}
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#0059b3",
				id: "otherCountries" + i,
				class: "otherCountries"
			});
	}
	var end = width - (radius * 20);
	for (var i = 0; i < continentsVisited; i++) {
		var x = (spacing * (i%5)) + radius + end;
		var y =  Math.floor(i / 5) * spacing + radius;
		if (y+radius > compareHeight) {
			compareHeight += radius*2;
			compareSVG.attr({viewBox: "0 0 " + width + " " + compareHeight});
		}
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#00b33c",
				id: "myContinents" + i,
				class: "myContinents"
			});
	}
	for (var i = 0; i < otherContinentsVisited; i++) {
		var x = (spacing * (i%5)) + radius + end + (spacing*5);
		var y =  Math.floor(i / 5) * spacing + radius;
		if (y+radius > compareHeight) {
			compareHeight += radius*2;
			compareSVG.attr({viewBox: "0 0 " + width + " " + compareHeight});
		}
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#0059b3",
				id: "otherContinents" + i,
				class: "otherContinents"
			});
	}
}

function updateCompareCircles() {
	var spacing = 20;
	var radius = 10;
	var middle = (width/2) - (radius * 10);
	var end = width - (radius * 20);
	var x, y;
	var prevStates = d3.selectAll("circle.myStates").size();
	if (prevStates === statesVisited) {
		// do nothing for state circles
	} else if (prevStates > statesVisited) {
		d3.select("#myStates" + (prevStates-1)).remove();
	} else {
		x = (spacing * (prevStates%5)) + radius;
		y =  Math.floor(prevStates / 5) * spacing + radius;
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#00b33c",
				id: "myStates" + prevStates,
				class: "myStates"
			});
	}
	var prevCountries = d3.selectAll("circle.myCountries").size();
	if (prevCountries === countriesVisited) {
		// do nothing for country circles
	} else if (prevCountries > countriesVisited) {
		d3.select("#myCountries" + (prevCountries-1)).remove();
	} else {
		x = (spacing * (prevCountries%5)) + radius + middle;
		y =  Math.floor(prevCountries / 5) * spacing + radius;
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#00b33c",
				id: "myCountries" + prevCountries,
				class: "myCountries"
			});
	}
	var prevContinents = d3.selectAll("circle.myContinents").size();
	if (prevContinents === continentsVisited) {
		return; // do nothing for continent circles
	} else if (prevContinents > continentsVisited) {
		d3.select("#myContinents" + (prevContinents-1)).remove();
	} else {
		x = (spacing * (prevContinents%5)) + radius + end;
		y =  Math.floor(prevContinents / 5) * spacing + radius;
		compareSVG.append("circle")
			.attr({
				r: radius,
				cx: x,
				cy: y,
				fill: "#00b33c",
				id: "myContinents" + prevContinents,
				class: "myContinents"
			});
	}
}

function reset() {
	resetting = true;
	for (var key in countries) {
		countries[key].visited = false;
	}
	for (var key in states) {
		states[key].visited = false;
	}
	for (var key in continents) {
		continents[key] = 0;
	}
	statesVisited = 0;
	countriesVisited = 0;
	continentsVisited = 0;
	
	update();
	svg.selectAll("path.land")
		.attr("fill", "white");
	svg.selectAll("path.states")
		.attr("fill", "white");
		
	removeCompare();
	if (loggedIn) {
		users.child(userID).set({
						countries: countries,
						states: states,
						continents: continents
					});
	}
	resetting = false;
}

});