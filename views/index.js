const d3 = require("d3");
const R = require("ramda");
const fs = require('fs');

const movement = require("nba-movement");

const WIDTH = 94;
const HEIGHT = 50;
const MULTIPLIER = 8;
const INTERVAL = 1000 / 24;

const pp = document.getElementById("play-pause");
const gc = document.getElementById("game-clock");
const sc = document.getElementById("shot-clock");
const bh = document.getElementById("ball-height");
const q = document.getElementById("quarter");

let svgNode;

let isPaused = false;

main();

function main() {
    fetch("/data/plays.json")
        .then(res => res.text())
        .then(text => text.trim().split("\n"))
        .then(arr => arr.map(JSON.parse).map(Event))
        .then(queueDrawing)

}

function drawMoment(moment) {
    removeSvg();

    gameClock(moment);
    shotClock(moment);
    ballHeight(moment);
    quarter(moment);

    const svg = d3.select("body").append("svg")
        .attr("width", WIDTH * MULTIPLIER)
        .attr("height", HEIGHT * MULTIPLIER);

    svgNode = svg._groups[0][0];

    var radius = 10;
    svg.selectAll(".player")
        .data(moment.coordinates).enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", function(c) {
            if (c.type === "ball") return radius - 4;
            return radius;
        })
        .attr("cx", c => c.x * MULTIPLIER)
        .attr("cy", c => c.y * MULTIPLIER)
        .style("fill", function(c) {
            if (c.type === "ball") return "black";
            if (c.teamId === 1610612766) return "#FDB3B3";
            return "#AEBEFF";
        });

    var texts = svg.selectAll(".myTexts")
        .data(moment.coordinates)
        .enter()
        .append("text");

    texts.attr("x", c => c.x * MULTIPLIER - radius / 2)
        .attr("y", c => c.y * MULTIPLIER + radius / 2)
        .style("fill", "black")
        .style("font-size", "12px")
        .style("font-family", "Arial, Helvetica, sans-serif")
        .text(function(c) {
            if (c.type === "ball") return "";
            return labelPlayer(c.playerId);
        });
}

function team(rawTeam) {
    return rawTeam.players.map(p => ({
        firstName: p.firstname,
        lastName: p.lastName,
        playerId: p.playerid,
        jerseyNo: p.jersey,
        position: p.position,
        teamName: rawTeam.name,
        teamId: rawTeam.teamid,
        teamAbbrev: rawTeam.abbreviation,
    }));
}

var fullPlayers = [];

var fullMomentsQ1 = [];
var fullMomentsQ2 = [];
var fullMomentsQ3 = [];
var fullMomentsQ4 = [];
var fullMoments = { fullMomentsQ1, fullMomentsQ2, fullMomentsQ3, fullMomentsQ4 };

var slider2 = document.getElementById("myRange2");
var quarterNumber = document.getElementById("quarter-number");
var quarterN = 1
var minute = document.getElementById("minute");
var minuteN = 11

slider2.oninput = function() {
    drawMoment(fullMoments['fullMomentsQ' + quarterN][0]['min' + minuteN][this.value]);
}

quarterNumber.oninput = function() {
    quarterN = this.value
    minuteN = 11
    drawMoment(fullMoments['fullMomentsQ' + quarterN][0]['min' + minuteN][this.value]);
}

minute.oninput = function() {
    minuteN = this.value
    slider2.max = fullMoments['fullMomentsQ' + quarterN][0]['min' + minuteN].length - 1
    slider2.value = 0
    drawMoment(fullMoments['fullMomentsQ' + quarterN][0]['min' + minuteN][this.value]);
}

function queueDrawing(events) {
    processEvents(events[0])
    slider2.max = fullMoments['fullMomentsQ' + quarterN][0]['min' + minuteN].length - 1
    drawMoment(fullMoments['fullMomentsQ' + quarterN][0]['min' + minuteN][minuteN]);
}

function labelPlayer(playerid) {
    return fullPlayers.filter(pl => pl.playerId == playerid)[0]['jerseyNo']
}

function processEvents(events) {
    var totalGameTime = 0

    var current_q = 0
    fullPlayers = events[0]['players']
    for (var i = 0; i < events.length; i++) {
        var ev = events[i]
        var moments = ev['moments']
        for (var j = 0; j < moments.length; j += 2) {
            var moment = moments[j]
            if (current_q != moment['quarter']) {
                current_q = moment['quarter']
                fullMoments['fullMomentsQ' + current_q].push(getEmptyListOfLists())
            }
            if (totalGameTime < moment['timestamp']) {
                totalGameTime = moment['timestamp']

                let min = Math.floor(moment.gameClock / 60);
                if (min == 12) min = 11
                fullMoments['fullMomentsQ' + moment['quarter']][0]['min' + min].push(moment)
            }
        }
    }

    return fullMoments;
}

function getEmptyListOfLists() {
    var min0 = []
    var min1 = []
    var min2 = []
    var min3 = []
    var min4 = []
    var min5 = []
    var min6 = []
    var min7 = []
    var min8 = []
    var min9 = []
    var min10 = []
    var min11 = []
    var temp = {
        min0,
        min1,
        min2,
        min3,
        min4,
        min5,
        min6,
        min7,
        min8,
        min9,
        min10,
        min11
    }
    return temp;
}

function Event(data) {
    data = data.events
    var events = []
    data.forEach(element => {
        var players = team(element.home).concat(team(element.visitor));
        var moments = element.moments.map(movement.Moment);
        events.push({ players, moments })
    });

    return events
}

function removeSvg() {
    if (svgNode == null) return;
    svgNode.parentElement.removeChild(svgNode);
    svgNode = null;
}


function gameClock(moment) {
    let min = Math.floor(moment.gameClock / 60);
    let sec = Math.floor(moment.gameClock % 60);
    if (sec < 10) sec = "0" + sec;
    gc.textContent = `${min}:${sec}`;
}

function shotClock(moment) {
    let clock = moment.shotClock;
    if (Math.floor(clock) === clock) {
        clock = clock + ".00";
    }
    sc.textContent = clock;
}

function ballHeight(moment) {
    let ball = R.find(R.whereEq({ type: "ball" }), moment.coordinates);
    bh.textContent = ball.z;
}

function quarter(moment) {
    let clock = moment.quarter;
    q.textContent = clock;
}

pp.addEventListener("click", () => isPaused = !isPaused);