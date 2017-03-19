var roleHarvester = {

    /** @param {Creep} creep **/
  run: function(creep, targets) {
    if(creep.carry.energy < creep.carryCapacity) {
      var sources = creep.room.find(FIND_SOURCES);
      if(creep.harvest(sources[1]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[1], {visualizePathStyle: {stroke: "#ffaa00"}});
      }
    }
    else {
      if(targets.length) {
        if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], {visualizePathStyle: {stroke: "#ffffff"}});
        }
      } else {
        console.log("no jobs switching to upgrading on harvest structures: " + targets.length  )
        console.log (targets)
        creep.memory.role = "upgrader";
        creep.say("🔄 switched to upgrading");
      }
    }
  }
};

module.exports = roleHarvester;
