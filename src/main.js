var roleHarvester = require("./role.harvester");
var roleUpgrader = require("./role.upgrader");
var roleBuilder = require("./role.builder");

module.exports.loop = function () {

  for(var name in Memory.creeps) {
    if(!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log("Clearing non-existing creep memory:", name);
    }
  }

  var builders = _.filter(Game.creeps, (creep) => creep.memory.role == "builder");
  var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == "harvester");
  var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == "upgrader");
  var structures = Game.spawns["Spawn1"].room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.energy < structure.energyCapacity;
    }
  });
  var constructions =  Game.spawns["Spawn1"].room.find(FIND_CONSTRUCTION_SITES);


  console.log("Harvesters: " + harvesters.length);
  console.log("builders: " + builders.length);
  console.log("upgraders: " + upgraders.length);
  console.log("structures: " + structures.length);
  console.log("constructions: " + constructions.length);

  if(_.size(Game.creeps) < 15) {
    var newName = Game.spawns["Spawn1"].createCreep([WORK,CARRY,MOVE], undefined, {role: "upgrader"});
    console.log("Spawning new harvester: " + newName);
  }

  if (structures.length != 0 && upgraders.length >= 2) {
    console.log("i: true");
    for (var i = harvesters.length; i < 5; i++) {
      upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == "upgrader");
      console.log("i: " + i + upgraders[0]);
      _.filter(Game.creeps, (creep) => creep.memory.role == "upgrader")[0].memory.role = "harvester";
      _.filter(Game.creeps, (creep) => creep.memory.role == "upgrader")[0].say("🔄 switched to harvesting");
    }
  }
  if (constructions.length != 0 && upgraders.length >= 2) {
    console.log("x: true");
    for (var x = builders.length; x < 5; x++) {
      upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == "upgrader");
      console.log("x: " + x + upgraders[0] + upgraders[0].memory.role);
      upgraders[0].memory.role = "builder";
      upgraders[0].say("🔄 switched to building");
    }
  }

  if(Game.spawns["Spawn1"].spawning) {
    var spawningCreep = Game.creeps[Game.spawns["Spawn1"].spawning.name];
    Game.spawns["Spawn1"].room.visual.text(
            "🛠️" + spawningCreep.memory.role,
            Game.spawns["Spawn1"].pos.x + 1,
            Game.spawns["Spawn1"].pos.y,
            {align: "left", opacity: 0.8});
  }

  for(var name in Game.creeps) {
    var creep = Game.creeps[name];
    if(creep.memory.role == "harvester") {
      roleHarvester.run(creep, structures);
    }
    if(creep.memory.role == "upgrader") {
      roleUpgrader.run(creep);
    }
    if(creep.memory.role == "builder") {
      roleBuilder.run(creep, constructions);
    }
  }
};
