var roleBuilder = {

/** @param {Creep} creep **/
  run: function(creep, targets) {
    if(creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
      creep.say("🔄 harvest");
    }
    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
      creep.memory.building = true;
      creep.say("🚧 build");
    }
    if(creep.memory.building) {
      if(targets.length) {
        if(creep.build(targets[1]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[1], {visualizePathStyle: {stroke: "#ffffff"}});
        }
      } else {
        console.log("no jobs switching to upgrading on building constructions: " + targets.length)
        creep.memory.role = "upgrader";
        creep.say("🔄 switched to upgrading");
      }
    }
    else {
      var sources = creep.room.find(FIND_SOURCES);
      if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[1], {visualizePathStyle: {stroke: "#ffaa00"}});
      }
    }
  }
};

module.exports = roleBuilder;
