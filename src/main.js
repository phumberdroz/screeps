module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const loopHelper_1 = __webpack_require__(/*! ./helpers/loopHelper */ 1);
	const initPrototypes_1 = __webpack_require__(/*! ./prototypes/initPrototypes */ 58);
	const sandbox_1 = __webpack_require__(/*! ./sandbox */ 62);
	const profiler_1 = __webpack_require__(/*! ./profiler */ 7);
	loopHelper_1.loopHelper.initMemory();
	initPrototypes_1.initPrototypes();
	module.exports.loop = function () {
	    Game.cache = { structures: {}, hostiles: {}, hostilesAndLairs: {}, mineralCount: {}, labProcesses: {},
	        activeLabCount: 0, placedRoad: false, };
	    // Init phase - Information is gathered about the game state and game objects instantiated
	    profiler_1.profiler.start("init");
	    let empire = loopHelper_1.loopHelper.initEmpire();
	    let operations = loopHelper_1.loopHelper.getOperations(empire);
	    for (let operation of operations)
	        operation.init();
	    profiler_1.profiler.end("init");
	    // RoleCall phase - Find creeps belonging to missions and spawn any additional needed.
	    profiler_1.profiler.start("roleCall");
	    for (let operation of operations)
	        operation.roleCall();
	    profiler_1.profiler.end("roleCall");
	    // Actions phase - Actions that change the game state are executed in this phase.
	    profiler_1.profiler.start("actions");
	    for (let operation of operations)
	        operation.actions();
	    profiler_1.profiler.end("actions");
	    // Finalize phase - Code that needs to run post-actions phase
	    for (let operation of operations)
	        operation.invalidateCache();
	    profiler_1.profiler.start("finalize");
	    for (let operation of operations)
	        operation.finalize();
	    profiler_1.profiler.end("finalize");
	    // post-operation actions and utilities
	    profiler_1.profiler.start("postOperations");
	    try {
	        empire.actions();
	    }
	    catch (e) {
	        console.log("error with empire actions\n", e.stack);
	    }
	    try {
	        loopHelper_1.loopHelper.scavangeResources();
	    }
	    catch (e) {
	        console.log("error scavanging:\n", e.stack);
	    }
	    try {
	        loopHelper_1.loopHelper.sendResourceOrder(empire);
	    }
	    catch (e) {
	        console.log("error reporting transactions:\n", e.stack);
	    }
	    try {
	        loopHelper_1.loopHelper.initConsoleCommands();
	    }
	    catch (e) {
	        console.log("error loading console commands:\n", e.stack);
	    }
	    try {
	        sandbox_1.sandBox.run();
	    }
	    catch (e) {
	        console.log("error loading sandbox:\n", e.stack);
	    }
	    profiler_1.profiler.end("postOperations");
	    try {
	        loopHelper_1.loopHelper.grafanaStats(empire);
	    }
	    catch (e) {
	        console.log("error reporting stats:\n", e.stack);
	    }
	    try {
	        profiler_1.profiler.finalize();
	    }
	    catch (e) {
	        console.log("error checking profiler:\n", e.stack);
	    }
	};


/***/ },
/* 1 */
/*!***********************************!*\
  !*** ./src/helpers/loopHelper.ts ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Empire_1 = __webpack_require__(/*! ../ai/Empire */ 2);
	const FortOperation_1 = __webpack_require__(/*! ../ai/operations/FortOperation */ 8);
	const MiningOperation_1 = __webpack_require__(/*! ../ai/operations/MiningOperation */ 24);
	const constants_1 = __webpack_require__(/*! ../config/constants */ 4);
	const KeeperOperation_1 = __webpack_require__(/*! ../ai/operations/KeeperOperation */ 32);
	const ConquestOperation_1 = __webpack_require__(/*! ../ai/operations/ConquestOperation */ 34);
	const consoleCommands_1 = __webpack_require__(/*! ./consoleCommands */ 36);
	const DemolishOperation_1 = __webpack_require__(/*! ../ai/operations/DemolishOperation */ 37);
	const TransportOperation_1 = __webpack_require__(/*! ../ai/operations/TransportOperation */ 39);
	const RaidOperation_1 = __webpack_require__(/*! ../ai/operations/RaidOperation */ 40);
	const QuadOperation_1 = __webpack_require__(/*! ../ai/operations/QuadOperation */ 46);
	const AutoOperation_1 = __webpack_require__(/*! ../ai/operations/AutoOperation */ 53);
	const FlexOperation_1 = __webpack_require__(/*! ../ai/operations/FlexOperation */ 54);
	const notifier_1 = __webpack_require__(/*! ../notifier */ 6);
	const helper_1 = __webpack_require__(/*! ./helper */ 5);
	const ZombieOperation_1 = __webpack_require__(/*! ../ai/operations/ZombieOperation */ 56);
	const OPERATION_CLASSES = {
	    conquest: ConquestOperation_1.ConquestOperation,
	    fort: FortOperation_1.FortOperation,
	    mining: MiningOperation_1.MiningOperation,
	    tran: TransportOperation_1.TransportOperation,
	    keeper: KeeperOperation_1.KeeperOperation,
	    demolish: DemolishOperation_1.DemolishOperation,
	    raid: RaidOperation_1.RaidOperation,
	    quad: QuadOperation_1.QuadOperation,
	    auto: AutoOperation_1.AutoOperation,
	    flex: FlexOperation_1.FlexOperation,
	    zombie: ZombieOperation_1.ZombieOperation,
	};
	exports.loopHelper = {
	    initEmpire: function () {
	        // gather flag data, instantiate operations
	        let empire = new Empire_1.Empire();
	        empire.init();
	        global.emp = empire;
	        return empire;
	    },
	    /// <summary>loop through flags and construct operation objects, return operation array sorted by priority</summary>
	    getOperations: function (empire) {
	        // gather flag data, instantiate operations
	        let operationList = {};
	        for (let flagName in Game.flags) {
	            for (let typeName in OPERATION_CLASSES) {
	                if (!OPERATION_CLASSES.hasOwnProperty(typeName))
	                    continue;
	                if (flagName.substring(0, typeName.length) === typeName) {
	                    let operationClass = OPERATION_CLASSES[typeName];
	                    let flag = Game.flags[flagName];
	                    let name = flagName.substring(flagName.indexOf("_") + 1);
	                    if (operationList.hasOwnProperty(name)) {
	                        console.log(`operation with name ${name} already exists (type: ${operationList[name].type}), please use a different name`);
	                        continue;
	                    }
	                    let operation;
	                    try {
	                        operation = new operationClass(flag, name, typeName, empire);
	                    }
	                    catch (e) {
	                        console.log("error parsing flag name and bootstrapping operation");
	                        console.log(e);
	                    }
	                    operationList[name] = operation;
	                    global[name] = operation;
	                }
	            }
	        }
	        Game.operations = operationList;
	        return _.sortBy(operationList, (operation) => operation.priority);
	    },
	    initMemory: function () {
	        _.defaultsDeep(Memory, {
	            stats: {},
	            temp: {},
	            playerConfig: {
	                terminalNetworkRange: 6,
	                muteSpawn: false,
	                enableStats: false,
	                creditReserveAmount: Number.MAX_VALUE,
	                powerMinimum: 9000,
	            },
	            profiler: {},
	            traders: {},
	            powerObservers: {},
	            notifier: [],
	            cpu: {
	                history: [],
	                average: Game.cpu.getUsed(),
	            },
	        });
	    },
	    scavangeResources: function () {
	        for (let v in Game.rooms) {
	            let room = Game.rooms[v];
	            let resources = room.find(FIND_DROPPED_ENERGY);
	            for (let resource of resources) {
	                if (resource.amount > 10) {
	                    let creep = resource.pos.lookFor(LOOK_CREEPS)[0];
	                    if (creep && creep.my && creep.memory.scavanger === resource.resourceType
	                        && (!creep.carry[resource.resourceType] || creep.carry[resource.resourceType] < creep.carryCapacity)) {
	                        let outcome = creep.pickup(resource);
	                    }
	                }
	            }
	        }
	    },
	    invalidateCache: Game.time % constants_1.CACHE_INVALIDATION_FREQUENCY < constants_1.CACHE_INVALIDATION_PERIOD,
	    grafanaStats: function (empire) {
	        if (!Memory.playerConfig.enableStats)
	            return;
	        if (!Memory.stats)
	            Memory.stats = {};
	        // STATS START HERE
	        _.forEach(Game.rooms, function (room) {
	            if (room.controller && room.controller.my) {
	                Memory.stats["rooms." + room.name + ".controller.level"] = room.controller.level;
	                Memory.stats["rooms." + room.name + ".controller.progress"] = room.controller.progress;
	                Memory.stats["rooms." + room.name + ".controller.progressTotal"] = room.controller.progressTotal;
	                Memory.stats["rooms." + room.name + ".energyAvailable"] = room.energyAvailable;
	            }
	        });
	        for (let resourceType of constants_1.MINERALS_RAW) {
	            Memory.stats["empire.rawMinerals." + resourceType] = empire.inventory[resourceType];
	            Memory.stats["empire.mineralCount." + resourceType] = Game.cache[resourceType] || 0;
	        }
	        for (let resourceType of constants_1.PRODUCT_LIST) {
	            Memory.stats["empire.compounds." + resourceType] = empire.inventory[resourceType];
	            Memory.stats["empire.processCount." + resourceType] = Game.cache.labProcesses[resourceType] || 0;
	        }
	        Memory.stats["empire.activeLabCount"] = Game.cache.activeLabCount;
	        Memory.stats["empire.energy"] = empire.inventory[RESOURCE_ENERGY];
	        for (let storage of empire.storages) {
	            Memory.stats["empire.power." + storage.room.name] = storage.store.power ? storage.store.power : 0;
	        }
	        // profiler check
	        for (let identifier in Memory.profiler) {
	            let profile = Memory.profiler[identifier];
	            Memory.stats["game.profiler." + identifier + ".costPerTick"] = profile.costPerTick;
	            Memory.stats["game.profiler." + identifier + ".costPerCall"] = profile.costPerCall;
	            Memory.stats["game.profiler." + identifier + ".callsPerTick"] = profile.callsPerTick;
	        }
	        Memory.stats["game.time"] = Game.time;
	        Memory.stats["game.gcl.level"] = Game.gcl.level;
	        Memory.stats["game.gcl.progress"] = Game.gcl.progress;
	        Memory.stats["game.gcl.progressTotal"] = Game.gcl.progressTotal;
	        Memory.stats["game.cpu.limit"] = Game.cpu.limit;
	        Memory.stats["game.cpu.tickLimit"] = Game.cpu.tickLimit;
	        Memory.stats["game.cpu.bucket"] = Game.cpu.bucket;
	        Memory.stats["game.cpu.used"] = Game.cpu.getUsed();
	    },
	    sendResourceOrder: function (empire) {
	        if (!Memory.resourceOrder) {
	            Memory.resourceOrder = {};
	        }
	        for (let timeStamp in Memory.resourceOrder) {
	            let order = Memory.resourceOrder[timeStamp];
	            if (!order || order.roomName === undefined || order.amount === undefined) {
	                console.log("problem with order:", JSON.stringify(order));
	                return;
	            }
	            if (!order.amountSent) {
	                order.amountSent = 0;
	            }
	            let sortedTerminals = _.sortBy(empire.terminals, (t) => Game.map.getRoomLinearDistance(order.roomName, t.room.name));
	            let count = 0;
	            for (let terminal of sortedTerminals) {
	                if (terminal.room.name === order.roomName)
	                    continue;
	                if (terminal.store[order.resourceType] >= constants_1.RESERVE_AMOUNT) {
	                    let amount = Math.min(1000, order.amount - order.amountSent);
	                    if (amount <= 0) {
	                        break;
	                    }
	                    let msg = order.resourceType + " delivery: " + (order.amountSent + amount) + "/" + order.amount;
	                    let outcome = terminal.send(order.resourceType, amount, order.roomName, msg);
	                    if (outcome === OK) {
	                        order.amountSent += amount;
	                        console.log(msg);
	                    }
	                    count++;
	                    if (count === order.efficiency)
	                        break;
	                }
	            }
	            if (order.amountSent === order.amount) {
	                console.log("finished sending mineral order: " + order.resourceType);
	                Memory.resourceOrder[timeStamp] = undefined;
	            }
	        }
	    },
	    initConsoleCommands: function () {
	        // command functions found in consoleCommands.ts can be executed from the game console
	        // example: cc.minv()
	        global.cc = consoleCommands_1.consoleCommands;
	        global.note = notifier_1.notifier;
	        global.helper = helper_1.helper;
	    },
	};


/***/ },
/* 2 */
/*!**************************!*\
  !*** ./src/ai/Empire.ts ***!
  \**************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const SpawnGroup_1 = __webpack_require__(/*! ./SpawnGroup */ 3);
	const constants_1 = __webpack_require__(/*! ../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../helpers/helper */ 5);
	const notifier_1 = __webpack_require__(/*! ../notifier */ 6);
	const profiler_1 = __webpack_require__(/*! ../profiler */ 7);
	class Empire {
	    constructor() {
	        this.storages = [];
	        this.terminals = [];
	        this.swapTerminals = [];
	        this.spawnGroups = {};
	        this.shortages = [];
	        this.severeShortages = [];
	        this.surpluses = [];
	        if (!Memory.empire)
	            Memory.empire = {};
	        _.defaults(Memory.empire, {
	            allyRooms: [],
	            hostileRooms: {},
	            tradeIndex: 0,
	            activeNukes: [],
	            safe: {},
	            danger: {},
	            errantConstructionRooms: {},
	        });
	        this.memory = Memory.empire;
	    }
	    /**
	     * Occurs before operation phases
	     */
	    init() {
	        if (this.memory.tradeIndex >= constants_1.TRADE_RESOURCES.length) {
	            this.memory.tradeIndex = 0;
	        }
	        this.tradeResource = constants_1.TRADE_RESOURCES[this.memory.tradeIndex++];
	    }
	    /**
	     * Occurs after operation phases
	     */
	    actions() {
	        this.networkTrade();
	        this.buyShortages();
	        this.sellCompounds();
	        this.reportNukes();
	        this.reportTransactions();
	        this.clearErrantConstruction();
	    }
	    get inventory() {
	        if (!this._inventory) {
	            let inventory = {};
	            for (let terminal of this.terminals) {
	                for (let mineralType in terminal.store) {
	                    if (!terminal.store.hasOwnProperty(mineralType))
	                        continue;
	                    if (inventory[mineralType] === undefined) {
	                        inventory[mineralType] = 0;
	                    }
	                    inventory[mineralType] += terminal.store[mineralType];
	                }
	            }
	            // gather mineral/storage data
	            for (let storage of this.storages) {
	                for (let mineralType in storage.store) {
	                    if (inventory[mineralType] === undefined) {
	                        inventory[mineralType] = 0;
	                    }
	                    inventory[mineralType] += storage.store[mineralType];
	                }
	            }
	            this._inventory = inventory;
	        }
	        return this._inventory;
	    }
	    register(room) {
	        if (!room)
	            return;
	        let hasTerminal;
	        if (room.terminal && room.terminal.my) {
	            hasTerminal = true;
	            this.terminals.push(room.terminal);
	        }
	        let hasStorage;
	        if (room.storage && room.storage.my) {
	            hasStorage = true;
	            this.storages.push(room.storage);
	        }
	        if (hasTerminal && hasStorage) {
	            this.analyzeResources(room);
	        }
	    }
	    registerSwap(room) {
	        if (room.terminal)
	            this.swapTerminals.push(room.terminal);
	        if (room.controller.level >= 6) {
	            this.analyzeResources(room, true);
	        }
	    }
	    /**
	     * Used to determine whether there is an abundance of a given resource type among all terminals.
	     * Should only be used after init() phase
	     * @param resourceType
	     * @param amountPerRoom - specify how much per room you consider an abundance, default value is SURPLUS_AMOUNT
	     */
	    hasAbundance(resourceType, amountPerRoom = constants_1.RESERVE_AMOUNT * 2) {
	        let abundanceAmount = this.terminals.length * amountPerRoom;
	        return this.inventory[resourceType] && this.inventory[resourceType] > abundanceAmount;
	    }
	    engageSwap(activeSwapRoom) {
	        let coreName = helper_1.helper.findCore(activeSwapRoom.name);
	        let neighbors = _(this.swapTerminals)
	            .filter(t => Game.map.getRoomLinearDistance(coreName, t.room.name) <= 4)
	            .map(t => t.room)
	            .value();
	        // gather data about swapping options (swaptions)
	        let availableSwaps = {};
	        for (let swapRoom of neighbors) {
	            if (swapRoom.memory.swapActive)
	                continue;
	            let mineral = swapRoom.find(FIND_MINERALS)[0];
	            if (mineral.mineralAmount > 0 || mineral.ticksToRegeneration < 9000) {
	                availableSwaps[mineral.mineralType] = swapRoom;
	            }
	        }
	        // check which mineraltype we are lowest in
	        let lowestCount = Number.MAX_VALUE; // big number
	        let lowestMineral;
	        for (let mineralType in availableSwaps) {
	            if (!this.inventory[mineralType] || this.inventory[mineralType] < lowestCount) {
	                lowestMineral = mineralType;
	                lowestCount = this.inventory[mineralType] ? this.inventory[mineralType] : 0;
	            }
	        }
	        if (!lowestMineral)
	            return;
	        let newActiveSwapRoom = availableSwaps[lowestMineral];
	        console.log("swap in", activeSwapRoom.name, "wants to switch to", newActiveSwapRoom.name, "to mine", lowestMineral);
	        activeSwapRoom.controller.unclaim();
	        activeSwapRoom.memory.swapActive = false;
	        newActiveSwapRoom.memory.swapActive = true;
	    }
	    sellExcess(room, resourceType, dealAmount) {
	        let orders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: resourceType });
	        this.removeOrders(ORDER_BUY, resourceType);
	        let bestOrder;
	        let highestGain = 0;
	        for (let order of orders) {
	            if (order.remainingAmount < 100)
	                continue;
	            let gain = order.price;
	            let transferCost = Game.market.calcTransactionCost(100, room.name, order.roomName) / 100;
	            gain -= transferCost * constants_1.RESOURCE_VALUE[RESOURCE_ENERGY];
	            if (gain > highestGain) {
	                highestGain = gain;
	                bestOrder = order;
	                console.log("I could sell it to", order.roomName, "for", order.price, "(+" + transferCost + ")");
	            }
	        }
	        if (bestOrder) {
	            let amount = Math.min(bestOrder.remainingAmount, dealAmount);
	            let outcome = Game.market.deal(bestOrder.id, amount, room.name);
	            let notYetSelling = this.orderCount(ORDER_SELL, resourceType, bestOrder.price) === 0;
	            if (notYetSelling) {
	                Game.market.createOrder(ORDER_SELL, resourceType, bestOrder.price, dealAmount * 2, room.name);
	                console.log("placed ORDER_SELL for", resourceType, "at", bestOrder.price, "Cr, to be sent from", room.name);
	            }
	            if (outcome === OK) {
	                console.log("sold", amount, resourceType, "to", bestOrder.roomName, "outcome:", outcome);
	            }
	            else if (outcome === ERR_INVALID_ARGS) {
	                console.log("invalid deal args:", bestOrder.id, amount, room.name);
	            }
	            else {
	                console.log("there was a problem trying to deal:", outcome);
	            }
	        }
	    }
	    removeOrders(type, resourceType) {
	        for (let orderId in Game.market.orders) {
	            let order = Game.market.orders[orderId];
	            if (order.type === type && order.resourceType === resourceType) {
	                Game.market.cancelOrder(orderId);
	            }
	        }
	    }
	    orderCount(type, resourceType, adjustPrice) {
	        let count = 0;
	        for (let orderId in Game.market.orders) {
	            let order = Game.market.orders[orderId];
	            if (order.remainingAmount < 10) {
	                Game.market.cancelOrder(orderId);
	            }
	            else if (order.type === type && order.resourceType === resourceType) {
	                count++;
	                if (adjustPrice && adjustPrice < order.price) {
	                    console.log("MARKET: lowering price for", resourceType, type, "from", order.price, "to", adjustPrice);
	                    Game.market.changeOrderPrice(order.id, adjustPrice);
	                }
	            }
	        }
	        return count;
	    }
	    getSpawnGroup(roomName) {
	        if (this.spawnGroups[roomName]) {
	            return this.spawnGroups[roomName];
	        }
	        else {
	            let room = Game.rooms[roomName];
	            if (room && room.find(FIND_MY_SPAWNS).length > 0) {
	                this.spawnGroups[roomName] = new SpawnGroup_1.SpawnGroup(room);
	                return this.spawnGroups[roomName];
	            }
	        }
	    }
	    buyShortages() {
	        if (Game.market.credits < Memory.playerConfig.creditReserveAmount)
	            return; // early
	        if (Game.time % 100 !== 2)
	            return;
	        // you could use a different constant here if you wanted to limit buying
	        for (let mineralType of constants_1.MINERALS_RAW) {
	            let abundance = this.hasAbundance(mineralType, constants_1.RESERVE_AMOUNT);
	            if (!abundance) {
	                console.log("EMPIRE: theres not enough", mineralType + ", attempting to purchase more");
	                let terminal = this.findBestTerminal(mineralType);
	                if (terminal)
	                    this.buyMineral(terminal.room, mineralType);
	            }
	        }
	    }
	    findBestTerminal(resourceType, searchType = "lowest") {
	        if (searchType === "lowest") {
	            let lowest = Number.MAX_VALUE;
	            let lowestTerminal;
	            for (let terminal of this.terminals) {
	                let amount = terminal.store[resourceType] || 0;
	                if (amount < lowest) {
	                    lowest = amount;
	                    lowestTerminal = terminal;
	                }
	            }
	            return lowestTerminal;
	        }
	        else {
	            let highest = 0;
	            let highestTerminal;
	            for (let terminal of this.terminals) {
	                let amount = terminal.store[resourceType] || 0;
	                if (amount > highest) {
	                    highest = amount;
	                    highestTerminal = terminal;
	                }
	            }
	            return highestTerminal;
	        }
	    }
	    buyMineral(room, resourceType) {
	        if (room.terminal.store[resourceType] > TERMINAL_CAPACITY - constants_1.RESERVE_AMOUNT) {
	            console.log("EMPIRE: wanted to buy mineral but lowest terminal was full, check " + room.name);
	            return;
	        }
	        this.removeOrders(ORDER_SELL, resourceType);
	        let orders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: resourceType });
	        let bestOrder;
	        let lowestExpense = Number.MAX_VALUE;
	        for (let order of orders) {
	            if (order.remainingAmount < 100)
	                continue;
	            let expense = order.price;
	            let transferCost = Game.market.calcTransactionCost(100, room.name, order.roomName) / 100;
	            expense += transferCost * constants_1.RESOURCE_VALUE[RESOURCE_ENERGY];
	            if (expense < lowestExpense) {
	                lowestExpense = expense;
	                bestOrder = order;
	                console.log("I could buy from", order.roomName, "for", order.price, "(+" + transferCost + ")");
	            }
	        }
	        if (bestOrder) {
	            let amount = Math.min(bestOrder.remainingAmount, constants_1.RESERVE_AMOUNT);
	            if (lowestExpense <= constants_1.RESOURCE_VALUE[resourceType]) {
	                let outcome = Game.market.deal(bestOrder.id, amount, room.name);
	                console.log("bought", amount, resourceType, "from", bestOrder.roomName, "outcome:", outcome);
	            }
	            else {
	            }
	            let noBuyOrders = this.orderCount(ORDER_BUY, resourceType) === 0;
	            if (noBuyOrders) {
	                Game.market.createOrder(ORDER_BUY, resourceType, bestOrder.price, constants_1.RESERVE_AMOUNT * 2, room.name);
	                console.log("placed ORDER_BUY for", resourceType, "at", bestOrder.price, "Cr, to be sent to", room.name);
	            }
	        }
	    }
	    addAllyRoom(roomName) {
	        if (_.contains(this.memory.allyRooms, roomName)) {
	            return;
	        }
	        this.memory.allyRooms.push(roomName);
	    }
	    removeAllyRoom(roomName) {
	        _.pull(this.memory.allyRooms, roomName);
	    }
	    addHostileRoom(roomName, controllerLevel) {
	        this.memory.hostileRooms[roomName] = controllerLevel;
	    }
	    removeHostileRoom(roomName) {
	        delete this.memory.hostileRooms[roomName];
	    }
	    observeAllyRoom(observer, index) {
	        if (index === undefined) {
	            index = 0;
	        }
	        if (!this.allyTradeStatus) {
	            this.allyTradeStatus = {};
	            for (let roomname of this.memory.allyRooms) {
	                this.allyTradeStatus[roomname] = false;
	            }
	        }
	        let checkCount = this.memory.allyRooms.length;
	        while (checkCount > 0) {
	            index++;
	            checkCount--;
	            if (index >= this.memory.allyRooms.length) {
	                index = 0;
	            }
	            let checkRoomName = Object.keys(this.allyTradeStatus)[index];
	            if (Game.map.getRoomLinearDistance(observer.room.name, checkRoomName) > OBSERVER_RANGE)
	                continue;
	            if (this.allyTradeStatus[checkRoomName])
	                continue;
	            this.allyTradeStatus[checkRoomName] = true;
	            observer.observeRoom(checkRoomName, constants_1.OBSERVER_PURPOSE_ALLYTRADE);
	            return index;
	        }
	    }
	    sellCompounds() {
	        if (Game.time % 100 !== 2)
	            return;
	        for (let compound of constants_1.PRODUCT_LIST) {
	            if (this.orderCount(ORDER_SELL, compound, constants_1.PRODUCT_PRICE[compound]) > 0)
	                continue;
	            let stockedTerminals = _.filter(this.terminals, t => t.store[compound] >= constants_1.RESERVE_AMOUNT);
	            if (stockedTerminals.length === 0)
	                continue;
	            console.log("MARKET: no orders for", compound, "found, creating one");
	            let competitionRooms = _.map(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: compound }), (order) => {
	                return order.roomName;
	            });
	            let distanceToNearest = 0;
	            let bestTerminal;
	            for (let terminal of stockedTerminals) {
	                let nearestCompetition = Number.MAX_VALUE;
	                for (let roomName of competitionRooms) {
	                    let distance = Game.map.getRoomLinearDistance(roomName, terminal.room.name);
	                    if (distance < nearestCompetition) {
	                        nearestCompetition = distance;
	                    }
	                }
	                if (nearestCompetition > distanceToNearest) {
	                    distanceToNearest = nearestCompetition;
	                    bestTerminal = terminal;
	                    console.log("I could sell from", terminal.room.name + ", nearest competition is", nearestCompetition, "rooms away");
	                }
	            }
	            Game.market.createOrder(ORDER_SELL, compound, constants_1.PRODUCT_PRICE[compound], constants_1.RESERVE_AMOUNT, bestTerminal.room.name);
	        }
	    }
	    networkTrade() {
	        this.registerAllyRooms();
	        this.tradeMonkey();
	    }
	    registerAllyRooms() {
	        for (let roomName of this.memory.allyRooms) {
	            let room = Game.rooms[roomName];
	            if (!room)
	                continue;
	            this.analyzeResources(room);
	        }
	    }
	    analyzeResources(room, swap = false) {
	        if (room.controller.level < 6 || !room.terminal || !room.storage)
	            return;
	        if (this.tradeResource === RESOURCE_ENERGY) {
	            if (swap) {
	                if (room.terminal.store.energy < 50000) {
	                    this.shortages.push(room.terminal);
	                }
	            }
	            else {
	                if (room.terminal.store.energy < 50000 && room.storage.store.energy < constants_1.NEED_ENERGY_THRESHOLD
	                    && _.sum(room.terminal.store) < 270000) {
	                    this.severeShortages.push(room.terminal);
	                }
	                else if (room.controller.my && room.terminal.store.energy >= 30000 &&
	                    room.storage.store.energy > constants_1.SUPPLY_ENERGY_THRESHOLD) {
	                    this.surpluses.push(room.terminal);
	                }
	            }
	        }
	        else {
	            let amount = room.terminal.store[this.tradeResource] || 0;
	            if (!swap && amount < constants_1.RESERVE_AMOUNT && _.sum(room.terminal.store) < 270000) {
	                this.shortages.push(room.terminal);
	            }
	            else if (room.controller.my && room.terminal.store.energy >= 10000 && amount >= constants_1.RESERVE_AMOUNT * 2) {
	                this.surpluses.push(room.terminal);
	            }
	        }
	    }
	    tradeMonkey() {
	        let pairs = [];
	        let shortages = this.shortages;
	        let ignoreDistance = false;
	        if (this.severeShortages.length > 0) {
	            shortages = this.severeShortages;
	        }
	        for (let sender of this.surpluses) {
	            let closestReciever = _.sortBy(shortages, (t) => {
	                return Game.map.getRoomLinearDistance(sender.room.name, t.room.name);
	            })[0];
	            if (!closestReciever)
	                continue;
	            let distance = Game.map.getRoomLinearDistance(sender.room.name, closestReciever.room.name);
	            if (this.tradeResource === RESOURCE_ENERGY && distance > constants_1.TRADE_MAX_DISTANCE && _.sum(sender.room.storage.store) < 940000
	                && !ignoreDistance)
	                continue;
	            pairs.push({
	                sender: sender,
	                reciever: closestReciever,
	                distance: distance,
	            });
	        }
	        pairs = _.sortBy(pairs, p => p.distance);
	        while (pairs.length > 0) {
	            let sender = pairs[0].sender;
	            let reciever = pairs[0].reciever;
	            let amount = constants_1.RESERVE_AMOUNT - (reciever.store[this.tradeResource] || 0);
	            if (this.tradeResource === RESOURCE_ENERGY) {
	                amount = constants_1.TRADE_ENERGY_AMOUNT;
	            }
	            this.sendResource(sender, this.tradeResource, amount, reciever);
	            pairs = _.filter(pairs, p => p.sender !== sender && p.reciever !== reciever);
	        }
	    }
	    sendResource(localTerminal, resourceType, amount, otherTerminal) {
	        if (amount < 100) {
	            amount = 100;
	        }
	        let outcome = localTerminal.send(resourceType, amount, otherTerminal.room.name);
	        if (outcome === OK) {
	            let distance = Game.map.getRoomLinearDistance(otherTerminal.room.name, localTerminal.room.name, true);
	        }
	        else {
	            console.log(`NETWORK: error sending resource in ${localTerminal.room.name}, outcome: ${outcome}`);
	            console.log(`arguments used: ${resourceType}, ${amount}, ${otherTerminal.room.name}`);
	        }
	    }
	    addNuke(activeNuke) {
	        this.memory.activeNukes.push(activeNuke);
	    }
	    reportNukes() {
	        if (Game.time % constants_1.TICK_FULL_REPORT !== 0)
	            return;
	        for (let activeNuke of this.memory.activeNukes) {
	            console.log(`EMPIRE: ${Game.time - activeNuke.tick} till our nuke lands in ${activeNuke.roomName}`);
	        }
	    }
	    roomTravelDistance(origin, destination) {
	        let linearDistance = Game.map.getRoomLinearDistance(origin, destination);
	        if (linearDistance >= 20) {
	            return linearDistance;
	        }
	        let allowedRooms = this.findAllowedRooms(origin, destination);
	        if (allowedRooms) {
	            return Object.keys(allowedRooms).length;
	        }
	    }
	    findAllowedRooms(origin, destination, options = {}) {
	        _.defaults(options, { restrictDistance: 20 });
	        if (Game.map.getRoomLinearDistance(origin, destination) > options.restrictDistance) {
	            return;
	        }
	        let allowedRooms = { [origin]: true, [destination]: true };
	        let ret = Game.map.findRoute(origin, destination, {
	            routeCallback: (roomName) => {
	                if (Game.map.getRoomLinearDistance(origin, roomName) > options.restrictDistance)
	                    return false;
	                if (options.preferHighway) {
	                    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
	                    let isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
	                    if (isHighway) {
	                        return 1;
	                    }
	                }
	                if (!options.allowSK && !Game.rooms[roomName]) {
	                    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
	                    let isSK = ((parsed[1] % 10 === 4) || (parsed[1] % 10 === 6)) &&
	                        ((parsed[2] % 10 === 4) || (parsed[2] % 10 === 6));
	                    if (isSK) {
	                        return 10;
	                    }
	                }
	                if (!options.allowHostile && this.memory.hostileRooms[roomName] &&
	                    roomName !== destination && roomName !== origin) {
	                    return Number.POSITIVE_INFINITY;
	                }
	            }
	        });
	        if (!_.isArray(ret)) {
	            console.log(`couldn't findRoute to ${destination}`);
	            return;
	        }
	        for (let value of ret) {
	            allowedRooms[value.room] = true;
	        }
	        return allowedRooms;
	    }
	    travelTo(creep, destination, options = {}) {
	        // register hostile rooms entered
	        if (creep.room.controller) {
	            if (creep.room.controller.owner && !creep.room.controller.my) {
	                this.memory.hostileRooms[creep.room.name] = creep.room.controller.level;
	            }
	            else {
	                this.memory.hostileRooms[creep.room.name] = undefined;
	            }
	        }
	        if (!creep.memory._travel) {
	            creep.memory._travel = { stuck: 0, destination: destination.pos, lastPos: undefined, path: undefined };
	        }
	        let travelData = creep.memory._travel;
	        if (creep.fatigue > 0 || creep.spawning) {
	            return ERR_BUSY;
	        }
	        let rangeToDestination = creep.pos.getRangeTo(destination);
	        if (rangeToDestination <= 1) {
	            let outcome = OK;
	            if (rangeToDestination === 1 && destination.pos.isPassible()) {
	                outcome = creep.move(creep.pos.getDirectionTo(destination));
	            }
	            if (options.returnPosition && outcome === OK) {
	                return destination.pos;
	            }
	            else {
	                return outcome;
	            }
	        }
	        if (travelData.lastPos) {
	            travelData.lastPos = helper_1.helper.deserializeRoomPosition(travelData.lastPos);
	            if (creep.pos.inRangeTo(travelData.lastPos, 0)) {
	                if (options.ignoreStuck) {
	                    travelData.stuck = 1;
	                }
	                else {
	                    travelData.stuck++;
	                }
	            }
	            else {
	                travelData.stuck = 0;
	            }
	        }
	        let sameDestination = travelData.destination &&
	            travelData.destination.x === destination.pos.x &&
	            travelData.destination.y === destination.pos.y &&
	            travelData.destination.roomName === destination.pos.roomName;
	        if (!travelData.path || !sameDestination || (travelData.stuck >= 5)) {
	            travelData.destination = destination.pos;
	            travelData.lastPos = undefined;
	            options.ignoreCreeps = travelData.stuck < 5;
	            let ret = this.findTravelPath(creep, destination, options);
	            travelData.path = helper_1.helper.serializePath(creep.pos, ret.path);
	            travelData.stuck = 0;
	        }
	        if (!travelData.path || travelData.path.length === 0) {
	            return ERR_NO_PATH;
	        }
	        if (travelData.lastPos && travelData.stuck === 0) {
	            travelData.path = travelData.path.substr(1);
	        }
	        travelData.lastPos = creep.pos;
	        let nextDirection = parseInt(travelData.path[0]);
	        let outcome = creep.move(nextDirection);
	        if (!options.returnPosition || outcome !== OK) {
	            return outcome;
	        }
	        else {
	            return creep.pos.getPositionAtDirection(nextDirection);
	        }
	    }
	    findTravelPath(origin, destination, options) {
	        if (!options) {
	            options = {};
	        }
	        _.defaults(options, {
	            ignoreRoads: false,
	            ignoreCreeps: true,
	            preferHighway: false,
	            ignoreStructures: false,
	            range: 1,
	            obstacles: [],
	        });
	        let allowedRooms;
	        let searchedAlready = false;
	        let callback = (roomName) => {
	            if (options.roomCallback) {
	                let outcome = options.roomCallback(roomName);
	                if (outcome !== undefined) {
	                    return outcome;
	                }
	            }
	            if (!allowedRooms && !searchedAlready) {
	                searchedAlready = true;
	                allowedRooms = this.findAllowedRooms(origin.pos.roomName, destination.pos.roomName, options);
	                if (!allowedRooms) {
	                    notifier_1.notifier.add(`couldn't find allowed rooms for path from ${origin} to ${destination}`);
	                }
	            }
	            if (allowedRooms && !allowedRooms[roomName])
	                return false;
	            let room = Game.rooms[roomName];
	            if (!room)
	                return;
	            let matrix;
	            if (options.ignoreStructures) {
	                matrix = new PathFinder.CostMatrix();
	            }
	            else {
	                matrix = room.defaultMatrix.clone();
	            }
	            if (!options.ignoreCreeps && roomName === origin.pos.roomName) {
	                helper_1.helper.addCreepsToMatrix(matrix, room);
	            }
	            for (let obstacle of options.obstacles) {
	                if (obstacle.pos.roomName === origin.pos.roomName) {
	                    matrix.set(obstacle.pos.x, obstacle.pos.y, 0xff);
	                }
	            }
	            return matrix;
	        };
	        let ret = PathFinder.search(origin.pos, { pos: destination.pos, range: options.range }, {
	            swampCost: options.ignoreRoads ? 5 : 10,
	            plainCost: options.ignoreRoads ? 1 : 2,
	            maxOps: 20000,
	            roomCallback: callback
	        });
	        return ret;
	    }
	    reportTransactions() {
	        if (Game.time % 10 !== 0)
	            return;
	        let kFormatter = (num) => {
	            return num > 999 ? (num / 1000).toFixed(1) + 'k' : num;
	        };
	        let consoleReport = (item) => {
	            let distance = Game.map.getRoomLinearDistance(item.from, item.to);
	            let cost = Game.market.calcTransactionCost(item.amount, item.from, item.to);
	            console.log(`TRADE: ${_.padLeft(`${item.from} ${item.sender ? item.sender.username : "npc"}`.substr(0, 12), 12)} ` +
	                `→ ${_.pad(`${kFormatter(item.amount)} ${item.resourceType}`.substr(0, 12), 12)} → ` +
	                `${_.padRight(`${item.to} ${item.recipient ? item.recipient.username : "npc"}`.substr(0, 12), 12)} ` +
	                `(dist: ${distance}, cost: ${kFormatter(cost)})`);
	        };
	        let decipher = (item) => {
	            if (!item.description) {
	                notifier_1.notifier.add(`EMPIRE: no description on decipher from ${item.sender.username}.`);
	                return;
	            }
	            let description = item.description.toLocaleLowerCase();
	            if (description === "safe") {
	                this.memory.safe[item.sender.username] = true;
	                console.log(`EMPIRE: ${item.sender.username} requested to be added to safe list`);
	            }
	            else if (description === "removesafe") {
	                delete this.memory.safe[item.sender.username];
	                console.log(`EMPIRE: ${item.sender.username} requested to be removed from safe list`);
	            }
	            else if (description === "danger") {
	                this.memory.danger[item.sender.username] = true;
	                console.log(`EMPIRE: ${item.sender.username} requested to be added to danger list`);
	            }
	            else if (description === "removedanger") {
	                delete this.memory.danger[item.sender.username];
	                console.log(`EMPIRE: ${item.sender.username} requested to be removed from danger list`);
	            }
	            else {
	                notifier_1.notifier.add(`EMPIRE: invalid description on decipher from ${item.sender.username}: ${_.escape(item.description)}`);
	            }
	        };
	        let decipheredMessage = false;
	        for (let item of Game.market.incomingTransactions) {
	            if (!item.sender)
	                continue;
	            if (item.time >= Game.time - 10) {
	                let username = item.sender.username;
	                if (!username) {
	                    username = "npc";
	                }
	                if (!Memory.traders[username]) {
	                    Memory.traders[username] = {};
	                }
	                if (Memory.traders[username][item.resourceType] === undefined) {
	                    Memory.traders[username][item.resourceType] = 0;
	                }
	                Memory.traders[username][item.resourceType] += item.amount;
	                consoleReport(item);
	                if (item.amount === 111 && !decipheredMessage) {
	                    decipheredMessage = true;
	                    decipher(item);
	                }
	            }
	            else {
	                break;
	            }
	        }
	        for (let item of Game.market.outgoingTransactions) {
	            if (!item.recipient)
	                continue;
	            if (item.time >= Game.time - 10) {
	                let username = item.recipient.username;
	                if (!username) {
	                    username = "npc";
	                }
	                if (!Memory.traders[username]) {
	                    Memory.traders[username] = {};
	                }
	                if (Memory.traders[username][item.resourceType] === undefined) {
	                    Memory.traders[username][item.resourceType] = 0;
	                }
	                Memory.traders[item.recipient.username][item.resourceType] -= item.amount;
	                if (item.recipient.username === constants_1.USERNAME) {
	                    continue;
	                }
	                consoleReport(item);
	            }
	            else {
	                break;
	            }
	        }
	    }
	    underCPULimit() {
	        return profiler_1.profiler.proportionUsed() < .9;
	    }
	    clearErrantConstruction() {
	        if (Game.time % 1000 !== 0) {
	            return;
	        }
	        let removeErrantStatus = {};
	        let addErrantStatus = {};
	        for (let siteName in Game.constructionSites) {
	            let site = Game.constructionSites[siteName];
	            if (site.room) {
	                delete this.memory.errantConstructionRooms[site.pos.roomName];
	            }
	            else {
	                if (this.memory.errantConstructionRooms[site.pos.roomName]) {
	                    site.remove();
	                    removeErrantStatus[site.pos.roomName];
	                }
	                else {
	                    addErrantStatus[site.pos.roomName] = true;
	                }
	            }
	        }
	        for (let roomName in addErrantStatus) {
	            this.memory.errantConstructionRooms[roomName] = true;
	        }
	        for (let roomName in removeErrantStatus) {
	            notifier_1.notifier.add(`EMPIRE: removed construction sites in ${roomName}`);
	            delete this.memory.errantConstructionRooms[roomName];
	        }
	    }
	}
	exports.Empire = Empire;


/***/ },
/* 3 */
/*!******************************!*\
  !*** ./src/ai/SpawnGroup.ts ***!
  \******************************/
/***/ function(module, exports) {

	"use strict";
	class SpawnGroup {
	    constructor(room) {
	        this.room = room;
	        this.spawns = room.find(FIND_MY_SPAWNS);
	        if (!this.room.memory.spawnMemory)
	            this.room.memory.spawnMemory = {};
	        this.memory = this.room.memory.spawnMemory;
	        this.extensions = room.findStructures(STRUCTURE_EXTENSION);
	        this.manageSpawnLog();
	        this.availableSpawnCount = this.getSpawnAvailability();
	        this.isAvailable = this.availableSpawnCount > 0;
	        this.currentSpawnEnergy = this.room.energyAvailable;
	        this.maxSpawnEnergy = this.room.energyCapacityAvailable;
	        this.pos = _.head(this.spawns).pos;
	    }
	    spawn(build, name, memory, reservation) {
	        let outcome;
	        this.isAvailable = false;
	        if (reservation) {
	            if (this.availableSpawnCount < reservation.spawns)
	                return ERR_BUSY;
	            if (this.currentSpawnEnergy < reservation.currentEnergy)
	                return ERR_NOT_ENOUGH_RESOURCES;
	        }
	        for (let spawn of this.spawns) {
	            if (spawn.spawning == null) {
	                outcome = spawn.createCreep(build, name, memory);
	                if (Memory.playerConfig.muteSpawn)
	                    break; // early
	                if (outcome === ERR_INVALID_ARGS) {
	                    console.log("SPAWN: invalid args for creep\nbuild:", build, "\nname:", name, "\ncount:", build.length);
	                }
	                if (_.isString(outcome)) {
	                    console.log("SPAWN: building " + name);
	                }
	                else if (outcome === ERR_NOT_ENOUGH_RESOURCES) {
	                    if (Game.time % 10 === 0) {
	                        console.log("SPAWN:", this.room.name, "not enough energy for", name, "cost:", SpawnGroup.calculateBodyCost(build), "current:", this.currentSpawnEnergy, "max", this.maxSpawnEnergy);
	                    }
	                }
	                else if (outcome !== ERR_NAME_EXISTS) {
	                    console.log("SPAWN:", this.room.name, "had error spawning " + name + ", outcome: " + outcome);
	                }
	                break;
	            }
	        }
	        return outcome;
	    }
	    getSpawnAvailability() {
	        let count = 0;
	        for (let spawn of this.spawns) {
	            if (spawn.spawning === null) {
	                count++;
	            }
	        }
	        this.memory.log.availability += count;
	        Memory.stats["spawnGroups." + this.room.name + ".idleCount"] = count;
	        return count;
	    }
	    getCurrentSpawnEnergy() {
	        let sum = 0;
	        for (let ext of this.extensions) {
	            sum += ext.energy;
	        }
	        for (let spawn of this.spawns) {
	            sum += spawn.energy;
	        }
	        return sum;
	    }
	    getMaxSpawnEnergy() {
	        let contollerLevel = this.room.controller.level;
	        let extensionCount = this.extensions.length;
	        let spawnCount = this.spawns.length;
	        return spawnCount * SPAWN_ENERGY_CAPACITY + extensionCount * EXTENSION_ENERGY_CAPACITY[contollerLevel];
	    }
	    static calculateBodyCost(body) {
	        let sum = 0;
	        for (let part of body) {
	            sum += BODYPART_COST[part];
	        }
	        return sum;
	    }
	    canCreateCreep(body) {
	        let cost = SpawnGroup.calculateBodyCost(body);
	        return cost <= this.currentSpawnEnergy;
	    }
	    // proportion allows you to scale down the body size if you don't want to use all of your spawning energy
	    // for example, proportion of .5 would return the max units per cost if only want to use half of your spawning capacity
	    maxUnitsPerCost(unitCost, proportion = 1) {
	        return Math.floor((this.maxSpawnEnergy * proportion) / unitCost);
	    }
	    maxUnits(body, proportion) {
	        let cost = SpawnGroup.calculateBodyCost(body);
	        return Math.min(this.maxUnitsPerCost(cost, proportion), Math.floor(50 / body.length));
	    }
	    manageSpawnLog() {
	        if (!this.memory.log)
	            this.memory.log = { availability: 0, history: [], longHistory: [] };
	        if (Game.time % 100 !== 0)
	            return; // early
	        let log = this.memory.log;
	        let average = log.availability / 100;
	        log.availability = 0;
	        /*
	        if (average > 1) console.log("SPAWNING:", this.room, "not very busy (avg", average, "idle out of",
	            this.spawns.length, "), perhaps add more harvesting");
	        if (average < .1) console.log("SPAWNING:", this.room, "very busy (avg", average, "idle out of",
	            this.spawns.length, "), might want to reduce harvesting");
	            */
	        log.history.push(average);
	        while (log.history.length > 5)
	            log.history.shift();
	        if (Game.time % 500 !== 0)
	            return; // early
	        let longAverage = _.sum(log.history) / 5;
	        log.longHistory.push(longAverage);
	        while (log.longHistory.length > 5)
	            log.longHistory.shift();
	    }
	    showHistory() {
	        console.log("Average availability in", this.room.name, "the last 5 creep generations (1500 ticks):");
	        console.log(this.memory.log.history);
	        console.log("Average availability over the last 75000 ticks (each represents a period of 15000 ticks)");
	        console.log(this.memory.log.longHistory);
	    }
	    get averageAvailability() {
	        if (this.memory.log.history.length === 0) {
	            return .1;
	        }
	        return _.last(this.memory.log.history);
	    }
	}
	exports.SpawnGroup = SpawnGroup;


/***/ },
/* 4 */
/*!*********************************!*\
  !*** ./src/config/constants.ts ***!
  \*********************************/
/***/ function(module, exports) {

	"use strict";
	exports.TICK_TRANSPORT_ANALYSIS = 1;
	exports.TICK_FULL_REPORT = 0;
	exports.DESTINATION_REACHED = -1201;
	exports.ROOMTYPE_SOURCEKEEPER = -1301;
	exports.ROOMTYPE_CORE = -1302;
	exports.ROOMTYPE_CONTROLLER = -1303;
	exports.ROOMTYPE_ALLEY = -1304;
	exports.OBSERVER_PURPOSE_ALLYTRADE = "allyTrade";
	exports.CACHE_INVALIDATION_FREQUENCY = 1000;
	exports.CACHE_INVALIDATION_PERIOD = 10;
	exports.PRIORITY_BUILD = [
	    STRUCTURE_SPAWN,
	    STRUCTURE_TOWER,
	    STRUCTURE_EXTENSION,
	    STRUCTURE_ROAD,
	    STRUCTURE_CONTAINER,
	    STRUCTURE_LINK,
	    STRUCTURE_STORAGE
	];
	exports.LOADAMOUNT_MINERAL = Math.ceil(33 / 6);
	exports.ALLIES = {
	    "taiga": true,
	    "Reini": true,
	    "bonzaiferroni": true,
	    "SteeleR": true,
	    "Vervorris": true,
	    "Jeb": true,
	    "danny": true,
	    "Atavus": true,
	    "Ashburnie": true,
	    "ricane": true,
	    "trebbettes": true,
	    "bovius": true,
	};
	exports.TRADE_PARTNERS = {
	    "bonzaiferroni": true,
	    "taiga": true,
	    "Reini": true,
	    "Vervorris": true,
	    "Jeb": true,
	    "trebbettes": true,
	    "ricane": true,
	};
	exports.USERNAME = _.first(_.toArray(Game.structures)).owner.username;
	var OperationPriority;
	(function (OperationPriority) {
	    OperationPriority[OperationPriority["Emergency"] = 0] = "Emergency";
	    OperationPriority[OperationPriority["OwnedRoom"] = 1] = "OwnedRoom";
	    OperationPriority[OperationPriority["VeryHigh"] = 2] = "VeryHigh";
	    OperationPriority[OperationPriority["High"] = 3] = "High";
	    OperationPriority[OperationPriority["Medium"] = 4] = "Medium";
	    OperationPriority[OperationPriority["Low"] = 5] = "Low";
	    OperationPriority[OperationPriority["VeryLow"] = 6] = "VeryLow";
	})(OperationPriority = exports.OperationPriority || (exports.OperationPriority = {}));
	var Direction;
	(function (Direction) {
	    Direction[Direction["North"] = 1] = "North";
	    Direction[Direction["NorthEast"] = 2] = "NorthEast";
	    Direction[Direction["East"] = 3] = "East";
	    Direction[Direction["SouthEast"] = 4] = "SouthEast";
	    Direction[Direction["South"] = 5] = "South";
	    Direction[Direction["SouthWest"] = 6] = "SouthWest";
	    Direction[Direction["West"] = 7] = "West";
	    Direction[Direction["NorthWest"] = 8] = "NorthWest";
	})(Direction = exports.Direction || (exports.Direction = {}));
	// these are the constants that govern your energy balance
	// rooms below this will try to pull energy...
	exports.NEED_ENERGY_THRESHOLD = 200000;
	// ...from rooms above this.
	exports.SUPPLY_ENERGY_THRESHOLD = 250000;
	// rooms that are above this will try to push energy to any room accepting energy (like swap operations)
	exports.SUPPLY_SWAP_THRESHOLD = 300000;
	// rooms above this will start processing power
	exports.POWER_PROCESS_THRESHOLD = 350000;
	// rooms above this will spawn a more powerful wall-builder to try to sink energy that way
	exports.ENERGYSINK_THRESHOLD = 450000;
	exports.SWAP_RESERVE = 950000;
	exports.MINERALS_RAW = ["H", "O", "Z", "U", "K", "L", "X"];
	exports.PRODUCT_LIST = ["XUH2O", "XLHO2", "XLH2O", "XKHO2", "XGHO2", "XZHO2", "XZH2O", "G", "XGH2O"];
	exports.TRADE_RESOURCES = exports.PRODUCT_LIST.concat(exports.MINERALS_RAW).concat([RESOURCE_POWER, RESOURCE_ENERGY]);
	exports.TRADE_MAX_DISTANCE = 6;
	exports.TRADE_ENERGY_AMOUNT = 10000;
	exports.IGOR_CAPACITY = 1000;
	exports.RESERVE_AMOUNT = 5000;
	// terminals with more than this will try to trade a mineral in the network
	exports.PRODUCTION_AMOUNT = Math.ceil((exports.RESERVE_AMOUNT * 2) / exports.IGOR_CAPACITY) * exports.IGOR_CAPACITY;
	exports.RESOURCE_VALUE = {
	    energy: .05,
	    H: 1,
	    O: 1,
	    Z: 1,
	    K: 1,
	    U: 1,
	    L: 1,
	    X: 1,
	};
	exports.PRODUCT_PRICE = {
	    XUH2O: 6,
	    XLHO2: 6,
	    XKHO2: 6,
	    XZHO2: 6,
	    XZH2O: 6,
	    XLH2O: 6,
	    XGH2O: 8,
	    XGHO2: 8,
	    G: 3,
	};
	exports.MINERAL_STORAGE_TARGET = {
	    H: 150000,
	    O: 150000,
	    K: 100000,
	    Z: 100000,
	    U: 100000,
	    L: 100000,
	    X: 140000,
	};
	exports.REAGENT_LIST = {
	    KO: ["K", "O"],
	    UH: ["U", "H"],
	    UO: ["U", "O"],
	    OH: ["O", "H"],
	    LO: ["L", "O"],
	    LH: ["L", "H"],
	    ZO: ["Z", "O"],
	    ZH: ["Z", "H"],
	    ZK: ["Z", "K"],
	    UL: ["U", "L"],
	    G: ["ZK", "UL"],
	    GH: ["G", "H"],
	    GO: ["G", "O"],
	    UH2O: ["UH", "OH"],
	    UHO2: ["UO", "OH"],
	    GH2O: ["GH", "OH"],
	    GHO2: ["GO", "OH"],
	    LHO2: ["LO", "OH"],
	    LH2O: ["LH", "OH"],
	    ZHO2: ["ZO", "OH"],
	    ZH2O: ["ZH", "OH"],
	    KHO2: ["KO", "OH"],
	    XUH2O: ["X", "UH2O"],
	    XUHO2: ["X", "UHO2"],
	    XGH2O: ["X", "GH2O"],
	    XGHO2: ["X", "GHO2"],
	    XLHO2: ["X", "LHO2"],
	    XLH2O: ["X", "LH2O"],
	    XZHO2: ["ZHO2", "X"],
	    XZH2O: ["ZH2O", "X"],
	    XKHO2: ["KHO2", "X"]
	};
	exports.OPERATION_NAMES = [
	    "domo", "boca", "lima", "root", "lima", "gato", "fret", "thad", "colo", "pony",
	    "moon", "oslo", "pita", "gaol", "snek", "kiev", "bonn", "dili", "cali", "nuuk",
	    "suva", "lome", "bern", "mija", "mano", "casa", "flor", "baja", "jefe", "flux",
	    "jeux", "cozy", "lupe", "hazy", "jugs", "quip", "jibs", "quay", "zany", "mojo",
	    "zarf", "expo", "mump", "huck", "prex", "djin", "hymn", "club", "whap", "chic"
	];
	exports.ARTROOMS = {};


/***/ },
/* 5 */
/*!*******************************!*\
  !*** ./src/helpers/helper.ts ***!
  \*******************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const constants_1 = __webpack_require__(/*! ../config/constants */ 4);
	exports.helper = {
	    getStoredAmount(target, resourceType) {
	        if (target instanceof Creep) {
	            return target.carry[resourceType];
	        }
	        else if (target.hasOwnProperty("store")) {
	            return target.store[resourceType];
	        }
	        else if (resourceType === RESOURCE_ENERGY && target.hasOwnProperty("energy")) {
	            return target.energy;
	        }
	    },
	    getCapacity(target) {
	        if (target instanceof Creep) {
	            return target.carryCapacity;
	        }
	        else if (target.hasOwnProperty("store")) {
	            return target.storeCapacity;
	        }
	        else if (target.hasOwnProperty("energyCapacity")) {
	            return target.energyCapacity;
	        }
	    },
	    isFull(target, resourceType) {
	        if (target instanceof Creep) {
	            return target.carry[resourceType] === target.carryCapacity;
	        }
	        else if (target.hasOwnProperty("store")) {
	            return target.store[resourceType] === target.storeCapacity;
	        }
	        else if (resourceType === RESOURCE_ENERGY && target.hasOwnProperty("energy")) {
	            return target.energy === target.energyCapacity;
	        }
	    },
	    clampDirection(direction) {
	        while (direction < 1)
	            direction += 8;
	        while (direction > 8)
	            direction -= 8;
	        return direction;
	    },
	    deserializeRoomPosition(roomPosition) {
	        return new RoomPosition(roomPosition.x, roomPosition.y, roomPosition.roomName);
	    },
	    checkEnemy(username, roomName) {
	        if (constants_1.ALLIES[username]) {
	            return false;
	        }
	        // make note of non-ally, non-npc creeps
	        if (username !== "Invader" && username !== "Source Keeper") {
	            this.strangerDanger(username, roomName);
	        }
	        return true;
	    },
	    strangerDanger(username, roomName) {
	        if (!Memory.strangerDanger) {
	            Memory.strangerDanger = {};
	        }
	        if (!Memory.strangerDanger[username]) {
	            Memory.strangerDanger[username] = [];
	        }
	        let lastReport = _.last(Memory.strangerDanger[username]);
	        if (!lastReport || lastReport.tickSeen < Game.time - 2000) {
	            let report = { tickSeen: Game.time, roomName: roomName };
	            console.log("STRANGER DANGER: one of", username, "\'s creeps seen in", roomName);
	            Memory.strangerDanger[username].push(report);
	            while (Memory.strangerDanger[username].length > 10)
	                Memory.strangerDanger[username].shift();
	        }
	    },
	    findCore(roomName) {
	        let coreName = "";
	        let digit;
	        for (let i of roomName) {
	            let parse = parseInt(i);
	            if (isNaN(parse)) {
	                if (digit !== undefined) {
	                    coreName += Math.floor(digit / 10) * 10 + 5;
	                    digit = undefined;
	                }
	                coreName += i;
	            }
	            else {
	                if (digit === undefined) {
	                    digit = 0;
	                }
	                else {
	                    digit *= 10;
	                }
	                digit += parse;
	            }
	        }
	        coreName += Math.floor(digit / 10) * 10 + 5;
	        return coreName;
	    },
	    /**
	     * Return room coordinates for a given Room, authored by tedivm
	     * @param roomName
	     * @returns {{x: (string|any), y: (string|any), x_dir: (string|any), y_dir: (string|any)}}
	     */
	    getRoomCoordinates(roomName) {
	        let coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g;
	        let match = coordinateRegex.exec(roomName);
	        if (!match)
	            return;
	        let xDir = match[1];
	        let x = match[2];
	        let yDir = match[3];
	        let y = match[4];
	        return {
	            x: Number(x),
	            y: Number(y),
	            xDir: xDir,
	            yDir: yDir,
	        };
	    },
	    findSightedPath(start, goal, goalRange, observer, cache) {
	        if (Game.cpu.bucket < 8000) {
	            console.log("PATH: waiting for full bucket");
	            return;
	        }
	        let invalid = false;
	        let ret = PathFinder.search(start, [{ pos: goal, range: goalRange }], {
	            maxOps: 10000,
	            maxRooms: 16,
	            roomCallback: (roomName) => {
	                if (invalid) {
	                    return false;
	                }
	                if (cache.matrices[roomName]) {
	                    return cache.matrices[roomName];
	                }
	                if (_.includes(cache.avoidRooms, roomName)) {
	                    return false;
	                }
	                let room = Game.rooms[roomName];
	                if (!room) {
	                    console.log("PATH: can't see", roomName + ", aiming observer at it");
	                    observer.observeRoom(roomName);
	                    invalid = true;
	                    return false;
	                }
	                if (room.controller && room.controller.level > 0) {
	                    if (room.controller.my) {
	                        return;
	                    }
	                    else {
	                        cache.avoidRooms.push(roomName);
	                        return false;
	                    }
	                }
	                let costs = new PathFinder.CostMatrix();
	                room.find(FIND_STRUCTURES).forEach((s) => {
	                    if (s.structureType !== STRUCTURE_ROAD)
	                        costs.set(s.pos.x, s.pos.y, 0xff);
	                });
	                cache.matrices[roomName] = costs;
	                return costs;
	            }
	        });
	        if (!invalid) {
	            console.log("PATH: successfully found sighted path");
	            return ret;
	        }
	    },
	    negaDirection(dir) {
	        switch (dir) {
	            case "W":
	                return "E";
	            case "E":
	                return "W";
	            case "N":
	                return "S";
	            case "S":
	                return "N";
	        }
	    },
	    blockOffPosition(costs, roomObject, range, cost = 30) {
	        for (let xDelta = -range; xDelta <= range; xDelta++) {
	            for (let yDelta = -range; yDelta <= range; yDelta++) {
	                if (Game.map.getTerrainAt(roomObject.pos.x + xDelta, roomObject.pos.y + yDelta, roomObject.room.name) === "wall")
	                    continue;
	                costs.set(roomObject.pos.x + xDelta, roomObject.pos.y + yDelta, cost);
	            }
	        }
	    },
	    addStructuresToMatrix(matrix, room, roadCost = 1) {
	        room.find(FIND_STRUCTURES).forEach(function (structure) {
	            if (structure instanceof StructureRampart) {
	                if (!structure.my) {
	                    matrix.set(structure.pos.x, structure.pos.y, 0xff);
	                }
	            }
	            else if (structure instanceof StructureRoad) {
	                // Favor roads over plain tiles
	                matrix.set(structure.pos.x, structure.pos.y, roadCost);
	            }
	            else if (structure.structureType !== STRUCTURE_CONTAINER) {
	                // Can't walk through non-walkable buildings
	                matrix.set(structure.pos.x, structure.pos.y, 0xff);
	            }
	        });
	        return matrix;
	    },
	    addCreepsToMatrix(matrix, room, addFriendly = true, addHostile = true) {
	        room.find(FIND_CREEPS).forEach((creep) => {
	            if (!creep.owner) {
	                if (addHostile) {
	                    matrix.set(creep.pos.x, creep.pos.y, 0xff);
	                }
	            }
	            else if (constants_1.ALLIES[creep.owner.username]) {
	                if (addFriendly) {
	                    matrix.set(creep.pos.x, creep.pos.y, 0xff);
	                }
	            }
	            else {
	                if (addHostile) {
	                    matrix.set(creep.pos.x, creep.pos.y, 0xff);
	                }
	            }
	        });
	        return matrix;
	    },
	    addTerrainToMatrix(matrix, roomName) {
	        for (let x = 0; x < 50; x++) {
	            for (let y = 0; y < 50; y++) {
	                let terrain = Game.map.getTerrainAt(x, y, roomName);
	                if (terrain === "wall") {
	                    matrix.set(x, y, 0xff);
	                }
	                else if (terrain === "swamp") {
	                    matrix.set(x, y, 5);
	                }
	                else {
	                    matrix.set(x, y, 1);
	                }
	            }
	        }
	        return;
	    },
	    findRelativeRoomName(roomName, xDelta, yDelta) {
	        let coords = this.getRoomCoordinates(roomName);
	        let xDir = coords.xDir;
	        let yDir = coords.yDir;
	        let x = coords.x + xDelta;
	        let y = coords.y + yDelta;
	        if (x < 0) {
	            x = Math.abs(x) - 1;
	            xDir = this.negaDirection(xDir);
	        }
	        if (y < 0) {
	            y = Math.abs(y) - 1;
	            yDir = this.negaDirection(yDir);
	        }
	        return xDir + x + yDir + y;
	    },
	    findRoomCoordDeltas(origin, otherRoom) {
	        let originCoords = this.getRoomCoordinates(origin);
	        let otherCoords = this.getRoomCoordinates(otherRoom);
	        let xDelta = otherCoords.x - originCoords.x;
	        if (originCoords.xDir === otherCoords.xDir) {
	            if (originCoords.xDir === "W") {
	                xDelta = -xDelta;
	            }
	        }
	        else {
	            xDelta = otherCoords.x + originCoords.x + 1;
	            if (originCoords.xDir === "E") {
	                xDelta = -xDelta;
	            }
	        }
	        let yDelta = otherCoords.y - originCoords.y;
	        if (originCoords.yDir === otherCoords.yDir) {
	            if (originCoords.yDir === "S") {
	                yDelta = -yDelta;
	            }
	        }
	        else {
	            yDelta = otherCoords.y + originCoords.y + 1;
	            if (originCoords.yDir === "N") {
	                yDelta = -yDelta;
	            }
	        }
	        return { x: xDelta, y: yDelta };
	    },
	    findRelativeRoomDir(origin, otherRoom) {
	        let coordDeltas = this.findRoomCoordDeltas(origin, otherRoom);
	        if (Math.abs(coordDeltas.x) === Math.abs(coordDeltas.y)) {
	            if (coordDeltas.x > 0) {
	                if (coordDeltas.y > 0) {
	                    return 2;
	                }
	                else {
	                    return 4;
	                }
	            }
	            else if (coordDeltas.x < 0) {
	                if (coordDeltas.y > 0) {
	                    return 8;
	                }
	                else {
	                    return 6;
	                }
	            }
	            else {
	                // must be the same room, no direction
	                return 0;
	            }
	        }
	        else {
	            if (Math.abs(coordDeltas.x) > Math.abs(coordDeltas.y)) {
	                if (coordDeltas.x > 0) {
	                    return 3;
	                }
	                else {
	                    return 7;
	                }
	            }
	            else {
	                if (coordDeltas.y > 0) {
	                    return 1;
	                }
	                else {
	                    return 5;
	                }
	            }
	        }
	    },
	    blockOffExits(matrix, cost = 0xff, roomName) {
	        for (let x = 0; x < 50; x += 49) {
	            for (let y = 0; y < 50; y++) {
	                if (roomName) {
	                    let terrain = Game.map.getTerrainAt(x, y, roomName);
	                    if (terrain !== "wall") {
	                        matrix.set(x, y, cost);
	                    }
	                }
	                else {
	                    matrix.set(x, y, 0xff);
	                }
	            }
	        }
	        for (let x = 0; x < 50; x++) {
	            for (let y = 0; y < 50; y += 49) {
	                if (roomName) {
	                    let terrain = Game.map.getTerrainAt(x, y, roomName);
	                    if (terrain !== "wall") {
	                        matrix.set(x, y, cost);
	                    }
	                }
	                else {
	                    matrix.set(x, y, 0xff);
	                }
	            }
	        }
	        return matrix;
	    },
	    showMatrix(matrix) {
	        // showMatrix
	        for (let y = 0; y < 50; y++) {
	            let line = "";
	            for (let x = 0; x < 50; x++) {
	                let value = matrix.get(x, y);
	                if (value === 0xff)
	                    line += "f";
	                else
	                    line += value % 10;
	            }
	            console.log(line);
	        }
	    },
	    coordToPosition(coord, centerPosition, rotation = 0) {
	        if (!(centerPosition instanceof RoomPosition)) {
	            centerPosition = this.deserializeRoomPosition(centerPosition);
	        }
	        let xCoord = coord.x;
	        let yCoord = coord.y;
	        if (rotation === 1) {
	            xCoord = -coord.y;
	            yCoord = coord.x;
	        }
	        else if (rotation === 2) {
	            xCoord = -coord.x;
	            yCoord = -coord.y;
	        }
	        else if (rotation === 3) {
	            xCoord = coord.y;
	            yCoord = -coord.x;
	        }
	        return new RoomPosition(centerPosition.x + xCoord, centerPosition.y + yCoord, centerPosition.roomName);
	    },
	    positionToCoord(pos, centerPoint, rotation = 0) {
	        let xCoord = pos.x - centerPoint.x;
	        let yCoord = pos.y - centerPoint.y;
	        if (rotation === 0) {
	            return { x: xCoord, y: yCoord };
	        }
	        else if (rotation === 1) {
	            return { x: yCoord, y: -xCoord };
	        }
	        else if (rotation === 2) {
	            return { x: -xCoord, y: -yCoord };
	        }
	        else if (rotation === 3) {
	            return { x: -yCoord, y: xCoord };
	        }
	    },
	    serializePath(startPos, path) {
	        let serializedPath = "";
	        let lastPosition = startPos;
	        for (let position of path) {
	            if (position.roomName === lastPosition.roomName) {
	                serializedPath += lastPosition.getDirectionTo(position);
	            }
	            lastPosition = position;
	        }
	        return serializedPath;
	    },
	    pathablePosition(roomName) {
	        for (let radius = 0; radius < 20; radius++) {
	            for (let xDelta = -radius; xDelta <= radius; xDelta++) {
	                for (let yDelta = -radius; yDelta <= radius; yDelta++) {
	                    if (Math.abs(yDelta) !== radius && Math.abs(xDelta) !== radius) {
	                        continue;
	                    }
	                    let x = 25 + xDelta;
	                    let y = 25 + yDelta;
	                    let terrain = Game.map.getTerrainAt(x, y, roomName);
	                    if (terrain !== "wall") {
	                        return new RoomPosition(x, y, roomName);
	                    }
	                }
	            }
	        }
	    },
	    roomTypeFromName(roomName) {
	        let coords = this.getRoomCoordinates(roomName);
	        if (coords.x % 10 === 0 || coords.y % 10 === 0) {
	            return constants_1.ROOMTYPE_ALLEY;
	        }
	        else if (coords.x % 5 === 0 && coords.y % 5 === 0) {
	            return constants_1.ROOMTYPE_CORE;
	        }
	        else if (coords.x % 10 === 6 || coords.x % 10 === 4 || coords.y % 10 === 6 || coords.y % 10 === 4) {
	            return constants_1.ROOMTYPE_SOURCEKEEPER;
	        }
	        else {
	            return constants_1.ROOMTYPE_CONTROLLER;
	        }
	    },
	    debugPath(path, identifier = "") {
	        let count = 0;
	        for (let position of path) {
	            let room = Game.rooms[position.roomName];
	            if (room) {
	                let name = "debugPath" + identifier + count;
	                count++;
	                let flag = Game.flags[name];
	                if (flag) {
	                    flag.setPosition(position);
	                }
	                else {
	                    position.createFlag(name, COLOR_ORANGE);
	                }
	            }
	        }
	        for (let i = count; i < 1000; i++) {
	            let name = "debugPath" + identifier + i;
	            let flag = Game.flags[name];
	            if (flag) {
	                flag.remove();
	            }
	            else {
	                break;
	            }
	        }
	        return `placed ${count} out of ${path.length} flags`;
	    },
	    towerDamageAtRange(range) {
	        if (range <= TOWER_OPTIMAL_RANGE) {
	            return TOWER_POWER_ATTACK;
	        }
	        if (range >= TOWER_FALLOFF_RANGE) {
	            range = TOWER_FALLOFF_RANGE;
	        }
	        return TOWER_POWER_ATTACK - (TOWER_POWER_ATTACK * TOWER_FALLOFF *
	            (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE));
	    }
	};


/***/ },
/* 6 */
/*!*************************!*\
  !*** ./src/notifier.ts ***!
  \*************************/
/***/ function(module, exports) {

	"use strict";
	exports.notifier = {
	    add(message) {
	        console.log(message);
	        Memory.notifier.push({ time: Game.time, message: message });
	    },
	    review(limit = Number.MAX_VALUE, burnAfterReading = false) {
	        let messageCount = Memory.notifier.length;
	        let count = 0;
	        for (let value of Memory.notifier) {
	            let secondsElapsed = (Game.time - value.time) * 3;
	            let seconds = secondsElapsed % 60;
	            let minutes = Math.floor(secondsElapsed / 60);
	            let hours = Math.floor(secondsElapsed / 3600);
	            console.log(`\n${value.time} (roughly ${hours > 0 ? `${hours} hours, ` : ""}${minutes > 0 ? `${minutes} minutes, ` : ""}${seconds > 0 ? `${seconds} seconds ` : ""}ago)`);
	            console.log(`${value.message}`);
	            count++;
	            if (count >= limit) {
	                break;
	            }
	        }
	        let destroyed = 0;
	        if (burnAfterReading) {
	            while (Memory.notifier.length > 0) {
	                Memory.notifier.shift();
	                destroyed++;
	                if (destroyed >= limit) {
	                    break;
	                }
	            }
	        }
	        return `viewing ${count} of ${messageCount} notifications`;
	    },
	    clear(term) {
	        if (term) {
	            let count = 0;
	            term = term.toLocaleLowerCase();
	            let newArray = [];
	            for (let value of Memory.notifier) {
	                if (value.message.toLocaleLowerCase().indexOf(term) < 0) {
	                    newArray.push(value);
	                    count++;
	                }
	                Memory.notifier = newArray;
	            }
	            return `removed ${count} messages;`;
	        }
	        else {
	            let count = Memory.notifier.length;
	            Memory.notifier = [];
	            return `removed ${count} messages;`;
	        }
	    }
	};


/***/ },
/* 7 */
/*!*************************!*\
  !*** ./src/profiler.ts ***!
  \*************************/
/***/ function(module, exports) {

	"use strict";
	exports.profiler = {
	    start(identifier, consoleReport = false, period = 5) {
	        if (!Memory.profiler[identifier]) {
	            Memory.profiler[identifier] = {};
	        }
	        _.defaults(Memory.profiler[identifier], { total: 0, count: 0, startOfPeriod: Game.time - 1 });
	        Memory.profiler[identifier].period = period;
	        Memory.profiler[identifier].consoleReport = consoleReport;
	        Memory.profiler[identifier].lastTickTracked = Game.time;
	        Memory.profiler[identifier].cpu = Game.cpu.getUsed();
	    },
	    end(identifier) {
	        let profile = Memory.profiler[identifier];
	        profile.total += Game.cpu.getUsed() - profile.cpu;
	        profile.count++;
	    },
	    finalize() {
	        for (let identifier in Memory.profiler) {
	            let profile = Memory.profiler[identifier];
	            if (Game.time - profile.startOfPeriod >= profile.period) {
	                profile.costPerCall = _.round(profile.total / profile.count, 2);
	                profile.costPerTick = _.round(profile.total / profile.period, 2);
	                profile.callsPerTick = _.round(profile.count / profile.period, 2);
	                if (profile.consoleReport) {
	                    console.log("PROFILER:", identifier, "perTick:", profile.costPerTick, "perCall:", profile.costPerCall, "calls per tick:", profile.callsPerTick);
	                }
	                profile.startOfPeriod = Game.time;
	                profile.total = 0;
	                profile.count = 0;
	            }
	            if (Game.time - profile.lastTickTracked > 10000) {
	                delete Memory.profiler[identifier];
	            }
	        }
	        if (Game.time % 10 === 0) {
	            // Memory serialization will cause additional CPU use, better to err on the conservative side
	            Memory.cpu.history.push(Game.cpu.getUsed() + Game.gcl.level / 5);
	            Memory.cpu.average = _.sum(Memory.cpu.history) / Memory.cpu.history.length;
	            while (Memory.cpu.history.length > 100) {
	                Memory.cpu.history.shift();
	            }
	        }
	    },
	    proportionUsed() {
	        return Memory.cpu.average / (Game.gcl.level * 10 + 20);
	    }
	};


/***/ },
/* 8 */
/*!********************************************!*\
  !*** ./src/ai/operations/FortOperation.ts ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const EmergencyMission_1 = __webpack_require__(/*! ../missions/EmergencyMission */ 10);
	const RefillMission_1 = __webpack_require__(/*! ../missions/RefillMission */ 12);
	const DefenseMission_1 = __webpack_require__(/*! ../missions/DefenseMission */ 13);
	const PowerMission_1 = __webpack_require__(/*! ../missions/PowerMission */ 14);
	const TerminalNetworkMission_1 = __webpack_require__(/*! ../missions/TerminalNetworkMission */ 15);
	const IgorMission_1 = __webpack_require__(/*! ../missions/IgorMission */ 16);
	const LinkMiningMission_1 = __webpack_require__(/*! ../missions/LinkMiningMission */ 17);
	const MiningMission_1 = __webpack_require__(/*! ../missions/MiningMission */ 18);
	const BuildMission_1 = __webpack_require__(/*! ../missions/BuildMission */ 19);
	const LinkNetworkMission_1 = __webpack_require__(/*! ../missions/LinkNetworkMission */ 20);
	const UpgradeMission_1 = __webpack_require__(/*! ../missions/UpgradeMission */ 21);
	const GeologyMission_1 = __webpack_require__(/*! ../missions/GeologyMission */ 22);
	const PaverMission_1 = __webpack_require__(/*! ../missions/PaverMission */ 23);
	class FortOperation extends Operation_1.Operation {
	    /**
	     * Manages the activities of an owned room, assumes bonzaiferroni's build spec
	     * @param flag
	     * @param name
	     * @param type
	     * @param empire
	     */
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	        this.priority = constants_1.OperationPriority.OwnedRoom;
	    }
	    initOperation() {
	        if (this.flag.room) {
	            // initOperation FortOperation variables
	            this.spawnGroup = this.empire.getSpawnGroup(this.flag.room.name);
	            this.empire.register(this.flag.room);
	            // spawn emergency miner if needed
	            this.addMission(new EmergencyMission_1.EmergencyMinerMission(this));
	            // refill spawning energy - will spawn small spawnCart if needed
	            let structures = this.flag.room.findStructures(STRUCTURE_EXTENSION)
	                .concat(this.flag.room.find(FIND_MY_SPAWNS));
	            let maxCarts = this.flag.room.storage ? 1 : 2;
	            this.addMission(new RefillMission_1.RefillMission(this));
	            this.addMission(new DefenseMission_1.DefenseMission(this));
	            if (this.memory.powerMining) {
	                this.addMission(new PowerMission_1.PowerMission(this));
	            }
	            // energy network
	            if (this.flag.room.terminal && this.flag.room.storage) {
	                this.addMission(new TerminalNetworkMission_1.TerminalNetworkMission(this));
	                this.addMission(new IgorMission_1.IgorMission(this));
	            }
	            // harvest energy
	            for (let i = 0; i < this.sources.length; i++) {
	                if (this.sources[i].pos.lookFor(LOOK_FLAGS).length > 0)
	                    continue;
	                let source = this.sources[i];
	                if (this.flag.room.controller.level === 8 && this.flag.room.storage) {
	                    let link = source.findMemoStructure(STRUCTURE_LINK, 2);
	                    if (link) {
	                        this.addMission(new LinkMiningMission_1.LinkMiningMission(this, "linkMiner" + i, source, link));
	                        continue;
	                    }
	                }
	                this.addMission(new MiningMission_1.MiningMission(this, "miner" + i, source));
	            }
	            // build construction
	            this.addMission(new BuildMission_1.BuildMission(this));
	            // build walls
	            // TODO: make MasonMission
	            // use link array near storage to fire energy at controller link (pre-rcl8)
	            if (this.flag.room.storage) {
	                this.addMission(new LinkNetworkMission_1.LinkNetworkMission(this));
	                let extractor = this.mineral.pos.lookFor(LOOK_STRUCTURES)[0];
	                if (this.flag.room.energyCapacityAvailable > 5000 && extractor && extractor.my) {
	                    this.addMission(new GeologyMission_1.GeologyMission(this));
	                }
	            }
	            // upgrader controller
	            let boostUpgraders = this.flag.room.controller.level < 8;
	            this.addMission(new UpgradeMission_1.UpgradeMission(this, boostUpgraders));
	            // pave all roads in the room
	            this.addMission(new PaverMission_1.PaverMission(this));
	        }
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	        this.memory.masonPotency = undefined;
	        this.memory.builderPotency = undefined;
	    }
	    calcMasonPotency() {
	        if (!this.memory.masonPotency) {
	            let surplusMode = this.flag.room.storage && this.flag.room.storage.store.energy > constants_1.NEED_ENERGY_THRESHOLD;
	            let megaSurplusMode = this.flag.room.storage && this.flag.room.storage.store.energy > constants_1.ENERGYSINK_THRESHOLD;
	            let potencyBasedOnStorage = megaSurplusMode ? 10 : surplusMode ? 5 : 1;
	            if (this.memory.wallBoost) {
	                potencyBasedOnStorage = 20;
	            }
	            // would happen to be the same as the potency used for builders
	            let potencyBasedOnSpawn = this.calcBuilderPotency();
	            if (this.memory.wallBoost) {
	                this.memory.mason.activateBoost = true;
	            }
	            this.memory.masonPotency = Math.min(potencyBasedOnSpawn, potencyBasedOnStorage);
	        }
	        return this.memory.masonPotency;
	    }
	    calcBuilderPotency() {
	        if (!this.memory.builderPotency) {
	            this.memory.builderPotency = Math.min(Math.floor(this.spawnGroup.maxSpawnEnergy / 175), 20);
	        }
	        return this.memory.builderPotency;
	    }
	    nuke(x, y, roomName) {
	        let nuker = _.head(this.flag.room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_NUKER } }));
	        let outcome = nuker.launchNuke(new RoomPosition(x, y, roomName));
	        if (outcome === OK) {
	            this.empire.addNuke({ tick: Game.time, roomName: roomName });
	            return "NUKER: Bombs away! \\o/";
	        }
	        else {
	            return `NUKER: error: ${outcome}`;
	        }
	    }
	    addAllyRoom(roomName) {
	        if (_.includes(this.empire.memory.allyRooms, roomName)) {
	            return "NETWORK: " + roomName + " is already being scanned by " + this.name;
	        }
	        this.empire.addAllyRoom(roomName);
	        return "NETWORK: added " + roomName + " to rooms scanned by " + this.name;
	    }
	}
	exports.FortOperation = FortOperation;


/***/ },
/* 9 */
/*!****************************************!*\
  !*** ./src/ai/operations/Operation.ts ***!
  \****************************************/
/***/ function(module, exports) {

	"use strict";
	class Operation {
	    /**
	     *
	     * @param flag - missions will operate relative to this flag, use the following naming convention: "operationType_operationName"
	     * @param name - second part of flag.name, should be unique amont all other operation names (I use city names)
	     * @param type - first part of flag.name, used to determine which operation class to instantiate
	     * @param empire - object used for empire-scoped behavior (terminal transmission, etc.)
	     */
	    constructor(flag, name, type, empire) {
	        this.flag = flag;
	        this.name = name;
	        this.type = type;
	        Object.defineProperty(this, "empire", { enumerable: false, value: empire });
	        Object.defineProperty(this, "memory", { enumerable: false, value: flag.memory });
	        if (!this.missions) {
	            this.missions = {};
	        }
	        // variables that require vision (null check where appropriate)
	        if (this.flag.room) {
	            this.hasVision = true;
	            this.sources = _.sortBy(this.flag.room.find(FIND_SOURCES), (s) => s.pos.getRangeTo(this.flag));
	            this.mineral = _.head(this.flag.room.find(FIND_MINERALS));
	        }
	    }
	    /**
	     * Init Phase - initialize operation variables and instantiate missions
	     */
	    init() {
	        try {
	            this.initOperation();
	        }
	        catch (e) {
	            console.log("error caught in initOperation phase, operation:", this.name);
	            console.log(e.stack);
	        }
	        for (let missionName in this.missions) {
	            try {
	                this.missions[missionName].initMission();
	            }
	            catch (e) {
	                console.log("error caught in initMission phase, operation:", this.name, "mission:", missionName);
	                console.log(e.stack);
	            }
	        }
	    }
	    /**
	     * RoleCall Phase - Iterate through missions and call mission.roleCall()
	     */
	    roleCall() {
	        // mission roleCall
	        for (let missionName in this.missions) {
	            try {
	                this.missions[missionName].roleCall();
	            }
	            catch (e) {
	                console.log("error caught in roleCall phase, operation:", this.name, "mission:", missionName);
	                console.log(e.stack);
	            }
	        }
	    }
	    /**
	     * Action Phase - Iterate through missions and call mission.missionActions()
	     */
	    actions() {
	        // mission actions
	        for (let missionName in this.missions) {
	            try {
	                this.missions[missionName].missionActions();
	            }
	            catch (e) {
	                console.log("error caught in missionActions phase, operation:", this.name, "mission:", missionName, "in room ", this.flag.pos.roomName);
	                console.log(e.stack);
	            }
	        }
	    }
	    /**
	     * Finalization Phase - Iterate through missions and call mission.finalizeMission(), also call operation.finalizeOperation()
	     */
	    finalize() {
	        // mission actions
	        for (let missionName in this.missions) {
	            try {
	                this.missions[missionName].finalizeMission();
	            }
	            catch (e) {
	                console.log("error caught in finalizeMission phase, operation:", this.name, "mission:", missionName);
	                console.log(e.stack);
	            }
	        }
	        try {
	            this.finalizeOperation();
	        }
	        catch (e) {
	            console.log("error caught in finalizeOperation phase, operation:", this.name);
	            console.log(e.stack);
	        }
	    }
	    /**
	     * Invalidate Cache Phase - Occurs every-so-often (see constants.ts) to give you an efficient means of invalidating operation and
	     * mission cache
	     */
	    invalidateCache() {
	        // base rate of 1 proc out of 100 ticks
	        if (Math.random() < .01) {
	            for (let missionName in this.missions) {
	                try {
	                    this.missions[missionName].invalidateMissionCache();
	                }
	                catch (e) {
	                    console.log("error caught in invalidateMissionCache phase, operation:", this.name, "mission:", missionName);
	                    console.log(e.stack);
	                }
	            }
	            try {
	                this.invalidateOperationCache();
	            }
	            catch (e) {
	                console.log("error caught in invalidateOperationCache phase, operation:", this.name);
	                console.log(e.stack);
	            }
	        }
	    }
	    /**
	     * Add mission to operation.missions hash
	     * @param mission
	     */
	    addMission(mission) {
	        // it is important for every mission belonging to an operation to have
	        // a unique name or they will be overwritten here
	        this.missions[mission.getName()] = mission;
	    }
	    getRemoteSpawnGroup(distanceLimit = 4, levelRequirement = 1) {
	        // invalidated periodically
	        if (!this.memory.spawnRooms || this.memory.spawnRooms.length === 0) {
	            let closestRoomRange = Number.MAX_VALUE;
	            let roomNames = [];
	            for (let roomName of Object.keys(this.empire.spawnGroups)) {
	                let roomLinearDistance = Game.map.getRoomLinearDistance(this.flag.pos.roomName, roomName);
	                if (roomLinearDistance === 0)
	                    continue;
	                if (roomLinearDistance > distanceLimit || roomLinearDistance > closestRoomRange)
	                    continue;
	                let spawnGroup = this.empire.spawnGroups[roomName];
	                if (spawnGroup.room.controller.level < levelRequirement)
	                    continue;
	                let distance = this.empire.roomTravelDistance(this.flag.pos.roomName, roomName);
	                if (distance < closestRoomRange) {
	                    closestRoomRange = distance;
	                    roomNames = [roomName];
	                }
	                else if (distance === closestRoomRange) {
	                    roomNames.push(roomName);
	                }
	            }
	            console.log(`SPAWN: finding spawn rooms in ${this.name}, ${roomNames}`);
	            this.memory.spawnRooms = roomNames;
	        }
	        let spawnRoom = _(this.memory.spawnRooms).sortBy((roomName) => {
	            let spawnGroup = this.empire.getSpawnGroup(roomName);
	            if (spawnGroup) {
	                return spawnGroup.averageAvailability;
	            }
	            else {
	                _.pull(this.memory.spawnRooms, roomName);
	            }
	        }).last();
	        return this.empire.getSpawnGroup(spawnRoom);
	    }
	    manualControllerBattery(id) {
	        let object = Game.getObjectById(id);
	        if (!object) {
	            return "that is not a valid game object or not in vision";
	        }
	        this.flag.room.memory.controllerBatteryId = id;
	        this.flag.room.memory.upgraderPositions = undefined;
	        return "controller battery assigned to" + object;
	    }
	    findOperationWaypoints() {
	        this.waypoints = [];
	        for (let i = 0; i < 100; i++) {
	            let flag = Game.flags[this.name + "_waypoints_" + i];
	            if (flag) {
	                this.waypoints.push(flag);
	            }
	            else {
	                break;
	            }
	        }
	    }
	    setSpawnRoom(roomName, portalTravel = false) {
	        if (roomName instanceof Operation) {
	            roomName = roomName.flag.room.name;
	        }
	        if (!this.empire.getSpawnGroup(roomName)) {
	            return "SPAWN: that room doesn't appear to host a valid spawnGroup";
	        }
	        if (!this.waypoints || !this.waypoints[0]) {
	            if (portalTravel) {
	                return "SPAWN: please set up waypoints before setting spawn room with portal travel";
	            }
	        }
	        else {
	            this.waypoints[0].memory.portalTravel = portalTravel;
	        }
	        this.memory.spawnRoom = roomName;
	        _.each(this.missions, (mission) => mission.invalidateSpawnDistance());
	        return "SPAWN: spawnRoom for " + this.name + " set to " + roomName + " (map range: " +
	            Game.map.getRoomLinearDistance(this.flag.pos.roomName, roomName) + ")";
	    }
	    setMax(missionName, max) {
	        if (!this.memory[missionName])
	            return "SPAWN: no " + missionName + " mission in " + this.name;
	        let oldValue = this.memory[missionName].max;
	        this.memory[missionName].max = max;
	        return "SPAWN: " + missionName + " max spawn value changed from " + oldValue + " to " + max;
	    }
	    setBoost(missionName, activateBoost) {
	        if (!this.memory[missionName])
	            return "SPAWN: no " + missionName + " mission in " + this.name;
	        let oldValue = this.memory[missionName].activateBoost;
	        this.memory[missionName].activateBoost = activateBoost;
	        return "SPAWN: " + missionName + " boost value changed from " + oldValue + " to " + activateBoost;
	    }
	    repair(id, hits) {
	        if (!id || !hits)
	            return "usage: opName.repair(id, hits)";
	        if (!this.memory.mason)
	            return "no mason available for repair instructions";
	        let object = Game.getObjectById(id);
	        if (!object)
	            return "that object doesn't seem to exist";
	        if (!(object instanceof Structure))
	            return "that isn't a structure";
	        if (hits > object.hitsMax)
	            return object.structureType + " cannot have more than " + object.hitsMax + " hits";
	        this.memory.mason.manualTargetId = id;
	        this.memory.mason.manualTargetHits = hits;
	        return "MASON: repairing " + object.structureType + " to " + hits + " hits";
	    }
	}
	exports.Operation = Operation;


/***/ },
/* 10 */
/*!*********************************************!*\
  !*** ./src/ai/missions/EmergencyMission.ts ***!
  \*********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class EmergencyMinerMission extends Mission_1.Mission {
	    /**
	     * Checks every 100 ticks if storage is full or a miner is present, if not spawns an emergency miner. Should come
	     * first in FortOperation
	     * @param operation
	     */
	    constructor(operation) {
	        super(operation, "emergencyMiner");
	    }
	    initMission() {
	    }
	    roleCall() {
	        let energyAvailable = this.spawnGroup.currentSpawnEnergy >= 1300 ||
	            (this.room.storage && this.room.storage.store.energy > 1300) || this.findMinersBySources();
	        let body = () => this.workerBody(2, 1, 1);
	        if (energyAvailable) {
	            this.memory.lastTick = Game.time;
	        }
	        let maxEmergencyMiners = 0;
	        if (!this.memory.lastTick || Game.time - this.memory.lastTick > 100) {
	            if (Game.time % 10 === 0) {
	                console.log("ATTN: Backup miner being spawned in", this.opName);
	            }
	            maxEmergencyMiners = 2;
	        }
	        this.emergencyMiners = this.headCount("emergencyMiner", body, maxEmergencyMiners);
	    }
	    missionActions() {
	        for (let miner of this.emergencyMiners) {
	            this.minerActions(miner);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    minerActions(miner) {
	        let closest = miner.pos.findClosestByRange(FIND_SOURCES);
	        if (!miner.pos.isNearTo(closest)) {
	            miner.blindMoveTo(closest);
	            return;
	        }
	        miner.memory.donatesEnergy = true;
	        miner.memory.scavanger = RESOURCE_ENERGY;
	        miner.harvest(closest);
	    }
	    findMinersBySources() {
	        for (let source of this.room.find(FIND_SOURCES)) {
	            if (source.pos.findInRange(FIND_MY_CREEPS, 1, (c) => c.partCount(WORK) > 0).length > 0) {
	                return true;
	            }
	        }
	        return false;
	    }
	}
	exports.EmergencyMinerMission = EmergencyMinerMission;


/***/ },
/* 11 */
/*!************************************!*\
  !*** ./src/ai/missions/Mission.ts ***!
  \************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class Mission {
	    constructor(operation, name, allowSpawn = true) {
	        this.partnerPairing = {};
	        this.name = name;
	        this.opName = operation.name;
	        this.opType = operation.type;
	        Object.defineProperty(this, "flag", { enumerable: false, value: operation.flag });
	        Object.defineProperty(this, "room", { enumerable: false, value: operation.flag.room });
	        Object.defineProperty(this, "empire", { enumerable: false, value: operation.empire });
	        Object.defineProperty(this, "spawnGroup", { enumerable: false, value: operation.spawnGroup, writable: true });
	        Object.defineProperty(this, "sources", { enumerable: false, value: operation.sources });
	        if (!operation.flag.memory[this.name])
	            operation.flag.memory[this.name] = {};
	        this.memory = operation.flag.memory[this.name];
	        this.allowSpawn = allowSpawn;
	        if (this.room)
	            this.hasVision = true;
	        // initialize memory to be used by this mission
	        if (!this.memory.spawn)
	            this.memory.spawn = {};
	        if (operation.waypoints && operation.waypoints.length > 0) {
	            this.waypoints = operation.waypoints;
	        }
	    }
	    getEmpire() { return this.empire; }
	    ;
	    getRoom() { return this.room; }
	    ;
	    getSpawnGroup() { return this.spawnGroup; }
	    ;
	    getMemory() { return this.memory; }
	    ;
	    getName() { return this.name; }
	    ;
	    getOpName() { return this.opName; }
	    ;
	    setBoost(activateBoost) {
	        let oldValue = this.memory.activateBoost;
	        this.memory.activateBoost = activateBoost;
	        return `changing boost activation for ${this.name} in ${this.opName} from ${oldValue} to ${activateBoost}`;
	    }
	    setMax(max) {
	        let oldValue = this.memory.max;
	        this.memory.max = max;
	        return `changing max creeps for ${this.name} in ${this.opName} from ${oldValue} to ${max}`;
	    }
	    setSpawnGroup(spawnGroup) {
	        this.spawnGroup = spawnGroup;
	    }
	    invalidateSpawnDistance() {
	        if (this.memory.distanceToSpawn) {
	            console.log(`SPAWN: resetting distance for ${this.name} in ${this.opName}`);
	            this.memory.distanceToSpawn = undefined;
	        }
	    }
	    /**
	     * General purpose function for spawning creeps
	     * @param roleName - Used to find creeps belonging to this role, examples: miner, energyCart
	     * @param getBody - function that returns the body to be used if a new creep needs to be spawned
	     * @param max - how many creeps are currently desired, pass 0 to halt spawning
	     * @param options - Optional parameters like prespawn interval, whether to disable attack notifications, etc.
	     * @returns {Creep[]}
	     */
	    headCount(roleName, getBody, max, options) {
	        if (!options) {
	            options = {};
	        }
	        let roleArray = [];
	        if (!this.memory.spawn[roleName]) {
	            this.memory.spawn[roleName] = this.findOrphans(roleName);
	        }
	        let count = 0;
	        for (let i = 0; i < this.memory.spawn[roleName].length; i++) {
	            let creepName = this.memory.spawn[roleName][i];
	            let creep = Game.creeps[creepName];
	            if (creep) {
	                // newer code to implement waypoints/boosts
	                let prepared = this.prepCreep(creep, options);
	                if (prepared) {
	                    roleArray.push(creep);
	                }
	                let ticksNeeded = 0;
	                if (options.prespawn !== undefined) {
	                    ticksNeeded += creep.body.length * 3;
	                    ticksNeeded += options.prespawn;
	                }
	                if (!creep.ticksToLive || creep.ticksToLive > ticksNeeded) {
	                    count++;
	                }
	            }
	            else {
	                this.memory.spawn[roleName].splice(i, 1);
	                Memory.creeps[creepName] = undefined;
	                i--;
	            }
	        }
	        if (count < max && this.allowSpawn && this.spawnGroup.isAvailable && (this.hasVision || options.blindSpawn)) {
	            let creepName = this.opName + "_" + roleName + "_" + Math.floor(Math.random() * 100);
	            let outcome = this.spawnGroup.spawn(getBody(), creepName, options.memory, options.reservation);
	            if (_.isString(outcome))
	                this.memory.spawn[roleName].push(creepName);
	        }
	        return roleArray;
	    }
	    spawnSharedCreep(roleName, getBody) {
	        let spawnMemory = this.spawnGroup.spawns[0].memory;
	        if (!spawnMemory.communityRoles)
	            spawnMemory.communityRoles = {};
	        let employerName = this.opName + this.name;
	        let creep;
	        if (spawnMemory.communityRoles[roleName]) {
	            let creepName = spawnMemory.communityRoles[roleName];
	            creep = Game.creeps[creepName];
	            if (creep && Game.map.getRoomLinearDistance(this.spawnGroup.room.name, creep.room.name) <= 3) {
	                if (creep.memory.employer === employerName || (!creep.memory.lastTickEmployed || Game.time - creep.memory.lastTickEmployed > 1)) {
	                    creep.memory.employer = employerName;
	                    creep.memory.lastTickEmployed = Game.time;
	                    return creep;
	                }
	            }
	            else {
	                delete Memory.creeps[creepName];
	                delete spawnMemory.communityRoles[roleName];
	            }
	        }
	        if (!creep && this.spawnGroup.isAvailable) {
	            let creepName = "community_" + roleName;
	            while (Game.creeps[creepName]) {
	                creepName = "community_" + roleName + "_" + Math.floor(Math.random() * 100);
	            }
	            let outcome = this.spawnGroup.spawn(getBody(), creepName, undefined, undefined);
	            if (_.isString(outcome)) {
	                spawnMemory.communityRoles[roleName] = outcome;
	            }
	            else if (Game.time % 10 !== 0 && outcome !== ERR_NOT_ENOUGH_RESOURCES) {
	                console.log(`error spawning community ${roleName} in ${this.opName} outcome: ${outcome}`);
	            }
	        }
	    }
	    /**
	     * Returns creep body array with desired number of parts in this order: WORK → CARRY → MOVE
	     * @param workCount
	     * @param carryCount
	     * @param movecount
	     * @returns {string[]}
	     */
	    workerBody(workCount, carryCount, movecount) {
	        let body = [];
	        for (let i = 0; i < workCount; i++) {
	            body.push(WORK);
	        }
	        for (let i = 0; i < carryCount; i++) {
	            body.push(CARRY);
	        }
	        for (let i = 0; i < movecount; i++) {
	            body.push(MOVE);
	        }
	        return body;
	    }
	    configBody(config) {
	        let body = [];
	        for (let partType in config) {
	            let amount = config[partType];
	            for (let i = 0; i < amount; i++) {
	                body.push(partType);
	            }
	        }
	        return body;
	    }
	    /**
	     * Returns creep body array with the desired ratio of parts, governed by how much spawn energy is possible
	     * @param workRatio
	     * @param carryRatio
	     * @param moveRatio
	     * @param spawnFraction - proportion of spawn energy to be used up to 50 body parts, .5 would use half, 1 would use all
	     * @param limit - set a limit to the number of units (useful if you know the exact limit, like with miners)
	     * @returns {string[]}
	     */
	    bodyRatio(workRatio, carryRatio, moveRatio, spawnFraction, limit) {
	        let sum = workRatio * 100 + carryRatio * 50 + moveRatio * 50;
	        let partsPerUnit = workRatio + carryRatio + moveRatio;
	        if (!limit)
	            limit = Math.floor(50 / partsPerUnit);
	        let maxUnits = Math.min(Math.floor((this.spawnGroup.maxSpawnEnergy * spawnFraction) / sum), limit);
	        return this.workerBody(workRatio * maxUnits, carryRatio * maxUnits, moveRatio * maxUnits);
	    }
	    /**
	     * General purpose checking for creep load
	     * @param creep
	     * @returns {boolean}
	     */
	    hasLoad(creep) {
	        if (creep.memory.hasLoad && _.sum(creep.carry) === 0) {
	            creep.memory.hasLoad = false;
	        }
	        else if (!creep.memory.hasLoad && _.sum(creep.carry) === creep.carryCapacity) {
	            creep.memory.hasLoad = true;
	        }
	        return creep.memory.hasLoad;
	    }
	    /**
	     * Used to determine cart count/size based on transport distance and the bandwidth needed
	     * @param distance - distance (or average distance) from point A to point B
	     * @param load - how many resource units need to be transported per tick (example: 10 for an energy source)
	     * @returns {{body: string[], cartsNeeded: number}}
	     */
	    cacheTransportAnalysis(distance, load) {
	        if (!this.memory.transportAnalysis || load !== this.memory.transportAnalysis.load
	            || distance !== this.memory.transportAnalysis.distance) {
	            this.memory.transportAnalysis = Mission.analyzeTransport(distance, load, this.spawnGroup.maxSpawnEnergy);
	        }
	        return this.memory.transportAnalysis;
	    }
	    static analyzeTransport(distance, load, maxSpawnEnergy) {
	        // cargo units are just 2 CARRY, 1 MOVE, which has a capacity of 100 and costs 150
	        let maxUnitsPossible = Math.min(Math.floor(maxSpawnEnergy /
	            ((BODYPART_COST[CARRY] * 2) + BODYPART_COST[MOVE])), 16);
	        let bandwidthNeeded = distance * load * 2.1;
	        let cargoUnitsNeeded = Math.ceil(bandwidthNeeded / (CARRY_CAPACITY * 2));
	        let cartsNeeded = Math.ceil(cargoUnitsNeeded / maxUnitsPossible);
	        let cargoUnitsPerCart = Math.floor(cargoUnitsNeeded / cartsNeeded);
	        return {
	            load: load,
	            distance: distance,
	            cartsNeeded: cartsNeeded,
	            carryCount: cargoUnitsPerCart * 2,
	            moveCount: cargoUnitsPerCart,
	        };
	    }
	    static loadFromSource(source) {
	        return Math.max(source.energyCapacity, SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME;
	    }
	    /**
	     * General-purpose energy getting, will look for an energy source in the same room as the operation flag (not creep)
	     * @param creep
	     * @param nextDestination
	     * @param highPriority - allows you to withdraw energy before a battery reaches an optimal amount of energy, jumping
	     * ahead of any other creeps trying to get energy
	     * @param getFromSource
	     */
	    procureEnergy(creep, nextDestination, highPriority = false, getFromSource = false) {
	        let battery = this.getBattery(creep);
	        if (battery) {
	            if (creep.pos.isNearTo(battery)) {
	                let outcome;
	                if (highPriority) {
	                    if (battery.store.energy >= 50) {
	                        outcome = creep.withdraw(battery, RESOURCE_ENERGY);
	                    }
	                }
	                else {
	                    outcome = creep.withdrawIfFull(battery, RESOURCE_ENERGY);
	                }
	                if (outcome === OK) {
	                    creep.memory.batteryId = undefined;
	                    if (nextDestination) {
	                        creep.blindMoveTo(nextDestination, { maxRooms: 1 });
	                    }
	                }
	            }
	            else {
	                creep.blindMoveTo(battery, { maxRooms: 1 });
	            }
	        }
	        else {
	            if (getFromSource) {
	                let closest = creep.pos.findClosestByRange(this.sources);
	                if (closest) {
	                    if (creep.pos.isNearTo(closest)) {
	                        creep.harvest(closest);
	                    }
	                    else {
	                        creep.blindMoveTo(closest);
	                    }
	                }
	                else if (!creep.pos.isNearTo(this.flag)) {
	                    creep.blindMoveTo(this.flag);
	                }
	            }
	            else {
	                if (creep.memory._move) {
	                    let moveData = creep.memory._move.dest;
	                    let dest = new RoomPosition(moveData.x, moveData.y, moveData.room);
	                    creep.idleOffRoad({ pos: dest }, true);
	                }
	                else {
	                    creep.idleOffRoad(this.flag, true);
	                }
	            }
	        }
	    }
	    /**
	     * Will return storage if it is available, otherwise will look for an alternative battery and cache it
	     * @param creep - return a battery relative to the room that the creep is currently in
	     * @returns {any}
	     */
	    getBattery(creep) {
	        let minEnergy = creep.carryCapacity - creep.carry.energy;
	        if (creep.room.storage && creep.room.storage.store.energy > minEnergy) {
	            return creep.room.storage;
	        }
	        return creep.rememberBattery();
	    }
	    getFlagSet(identifier, max = 10) {
	        let flags = [];
	        for (let i = 0; i < max; i++) {
	            let flag = Game.flags[this.opName + identifier + i];
	            if (flag) {
	                flags.push(flag);
	            }
	        }
	        return flags;
	    }
	    flagLook(lookConstant, identifier, max = 10) {
	        let objects = [];
	        let flags = this.getFlagSet(identifier, max);
	        for (let flag of flags) {
	            if (flag.room) {
	                let object = _.head(flag.pos.lookFor(lookConstant));
	                if (object) {
	                    objects.push(object);
	                }
	                else {
	                    flag.remove();
	                }
	            }
	        }
	        return objects;
	    }
	    getStorage(pos) {
	        if (this.memory.tempStorageId) {
	            let storage = Game.getObjectById(this.memory.tempStorageId);
	            if (storage) {
	                return storage;
	            }
	            else {
	                console.log("ATTN: Clearing temporary storage id due to not finding object in", this.opName);
	                this.memory.tempStorageId = undefined;
	            }
	        }
	        if (this.memory.storageId) {
	            let storage = Game.getObjectById(this.memory.storageId);
	            if (storage && storage.room.controller.level >= 4) {
	                return storage;
	            }
	            else {
	                console.log("ATTN: attempting to find better storage for", this.name, "in", this.opName);
	                this.memory.storageId = undefined;
	                return this.getStorage(pos);
	            }
	        }
	        else {
	            let storages = _.filter(this.empire.storages, (s) => s.room.controller.level >= 4);
	            let storage = pos.findClosestByLongPath(storages);
	            if (!storage) {
	                storage = pos.findClosestByRoomRange(storages);
	                console.log("couldn't find storage via path, fell back to find closest by room range for", this.opName);
	            }
	            if (storage) {
	                console.log("ATTN: attempting to find better storage for", this.name, "in", this.opName);
	                this.memory.storageId = storage.id;
	                return storage;
	            }
	        }
	    }
	    idleNear(creep, place, desiredRange = 3) {
	        let range = creep.pos.getRangeTo(place);
	        if (range < desiredRange) {
	            creep.idleOffRoad(place);
	        }
	        else if (range === desiredRange) {
	            creep.idleOffRoad(place, true);
	        }
	        else {
	            creep.blindMoveTo(place);
	        }
	    }
	    findOrphans(roleName) {
	        let creepNames = [];
	        for (let creepName in Game.creeps) {
	            if (creepName.indexOf(this.opName + "_" + roleName + "_") > -1) {
	                creepNames.push(creepName);
	            }
	        }
	        return creepNames;
	    }
	    recycleCreep(creep) {
	        let spawn = this.spawnGroup.spawns[0];
	        if (creep.pos.isNearTo(spawn)) {
	            spawn.recycleCreep(creep);
	        }
	        else {
	            creep.blindMoveTo(spawn);
	        }
	    }
	    prepCreep(creep, options) {
	        if (!creep.memory.prep) {
	            this.disableNotify(creep);
	            let boosted = creep.seekBoost(creep.memory.boosts, creep.memory.allowUnboosted);
	            if (!boosted)
	                return false;
	            let outcome = creep.travelByWaypoint(this.waypoints);
	            if (outcome !== constants_1.DESTINATION_REACHED)
	                return false;
	            if (!options.skipMoveToRoom && (creep.room.name !== this.flag.pos.roomName || creep.isNearExit(1))) {
	                if (creep.room.roomType === constants_1.ROOMTYPE_SOURCEKEEPER) {
	                    creep.avoidSK(this.flag);
	                }
	                else {
	                    this.empire.travelTo(creep, this.flag);
	                }
	                return false;
	            }
	            delete creep.memory._travel;
	            creep.memory.prep = true;
	        }
	        return true;
	    }
	    findPartnerships(creeps, role) {
	        for (let creep of creeps) {
	            if (!creep.memory.partner) {
	                if (!this.partnerPairing[role])
	                    this.partnerPairing[role] = [];
	                this.partnerPairing[role].push(creep);
	                for (let otherRole in this.partnerPairing) {
	                    if (role === otherRole)
	                        continue;
	                    let otherCreeps = this.partnerPairing[otherRole];
	                    let closestCreep;
	                    let smallestAgeDifference = Number.MAX_VALUE;
	                    for (let otherCreep of otherCreeps) {
	                        let ageDifference = Math.abs(creep.ticksToLive - otherCreep.ticksToLive);
	                        if (ageDifference < smallestAgeDifference) {
	                            smallestAgeDifference = ageDifference;
	                            closestCreep = otherCreep;
	                        }
	                    }
	                    if (closestCreep) {
	                        closestCreep.memory.partner = creep.name;
	                        creep.memory.partner = closestCreep.name;
	                    }
	                }
	            }
	        }
	    }
	    findDistanceToSpawn(destination) {
	        if (!this.memory.distanceToSpawn) {
	            let roomLinearDistance = Game.map.getRoomLinearDistance(this.spawnGroup.pos.roomName, destination.roomName);
	            if (roomLinearDistance === 0) {
	                let distance = this.spawnGroup.pos.getPathDistanceTo(destination);
	                if (!distance) {
	                    console.log(`SPAWN: error finding distance in ${this.opName} for object at ${destination}`);
	                    return;
	                }
	                this.memory.distanceToSpawn = distance;
	            }
	            else if (roomLinearDistance <= OBSERVER_RANGE) {
	                this.memory.distanceToSpawn = (roomLinearDistance + 1) * 50;
	            }
	            else {
	                console.log(`SPAWN: likely portal travel detected in ${this.opName}, setting distance to 200`);
	                this.memory.distanceToSpawn = 200;
	            }
	        }
	        return this.memory.distanceToSpawn;
	    }
	    disableNotify(creep) {
	        if (!creep.memory.notifyDisabled) {
	            creep.notifyWhenAttacked(false);
	            creep.memory.notifyDisabled = true;
	        }
	    }
	    pavePath(start, finish, rangeAllowance, ignoreLimit = false) {
	        if (Game.time - this.memory.paveTick < 1000)
	            return;
	        let path = this.findPavedPath(start.pos, finish.pos, rangeAllowance);
	        if (!path) {
	            console.log(`incomplete pavePath, please investigate (${this.opName}), start: ${start.pos}, finish: ${finish.pos}, mission: ${this.name}`);
	            return;
	        }
	        let newConstructionPos = this.examinePavedPath(path);
	        if (newConstructionPos && (ignoreLimit || Object.keys(Game.constructionSites).length < 60)) {
	            if (!Game.cache.placedRoad) {
	                Game.cache.placedRoad = true;
	                console.log(`PAVER: placed road ${newConstructionPos} in ${this.opName}`);
	                newConstructionPos.createConstructionSite(STRUCTURE_ROAD);
	            }
	        }
	        else {
	            this.memory.paveTick = Game.time;
	            if (_.last(path).inRangeTo(finish.pos, rangeAllowance)) {
	                return path.length;
	            }
	        }
	    }
	    findPavedPath(start, finish, rangeAllowance) {
	        const ROAD_COST = 3;
	        const PLAIN_COST = 4;
	        const SWAMP_COST = 5;
	        const AVOID_COST = 7;
	        let maxDistance = Game.map.getRoomLinearDistance(start.roomName, finish.roomName);
	        let ret = PathFinder.search(start, [{ pos: finish, range: rangeAllowance }], {
	            plainCost: PLAIN_COST,
	            swampCost: SWAMP_COST,
	            maxOps: 8000,
	            roomCallback: (roomName) => {
	                // disqualify rooms that involve a circuitous path
	                if (Game.map.getRoomLinearDistance(start.roomName, roomName) > maxDistance) {
	                    return false;
	                }
	                // disqualify enemy rooms
	                if (this.empire.memory.hostileRooms[roomName]) {
	                    return false;
	                }
	                let matrix;
	                let room = Game.rooms[roomName];
	                if (!room) {
	                    let roomType = helper_1.helper.roomTypeFromName(roomName);
	                    if (roomType === constants_1.ROOMTYPE_ALLEY) {
	                        matrix = new PathFinder.CostMatrix();
	                        helper_1.helper.blockOffExits(matrix, AVOID_COST, roomName);
	                        return matrix;
	                    }
	                    else {
	                        return;
	                    }
	                }
	                matrix = new PathFinder.CostMatrix();
	                helper_1.helper.addStructuresToMatrix(matrix, room, ROAD_COST);
	                // avoid controller
	                if (room.controller) {
	                    helper_1.helper.blockOffPosition(matrix, room.controller, 3, AVOID_COST);
	                }
	                // avoid container adjacency
	                let sources = room.find(FIND_SOURCES);
	                for (let source of sources) {
	                    let container = source.findMemoStructure(STRUCTURE_CONTAINER, 1);
	                    if (container) {
	                        helper_1.helper.blockOffPosition(matrix, container, 1, AVOID_COST);
	                    }
	                }
	                // add construction sites too
	                let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
	                for (let site of constructionSites) {
	                    if (site.structureType === STRUCTURE_ROAD) {
	                        matrix.set(site.pos.x, site.pos.y, ROAD_COST);
	                    }
	                    else {
	                        matrix.set(site.pos.x, site.pos.y, 0xff);
	                    }
	                }
	                return matrix;
	            },
	        });
	        if (!ret.incomplete)
	            return ret.path;
	    }
	    examinePavedPath(path) {
	        let repairIds = [];
	        let hitsToRepair = 0;
	        for (let i = 0; i < path.length; i++) {
	            let position = path[i];
	            if (!Game.rooms[position.roomName])
	                return;
	            if (position.isNearExit(0))
	                continue;
	            let road = position.lookForStructure(STRUCTURE_ROAD);
	            if (road) {
	                repairIds.push(road.id);
	                hitsToRepair += road.hitsMax - road.hits;
	                // TODO: calculate how much "a whole lot" should be based on paver repair rate
	                const A_WHOLE_LOT = 1000000;
	                if (!this.memory.roadRepairIds && (hitsToRepair > A_WHOLE_LOT || road.hits < road.hitsMax * .20)) {
	                    console.log(`PAVER: I'm being summoned in ${this.opName}`);
	                    this.memory.roadRepairIds = repairIds;
	                }
	                continue;
	            }
	            let construction = position.lookFor(LOOK_CONSTRUCTION_SITES)[0];
	            if (construction)
	                continue;
	            return position;
	        }
	    }
	    paverActions(paver) {
	        let hasLoad = this.hasLoad(paver);
	        if (!hasLoad) {
	            this.procureEnergy(paver, this.findRoadToRepair());
	            return;
	        }
	        let road = this.findRoadToRepair();
	        if (!road) {
	            console.log(`this is ${this.opName} paver, checking out with ${paver.ticksToLive} ticks to live`);
	            delete Memory.creeps[paver.name];
	            paver.idleOffRoad(this.room.controller);
	            return;
	        }
	        let paving = false;
	        if (paver.pos.inRangeTo(road, 3) && !paver.pos.isNearExit(0)) {
	            paving = paver.repair(road) === OK;
	            let hitsLeftToRepair = road.hitsMax - road.hits;
	            if (hitsLeftToRepair > 10000) {
	                paver.yieldRoad(road, true);
	            }
	            else if (hitsLeftToRepair > 1500) {
	                paver.yieldRoad(road, false);
	            }
	        }
	        else {
	            paver.blindMoveTo(road);
	        }
	        if (!paving) {
	            road = paver.pos.lookForStructure(STRUCTURE_ROAD);
	            if (road && road.hits < road.hitsMax)
	                paver.repair(road);
	        }
	        let creepsInRange = _.filter(paver.pos.findInRange(FIND_MY_CREEPS, 1), (c) => {
	            return c.carry.energy > 0 && c.partCount(WORK) === 0;
	        });
	        if (creepsInRange.length > 0) {
	            creepsInRange[0].transfer(paver, RESOURCE_ENERGY);
	        }
	    }
	    findRoadToRepair() {
	        if (!this.memory.roadRepairIds)
	            return;
	        let road = Game.getObjectById(this.memory.roadRepairIds[0]);
	        if (road && road.hits < road.hitsMax) {
	            return road;
	        }
	        else {
	            this.memory.roadRepairIds.shift();
	            if (this.memory.roadRepairIds.length > 0) {
	                return this.findRoadToRepair();
	            }
	            else {
	                this.memory.roadRepairIds = undefined;
	            }
	        }
	    }
	    spawnPaver() {
	        if (this.room.controller && this.room.controller.level === 1)
	            return;
	        let paverBody = () => { return this.bodyRatio(1, 3, 2, 1, 5); };
	        return this.spawnSharedCreep("paver", paverBody);
	    }
	    setPrespawn(creep) {
	        this.memory.prespawn = 1500 - creep.ticksToLive;
	    }
	}
	exports.Mission = Mission;


/***/ },
/* 12 */
/*!******************************************!*\
  !*** ./src/ai/missions/RefillMission.ts ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class RefillMission extends Mission_1.Mission {
	    /**
	     * General-purpose structure refilling. Can be used to refill spawning energy, towers, links, labs, etc.
	     *  Will default to drawing energy from storage, and use altBattery if there is no storage with energy
	     * @param operation
	     */
	    constructor(operation) {
	        super(operation, "refill");
	    }
	    initMission() {
	        this.emergencyMode = this.memory.cartsLastTick === 0;
	    }
	    roleCall() {
	        let max = 2;
	        if (this.room.storage) {
	            max = 1;
	        }
	        if (this.memory.max) {
	            max = this.memory.max;
	        }
	        let emergencyMax = 0;
	        if (this.emergencyMode) {
	            emergencyMax = 1;
	        }
	        let emergencyBody = () => { return this.workerBody(0, 4, 2); };
	        this.emergencyCarts = this.headCount("emergency_" + this.name, emergencyBody, emergencyMax);
	        let cartBody = () => {
	            return this.bodyRatio(0, 2, 1, 1, 10);
	        };
	        let memory = { scavanger: RESOURCE_ENERGY };
	        this.carts = this.headCount("spawnCart", cartBody, max, { prespawn: 50, memory: memory });
	        this.memory.cartsLastTick = this.carts.length;
	    }
	    missionActions() {
	        for (let cart of this.emergencyCarts) {
	            this.spawnCartActions(cart);
	        }
	        for (let cart of this.carts) {
	            this.spawnCartActions(cart);
	        }
	    }
	    spawnCartActions(cart) {
	        let hasLoad = this.hasLoad(cart);
	        if (!hasLoad) {
	            cart.memory.emptyId = undefined;
	            this.procureEnergy(cart, this.findNearestEmpty(cart), true);
	            return;
	        }
	        let target = this.findNearestEmpty(cart);
	        if (!target) {
	            if (cart.carry.energy === cart.carryCapacity) {
	                this.idleNear(cart, this.spawnGroup.spawns[0], 12);
	            }
	            else {
	                cart.memory.hasLoad = false;
	            }
	            return;
	        }
	        // has target
	        if (!cart.pos.isNearTo(target)) {
	            cart.blindMoveTo(target, { maxRooms: 1 });
	            if (this.room.storage && cart.pos.isNearTo(this.room.storage) &&
	                cart.carry.energy <= cart.carryCapacity - 50) {
	                cart.withdraw(this.room.storage, RESOURCE_ENERGY);
	            }
	            return;
	        }
	        // is near to target
	        let outcome = cart.transfer(target, RESOURCE_ENERGY);
	        if (outcome === OK && cart.carry.energy >= target.energyCapacity) {
	            cart.memory.emptyId = undefined;
	            target = this.findNearestEmpty(cart, target);
	            if (target && !cart.pos.isNearTo(target)) {
	                cart.blindMoveTo(target, { maxRooms: 1 });
	            }
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    findNearestEmpty(cart, pullTarget) {
	        let findEmpty = () => {
	            if (!this.empties) {
	                this.empties = _.filter(this.room.findStructures(STRUCTURE_SPAWN)
	                    .concat(this.room.findStructures(STRUCTURE_EXTENSION)), (s) => {
	                    return s.energy < s.energyCapacity;
	                });
	                this.empties = this.empties.concat(_.filter(this.room.findStructures(STRUCTURE_TOWER), (s) => {
	                    return s.energy < s.energyCapacity * .5;
	                }));
	            }
	            if (pullTarget) {
	                _.pull(this.empties, pullTarget);
	            }
	            return cart.pos.findClosestByRange(this.empties);
	        };
	        let forgetEmpty = (s) => s.energy === s.energyCapacity || Game.time % 5 === 0;
	        return cart.rememberStructure(findEmpty, forgetEmpty, "emptyId", true);
	    }
	}
	exports.RefillMission = RefillMission;


/***/ },
/* 13 */
/*!*******************************************!*\
  !*** ./src/ai/missions/DefenseMission.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class DefenseMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "defense");
	        this.healers = [];
	        this.attackers = [];
	        this.enemySquads = [];
	        this.preferRamparts = (roomName, matrix) => {
	            if (roomName === this.room.name) {
	                // block off hostiles and adjacent squares
	                for (let hostile of this.room.hostiles) {
	                    matrix.set(hostile.pos.x, hostile.pos.y, 0xff);
	                    for (let i = 1; i <= 8; i++) {
	                        let position = hostile.pos.getPositionAtDirection(i);
	                        matrix.set(position.x, position.y, 0xff);
	                    }
	                }
	                // set rampart costs to same as road
	                for (let rampart of this.wallRamparts) {
	                    matrix.set(rampart.pos.x, rampart.pos.y, 1);
	                }
	                return matrix;
	            }
	        };
	    }
	    initMission() {
	        this.towers = this.room.findStructures(STRUCTURE_TOWER);
	        this.analyzePlayerThreat();
	        // nuke detection
	        if (Game.time % 1000 === 1) {
	            let nukes = this.room.find(FIND_NUKES);
	            for (let nuke of nukes) {
	                console.log(`DEFENSE: nuke landing at ${this.opName} in ${nuke.timeToLand}`);
	            }
	        }
	        // only gets triggered if a wall is breached
	        this.triggerSafeMode();
	    }
	    roleCall() {
	        let maxDefenders = 0;
	        let maxRefillers = 0;
	        if (this.playerThreat) {
	            maxDefenders = Math.max(this.enemySquads.length, 1);
	            maxRefillers = 1;
	        }
	        this.refillCarts = this.headCount("towerCart", () => this.bodyRatio(0, 2, 1, 1, 4), maxRefillers);
	        let memory = { boosts: [RESOURCE_CATALYZED_KEANIUM_ALKALIDE, RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
	                RESOURCE_CATALYZED_UTRIUM_ACID], allowUnboosted: !this.enhancedBoost };
	        if (this.enhancedBoost) {
	            memory.boosts.push(RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE);
	        }
	        let defenderBody = () => {
	            if (this.enhancedBoost) {
	                let bodyUnit = this.configBody({ [TOUGH]: 1, [ATTACK]: 3, [MOVE]: 1 });
	                let maxUnits = Math.min(this.spawnGroup.maxUnits(bodyUnit), 8);
	                return this.configBody({ [TOUGH]: maxUnits, [ATTACK]: maxUnits * 3, [RANGED_ATTACK]: 1, [MOVE]: maxUnits + 1 });
	            }
	            else {
	                let bodyUnit = this.configBody({ [TOUGH]: 1, [ATTACK]: 5, [MOVE]: 6 });
	                let maxUnits = Math.min(this.spawnGroup.maxUnits(bodyUnit), 4);
	                return this.configBody({ [TOUGH]: maxUnits, [ATTACK]: maxUnits * 5, [MOVE]: maxUnits * 6 });
	            }
	        };
	        this.defenders = this.headCount("defender", defenderBody, maxDefenders, { prespawn: 1, memory: memory });
	    }
	    missionActions() {
	        let order = 0;
	        for (let defender of this.defenders) {
	            this.defenderActions(defender, order);
	            order++;
	        }
	        this.towerTargeting(this.towers);
	        for (let cart of this.refillCarts) {
	            this.towerCartActions(cart);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    towerCartActions(cart) {
	        let hasLoad = this.hasLoad(cart);
	        if (!hasLoad) {
	            this.procureEnergy(cart, this.findLowestEmpty(cart), true);
	            return;
	        }
	        let target = this.findLowestEmpty(cart);
	        if (!target) {
	            cart.memory.hasLoad = cart.carry.energy === cart.carryCapacity;
	            cart.yieldRoad(this.flag);
	            return;
	        }
	        // has target
	        if (!cart.pos.isNearTo(target)) {
	            cart.blindMoveTo(target, { maxRooms: 1 });
	            return;
	        }
	        // is near to target
	        let outcome = cart.transfer(target, RESOURCE_ENERGY);
	        if (outcome === OK && cart.carry.energy >= target.energyCapacity) {
	            target = this.findLowestEmpty(cart, target);
	            if (target && !cart.pos.isNearTo(target)) {
	                cart.blindMoveTo(target, { maxRooms: 1 });
	            }
	        }
	    }
	    findLowestEmpty(cart, pullTarget) {
	        if (!this.empties) {
	            this.empties = _(this.towers)
	                .filter((s) => s.energy < s.energyCapacity)
	                .sortBy("energy")
	                .value();
	        }
	        if (pullTarget) {
	            _.pull(this.empties, pullTarget);
	        }
	        return this.empties[0];
	    }
	    defenderActions(defender, order) {
	        if (this.enemySquads.length === 0) {
	            this.idleNear(defender, this.flag);
	            defender.say("none :(");
	            return; // early
	        }
	        // movement
	        let dangerZone = false;
	        if (this.memory.unleash) {
	            let closest = defender.pos.findClosestByRange(this.room.hostiles);
	            if (defender.pos.isNearTo(closest)) {
	                if (defender.attack(closest) === OK) {
	                    this.attackedCreep = closest;
	                }
	            }
	            else {
	                let outcome = defender.blindMoveTo(closest);
	            }
	        }
	        else {
	            let target = defender.pos.findClosestByRange(this.enemySquads[order % this.enemySquads.length]);
	            if (!target) {
	                console.log("no target");
	                return;
	            }
	            let closestRampart = target.pos.findClosestByRange(this.jonRamparts);
	            if (closestRampart) {
	                let currentRampart = defender.pos.lookForStructure(STRUCTURE_RAMPART);
	                if (currentRampart && currentRampart.pos.getRangeTo(target) <= closestRampart.pos.getRangeTo(target)) {
	                    closestRampart = currentRampart;
	                }
	                _.pull(this.jonRamparts, closestRampart);
	                defender.blindMoveTo(closestRampart, { costCallback: this.preferRamparts });
	            }
	            else {
	                defender.idleOffRoad(this.flag);
	            }
	            // attack
	            if (defender.pos.isNearTo(target)) {
	                if (defender.attack(target) === OK) {
	                    if (!this.attackedCreep || target.hits < this.attackedCreep.hits) {
	                        this.attackedCreep = this.closestHostile;
	                    }
	                }
	            }
	            else {
	                let closeCreep = defender.pos.findInRange(this.room.hostiles, 1)[0];
	                if (closeCreep) {
	                    if (defender.attack(closeCreep) === OK) {
	                        this.attackedCreep = closeCreep;
	                    }
	                }
	            }
	        }
	        // heal
	        if (defender.hits < defender.hitsMax && (!this.healedDefender || defender.hits < this.healedDefender.hits)) {
	            this.healedDefender = defender;
	        }
	    }
	    towerTargeting(towers) {
	        if (!towers || towers.length === 0)
	            return;
	        for (let tower of this.towers) {
	            let target = this.closestHostile;
	            // kill jon snows target
	            if (this.attackedCreep) {
	                target = this.attackedCreep;
	            }
	            // healing as needed
	            if (this.healedDefender) {
	                tower.heal(this.healedDefender);
	            }
	            // the rest attack
	            tower.attack(target);
	        }
	    }
	    triggerSafeMode() {
	        if (this.playerThreat && !this.memory.disableSafeMode) {
	            let wallCount = this.room.findStructures(STRUCTURE_WALL).concat(this.room.findStructures(STRUCTURE_RAMPART)).length;
	            if (this.memory.wallCount && wallCount < this.memory.wallCount) {
	                this.room.controller.activateSafeMode();
	                this.memory.unleash = true;
	            }
	            this.memory.wallCount = wallCount;
	        }
	        else {
	            this.memory.wallCount = undefined;
	        }
	    }
	    closeToWall(creep) {
	        let wall = Game.getObjectById(this.memory.closestWallId);
	        if (wall && creep.pos.isNearTo(wall)) {
	            return true;
	        }
	        else {
	            let walls = this.room.findStructures(STRUCTURE_RAMPART);
	            for (let wall of walls) {
	                if (creep.pos.isNearTo(wall)) {
	                    this.memory.closestWallId = wall.id;
	                    return true;
	                }
	            }
	        }
	    }
	    analyzePlayerThreat() {
	        if (this.towers.length > 0 && this.room.hostiles.length > 0) {
	            this.closestHostile = this.towers[0].pos.findClosestByRange(this.room.hostiles);
	        }
	        let playerCreeps = _.filter(this.room.hostiles, (c) => {
	            return c.owner.username !== "Invader" && c.body.length >= 40 && _.filter(c.body, part => part.boost).length > 0;
	        });
	        this.playerThreat = playerCreeps.length > 1 || this.memory.preSpawn;
	        if (this.playerThreat) {
	            if (!Memory.roomAttacks)
	                Memory.roomAttacks = {};
	            Memory.roomAttacks[playerCreeps[0].owner.username] = Game.time;
	            if (Game.time % 10 === 5) {
	                console.log("DEFENSE: " + playerCreeps.length + " non-ally hostile creep in owned room: " + this.flag.pos.roomName);
	            }
	            for (let creep of this.room.hostiles) {
	                if (creep.partCount(HEAL) > 12) {
	                    this.healers.push(creep);
	                }
	                else {
	                    this.attackers.push(creep);
	                }
	            }
	            this.likelyTowerDrainAttempt = this.attackers.length === 0;
	            this.wallRamparts = _.filter(this.room.findStructures(STRUCTURE_RAMPART), (r) => {
	                return _.filter(r.pos.lookFor(LOOK_STRUCTURES), (s) => {
	                    return s.structureType !== STRUCTURE_ROAD;
	                }).length === 1;
	            });
	            this.jonRamparts = this.wallRamparts.slice(0);
	            // find squads
	            let attackers = _.sortBy(this.attackers, (c) => { this.towers[0].pos.getRangeTo(c); });
	            while (attackers.length > 0) {
	                let squad = attackers[0].pos.findInRange(attackers, 5);
	                let nearbyRamparts = attackers[0].pos.findInRange(this.wallRamparts, 10);
	                if (this.enemySquads.length === 0 || nearbyRamparts.length > 0) {
	                    this.enemySquads.push(squad);
	                }
	                attackers = _.difference(attackers, squad);
	            }
	            this.enhancedBoost = this.room.terminal && this.room.terminal.store[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE] > 1000;
	        }
	    }
	}
	exports.DefenseMission = DefenseMission;


/***/ },
/* 14 */
/*!*****************************************!*\
  !*** ./src/ai/missions/PowerMission.ts ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const notifier_1 = __webpack_require__(/*! ../../notifier */ 6);
	class PowerMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "power");
	    }
	    initMission() {
	        let observer = this.room.findStructures(STRUCTURE_OBSERVER)[0];
	        if (!observer)
	            return;
	        if (!Memory.powerObservers[this.room.name]) {
	            Memory.powerObservers[this.room.name] = this.generateScanData();
	            return;
	        }
	        if (this.memory.currentBank) {
	            this.monitorBank(this.memory.currentBank);
	        }
	        else {
	            this.scanForBanks(observer);
	        }
	    }
	    roleCall() {
	        let max = 0;
	        let distance;
	        if (this.memory.currentBank && !this.memory.currentBank.finishing && !this.memory.currentBank.assisting) {
	            max = 1;
	            distance = this.memory.currentBank.distance;
	        }
	        this.bonnies = this.headCount("bonnie", () => this.configBody({ move: 25, heal: 25 }), max, {
	            prespawn: distance,
	            reservation: { spawns: 2, currentEnergy: 8000 }
	        });
	        this.clydes = this.headCount("clyde", () => this.configBody({ move: 20, attack: 20 }), this.bonnies.length);
	        let unitsPerCart = 1;
	        let maxCarts = 0;
	        if (this.memory.currentBank && this.memory.currentBank.finishing && !this.memory.currentBank.assisting) {
	            let unitsNeeded = Math.ceil(this.memory.currentBank.power / 100);
	            maxCarts = Math.ceil(unitsNeeded / 16);
	            unitsPerCart = Math.ceil(unitsNeeded / maxCarts);
	        }
	        this.carts = this.headCount("powerCart", () => this.workerBody(0, unitsPerCart * 2, unitsPerCart), maxCarts);
	    }
	    missionActions() {
	        for (let i = 0; i < 2; i++) {
	            let clyde = this.clydes[i];
	            if (clyde) {
	                if (!clyde.memory.myBonnieName) {
	                    if (this.clydes.length === this.bonnies.length) {
	                        clyde.memory.myBonnieName = this.bonnies[i].name;
	                    }
	                }
	                else {
	                    this.clydeActions(clyde);
	                    this.checkForAlly(clyde);
	                }
	            }
	            let bonnie = this.bonnies[i];
	            if (bonnie) {
	                if (!bonnie.memory.myClydeName) {
	                    if (this.clydes.length === this.bonnies.length) {
	                        bonnie.memory.myClydeName = this.clydes[i].name;
	                    }
	                }
	                else {
	                    this.bonnieActions(bonnie);
	                }
	            }
	        }
	        if (this.carts) {
	            let order = 0;
	            for (let cart of this.carts) {
	                this.powerCartActions(cart, order);
	                order++;
	            }
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    findAlleysInRange(range) {
	        let roomNames = [];
	        for (let i = this.room.coords.x - range; i <= this.room.coords.x + range; i++) {
	            for (let j = this.room.coords.y - range; j <= this.room.coords.y + range; j++) {
	                let x = i;
	                let xDir = this.room.coords.xDir;
	                let y = j;
	                let yDir = this.room.coords.yDir;
	                if (x < 0) {
	                    x = Math.abs(x) - 1;
	                    xDir = helper_1.helper.negaDirection(xDir);
	                }
	                if (y < 0) {
	                    y = Math.abs(y) - 1;
	                    yDir = helper_1.helper.negaDirection(yDir);
	                }
	                let roomName = xDir + x + yDir + y;
	                if ((x % 10 === 0 || y % 10 === 0) && Game.map.isRoomAvailable(roomName)) {
	                    roomNames.push(roomName);
	                }
	            }
	        }
	        return roomNames;
	    }
	    clydeActions(clyde) {
	        let myBonnie = Game.creeps[clyde.memory.myBonnieName];
	        if (!myBonnie || (!clyde.pos.isNearTo(myBonnie) && !clyde.isNearExit(1))) {
	            clyde.idleOffRoad(this.flag);
	            return;
	        }
	        if (!this.memory.currentBank) {
	            console.log(`POWER: clyde checking out: ${clyde.room.name}`);
	            clyde.suicide();
	            myBonnie.suicide();
	            return;
	        }
	        let bankPos = helper_1.helper.deserializeRoomPosition(this.memory.currentBank.pos);
	        if (clyde.pos.isNearTo(bankPos)) {
	            clyde.memory.inPosition = true;
	            let bank = bankPos.lookForStructure(STRUCTURE_POWER_BANK);
	            if (bank) {
	                if (bank.hits > 600 || clyde.ticksToLive < 5) {
	                    clyde.attack(bank);
	                }
	                else {
	                    // wait for carts
	                    for (let cart of this.carts) {
	                        if (!bankPos.inRangeTo(cart, 5)) {
	                            return;
	                        }
	                    }
	                    clyde.attack(bank);
	                }
	            }
	        }
	        else if (myBonnie.fatigue === 0) {
	            if (this.memory.currentBank.assisting === undefined) {
	                // traveling from spawn
	                this.empire.travelTo(clyde, { pos: bankPos }, { ignoreRoads: true });
	            }
	            else {
	                clyde.moveTo(bankPos, { reusePath: 0 });
	            }
	        }
	    }
	    bonnieActions(bonnie) {
	        let myClyde = Game.creeps[bonnie.memory.myClydeName];
	        if (!myClyde) {
	            return;
	        }
	        if (myClyde.ticksToLive === 1) {
	            bonnie.suicide();
	            return;
	        }
	        if (bonnie.pos.isNearTo(myClyde)) {
	            if (myClyde.memory.inPosition) {
	                bonnie.heal(myClyde);
	            }
	            else {
	                bonnie.move(bonnie.pos.getDirectionTo(myClyde));
	            }
	        }
	        else {
	            bonnie.blindMoveTo(myClyde);
	        }
	    }
	    powerCartActions(cart, order) {
	        if (!cart.carry.power) {
	            if (this.memory.currentBank && this.memory.currentBank.finishing) {
	                this.powerCartApproachBank(cart, order);
	                return;
	            }
	            else {
	                let power = cart.room.find(FIND_DROPPED_RESOURCES, { filter: (r) => r.resourceType === RESOURCE_POWER })[0];
	                if (power) {
	                    if (cart.pos.isNearTo(power)) {
	                        cart.pickup(power);
	                        cart.blindMoveTo(this.room.storage);
	                    }
	                    else {
	                        cart.blindMoveTo(power);
	                    }
	                    return; //  early;
	                }
	            }
	            this.recycleCreep(cart);
	            return; // early
	        }
	        if (cart.pos.isNearTo(this.room.storage)) {
	            cart.transfer(this.room.storage, RESOURCE_POWER);
	        }
	        else {
	            // traveling to storage
	            this.empire.travelTo(cart, this.room.storage);
	        }
	    }
	    powerCartApproachBank(cart, order) {
	        let bankPos = helper_1.helper.deserializeRoomPosition(this.memory.currentBank.pos);
	        if (!cart.pos.inRangeTo(bankPos, 5)) {
	            // traveling from spawn
	            this.empire.travelTo(cart, { pos: bankPos }, { ignoreRoads: true });
	        }
	        else {
	            if (!cart.memory.inPosition) {
	                if (bankPos.openAdjacentSpots().length > 0) {
	                    if (cart.pos.isNearTo(bankPos)) {
	                        cart.memory.inPosition = true;
	                    }
	                    else {
	                        cart.blindMoveTo(bankPos);
	                    }
	                }
	                else if (order > 0) {
	                    if (cart.pos.isNearTo(this.carts[order - 1])) {
	                        cart.memory.inPosition = true;
	                    }
	                    else {
	                        cart.blindMoveTo(this.carts[order - 1]);
	                    }
	                }
	                else {
	                    if (cart.pos.isNearTo(this.clydes[0])) {
	                        cart.memory.inPosition = true;
	                    }
	                    else {
	                        cart.blindMoveTo(this.clydes[0]);
	                    }
	                }
	            }
	        }
	    }
	    checkForAlly(clyde) {
	        if (clyde.isNearExit(1) || !this.memory.currentBank || !this.memory.currentBank.assisting !== undefined)
	            return;
	        let bank = clyde.room.findStructures(STRUCTURE_POWER_BANK)[0];
	        if (!bank)
	            return;
	        let allyClyde = bank.room.find(FIND_HOSTILE_CREEPS, {
	            filter: (c) => c.partCount(ATTACK) === 20 && constants_1.ALLIES[c.owner.username] && !c.isNearExit(1)
	        })[0];
	        if (!allyClyde) {
	            return;
	        }
	        if (clyde.memory.play) {
	            let myPlay = clyde.memory.play;
	            let allyPlay = allyClyde.saying;
	            if (!allyPlay || allyPlay === myPlay) {
	                console.log("POWER: we had a tie!");
	                clyde.say("tie!", true);
	                clyde.memory.play = undefined;
	            }
	            else if ((allyPlay === "rock" && myPlay === "scissors") || (allyPlay === "scissors" && myPlay === "paper") ||
	                (allyPlay === "paper" && myPlay === "rock")) {
	                if (bank.pos.openAdjacentSpots(true).length === 1) {
	                    let bonnie = Game.creeps[clyde.memory.myBonnieName];
	                    bonnie.suicide();
	                    clyde.suicide();
	                }
	                this.memory.currentBank.assisting = true;
	                clyde.say("damn", true);
	                notifier_1.notifier.add(`"POWER: ally gets the power! ${bank.room.name}`);
	            }
	            else {
	                this.memory.currentBank.assisting = false;
	                clyde.say("yay!", true);
	                notifier_1.notifier.add(`"POWER: I get the power! ${bank.room.name}`);
	            }
	        }
	        else {
	            console.log("POWER: ally found in", clyde.room.name, "playing a game to find out who gets power");
	            let random = Math.floor(Math.random() * 3);
	            let play;
	            if (random === 0) {
	                play = "rock";
	            }
	            else if (random === 1) {
	                play = "paper";
	            }
	            else if (random === 2) {
	                play = "scissors";
	            }
	            clyde.memory.play = play;
	            clyde.say(play, true);
	        }
	    }
	    generateScanData() {
	        if (Game.cpu.bucket < 10000)
	            return;
	        let scanData = {};
	        let spawn = this.spawnGroup.spawns[0];
	        let possibleRoomNames = this.findAlleysInRange(5);
	        for (let roomName of possibleRoomNames) {
	            let position = helper_1.helper.pathablePosition(roomName);
	            let ret = this.empire.findTravelPath(spawn, { pos: position });
	            if (ret.incomplete) {
	                notifier_1.notifier.add(`POWER: incomplete path generating scanData (op: ${this.opName}, roomName: ${roomName})`);
	                continue;
	            }
	            let currentObserver = _.find(Memory.powerObservers, (value) => value[roomName]);
	            let distance = ret.path.length;
	            if (distance > 250)
	                continue;
	            if (currentObserver) {
	                if (currentObserver[roomName] > distance) {
	                    console.log(`POWER: found better distance for ${roomName} at ${this.opName}, ` +
	                        `${currentObserver[roomName]} => ${distance}`);
	                    delete currentObserver[roomName];
	                }
	                else {
	                    continue;
	                }
	            }
	            scanData[roomName] = distance;
	        }
	        console.log(`POWER: found ${Object.keys(scanData).length} rooms for power scan in ${this.opName}`);
	        return scanData;
	    }
	    monitorBank(currentBank) {
	        let room = Game.rooms[currentBank.pos.roomName];
	        if (room) {
	            let bank = room.findStructures(STRUCTURE_POWER_BANK)[0];
	            if (bank) {
	                currentBank.hits = bank.hits;
	                if (!currentBank.finishing && bank.hits < 500000) {
	                    let clyde = bank.pos.findInRange(_.filter(room.find(FIND_MY_CREEPS), (c) => c.partCount(ATTACK) === 20), 1)[0];
	                    if (clyde && bank.hits < clyde.ticksToLive * 600) {
	                        console.log(`POWER: last wave needed for bank has arrived, ${this.opName}`);
	                        currentBank.finishing = true;
	                    }
	                }
	            }
	            else {
	                this.memory.currentBank = undefined;
	            }
	        }
	        if (Game.time > currentBank.timeout) {
	            notifier_1.notifier.add(`POWER: bank timed out ${JSON.stringify(currentBank)}`);
	            this.memory.currentBank = undefined;
	        }
	    }
	    scanForBanks(observer) {
	        if (observer.observation && observer.observation.purpose === this.name) {
	            let room = observer.observation.room;
	            let bank = observer.observation.room.findStructures(STRUCTURE_POWER_BANK)[0];
	            if (bank && bank.ticksToDecay > 4500 && room.findStructures(STRUCTURE_WALL).length === 0
	                && bank.power >= Memory.playerConfig.powerMinimum) {
	                console.log("\\o/ \\o/ \\o/", bank.power, "power found at", room, "\\o/ \\o/ \\o/");
	                this.memory.currentBank = {
	                    pos: bank.pos,
	                    hits: bank.hits,
	                    power: bank.power,
	                    distance: Memory.powerObservers[this.room.name][room.name],
	                    timeout: Game.time + bank.ticksToDecay,
	                };
	                return;
	            }
	        }
	        if (this.spawnGroup.averageAvailability < .5 || Math.random() > .2) {
	            return;
	        }
	        let scanData = Memory.powerObservers[this.room.name];
	        if (this.memory.scanIndex >= Object.keys(scanData).length) {
	            this.memory.scanIndex = 0;
	        }
	        let roomName = Object.keys(scanData)[this.memory.scanIndex++];
	        observer.observeRoom(roomName, this.name);
	    }
	}
	exports.PowerMission = PowerMission;


/***/ },
/* 15 */
/*!***************************************************!*\
  !*** ./src/ai/missions/TerminalNetworkMission.ts ***!
  \***************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	class TerminalNetworkMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "network");
	    }
	    initMission() {
	        this.terminal = this.room.terminal;
	        this.storage = this.room.storage;
	    }
	    roleCall() {
	    }
	    missionActions() {
	        this.sellOverstock();
	        this.checkOverstock();
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    sellOverstock() {
	        if (Game.time % 100 !== 1)
	            return;
	        for (let mineralType of constants_1.MINERALS_RAW) {
	            if (this.storage.store[mineralType] >= constants_1.MINERAL_STORAGE_TARGET[mineralType]
	                && this.storage.room.terminal.store[mineralType] >= constants_1.RESERVE_AMOUNT) {
	                console.log("TRADE: have too much", mineralType, "in", this.storage.room, this.storage.store[mineralType]);
	                this.empire.sellExcess(this.room, mineralType, constants_1.RESERVE_AMOUNT);
	            }
	        }
	        if (_.sum(this.storage.store) >= 940000) {
	            console.log("TRADE: have too much energy in", this.storage.room, this.storage.store.energy);
	            this.empire.sellExcess(this.room, RESOURCE_ENERGY, constants_1.RESERVE_AMOUNT);
	        }
	    }
	    checkOverstock() {
	        if (Game.time % 100 !== 0 || _.sum(this.terminal.store) < 250000)
	            return;
	        let mostStockedAmount = 0;
	        let mostStockedResource;
	        for (let resourceType in this.terminal.store) {
	            if (resourceType === RESOURCE_ENERGY)
	                continue;
	            if (this.terminal.store[resourceType] < mostStockedAmount)
	                continue;
	            mostStockedAmount = this.terminal.store[resourceType];
	            mostStockedResource = resourceType;
	        }
	        let leastStockedTerminal = _.sortBy(this.empire.terminals, (t) => _.sum(t.store))[0];
	        this.terminal.send(mostStockedResource, constants_1.RESERVE_AMOUNT, leastStockedTerminal.room.name);
	        console.log("NETWORK: balancing terminal capacity, sending", constants_1.RESERVE_AMOUNT, mostStockedResource, "from", this.room.name, "to", leastStockedTerminal.room.name);
	    }
	}
	exports.TerminalNetworkMission = TerminalNetworkMission;


/***/ },
/* 16 */
/*!****************************************!*\
  !*** ./src/ai/missions/IgorMission.ts ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class IgorMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "igor");
	    }
	    initMission() {
	        this.labs = this.room.findStructures(STRUCTURE_LAB);
	        this.terminal = this.room.terminal;
	        this.storage = this.room.storage;
	        this.reagentLabs = this.findReagentLabs();
	        this.productLabs = this.findProductLabs();
	        this.labProcess = this.findLabProcess();
	        if (this.labProcess) {
	            let target = this.labProcess.targetShortage.mineralType;
	            if (!Game.cache.labProcesses[target])
	                Game.cache.labProcesses[target] = 0;
	            Game.cache.labProcesses[target]++;
	        }
	        this.powerSpawn = this.room.findStructures(STRUCTURE_POWER_SPAWN)[0];
	        this.findIgorIdlePosition();
	    }
	    roleCall() {
	        this.igors = this.headCount("igor", () => this.workerBody(0, 20, 10), 1, {
	            prespawn: 50,
	            memory: { idlePosition: this.memory.idlePosition }
	        });
	        if (this.igors.length === 0) {
	            this.memory.command = undefined;
	        }
	    }
	    missionActions() {
	        for (let i = 0; i < this.igors.length; i++) {
	            let igor = this.igors[i];
	            this.igorActions(igor, i);
	        }
	        if (this.labProcess) {
	            this.doSynthesis();
	        }
	        if (this.powerSpawn && this.powerSpawn.energy > 50 && this.powerSpawn.power > 0
	            && this.storage.store.energy > constants_1.POWER_PROCESS_THRESHOLD) {
	            this.powerSpawn.processPower();
	        }
	        this.checkBoostRequests();
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        if (!this.memory.labCount)
	            this.memory.labCount = this.labs.length;
	        if (this.memory.labCount !== this.labs.length) {
	            this.memory.labCount = this.labs.length;
	            this.memory.reagentLabIds = undefined;
	            this.memory.productLabIds = undefined;
	        }
	        if (this.memory.idlePosition) {
	            let position = helper_1.helper.deserializeRoomPosition(this.memory.idlePosition);
	            if (position.lookFor(LOOK_STRUCTURES).length > 0) {
	                this.memory.idlePosition = undefined;
	            }
	        }
	    }
	    igorActions(igor, order) {
	        if (order > 0) {
	            igor.blindMoveTo(this.flag);
	            return;
	        }
	        let command = this.accessCommand(igor);
	        if (!command) {
	            if (_.sum(igor.carry) > 0) {
	                console.log("igor in", this.opName, "is holding resources without a command, putting them in terminal");
	                if (igor.pos.isNearTo(this.terminal)) {
	                    igor.transferEverything(this.terminal);
	                }
	                else {
	                    igor.blindMoveTo(this.terminal);
	                }
	                return;
	            }
	            igor.idleOffRoad(this.flag);
	            return;
	        }
	        if (_.sum(igor.carry) === 0) {
	            let origin = Game.getObjectById(command.origin);
	            if (igor.pos.isNearTo(origin)) {
	                if (origin instanceof StructureTerminal) {
	                    if (!origin.store[command.resourceType]) {
	                        console.log(`IGOR: I can't find that resource in terminal, opName: ${this.opName}`);
	                        this.memory.command = undefined;
	                    }
	                }
	                igor.withdraw(origin, command.resourceType, command.amount);
	                let destination = Game.getObjectById(command.destination);
	                if (!igor.pos.isNearTo(destination)) {
	                    igor.blindMoveTo(destination);
	                }
	            }
	            else {
	                igor.blindMoveTo(origin);
	            }
	            return; // early
	        }
	        let destination = Game.getObjectById(command.destination);
	        if (igor.pos.isNearTo(destination)) {
	            let outcome = igor.transfer(destination, command.resourceType, command.amount);
	            if (outcome === OK && command.reduceLoad && this.labProcess) {
	                this.labProcess.reagentLoads[command.resourceType] -= command.amount;
	            }
	            this.memory.command = undefined;
	        }
	        else {
	            igor.blindMoveTo(destination);
	        }
	    }
	    findCommand() {
	        let terminal = this.room.terminal;
	        let storage = this.room.storage;
	        let energyInStorage = storage.store.energy;
	        let energyInTerminal = terminal.store.energy;
	        let command = this.checkPullFlags();
	        if (command)
	            return command;
	        command = this.checkReagentLabs();
	        if (command)
	            return command;
	        command = this.checkProductLabs();
	        if (command)
	            return command;
	        // take energy out of terminal
	        if (energyInTerminal > 30000 + constants_1.IGOR_CAPACITY) {
	            return { origin: terminal.id, destination: storage.id, resourceType: RESOURCE_ENERGY };
	        }
	        // load terminal
	        if (energyInStorage > 50000 && energyInTerminal < 30000) {
	            return { origin: storage.id, destination: terminal.id, resourceType: RESOURCE_ENERGY };
	        }
	        // TODO: make individual check-functions for each of these commands like i've done with labs
	        // load powerSpawn
	        let powerSpawn = this.room.findStructures(STRUCTURE_POWER_SPAWN)[0];
	        if (powerSpawn) {
	            // load energy
	            if (powerSpawn.energy < powerSpawn.energyCapacity - constants_1.IGOR_CAPACITY) {
	                return { origin: storage.id, destination: powerSpawn.id, resourceType: RESOURCE_ENERGY };
	            }
	            else if (powerSpawn.power === 0 && terminal.store[RESOURCE_POWER] >= 100) {
	                return { origin: terminal.id, destination: powerSpawn.id, resourceType: RESOURCE_POWER, amount: 100 };
	            }
	        }
	        // push local minerals
	        for (let mineralType in storage.store) {
	            if (mineralType !== RESOURCE_ENERGY) {
	                if (!terminal.store[mineralType] || terminal.store[mineralType] < constants_1.RESERVE_AMOUNT * 2) {
	                    return { origin: storage.id, destination: terminal.id, resourceType: mineralType };
	                }
	            }
	        }
	        // load nukers
	        let nuker = this.room.findStructures(STRUCTURE_NUKER)[0];
	        if (nuker) {
	            if (nuker.energy < nuker.energyCapacity && storage.store.energy > 100000) {
	                return { origin: storage.id, destination: nuker.id, resourceType: RESOURCE_ENERGY };
	            }
	            else if (nuker.ghodium < nuker.ghodiumCapacity && terminal.store[RESOURCE_GHODIUM]) {
	                return { origin: terminal.id, destination: nuker.id, resourceType: RESOURCE_GHODIUM };
	            }
	        }
	    }
	    accessCommand(igor) {
	        if (!this.memory.command && igor.ticksToLive < 40) {
	            igor.suicide();
	            return;
	        }
	        if (!this.memory.lastCommandTick)
	            this.memory.lastCommandTick = Game.time - 10;
	        if (!this.memory.command && Game.time > this.memory.lastCommandTick + 10) {
	            if (_.sum(igor.carry) === 0) {
	                this.memory.command = this.findCommand();
	            }
	            else {
	                console.log("IGOR: can't take new command in:", this.opName, "because I'm holding something");
	            }
	            if (!this.memory.command) {
	                this.memory.lastCommandTick = Game.time;
	            }
	        }
	        return this.memory.command;
	    }
	    checkPullFlags() {
	        if (!this.productLabs)
	            return;
	        for (let lab of this.productLabs) {
	            if (this.terminal.store.energy >= constants_1.IGOR_CAPACITY && lab.energy < constants_1.IGOR_CAPACITY) {
	                // restore boosting energy to lab
	                return { origin: this.terminal.id, destination: lab.id, resourceType: RESOURCE_ENERGY };
	            }
	            let flag = lab.pos.lookFor(LOOK_FLAGS)[0];
	            if (!flag)
	                continue;
	            let mineralType = flag.name.substring(flag.name.indexOf("_") + 1);
	            if (!_.includes(constants_1.PRODUCT_LIST, mineralType)) {
	                console.log("ERROR: invalid lab request:", flag.name);
	                return; // early
	            }
	            if (lab.mineralType && lab.mineralType !== mineralType) {
	                // empty wrong mineral type
	                return { origin: lab.id, destination: this.terminal.id, resourceType: lab.mineralType };
	            }
	            else if (LAB_MINERAL_CAPACITY - lab.mineralAmount >= constants_1.IGOR_CAPACITY && this.terminal.store[mineralType] >= constants_1.IGOR_CAPACITY) {
	                // bring mineral to lab when amount is below igor capacity
	                return { origin: this.terminal.id, destination: lab.id, resourceType: mineralType };
	            }
	        }
	    }
	    checkReagentLabs() {
	        if (!this.reagentLabs || this.reagentLabs.length < 2)
	            return; // early
	        for (let i = 0; i < 2; i++) {
	            let lab = this.reagentLabs[i];
	            let mineralType = this.labProcess ? Object.keys(this.labProcess.reagentLoads)[i] : undefined;
	            if (!mineralType && lab.mineralAmount > 0) {
	                // clear labs when there is no current process
	                return { origin: lab.id, destination: this.terminal.id, resourceType: lab.mineralType };
	            }
	            else if (mineralType && lab.mineralType && lab.mineralType !== mineralType) {
	                // clear labs when there is mismatch with current process
	                return { origin: lab.id, destination: this.terminal.id, resourceType: lab.mineralType };
	            }
	            else if (mineralType) {
	                let amountNeeded = Math.min(this.labProcess.reagentLoads[mineralType], constants_1.IGOR_CAPACITY);
	                if (amountNeeded > 0 && this.terminal.store[mineralType] >= amountNeeded
	                    && lab.mineralAmount <= LAB_MINERAL_CAPACITY - constants_1.IGOR_CAPACITY) {
	                    // bring mineral to lab when amount drops below amountNeeded
	                    return { origin: this.terminal.id, destination: lab.id, resourceType: mineralType, amount: amountNeeded, reduceLoad: true };
	                }
	            }
	        }
	    }
	    checkProductLabs() {
	        if (!this.productLabs)
	            return; // early
	        for (let lab of this.productLabs) {
	            if (this.terminal.store.energy >= constants_1.IGOR_CAPACITY && lab.energy < constants_1.IGOR_CAPACITY) {
	                // restore boosting energy to lab
	                return { origin: this.terminal.id, destination: lab.id, resourceType: RESOURCE_ENERGY };
	            }
	            let flag = lab.pos.lookFor(LOOK_FLAGS)[0];
	            if (flag)
	                continue;
	            if (lab.mineralAmount > 0 && (!this.labProcess || lab.mineralType !== this.labProcess.currentShortage.mineralType)) {
	                // empty wrong mineral type or clear lab when no process
	                return { origin: lab.id, destination: this.terminal.id, resourceType: lab.mineralType };
	            }
	            else if (this.labProcess && lab.mineralAmount >= constants_1.IGOR_CAPACITY) {
	                // store product in terminal
	                return { origin: lab.id, destination: this.terminal.id, resourceType: lab.mineralType };
	            }
	        }
	    }
	    findReagentLabs() {
	        if (this.memory.reagentLabIds) {
	            let labs = _.map(this.memory.reagentLabIds, (id) => {
	                let lab = Game.getObjectById(id);
	                if (lab) {
	                    return lab;
	                }
	                else {
	                    this.memory.reagentLabIds = undefined;
	                }
	            });
	            if (labs.length === 2) {
	                return labs;
	            }
	            else {
	                this.memory.reagentLabIds = undefined;
	            }
	        }
	        if (Game.time % 1000 !== 2)
	            return; // early
	        let labs = this.room.findStructures(STRUCTURE_LAB);
	        if (labs.length < 3)
	            return; // early
	        let reagentLabs = [];
	        for (let lab of labs) {
	            if (reagentLabs.length === 2)
	                break;
	            let outOfRange = false;
	            for (let otherLab of labs) {
	                if (lab.pos.inRangeTo(otherLab, 2))
	                    continue;
	                outOfRange = true;
	                break;
	            }
	            if (!outOfRange)
	                reagentLabs.push(lab);
	        }
	        if (reagentLabs.length === 2) {
	            this.memory.reagentLabIds = _.map(reagentLabs, (lab) => lab.id);
	            this.memory.productLabIds = undefined;
	            return reagentLabs;
	        }
	    }
	    findProductLabs() {
	        if (this.memory.productLabIds) {
	            let labs = _.map(this.memory.productLabIds, (id) => {
	                let lab = Game.getObjectById(id);
	                if (lab) {
	                    return lab;
	                }
	                else {
	                    this.memory.productLabIds = undefined;
	                }
	            });
	            if (labs.length > 0) {
	                return labs;
	            }
	            else {
	                this.memory.productLabIds = undefined;
	            }
	        }
	        let labs = this.room.findStructures(STRUCTURE_LAB);
	        if (labs.length === 0)
	            return; // early
	        if (this.reagentLabs) {
	            for (let reagentLab of this.reagentLabs) {
	                labs = _.pull(labs, reagentLab);
	            }
	        }
	        this.memory.productLabIds = _.map(labs, (lab) => lab.id);
	        return labs;
	    }
	    doSynthesis() {
	        for (let i = 0; i < this.productLabs.length; i++) {
	            // so that they don't all activate on the same tick and make bucket sad
	            if (Game.time % 10 !== i)
	                continue;
	            let lab = this.productLabs[i];
	            if (lab.pos.lookFor(LOOK_FLAGS).length > 0)
	                continue;
	            if (!lab.mineralType || lab.mineralType === this.labProcess.currentShortage.mineralType) {
	                let outcome = lab.runReaction(this.reagentLabs[0], this.reagentLabs[1]);
	                if (outcome === OK) {
	                    Game.cache.activeLabCount++;
	                }
	            }
	        }
	    }
	    findLabProcess() {
	        if (!this.reagentLabs)
	            return;
	        if (this.memory.labProcess) {
	            let process = this.memory.labProcess;
	            let processFinished = this.checkProcessFinished(process);
	            if (processFinished) {
	                console.log("IGOR:", this.opName, "has finished with", process.currentShortage.mineralType);
	                this.memory.labProcess = undefined;
	                return this.findLabProcess();
	            }
	            let progress = this.checkProgress(process);
	            if (!progress) {
	                console.log("IGOR:", this.opName, "made no progress with", process.currentShortage.mineralType);
	                this.memory.labProcess = undefined;
	                return this.findLabProcess();
	            }
	            return process;
	        }
	        // avoid checking for new process every tick
	        if (!this.memory.checkProcessTick)
	            this.memory.checkProcessTick = Game.time - 100;
	        if (Game.time < this.memory.checkProcessTick + 100)
	            return; // early
	        this.memory.labProcess = this.findNewProcess();
	    }
	    checkProcessFinished(process) {
	        for (let i = 0; i < 2; i++) {
	            let amountInLab = this.reagentLabs[i].mineralAmount;
	            let load = process.reagentLoads[Object.keys(process.reagentLoads)[i]];
	            if (amountInLab === 0 && load === 0) {
	                return true;
	            }
	        }
	        return false;
	    }
	    checkProgress(process) {
	        if (Game.time % 1000 !== 2)
	            return true;
	        let loadStatus = 0;
	        for (let resourcetype in process.reagentLoads) {
	            loadStatus += process.reagentLoads[resourcetype];
	        }
	        if (loadStatus !== process.loadProgress) {
	            process.loadProgress = loadStatus;
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	    findNewProcess() {
	        let store = this.gatherInventory();
	        for (let compound of constants_1.PRODUCT_LIST) {
	            if (store[compound] >= constants_1.PRODUCTION_AMOUNT)
	                continue;
	            return this.generateProcess({ mineralType: compound, amount: constants_1.PRODUCTION_AMOUNT + constants_1.IGOR_CAPACITY - (this.terminal.store[compound] || 0) });
	        }
	        if (store[RESOURCE_CATALYZED_GHODIUM_ACID] < constants_1.PRODUCTION_AMOUNT + 5000) {
	            return this.generateProcess({ mineralType: RESOURCE_CATALYZED_GHODIUM_ACID, amount: 5000 });
	        }
	    }
	    recursiveShortageCheck(shortage, fullAmount = false) {
	        // gather amounts of compounds in terminal and labs
	        let store = this.gatherInventory();
	        if (store[shortage.mineralType] === undefined)
	            store[shortage.mineralType] = 0;
	        let amountNeeded = shortage.amount - Math.floor(store[shortage.mineralType] / 10) * 10;
	        if (fullAmount) {
	            amountNeeded = shortage.amount;
	        }
	        if (amountNeeded > 0) {
	            // remove raw minerals from list, no need to make those
	            let reagents = _.filter(constants_1.REAGENT_LIST[shortage.mineralType], (mineralType) => !_.includes(constants_1.MINERALS_RAW, mineralType));
	            let shortageFound;
	            for (let reagent of reagents) {
	                shortageFound = this.recursiveShortageCheck({ mineralType: reagent, amount: amountNeeded });
	                if (shortageFound)
	                    break;
	            }
	            if (shortageFound) {
	                return shortageFound;
	            }
	            else {
	                return { mineralType: shortage.mineralType, amount: amountNeeded };
	            }
	        }
	    }
	    gatherInventory() {
	        let inventory = {};
	        for (let mineralType in this.terminal.store) {
	            if (!this.terminal.store.hasOwnProperty(mineralType))
	                continue;
	            if (inventory[mineralType] === undefined)
	                inventory[mineralType] = 0;
	            inventory[mineralType] += this.terminal.store[mineralType];
	        }
	        for (let lab of this.productLabs) {
	            if (lab.mineralAmount > 0) {
	                if (inventory[lab.mineralType] === undefined)
	                    inventory[lab.mineralType] = 0;
	                inventory[lab.mineralType] += lab.mineralAmount;
	            }
	        }
	        /* shouldn't need to check igors
	        for (let igor of this.igors) {
	            for (let resourceType in igor.carry) {
	                inventory[resourceType] += igor.carry[resourceType];
	            }
	        }
	        */
	        return inventory;
	    }
	    generateProcess(targetShortage) {
	        let currentShortage = this.recursiveShortageCheck(targetShortage, true);
	        if (currentShortage === undefined) {
	            console.log("IGOR: error finding current shortage in", this.opName);
	            return;
	        }
	        let reagentLoads = {};
	        for (let mineralType of constants_1.REAGENT_LIST[currentShortage.mineralType]) {
	            reagentLoads[mineralType] = currentShortage.amount;
	        }
	        let loadProgress = currentShortage.amount * 2;
	        return {
	            targetShortage: targetShortage,
	            currentShortage: currentShortage,
	            reagentLoads: reagentLoads,
	            loadProgress: loadProgress
	        };
	    }
	    checkBoostRequests() {
	        if (!this.room.memory.boostRequests)
	            this.room.memory.boostRequests = {};
	        let requests = this.room.memory.boostRequests;
	        for (let resourceType in requests) {
	            let request = requests[resourceType];
	            for (let id of request.requesterIds) {
	                let creep = Game.getObjectById(id);
	                if (!creep) {
	                    request.requesterIds = _.pull(request.requesterIds, id);
	                }
	            }
	            let flag = Game.flags[request.flagName];
	            if (request.requesterIds.length === 0 && flag) {
	                console.log("IGOR: removing boost flag:", flag.name);
	                flag.remove();
	                requests[resourceType] = undefined;
	            }
	            if (request.requesterIds.length > 0 && !flag) {
	                request.flagName = this.placePullFlag(resourceType);
	            }
	        }
	    }
	    placePullFlag(resourceType) {
	        let existingFlag = Game.flags[this.opName + "_" + resourceType];
	        if (existingFlag)
	            return existingFlag.name;
	        let labs = _.filter(this.productLabs, (l) => l.pos.lookFor(LOOK_FLAGS).length === 0);
	        if (labs.length === 0)
	            return;
	        let closestToSpawn = this.spawnGroup.spawns[0].pos.findClosestByRange(labs);
	        if (this.productLabs.length > 1) {
	            this.productLabs = _.pull(this.productLabs, closestToSpawn);
	        }
	        let outcome = closestToSpawn.pos.createFlag(this.opName + "_" + resourceType);
	        if (_.isString(outcome)) {
	            console.log("IGOR: placing boost flag:", outcome);
	            return outcome;
	        }
	    }
	    findIgorIdlePosition() {
	        if (!this.memory.idlePosition && Game.time % 1000 === 0) {
	            // start with the position that would be available following the default spec
	            let positions = [this.terminal.pos.getPositionAtDirection(this.terminal.pos.getDirectionTo(this.storage))];
	            for (let i = 1; i <= 8; i++) {
	                // add other positions around storage
	                positions.push(this.storage.pos.getPositionAtDirection(i));
	            }
	            for (let position of positions) {
	                // check each position for valid conditions
	                if (position.lookFor(LOOK_STRUCTURES).length === 0 && position.isPassible(true) && position.isNearTo(this.storage)) {
	                    console.log(`IGOR: found a good idle position in ${this.opName}: ${position}`);
	                    this.memory.idlePosition = position;
	                    break;
	                }
	            }
	            if (!this.memory.idlePosition) {
	                console.log(`IGOR: terminal placement is unoptimal at ${this.opName}, consider moving storage or terminal`);
	            }
	        }
	    }
	}
	exports.IgorMission = IgorMission;


/***/ },
/* 17 */
/*!**********************************************!*\
  !*** ./src/ai/missions/LinkMiningMission.ts ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class LinkMiningMission extends Mission_1.Mission {
	    /**
	     * Sends a miner to a source with a link, energy transfer is managed by LinkNetworkMission
	     * @param operation
	     * @param name
	     * @param source
	     * @param link
	     */
	    constructor(operation, name, source, link) {
	        super(operation, name);
	        this.source = source;
	        this.link = link;
	    }
	    initMission() {
	    }
	    roleCall() {
	        this.linkMiners = this.headCount(this.name, () => this.workerBody(5, 4, 5), 1);
	    }
	    missionActions() {
	        for (let miner of this.linkMiners) {
	            this.minerActions(miner);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    minerActions(miner) {
	        if (!miner.memory.inPosition) {
	            this.moveToPosition(miner);
	            return; // early
	        }
	        miner.memory.donatesEnergy = true;
	        miner.memory.scavanger = RESOURCE_ENERGY;
	        miner.harvest(this.source);
	        if (miner.carry.energy === miner.carryCapacity) {
	            miner.transfer(this.link, RESOURCE_ENERGY);
	        }
	    }
	    /**
	     * Picks a position between the source and the link and moves there, robbing and killing any miner at that position
	     * @param miner
	     */
	    moveToPosition(miner) {
	        for (let i = 1; i <= 8; i++) {
	            let position = this.source.pos.getPositionAtDirection(i);
	            if (!position.isPassible(true))
	                continue;
	            if (!position.isNearTo(this.link))
	                continue;
	            if (position.lookForStructure(STRUCTURE_ROAD))
	                continue;
	            if (miner.pos.inRangeTo(position, 0)) {
	                miner.memory.inPosition = true;
	            }
	            else {
	                miner.moveItOrLoseIt(position, "miner");
	            }
	            return; // early
	        }
	        console.log("couldn't find valid position for", miner.name, "in ", miner.room.name);
	    }
	}
	exports.LinkMiningMission = LinkMiningMission;


/***/ },
/* 18 */
/*!******************************************!*\
  !*** ./src/ai/missions/MiningMission.ts ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const notifier_1 = __webpack_require__(/*! ../../notifier */ 6);
	class MiningMission extends Mission_1.Mission {
	    /**
	     * General-purpose energy mining, uses a nested TransportMission to transfer energy
	     * @param operation
	     * @param name
	     * @param source
	     * @param remoteSpawning
	     */
	    constructor(operation, name, source, remoteSpawning = false) {
	        super(operation, name);
	        this.source = source;
	        this.remoteSpawning = remoteSpawning;
	    }
	    // return-early
	    initMission() {
	        if (!this.hasVision)
	            return;
	        this.storage = this.findMinerStorage();
	        if (!this.memory.positionsAvailable) {
	            this.memory.positionsAvailable = this.source.pos.openAdjacentSpots(true).length;
	        }
	        this.positionsAvailable = this.memory.positionsAvailable;
	        this.container = this.source.findMemoStructure(STRUCTURE_CONTAINER, 1);
	        if (!this.container) {
	            this.placeContainer();
	        }
	        this.minersNeeded = 1;
	        if (this.spawnGroup.maxSpawnEnergy < 1050 && !this.remoteSpawning) {
	            this.minersNeeded = 2;
	            if (this.spawnGroup.maxSpawnEnergy < 450) {
	                this.minersNeeded = 3;
	            }
	        }
	    }
	    roleCall() {
	        // below a certain amount of maxSpawnEnergy, BootstrapMission will harvest energy
	        let maxMiners = Math.min(this.minersNeeded, this.positionsAvailable);
	        let getMinerBody = () => {
	            return this.getMinerBody();
	        };
	        this.miners = this.headCount(this.name, getMinerBody, maxMiners, { prespawn: this.memory.prespawn });
	        if (this.memory.roadRepairIds) {
	            this.paver = this.spawnPaver();
	        }
	        if (!this.storage)
	            return;
	        this.analysis = this.miningTransportAnalysis();
	        let maxCarts = _.sum(this.storage.store) < 950000 ? this.analysis.cartsNeeded : 0;
	        if (!this.container) {
	            maxCarts = 0;
	        }
	        let memory = { scavanger: RESOURCE_ENERGY };
	        this.minerCarts = this.headCount(this.name + "cart", () => this.workerBody(0, this.analysis.carryCount, this.analysis.moveCount), maxCarts, { prespawn: this.analysis.distance, memory: memory });
	    }
	    missionActions() {
	        let order = 0;
	        for (let miner of this.miners) {
	            this.minerActions(miner, order);
	            order++;
	        }
	        if (this.minerCarts) {
	            for (let cart of this.minerCarts) {
	                this.cartActions(cart);
	            }
	        }
	        if (this.paver) {
	            this.paverActions(this.paver);
	        }
	        if (this.container) {
	            let startingPosition = this.storage;
	            if (!startingPosition) {
	                startingPosition = this.room.find(FIND_MY_SPAWNS)[0];
	            }
	            if (!startingPosition) {
	                startingPosition = this.room.find(FIND_CONSTRUCTION_SITES, { filter: ((s) => s.structureType === STRUCTURE_SPAWN) })[0];
	            }
	            if (startingPosition) {
	                let distance = this.pavePath(startingPosition, this.container, 2);
	                if (distance) {
	                    this.memory.distanceToStorage = distance;
	                }
	            }
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        this.memory.transportAnalysis = undefined;
	    }
	    minerActions(miner, order) {
	        let fleeing = miner.fleeHostiles();
	        if (fleeing) {
	            if (miner.carry.energy > 0) {
	                miner.drop(RESOURCE_ENERGY);
	            }
	            return;
	        }
	        if (!this.hasVision) {
	            miner.blindMoveTo(this.flag);
	            return; // early
	        }
	        if (!this.container) {
	            this.buildContainer(miner, order);
	            return;
	        }
	        if (order === 0) {
	            this.leadMinerActions(miner);
	        }
	        else {
	            this.backupMinerActions(miner);
	        }
	        if (!miner.memory.setDistance) {
	            if (order === this.miners.length - 1 && miner.pos.isNearTo(this.source)) {
	                miner.memory.setDistance = true;
	                if (miner.ticksToLive > 1000) {
	                    this.setPrespawn(miner);
	                }
	            }
	        }
	    }
	    leadMinerActions(miner) {
	        if (miner.pos.inRangeTo(this.container, 0)) {
	            if (this.container.hits < this.container.hitsMax * .90 && miner.carry.energy >= 20) {
	                miner.repair(this.container);
	            }
	            else if (this.container.store.energy < this.container.storeCapacity) {
	                miner.harvest(this.source);
	            }
	        }
	        else {
	            if (this.minersNeeded === 1) {
	                miner.moveItOrLoseIt(this.container.pos);
	            }
	            else {
	                miner.blindMoveTo(this.container);
	            }
	        }
	    }
	    backupMinerActions(miner) {
	        if (!miner.pos.isNearTo(this.source) || !miner.pos.isNearTo(this.container)) {
	            let position = _.filter(this.container.pos.openAdjacentSpots(), (p) => p.isNearTo(this.source))[0];
	            if (position) {
	                miner.blindMoveTo(position);
	            }
	            else {
	                this.idleNear(miner, this.source, 3);
	            }
	            return;
	        }
	        if (this.container.hits < this.container.hitsMax * .90 && miner.carry.energy >= 20) {
	            miner.repair(this.container);
	        }
	        else {
	            miner.harvest(this.source);
	        }
	        if (miner.carry.energy >= 40) {
	            miner.transfer(this.container, RESOURCE_ENERGY);
	        }
	    }
	    getMinerBody() {
	        if (this.remoteSpawning) {
	            return this.workerBody(6, 1, 6);
	        }
	        if (this.minersNeeded === 1) {
	            let work = Math.ceil((Math.max(this.source.energyCapacity, SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME) / HARVEST_POWER) + 1;
	            return this.workerBody(work, 1, Math.ceil(work / 2));
	        }
	        else if (this.minersNeeded === 2) {
	            return this.workerBody(3, 1, 2);
	        }
	        else {
	            return this.workerBody(2, 1, 1);
	        }
	    }
	    miningTransportAnalysis() {
	        if (!this.memory.distanceToStorage) {
	            let path = PathFinder.search(this.storage.pos, { pos: this.source.pos, range: 1 }).path;
	            this.memory.distanceToStorage = path.length;
	        }
	        let distance = this.memory.distanceToStorage;
	        let load = Mission_1.Mission.loadFromSource(this.source);
	        return this.cacheTransportAnalysis(distance, load);
	    }
	    cartActions(cart) {
	        let fleeing = cart.fleeHostiles();
	        if (fleeing)
	            return; // early
	        // emergency cpu savings
	        if (Game.cpu.bucket < 1000)
	            return;
	        let hasLoad = this.hasLoad(cart);
	        if (!hasLoad) {
	            let supply = this.container ? this.container : this.miners[0];
	            if (!supply) {
	                if (!cart.pos.isNearTo(this.flag)) {
	                    cart.idleOffRoad(this.flag);
	                }
	                return; // early
	            }
	            let rangeToSupply = cart.pos.getRangeTo(supply);
	            if (rangeToSupply > 3) {
	                cart.blindMoveTo(supply);
	                return;
	            }
	            if (supply.store.energy === 0) {
	                cart.idleOffRoad(this.flag);
	                return;
	            }
	            if (rangeToSupply > 1) {
	                cart.blindMoveTo(supply);
	                return;
	            }
	            let outcome = cart.withdrawIfFull(supply, RESOURCE_ENERGY);
	            if (outcome === OK && supply.store.energy >= cart.storeCapacity) {
	                cart.blindMoveTo(this.storage);
	            }
	            return; // early
	        }
	        if (!this.storage) {
	            if (!cart.pos.isNearTo(this.flag)) {
	                cart.blindMoveTo((this.flag));
	            }
	            return;
	        }
	        if (cart.pos.isNearTo(this.storage)) {
	            let outcome = cart.transfer(this.storage, RESOURCE_ENERGY);
	            if (outcome === OK && cart.ticksToLive < this.analysis.distance * 2) {
	                cart.suicide();
	            }
	            else if (outcome === OK) {
	                cart.blindMoveTo(this.miners[0]);
	            }
	        }
	        else {
	            cart.blindMoveTo(this.storage);
	        }
	    }
	    findMinerStorage() {
	        let destination = Game.flags[this.opName + "_sourceDestination"];
	        if (destination) {
	            let structure = destination.pos.lookFor(LOOK_STRUCTURES)[0];
	            if (structure) {
	                return structure;
	            }
	        }
	        if (this.opType === "mining" || this.opType === "keeper") {
	            return this.getStorage(this.source.pos);
	        }
	        else {
	            if (this.room.storage && this.room.storage.my) {
	                return this.flag.room.storage;
	            }
	        }
	    }
	    placeContainer() {
	        let startingPosition = this.storage;
	        if (!startingPosition) {
	            startingPosition = this.room.find(FIND_MY_SPAWNS)[0];
	        }
	        if (!startingPosition) {
	            startingPosition = this.room.find(FIND_CONSTRUCTION_SITES, { filter: ((s) => s.structureType === STRUCTURE_SPAWN) })[0];
	        }
	        if (!startingPosition)
	            return;
	        if (this.source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1).length > 0)
	            return;
	        let ret = PathFinder.search(this.source.pos, [{ pos: startingPosition.pos, range: 1 }], {
	            maxOps: 4000,
	            swampCost: 2,
	            plainCost: 2,
	            roomCallback: (roomName) => {
	                let room = Game.rooms[roomName];
	                if (!room)
	                    return;
	                let matrix = new PathFinder.CostMatrix();
	                helper_1.helper.addStructuresToMatrix(matrix, room);
	                return matrix;
	            }
	        });
	        if (ret.incomplete || ret.path.length === 0) {
	            notifier_1.notifier.add(`path used for container placement in ${this.opName} incomplete, please investigate`);
	        }
	        let position = ret.path[0];
	        let testPositions = _.sortBy(this.source.pos.openAdjacentSpots(true), (p) => p.getRangeTo(position));
	        for (let testPosition of testPositions) {
	            let sourcesInRange = testPosition.findInRange(FIND_SOURCES, 1);
	            if (sourcesInRange.length > 1) {
	                continue;
	            }
	            console.log(`MINER: placed container in ${this.opName}`);
	            testPosition.createConstructionSite(STRUCTURE_CONTAINER);
	            return;
	        }
	        console.log(`MINER: Unable to place container in ${this.opName}`);
	    }
	    buildContainer(miner, order) {
	        if (miner.pos.isNearTo(this.source)) {
	            if (miner.carry.energy < miner.carryCapacity || (this.minersNeeded > 1 && order === 1)) {
	                miner.harvest(this.source);
	            }
	            else {
	                let construction = this.source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1)[0];
	                if (construction) {
	                    miner.build(construction);
	                }
	            }
	        }
	        else {
	            miner.blindMoveTo(this.source);
	        }
	    }
	}
	exports.MiningMission = MiningMission;


/***/ },
/* 19 */
/*!*****************************************!*\
  !*** ./src/ai/missions/BuildMission.ts ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	class BuildMission extends Mission_1.Mission {
	    /**
	     * Spawns a creep to build construction and repair walls. Construction will take priority over walls
	     * @param operation
	     * @param activateBoost
	     */
	    constructor(operation, activateBoost = false) {
	        super(operation, "builder");
	        this.activateBoost = activateBoost;
	    }
	    initMission() {
	        if (this.room !== this.spawnGroup.room) {
	            this.remoteSpawn = true;
	        }
	        this.sites = this.room.find(FIND_MY_CONSTRUCTION_SITES);
	        this.prioritySites = _.filter(this.sites, s => constants_1.PRIORITY_BUILD.indexOf(s.structureType) > -1);
	        if (Game.time % 10 === 5) {
	            // this should be a little more cpu-friendly since it basically will only run in room that has construction
	            for (let site of this.sites) {
	                if (site.structureType === STRUCTURE_RAMPART || site.structureType === STRUCTURE_WALL) {
	                    this.memory.maxHitsToBuild = 2000;
	                    break;
	                }
	            }
	        }
	        if (!this.memory.maxHitsToBuild)
	            this.memory.maxHitsToBuild = 2000;
	    }
	    roleCall() {
	        let maxBuilders = 0;
	        let potency = 0;
	        if (this.sites.length > 0) {
	            potency = this.findBuilderPotency();
	            if (this.room.storage && this.room.storage.store.energy < 50000) {
	                potency = 1;
	            }
	            let builderCost = potency * 100 + Math.ceil(potency / 2) * 50 + 150 * potency;
	            maxBuilders = Math.ceil(builderCost / this.spawnGroup.maxSpawnEnergy);
	        }
	        let distance = 20;
	        if (this.room.storage) {
	            distance = 10;
	        }
	        let analysis = this.cacheTransportAnalysis(distance, potency * 5);
	        let builderBody = () => {
	            if (this.spawnGroup.maxSpawnEnergy < 550) {
	                return this.bodyRatio(1, 3, .5, 1, potency);
	            }
	            let potencyCost = potency * 100 + Math.ceil(potency / 2) * 50;
	            let energyForCarry = this.spawnGroup.maxSpawnEnergy - potencyCost;
	            let cartCarryCount = analysis.carryCount;
	            let carryCount = Math.min(Math.floor(energyForCarry / 50), cartCarryCount);
	            if (this.spawnGroup.room === this.room) {
	                return this.workerBody(potency, carryCount, Math.ceil(potency / 2));
	            }
	            else {
	                return this.workerBody(potency, carryCount, potency);
	            }
	        };
	        let builderMemory;
	        if (this.activateBoost) {
	            builderMemory = {
	                scavanger: RESOURCE_ENERGY,
	                boosts: [RESOURCE_CATALYZED_LEMERGIUM_ACID],
	                allowUnboosted: true
	            };
	        }
	        else {
	            builderMemory = { scavanger: RESOURCE_ENERGY };
	        }
	        this.builders = this.headCount(this.name, builderBody, maxBuilders, { prespawn: this.memory.prespawn, memory: builderMemory });
	        this.builders = _.sortBy(this.builders, (c) => c.carry.energy);
	        let cartMemory = {
	            scavanger: RESOURCE_ENERGY
	        };
	        this.supplyCarts = this.headCount(this.name + "Cart", () => this.workerBody(0, analysis.carryCount, analysis.moveCount), analysis.cartsNeeded, { prespawn: this.memory.prespawn, memory: cartMemory });
	    }
	    missionActions() {
	        for (let builder of this.builders) {
	            this.builderActions(builder);
	        }
	        for (let cart of this.supplyCarts) {
	            this.builderCartActions(cart);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        this.memory.transportAnalysis = undefined;
	        if (Math.random() < 0.01)
	            this.memory.maxHitsToBuild = undefined;
	    }
	    builderActions(builder) {
	        if (!builder.memory.setPrespawn) {
	            builder.memory.setPrespawn = true;
	            this.setPrespawn(builder);
	        }
	        let hasLoad = _.filter(this.supplyCarts, (c) => !c.spawning).length > 0 || this.hasLoad(builder);
	        if (!hasLoad) {
	            this.procureEnergy(builder);
	            return;
	        }
	        // repair the rampart you just built
	        if (this.memory.rampartPos) {
	            let rampart = helper_1.helper.deserializeRoomPosition(this.memory.rampartPos).lookForStructure(STRUCTURE_RAMPART);
	            if (rampart && rampart.hits < 10000) {
	                if (rampart.pos.inRangeTo(builder, 3)) {
	                    builder.repair(rampart);
	                }
	                else {
	                    builder.blindMoveTo(rampart);
	                }
	                return;
	            }
	            else {
	                this.memory.rampartPos = undefined;
	            }
	        }
	        // has energy
	        let closest;
	        if (this.prioritySites.length > 0) {
	            closest = builder.pos.findClosestByRange(this.prioritySites);
	        }
	        else {
	            closest = builder.pos.findClosestByRange(this.sites);
	        }
	        if (!closest) {
	            this.buildWalls(builder);
	            return;
	        }
	        // has target
	        let range = builder.pos.getRangeTo(closest);
	        if (range <= 3) {
	            let outcome = builder.build(closest);
	            if (outcome === OK) {
	                builder.yieldRoad(closest);
	            }
	            if (outcome === OK && closest.structureType === STRUCTURE_RAMPART) {
	                this.memory.rampartPos = closest.pos;
	            }
	            if (range === 0) {
	                builder.blindMoveTo(this.flag);
	            }
	        }
	        else {
	            builder.blindMoveTo(closest, { maxRooms: 1 });
	        }
	    }
	    buildWalls(builder) {
	        let target = this.findMasonTarget(builder);
	        if (!target) {
	            if (builder.room.controller && builder.room.controller.level < 8) {
	                this.upgradeController(builder);
	            }
	            else {
	                builder.idleOffRoad(this.flag);
	            }
	            return;
	        }
	        if (builder.pos.inRangeTo(target, 3)) {
	            let outcome = builder.repair(target);
	            if (outcome === OK) {
	                builder.yieldRoad(target);
	            }
	        }
	        else {
	            builder.blindMoveTo(target);
	        }
	    }
	    findMasonTarget(builder) {
	        let manualTarget = this.findManualTarget();
	        if (manualTarget)
	            return manualTarget;
	        if (this.room.hostiles.length > 0 && this.room.hostiles[0].owner.username !== "Invader") {
	            if (!this.walls) {
	                this.walls = _(this.room.findStructures(STRUCTURE_RAMPART).concat(this.room.findStructures(STRUCTURE_WALL)))
	                    .sortBy("hits")
	                    .value();
	            }
	            let lowest = this.walls[0];
	            _.pull(this.walls, lowest);
	            if (builder.memory.emergencyRepairId) {
	                let structure = Game.getObjectById(builder.memory.emergencyRepairId);
	                if (structure && !builder.pos.inRangeTo(lowest, 3)) {
	                    return structure;
	                }
	                else {
	                    builder.memory.emergencyRepairId = undefined;
	                }
	            }
	            return lowest;
	        }
	        if (builder.memory.wallId) {
	            let wall = Game.getObjectById(builder.memory.wallId);
	            if (wall && wall.hits < this.memory.maxHitsToBuild) {
	                return wall;
	            }
	            else {
	                builder.memory.wallId = undefined;
	                return this.findMasonTarget(builder);
	            }
	        }
	        else {
	            // look for ramparts under maxHitsToBuild
	            let structures = _.filter(this.room.findStructures(STRUCTURE_RAMPART), (s) => s.hits < this.memory.maxHitsToBuild * .9);
	            // look for walls under maxHitsToBuild
	            if (structures.length === 0) {
	                structures = _.filter(this.room.findStructures(STRUCTURE_WALL), (s) => s.hits < this.memory.maxHitsToBuild * .9);
	            }
	            if (structures.length === 0) {
	                // increase maxHitsToBuild if there are walls/ramparts in room and re-call function
	                if (this.room.findStructures(STRUCTURE_RAMPART).concat(this.room.findStructures(STRUCTURE_WALL)).length > 0) {
	                    // TODO: seems to produce some pretty uneven walls, find out why
	                    this.memory.maxHitsToBuild += Math.pow(10, Math.floor(Math.log(this.memory.maxHitsToBuild) / Math.log(10)));
	                    return this.findMasonTarget(builder);
	                }
	            }
	            let closest = builder.pos.findClosestByRange(structures);
	            if (closest) {
	                builder.memory.wallId = closest.id;
	                return closest;
	            }
	        }
	    }
	    findManualTarget() {
	        if (this.memory.manualTargetId) {
	            let target = Game.getObjectById(this.memory.manualTargetId);
	            if (target && target.hits < this.memory.manualTargetHits) {
	                return target;
	            }
	            else {
	                this.memory.manualTargetId = undefined;
	                this.memory.manualTargetHits = undefined;
	            }
	        }
	    }
	    upgradeController(builder) {
	        if (builder.pos.inRangeTo(builder.room.controller, 3)) {
	            builder.upgradeController(builder.room.controller);
	            builder.yieldRoad(builder.room.controller);
	        }
	        else {
	            builder.blindMoveTo(builder.room.controller);
	        }
	    }
	    findBuilderPotency() {
	        let potency = 1;
	        if (this.room.storage) {
	            potency = Math.min(Math.floor(this.room.storage.store.energy / 7500), 10);
	        }
	        else {
	            potency = this.room.find(FIND_SOURCES).length * 2;
	        }
	        return potency;
	    }
	    builderCartActions(cart) {
	        let suppliedCreep = _.head(this.builders);
	        if (!suppliedCreep) {
	            cart.idleOffRoad(this.flag);
	            return;
	        }
	        let hasLoad = this.hasLoad(cart);
	        if (!hasLoad) {
	            this.procureEnergy(cart, suppliedCreep);
	            return;
	        }
	        let rangeToBuilder = cart.pos.getRangeTo(suppliedCreep);
	        if (rangeToBuilder > 3) {
	            cart.blindMoveTo(suppliedCreep);
	            return;
	        }
	        let overCapacity = cart.carry.energy > suppliedCreep.carryCapacity - suppliedCreep.carry.energy;
	        if (suppliedCreep.carry.energy > suppliedCreep.carryCapacity * .5 && overCapacity) {
	            cart.yieldRoad(suppliedCreep);
	            return;
	        }
	        if (rangeToBuilder > 1) {
	            cart.blindMoveTo(suppliedCreep);
	            return;
	        }
	        cart.transfer(suppliedCreep, RESOURCE_ENERGY);
	        if (!overCapacity && this.room.storage) {
	            cart.blindMoveTo(this.room.storage);
	        }
	    }
	}
	exports.BuildMission = BuildMission;


/***/ },
/* 20 */
/*!***********************************************!*\
  !*** ./src/ai/missions/LinkNetworkMission.ts ***!
  \***********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class LinkNetworkMission extends Mission_1.Mission {
	    /**
	     * Manages linknetwork in room to efficiently send energy between the storage, controller, and sources
	     * Assumptions: 1) all links within 1 linear distance of storage to be used as StorageLinks, 2) all links within
	     * linear distance of 2 of sources to be used as sourceLinks, 3) all links within linearDistance of 3 of controller
	     * to be used as controller links
	     * @param operation
	     */
	    constructor(operation) {
	        super(operation, "linkNetwork");
	        this.storageLinks = [];
	        this.sourceLinks = [];
	    }
	    initMission() {
	        if (this.room.storage) {
	            let controllerBattery = this.room.controller.getBattery();
	            if (controllerBattery instanceof StructureLink) {
	                this.controllerLink = controllerBattery;
	            }
	            this.findStorageLinks();
	            if (this.room.controller.level === 8) {
	                this.findSourceLinks();
	            }
	        }
	    }
	    roleCall() {
	        let conduitBody = () => {
	            return this.workerBody(0, 8, 4);
	        };
	        let max = 0;
	        if (this.storageLinks.length > 0 && this.controllerLink) {
	            max = 1;
	        }
	        let memory = { scavanger: RESOURCE_ENERGY };
	        this.conduits = this.headCount("conduit", conduitBody, max, { prespawn: 10, memory: memory });
	    }
	    missionActions() {
	        for (let conduit of this.conduits) {
	            this.conduitActions(conduit);
	        }
	        if (this.room.controller.level < 8) {
	            this.linkNetworkAlpha();
	        }
	        else {
	            this.linkNetworkBeta();
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    findStorageLinks() {
	        if (this.room.controller.level === 8) {
	            let storageLink = this.room.storage.findMemoStructure(STRUCTURE_LINK, 2);
	            if (storageLink) {
	                this.storageLinks.push(storageLink);
	            }
	        }
	        else {
	            if (!this.memory.storageLinkIds || Game.time % 100 === 7) {
	                // I had this as a lodash function but it looked ugly
	                let linkIds = [];
	                let links = this.room.findStructures(STRUCTURE_LINK);
	                for (let link of links) {
	                    if (link.pos.inRangeTo(this.room.storage, 2)) {
	                        this.storageLinks.push(link);
	                        linkIds.push(link.id);
	                    }
	                }
	                this.memory.storageLinkIds = linkIds;
	            }
	            else {
	                for (let id of this.memory.storageLinkIds) {
	                    let link = Game.getObjectById(id);
	                    if (link) {
	                        this.storageLinks.push(link);
	                    }
	                    else {
	                        this.memory.storageLinkIds = _.pull(this.memory.storageLinkIds, id);
	                    }
	                }
	            }
	            this.storageLinks = _.sortBy(this.storageLinks, "energy");
	        }
	    }
	    findSourceLinks() {
	        for (let source of this.sources) {
	            let link = source.findMemoStructure(STRUCTURE_LINK, 2);
	            if (link) {
	                this.sourceLinks.push(link);
	            }
	        }
	    }
	    conduitActions(conduit) {
	        if (!conduit.memory.inPosition) {
	            this.moveToPosition(conduit);
	            return;
	        }
	        // in position
	        if (this.room.controller.level < 8) {
	            this.conduitAlphaActions(conduit);
	        }
	        else {
	            this.conduitBetaActions(conduit);
	        }
	    }
	    moveToPosition(conduit) {
	        for (let i = 1; i <= 8; i++) {
	            let position = this.room.storage.pos.getPositionAtDirection(i);
	            let invalid = false;
	            for (let link of this.storageLinks) {
	                if (!link.pos.isNearTo(position)) {
	                    invalid = true;
	                    break;
	                }
	            }
	            if (invalid)
	                continue;
	            if (conduit.pos.inRangeTo(position, 0)) {
	                conduit.memory.inPosition = true;
	            }
	            else {
	                conduit.moveItOrLoseIt(position, "conduit");
	            }
	            return; // early
	        }
	        console.log("couldn't find valid position for", conduit.name);
	    }
	    conduitAlphaActions(conduit) {
	        if (conduit.carry.energy < conduit.carryCapacity) {
	            conduit.withdraw(this.room.storage, RESOURCE_ENERGY);
	        }
	        else {
	            for (let link of this.storageLinks) {
	                if (link.energy < link.energyCapacity) {
	                    conduit.transfer(link, RESOURCE_ENERGY);
	                    break;
	                }
	            }
	        }
	    }
	    conduitBetaActions(conduit) {
	        if (this.storageLinks.length === 0)
	            return;
	        let link = this.storageLinks[0];
	        if (conduit.carry.energy > 0) {
	            if (link.energy < 400) {
	                conduit.transfer(link, RESOURCE_ENERGY, Math.min(400 - link.energy, conduit.carry.energy));
	            }
	            else {
	                conduit.transfer(this.room.storage, RESOURCE_ENERGY);
	            }
	        }
	        if (link.energy > 400) {
	            conduit.withdraw(link, RESOURCE_ENERGY, link.energy - 400);
	        }
	        else if (link.energy < 400) {
	            conduit.withdraw(this.room.storage, RESOURCE_ENERGY, 400 - link.energy);
	        }
	    }
	    linkNetworkAlpha() {
	        if (!this.controllerLink)
	            return;
	        let longestDistance = this.findLongestDistance(this.controllerLink, this.storageLinks);
	        if (Game.time % (Math.ceil(longestDistance / this.storageLinks.length)) === 0) {
	            // figure out which one needs to fire
	            if (this.memory.linkFiringIndex === undefined) {
	                this.memory.linkFiringIndex = 0;
	            }
	            let linkToFire = this.storageLinks[this.memory.linkFiringIndex];
	            if (linkToFire) {
	                linkToFire.transferEnergy(this.controllerLink);
	            }
	            else {
	                console.log("should never see this message related to alternating link firing");
	            }
	            this.memory.linkFiringIndex++;
	            if (this.memory.linkFiringIndex >= this.storageLinks.length) {
	                this.memory.linkFiringIndex = 0;
	            }
	        }
	    }
	    linkNetworkBeta() {
	        let firstLink = this.sourceLinks[0];
	        let storageLink = this.storageLinks[0];
	        if (!storageLink || !this.controllerLink)
	            return; // early
	        if (!firstLink) {
	            if (storageLink && storageLink.cooldown === 0 && this.controllerLink) {
	                // maintain controller while sourceLinks are not yet built
	                storageLink.transferEnergy(this.controllerLink);
	            }
	            return;
	        }
	        if (Game.time % 40 === 0) {
	            if (this.controllerLink.energy < 400) {
	                firstLink.transferEnergy(this.controllerLink);
	            }
	            else {
	                firstLink.transferEnergy(storageLink);
	            }
	        }
	        if (Game.time % 40 === 20 && this.controllerLink.energy < 400) {
	            storageLink.transferEnergy(this.controllerLink, 400 - this.controllerLink.energy);
	        }
	        if (this.sources.length === 1)
	            return;
	        let secondLink = this.sourceLinks[1];
	        if (Game.time % 40 === 10 && secondLink && storageLink) {
	            secondLink.transferEnergy(storageLink);
	        }
	    }
	    findLongestDistance(origin, objects) {
	        let distance = 0;
	        for (let object of objects) {
	            let dist = origin.pos.getRangeTo(object);
	            if (dist > distance) {
	                distance = dist;
	            }
	        }
	        return distance;
	    }
	}
	exports.LinkNetworkMission = LinkNetworkMission;


/***/ },
/* 21 */
/*!*******************************************!*\
  !*** ./src/ai/missions/UpgradeMission.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class UpgradeMission extends Mission_1.Mission {
	    /**
	     * Controller upgrading. Will look for a suitable controller battery (StructureContainer, StructureStorage,
	     * StructureLink) and if one isn't found it will spawn SupplyMission to bring energy to upgraders
	     * @param operation
	     * @param boost
	     * @param allowSpawn
	     * @param allowUnboosted
	     */
	    constructor(operation, boost, allowSpawn = true, allowUnboosted = true) {
	        super(operation, "upgrade", allowSpawn);
	        this.boost = boost;
	        this.allowUnboosted = allowUnboosted;
	    }
	    initMission() {
	        if (!this.memory.cartCount) {
	            this.memory.cartCount = 0;
	        }
	        if (this.spawnGroup.room !== this.room) {
	            this.remoteSpawning = true;
	            this.distanceToSpawn = Game.map.getRoomLinearDistance(this.spawnGroup.room.name, this.room.name);
	        }
	        else {
	            this.distanceToSpawn = this.findDistanceToSpawn(this.room.controller.pos);
	        }
	        this.battery = this.findControllerBattery();
	    }
	    roleCall() {
	        // memory
	        let memory;
	        if (this.boost || this.empire.hasAbundance(RESOURCE_CATALYZED_GHODIUM_ACID, constants_1.RESERVE_AMOUNT * 2)) {
	            memory = { boosts: [RESOURCE_CATALYZED_GHODIUM_ACID], allowUnboosted: this.allowUnboosted };
	        }
	        let totalPotency = this.findUpgraderPotency();
	        let potencyPerCreep;
	        if (this.remoteSpawning) {
	            potencyPerCreep = Math.min(totalPotency, 23);
	        }
	        else {
	            let unitCost = 125;
	            potencyPerCreep = Math.min(Math.floor((this.spawnGroup.maxSpawnEnergy - 200) / unitCost), 30, totalPotency);
	        }
	        let max = this.findMaxUpgraders(totalPotency, potencyPerCreep);
	        let linkUpgraderBody = () => {
	            if (this.memory.max !== undefined) {
	                return this.workerBody(30, 4, 15);
	            }
	            if (this.remoteSpawning) {
	                return this.workerBody(potencyPerCreep, 4, potencyPerCreep);
	            }
	            if (this.spawnGroup.maxSpawnEnergy < 800) {
	                return this.bodyRatio(2, 1, 1, 1);
	            }
	            else {
	                return this.workerBody(potencyPerCreep, 4, Math.ceil(potencyPerCreep / 2));
	            }
	        };
	        if (this.battery instanceof StructureContainer) {
	            let analysis = this.cacheTransportAnalysis(25, totalPotency);
	            this.batterySupplyCarts = this.headCount("upgraderCart", () => this.workerBody(0, analysis.carryCount, analysis.moveCount), analysis.cartsNeeded, { prespawn: this.distanceToSpawn, });
	        }
	        this.linkUpgraders = this.headCount("upgrader", linkUpgraderBody, max, {
	            prespawn: this.distanceToSpawn,
	            memory: memory
	        });
	        if (this.memory.roadRepairIds && !this.remoteSpawning) {
	            this.paver = this.spawnPaver();
	        }
	        let maxInfluxCarts = 0;
	        let influxMemory;
	        if (this.remoteSpawning) {
	            if (this.room.storage && this.room.storage.store.energy < constants_1.NEED_ENERGY_THRESHOLD
	                && this.spawnGroup.room.storage && this.spawnGroup.room.storage.store.energy > constants_1.SUPPLY_ENERGY_THRESHOLD) {
	                maxInfluxCarts = 10;
	                influxMemory = { originId: this.spawnGroup.room.storage.id };
	            }
	        }
	        let influxCartBody = () => this.workerBody(0, 25, 25);
	        this.influxCarts = this.headCount("influxCart", influxCartBody, maxInfluxCarts, { memory: influxMemory, skipMoveToRoom: true });
	    }
	    missionActions() {
	        let index = 0;
	        for (let upgrader of this.linkUpgraders) {
	            this.linkUpgraderActions(upgrader, index);
	            index++;
	        }
	        if (this.paver) {
	            this.paverActions(this.paver);
	        }
	        if (this.batterySupplyCarts) {
	            for (let cart of this.batterySupplyCarts) {
	                this.batterySupplyCartActions(cart);
	            }
	        }
	        for (let influxCart of this.influxCarts) {
	            this.influxCartActions(influxCart);
	        }
	        if (this.battery) {
	            let startingPosition = this.room.storage;
	            if (!startingPosition) {
	                startingPosition = this.room.find(FIND_MY_SPAWNS)[0];
	            }
	            if (startingPosition) {
	                this.pavePath(startingPosition, this.battery, 1, true);
	            }
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        if (Math.random() < .01)
	            this.memory.positionCount = undefined;
	        if (Math.random() < .1)
	            this.memory.transportAnalysis = undefined;
	    }
	    linkUpgraderActions(upgrader, index) {
	        let battery = this.room.controller.getBattery();
	        if (!battery) {
	            upgrader.idleOffRoad(this.flag);
	            return; // early
	        }
	        let outcome;
	        if (battery instanceof StructureContainer && battery.hits < battery.hitsMax * 0.8) {
	            outcome = upgrader.repair(battery);
	        }
	        else {
	            outcome = upgrader.upgradeController(this.room.controller);
	        }
	        let myPosition = this.room.controller.getUpgraderPositions()[index];
	        if (myPosition) {
	            let range = upgrader.pos.getRangeTo(myPosition);
	            if (range > 0) {
	                upgrader.blindMoveTo(myPosition);
	            }
	        }
	        else {
	            if (upgrader.pos.inRangeTo(battery, 3)) {
	                upgrader.yieldRoad(battery);
	            }
	            else {
	                upgrader.blindMoveTo(battery);
	            }
	        }
	        if (upgrader.carry[RESOURCE_ENERGY] < upgrader.carryCapacity / 4) {
	            upgrader.withdraw(battery, RESOURCE_ENERGY);
	        }
	    }
	    findControllerBattery() {
	        let battery = this.room.controller.getBattery();
	        if (battery instanceof StructureContainer && this.room.controller.level >= 5) {
	            battery.destroy();
	            return;
	        }
	        if (!battery) {
	            let spawn = this.room.find(FIND_MY_SPAWNS)[0];
	            if (!spawn)
	                return;
	            if (!this.memory.batteryPosition) {
	                this.memory.batteryPosition = this.findBatteryPosition(spawn);
	                if (!this.memory.batteryPosition)
	                    return;
	            }
	            let structureType = STRUCTURE_LINK;
	            if (this.room.controller.level < 5) {
	                structureType = STRUCTURE_CONTAINER;
	            }
	            let position = helper_1.helper.deserializeRoomPosition(this.memory.batteryPosition);
	            if (position.lookFor(LOOK_CONSTRUCTION_SITES).length > 0)
	                return;
	            let outcome = position.createConstructionSite(structureType);
	            console.log(`UPGRADE: placing battery in ${this.opName}, outcome: ${outcome}, ${position}`);
	        }
	        return battery;
	    }
	    findBatteryPosition(spawn) {
	        let path = this.findPavedPath(spawn.pos, this.room.controller.pos, 1);
	        let positionsInRange = this.room.controller.pos.findInRange(path, 3);
	        positionsInRange = _.sortBy(positionsInRange, (pos) => pos.getRangeTo(spawn.pos));
	        let mostSpots = 0;
	        let bestPositionSoFar;
	        for (let position of positionsInRange) {
	            let sourcesInRange = position.findInRange(FIND_SOURCES, 2);
	            if (sourcesInRange.length > 0)
	                continue;
	            let openSpotCount = _.filter(position.openAdjacentSpots(true), (pos) => pos.getRangeTo(this.room.controller) <= 3).length;
	            if (openSpotCount >= 5)
	                return position;
	            else if (openSpotCount > mostSpots) {
	                mostSpots = openSpotCount;
	                bestPositionSoFar = position;
	            }
	        }
	        if (bestPositionSoFar) {
	            return bestPositionSoFar;
	        }
	        else {
	            console.log(`couldn't find controller battery position in ${this.opName}`);
	        }
	    }
	    findUpgraderPotency() {
	        if (!this.battery || this.room.hostiles.length > 0)
	            return 0;
	        if (!this.memory.potency || Game.time % 10 === 0) {
	            if (this.room.controller.level === 8) {
	                if (this.room.storage && this.room.storage.store.energy > constants_1.NEED_ENERGY_THRESHOLD) {
	                    return 15;
	                }
	                else {
	                    return 1;
	                }
	            }
	            if (this.room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 &&
	                (!this.room.storage || this.room.storage.store.energy < 50000)) {
	                return 1;
	            }
	            let storageCapacity;
	            if (this.room.storage) {
	                storageCapacity = Math.floor(this.room.storage.store.energy / 1500);
	            }
	            if (this.battery instanceof StructureLink && this.room.storage) {
	                let cooldown = this.battery.pos.getRangeTo(this.room.storage) + 3;
	                let linkCount = this.room.storage.pos.findInRange(this.room.findStructures(STRUCTURE_LINK), 2).length;
	                return Math.min(Math.floor(((LINK_CAPACITY * .97) * linkCount) / cooldown), storageCapacity);
	            }
	            else if (this.battery instanceof StructureContainer) {
	                if (this.room.storage)
	                    return storageCapacity;
	                return this.room.find(FIND_SOURCES).length * 10;
	            }
	            else {
	                console.log(`unrecognized controller battery type in ${this.opName}, ${this.battery.structureType}`);
	                return 0;
	            }
	        }
	        return this.memory.potency;
	    }
	    batterySupplyCartActions(cart) {
	        let controllerBattery = this.battery;
	        let hasLoad = this.hasLoad(cart);
	        if (!hasLoad) {
	            this.procureEnergy(cart, controllerBattery);
	            return;
	        }
	        let rangeToBattery = cart.pos.getRangeTo(controllerBattery);
	        if (rangeToBattery > 3) {
	            cart.blindMoveTo(controllerBattery, { maxRooms: 1 });
	            return;
	        }
	        if (controllerBattery.store.energy === controllerBattery.storeCapacity) {
	            cart.yieldRoad(controllerBattery);
	            return;
	        }
	        if (rangeToBattery > 1) {
	            cart.blindMoveTo(controllerBattery, { maxRooms: 1 });
	            return;
	        }
	        cart.transfer(controllerBattery, RESOURCE_ENERGY);
	    }
	    influxCartActions(influxCart) {
	        let originStorage = Game.getObjectById(influxCart.memory.originId);
	        if (!originStorage) {
	            influxCart.idleOffRoad(this.flag);
	            return;
	        }
	        let hasLoad = this.hasLoad(influxCart);
	        if (!hasLoad) {
	            if (influxCart.pos.isNearTo(originStorage)) {
	                influxCart.withdraw(originStorage, RESOURCE_ENERGY);
	                this.empire.travelTo(influxCart, this.room.storage, { ignoreRoads: true });
	            }
	            else {
	                this.empire.travelTo(influxCart, originStorage, { ignoreRoads: true });
	            }
	            return;
	        }
	        if (influxCart.pos.isNearTo(this.room.storage)) {
	            influxCart.transfer(this.room.storage, RESOURCE_ENERGY);
	            this.empire.travelTo(influxCart, originStorage, { ignoreRoads: true });
	        }
	        else {
	            this.empire.travelTo(influxCart, this.room.storage, { ignoreRoads: true });
	        }
	    }
	    findMaxUpgraders(totalPotency, potencyPerCreep) {
	        if (!this.battery)
	            return 0;
	        if (this.memory.max !== undefined) {
	            console.log(`overriding max in ${this.opName}`);
	            return this.memory.max;
	        }
	        let max = Math.min(Math.floor(totalPotency / potencyPerCreep), 5);
	        if (this.room.controller.getUpgraderPositions()) {
	            max = Math.min(this.room.controller.getUpgraderPositions().length, max);
	        }
	        return max;
	    }
	}
	exports.UpgradeMission = UpgradeMission;


/***/ },
/* 22 */
/*!*******************************************!*\
  !*** ./src/ai/missions/GeologyMission.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class GeologyMission extends Mission_1.Mission {
	    constructor(operation, storeStructure) {
	        super(operation, "geology");
	        this.storeStructure = storeStructure;
	    }
	    initMission() {
	        if (!this.hasVision)
	            return;
	        this.mineral = this.room.find(FIND_MINERALS)[0];
	        if (!Game.cache[this.mineral.mineralType])
	            Game.cache[this.mineral.mineralType] = 0;
	        Game.cache[this.mineral.mineralType]++;
	        if (!this.storeStructure)
	            this.storeStructure = this.getStorage(this.mineral.pos);
	        if (!this.storeStructure)
	            return;
	        if (!this.memory.distanceToStorage) {
	            this.memory.distanceToStorage = this.mineral.pos.walkablePath(this.storeStructure.pos).length;
	        }
	        if ((!this.room.controller || this.room.controller.level >= 7) && !this.memory.builtExtractor) {
	            let extractor = this.mineral.pos.lookForStructure(STRUCTURE_EXTRACTOR);
	            if (!extractor) {
	                this.mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
	            }
	            this.memory.builtExtractor = true;
	        }
	        this.distanceToSpawn = this.findDistanceToSpawn(this.mineral.pos);
	        if (!this.memory.bestBody) {
	            this.memory.bestBody = this.calculateBestBody();
	        }
	        if (this.mineral.mineralAmount === 0 && this.mineral.ticksToRegeneration > 1000 &&
	            this.mineral.ticksToRegeneration < MINERAL_REGEN_TIME - 1000) {
	            return; // early
	        }
	        this.container = this.mineral.findMemoStructure(STRUCTURE_CONTAINER, 1);
	        if (!this.container && this.memory.builtExtractor &&
	            (this.mineral.ticksToRegeneration < 1000 || this.mineral.mineralAmount > 0)) {
	            this.buildContainer();
	        }
	        this.analysis = this.cacheTransportAnalysis(this.memory.distanceToStorage, constants_1.LOADAMOUNT_MINERAL);
	    }
	    roleCall() {
	        let maxGeologists = 0;
	        if (this.hasVision && this.container && this.mineral.mineralAmount > 0 && this.memory.builtExtractor) {
	            maxGeologists = 1;
	        }
	        let geoBody = () => {
	            if (this.room.controller && this.room.controller.my) {
	                return this.memory.bestBody;
	            }
	            else {
	                return this.workerBody(33, 0, 17);
	            }
	        };
	        this.geologists = this.headCount("geologist", geoBody, maxGeologists, this.distanceToSpawn);
	        let maxCarts = maxGeologists > 0 ? this.analysis.cartsNeeded : 0;
	        this.carts = this.headCount("geologyCart", () => this.workerBody(0, this.analysis.carryCount, this.analysis.moveCount), maxCarts, { prespawn: this.distanceToSpawn });
	        let maxRepairers = this.mineral.mineralAmount > 5000 && this.container && this.container.hits < 50000 ? 1 : 0;
	        this.repairers = this.headCount("repairer", () => this.workerBody(5, 15, 10), maxRepairers);
	        if (this.memory.roadRepairIds) {
	            this.paver = this.spawnPaver();
	        }
	    }
	    missionActions() {
	        for (let geologist of this.geologists) {
	            this.geologistActions(geologist);
	        }
	        for (let cart of this.carts) {
	            if (this.mineral.mineralAmount > 0) {
	                this.cartActions(cart);
	            }
	            else {
	                this.cleanupCartActions(cart);
	            }
	        }
	        for (let repairer of this.repairers) {
	            this.repairActions(repairer);
	        }
	        if (this.paver) {
	            this.paverActions(this.paver);
	        }
	        if (this.memory.builtExtractor) {
	            let distance = this.pavePath(this.storeStructure, this.mineral, 2);
	            if (distance) {
	                this.memory.distanceToStorage = distance;
	            }
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        if (Math.random() < .01) {
	            this.memory.storageId = undefined;
	            this.memory.transportAnalysis = undefined;
	            this.memory.distanceToStorage = undefined;
	            this.memory.builtExtractor = undefined;
	            this.memory.distanceToSpawn = undefined;
	        }
	    }
	    calculateBestBody() {
	        let bestMineAmount = 0;
	        let bestMovePartsCount = 0;
	        let bestWorkPartsCount = 0;
	        for (let i = 1; i < 50; i++) {
	            let movePartsCount = i;
	            let workPartsCount = MAX_CREEP_SIZE - movePartsCount;
	            let ticksPerMove = Math.ceil(1 / (movePartsCount * 2 / workPartsCount));
	            let minePerTick = workPartsCount;
	            let travelTime = ticksPerMove * this.distanceToSpawn;
	            let mineTime = CREEP_LIFE_TIME - travelTime;
	            let mineAmount = minePerTick * mineTime;
	            if (mineAmount > bestMineAmount) {
	                bestMineAmount = mineAmount;
	                bestMovePartsCount = movePartsCount;
	                bestWorkPartsCount = workPartsCount;
	            }
	        }
	        return this.workerBody(bestWorkPartsCount, 0, bestMovePartsCount);
	    }
	    geologistActions(geologist) {
	        let fleeing = geologist.fleeHostiles();
	        if (fleeing)
	            return; // early
	        if (!this.container) {
	            if (!geologist.pos.isNearTo(this.flag)) {
	                geologist.blindMoveTo(this.flag);
	            }
	            return; // early
	        }
	        if (!geologist.pos.inRangeTo(this.container, 0)) {
	            geologist.moveItOrLoseIt(this.container.pos, "geologist");
	            return; // early
	        }
	        if (this.mineral.mineralAmount === 0) {
	            if (this.container.store[this.mineral.mineralType] === 0) {
	                // break down container
	                geologist.dismantle(this.container);
	            }
	            return; // early
	        }
	        if (!this.container.store[this.mineral.mineralType] ||
	            this.container.store[this.mineral.mineralType] < this.container.storeCapacity - 33) {
	            if (Game.time % 6 === 0)
	                geologist.harvest(this.mineral);
	        }
	    }
	    cleanupCartActions(cart) {
	        let fleeing = cart.fleeHostiles();
	        if (fleeing)
	            return; // early
	        if (_.sum(cart.carry) === cart.carryCapacity) {
	            if (cart.pos.isNearTo(this.storeStructure)) {
	                cart.transferEverything(this.storeStructure);
	            }
	            else {
	                cart.blindMoveTo(this.storeStructure);
	            }
	            return; // early;
	        }
	        if (this.container && _.sum(this.container.store) > 0) {
	            if (cart.pos.isNearTo(this.container)) {
	                if (this.container.store.energy > 0) {
	                    cart.withdraw(this.container, RESOURCE_ENERGY);
	                }
	                else if (this.container.store[this.mineral.mineralType] > 0) {
	                    cart.withdraw(this.container, this.mineral.mineralType);
	                }
	            }
	            else {
	                cart.blindMoveTo(this.container);
	            }
	        }
	        else {
	            if (_.sum(cart.carry) > 0) {
	                if (cart.pos.isNearTo(this.storeStructure)) {
	                    cart.transferEverything(this.storeStructure);
	                }
	                else {
	                    cart.blindMoveTo(this.storeStructure);
	                }
	                return; // early;
	            }
	            let spawn = this.spawnGroup.spawns[0];
	            if (cart.pos.isNearTo(spawn)) {
	                spawn.recycleCreep(cart);
	                let witness = this.room.find(FIND_MY_CREEPS)[0];
	                if (witness) {
	                    witness.say("valhalla!");
	                }
	            }
	            else {
	                cart.blindMoveTo(spawn);
	            }
	            return; // early
	        }
	    }
	    buildContainer() {
	        if (!this.memory.containerPosition) {
	            this.memory.containerPosition = this.mineral.pos.walkablePath(this.storeStructure.pos)[0];
	        }
	        let position = helper_1.helper.deserializeRoomPosition(this.memory.containerPosition);
	        if (position.lookFor(LOOK_CONSTRUCTION_SITES).length === 0 && !position.lookForStructure(STRUCTURE_CONTAINER)) {
	            console.log("GEO: building container in", this.opName);
	            position.createConstructionSite(STRUCTURE_CONTAINER);
	        }
	    }
	    cartActions(cart) {
	        let fleeing = cart.fleeHostiles();
	        if (fleeing)
	            return; // early
	        let hasLoad = this.hasLoad(cart);
	        if (!hasLoad) {
	            if (!this.container) {
	                if (!cart.pos.isNearTo(this.flag)) {
	                    cart.blindMoveTo(this.flag);
	                }
	                return;
	            }
	            if (_.sum(this.container.store) < cart.carryCapacity &&
	                this.container.pos.lookFor(LOOK_CREEPS).length === 0) {
	                this.idleNear(cart, this.container, 3);
	                return;
	            }
	            if (cart.pos.isNearTo(this.container)) {
	                if (this.container.store.energy > 0) {
	                    cart.withdraw(this.container, RESOURCE_ENERGY);
	                }
	                else {
	                    let outcome = cart.withdrawIfFull(this.container, this.mineral.mineralType);
	                    if (outcome === OK && this.container.store[this.mineral.mineralType] >= cart.storeCapacity) {
	                        cart.blindMoveTo(this.storeStructure);
	                    }
	                }
	            }
	            else {
	                cart.blindMoveTo(this.container);
	            }
	            return; // early
	        }
	        if (cart.pos.isNearTo(this.storeStructure)) {
	            let outcome = cart.transferEverything(this.storeStructure);
	            if (outcome === OK && cart.ticksToLive < this.analysis.distance) {
	                cart.suicide();
	            }
	            else if (outcome === OK) {
	                cart.blindMoveTo(this.container);
	            }
	        }
	        else {
	            cart.blindMoveTo(this.storeStructure);
	        }
	    }
	    repairActions(repairer) {
	        let fleeing = repairer.fleeHostiles();
	        if (fleeing)
	            return;
	        if (repairer.room.name !== this.flag.pos.roomName) {
	            this.idleNear(repairer, this.flag);
	            return;
	        }
	        let hasLoad = this.hasLoad(repairer);
	        if (!hasLoad) {
	            this.procureEnergy(repairer);
	            return;
	        }
	        if (!this.container || this.container.hits === this.container.hitsMax) {
	            repairer.idleOffRoad(this.flag);
	            return;
	        }
	        if (repairer.pos.inRangeTo(this.container, 3)) {
	            repairer.repair(this.container);
	            repairer.yieldRoad(this.container);
	        }
	        else {
	            repairer.blindMoveTo(this.container);
	        }
	    }
	}
	exports.GeologyMission = GeologyMission;


/***/ },
/* 23 */
/*!*****************************************!*\
  !*** ./src/ai/missions/PaverMission.ts ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class PaverMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "paver");
	    }
	    initMission() {
	        if (!this.hasVision)
	            return; // early
	        if (!this.memory.potency) {
	            let roads = this.room.findStructures(STRUCTURE_ROAD);
	            let sum = 0;
	            for (let road of roads) {
	                sum += road.hitsMax;
	            }
	            this.memory.potency = Math.max(Math.ceil(sum / 500000), 1);
	        }
	        this.potency = this.memory.potency;
	    }
	    roleCall() {
	        let needPaver = this.room && this.room.findStructures(STRUCTURE_ROAD).length > 0;
	        let max = 0;
	        if (needPaver) {
	            max = 1;
	        }
	        let body = () => {
	            if (this.spawnGroup.maxSpawnEnergy <= 550) {
	                return this.bodyRatio(1, 3, 1, 1);
	            }
	            else {
	                return this.workerBody(this.potency, 3 * this.potency, 2 * this.potency);
	            }
	        };
	        this.pavers = this.headCount(this.name, body, max, { prespawn: 10 });
	    }
	    missionActions() {
	        for (let paver of this.pavers) {
	            this.deprecatedPaverActions(paver);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        if (Math.random() < .01)
	            this.memory.potency = undefined;
	    }
	    deprecatedPaverActions(paver) {
	        let fleeing = paver.fleeHostiles();
	        if (fleeing)
	            return; // early
	        let withinRoom = paver.pos.roomName === this.flag.pos.roomName;
	        if (!withinRoom) {
	            paver.blindMoveTo(this.flag);
	            return;
	        }
	        // I'm in the room
	        paver.memory.scavanger = RESOURCE_ENERGY;
	        let hasLoad = this.hasLoad(paver);
	        if (!hasLoad) {
	            this.procureEnergy(paver);
	            return;
	        }
	        // I'm in the room and I have energy
	        let findRoad = () => {
	            return _.filter(paver.room.findStructures(STRUCTURE_ROAD), (s) => s.hits < s.hitsMax - 1000)[0];
	        };
	        let forget = (s) => s.hits === s.hitsMax;
	        let target = paver.rememberStructure(findRoad, forget);
	        if (!target) {
	            let repairing = false;
	            if (this.room.controller && this.room.controller.my) {
	                repairing = this.repairContainers(paver);
	            }
	            if (!repairing) {
	                paver.memory.hasLoad = paver.carry.energy === paver.carryCapacity;
	                paver.idleOffRoad(this.flag);
	            }
	            return;
	        }
	        // and I have a target
	        let range = paver.pos.getRangeTo(target);
	        if (range > 3) {
	            paver.blindMoveTo(target, { maxRooms: 1 });
	            // repair any damaged road i'm standing on
	            let road = paver.pos.lookForStructure(STRUCTURE_ROAD);
	            if (road && road.hits < road.hitsMax - 100) {
	                paver.repair(road);
	            }
	            return;
	        }
	        // and i'm in range
	        paver.repair(target);
	        paver.yieldRoad(target);
	    }
	    repairContainers(paver) {
	        let disrepairedContainer = paver.rememberStructure(() => {
	            return _(this.room.findStructures(STRUCTURE_CONTAINER))
	                .filter((c) => {
	                return c.hits < c.hitsMax * .5
	                    && !c.pos.isNearTo(c.room.find(FIND_MINERALS)[0]);
	            })
	                .head();
	        }, (s) => {
	            return s.hits === s.hitsMax;
	        });
	        if (disrepairedContainer) {
	            if (paver.pos.isNearTo(disrepairedContainer)) {
	                paver.repair(disrepairedContainer);
	                paver.yieldRoad(disrepairedContainer);
	            }
	            else {
	                paver.blindMoveTo(disrepairedContainer);
	            }
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	}
	exports.PaverMission = PaverMission;


/***/ },
/* 24 */
/*!**********************************************!*\
  !*** ./src/ai/operations/MiningOperation.ts ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const ScoutMission_1 = __webpack_require__(/*! ../missions/ScoutMission */ 25);
	const MiningMission_1 = __webpack_require__(/*! ../missions/MiningMission */ 18);
	const RemoteBuildMission_1 = __webpack_require__(/*! ../missions/RemoteBuildMission */ 26);
	const GeologyMission_1 = __webpack_require__(/*! ../missions/GeologyMission */ 22);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const ReserveMission_1 = __webpack_require__(/*! ../missions/ReserveMission */ 27);
	const BodyguardMission_1 = __webpack_require__(/*! ../missions/BodyguardMission */ 28);
	const SwapMission_1 = __webpack_require__(/*! ../missions/SwapMission */ 29);
	const ClaimMission_1 = __webpack_require__(/*! ../missions/ClaimMission */ 30);
	const UpgradeMission_1 = __webpack_require__(/*! ../missions/UpgradeMission */ 21);
	const EnhancedBodyguardMission_1 = __webpack_require__(/*! ../missions/EnhancedBodyguardMission */ 31);
	class MiningOperation extends Operation_1.Operation {
	    /**
	     * Remote mining, spawns Scout if there is no vision, spawns a MiningMission for each source in the room. Can also
	     * mine minerals from core rooms
	     * @param flag
	     * @param name
	     * @param type
	     * @param empire
	     */
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	        this.priority = constants_1.OperationPriority.Low;
	    }
	    initOperation() {
	        this.findOperationWaypoints();
	        if (this.waypoints.length > 0 && !this.memory.spawnRoom) {
	            console.log("SPAWN: waypoints detected, manually set spawn room, example:", this.name +
	                ".setSpawnRoom(otherOpName.flag.room.name)");
	            return;
	        }
	        this.spawnGroup = this.getRemoteSpawnGroup();
	        if (!this.spawnGroup) {
	            console.log("ATTN: no spawnGroup found for", this.name);
	            return; // early
	        }
	        this.addMission(new ScoutMission_1.ScoutMission(this));
	        // it is not ideal to return early if no vision, but i'm having a hard time figuring out how to do
	        // miningmission without vision
	        // defense
	        if (this.flag.room && this.flag.room.roomType === constants_1.ROOMTYPE_CORE) {
	            this.addMission(new EnhancedBodyguardMission_1.EnhancedBodyguardMission(this));
	        }
	        else {
	            this.addMission(new BodyguardMission_1.BodyguardMission(this));
	        }
	        if (!this.flag.room)
	            return;
	        // swap mining
	        if (this.memory.swapMining) {
	            this.addMission(new SwapMission_1.SwapMission(this));
	        }
	        // claimers
	        if (this.flag.room.memory.swapActive) {
	            if (!this.flag.room.controller.my) {
	                this.addMission(new ClaimMission_1.ClaimMission(this));
	            }
	            // upgraders
	            let spawnUpgraders = this.flag.room.controller.level < 6 &&
	                this.spawnGroup.room.terminal.store[RESOURCE_CATALYZED_GHODIUM_ACID] >= constants_1.IGOR_CAPACITY;
	            this.addMission(new UpgradeMission_1.UpgradeMission(this, true, spawnUpgraders, false));
	        }
	        else {
	            if (this.flag.room.controller) {
	                this.addMission(new ReserveMission_1.ReserveMission(this));
	            }
	        }
	        for (let i = 0; i < this.sources.length; i++) {
	            if (this.sources[i].pos.lookFor(LOOK_FLAGS).length > 0)
	                continue;
	            this.addMission(new MiningMission_1.MiningMission(this, "miner" + i, this.sources[i]));
	        }
	        this.addMission(new RemoteBuildMission_1.RemoteBuildMission(this, true));
	        if (!this.flag.room.controller || this.memory.swapMining) {
	            let storeStructure = this.memory.swapMining ? this.flag.room.terminal : undefined;
	            this.addMission(new GeologyMission_1.GeologyMission(this, storeStructure));
	        }
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	        if (Math.random() < .01) {
	            this.memory.spawnRooms = undefined;
	        }
	    }
	}
	exports.MiningOperation = MiningOperation;


/***/ },
/* 25 */
/*!*****************************************!*\
  !*** ./src/ai/missions/ScoutMission.ts ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class ScoutMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "scout");
	    }
	    initMission() {
	    }
	    roleCall() {
	        let maxScouts = 0;
	        if (!this.hasVision) {
	            maxScouts = 1;
	        }
	        this.scouts = this.headCount(this.name, () => this.workerBody(0, 0, 1), maxScouts, { blindSpawn: true });
	    }
	    missionActions() {
	        for (let scout of this.scouts) {
	            if (!scout.pos.isNearTo(this.flag)) {
	                scout.avoidSK(this.flag);
	            }
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	}
	exports.ScoutMission = ScoutMission;


/***/ },
/* 26 */
/*!***********************************************!*\
  !*** ./src/ai/missions/RemoteBuildMission.ts ***!
  \***********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class RemoteBuildMission extends Mission_1.Mission {
	    /**
	     * Builds construction in remote locations, can recycle self when finished
	     * @param operation
	     * @param recycleWhenDone - recycles creep in spawnroom if there are no available construction sites
	     * @param boost
	     */
	    constructor(operation, recycleWhenDone) {
	        super(operation, "remoteBuild");
	        this.recycleWhenDone = recycleWhenDone;
	    }
	    initMission() {
	        if (!this.hasVision) {
	            return; // early
	        }
	        this.construction = this.room.find(FIND_MY_CONSTRUCTION_SITES);
	    }
	    roleCall() {
	        let maxBuilders = this.construction && this.construction.length > 0 ? 1 : 0;
	        let getBody = () => {
	            return this.bodyRatio(1, 1, 1, .8, 10);
	        };
	        let memory;
	        if (this.memory.activateBoost || (this.room.controller && this.room.controller.my)) {
	            memory = { boosts: [RESOURCE_CATALYZED_LEMERGIUM_ACID], allowUnboosted: true };
	        }
	        this.builders = this.headCount("remoteBuilder", getBody, maxBuilders, { memory: memory });
	    }
	    missionActions() {
	        for (let builder of this.builders) {
	            if (!this.waypoints && this.recycleWhenDone && this.construction.length === 0) {
	                this.recycleBuilder(builder);
	            }
	            else {
	                this.builderActions(builder);
	            }
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    builderActions(builder) {
	        let fleeing = builder.fleeHostiles();
	        if (fleeing)
	            return; // early
	        if (!this.hasVision) {
	            if (!builder.pos.isNearTo(this.flag)) {
	                builder.blindMoveTo(this.flag);
	            }
	            return; // early
	        }
	        let hasLoad = this.hasLoad(builder);
	        if (!hasLoad) {
	            this.procureEnergy(builder, undefined, true, true);
	            return; // early
	        }
	        let closest = builder.pos.findClosestByRange(this.construction);
	        if (!closest) {
	            this.idleNear(builder, this.flag);
	            return; // early
	        }
	        if (builder.pos.inRangeTo(closest, 3)) {
	            builder.build(closest);
	            builder.yieldRoad(closest);
	        }
	        else {
	            builder.blindMoveTo(closest, { maxRooms: 1 });
	        }
	    }
	    recycleBuilder(builder) {
	        let spawn = this.spawnGroup.spawns[0];
	        if (builder.carry.energy > 0 && spawn.room.storage) {
	            if (builder.pos.isNearTo(spawn.room.storage)) {
	                builder.transfer(spawn.room.storage, RESOURCE_ENERGY);
	            }
	            else {
	                builder.blindMoveTo(spawn.room.storage);
	            }
	        }
	        else {
	            let spawn = this.spawnGroup.spawns[0];
	            if (builder.pos.isNearTo(spawn)) {
	                spawn.recycleCreep(builder);
	            }
	            else {
	                builder.blindMoveTo(spawn);
	            }
	        }
	    }
	}
	exports.RemoteBuildMission = RemoteBuildMission;


/***/ },
/* 27 */
/*!*******************************************!*\
  !*** ./src/ai/missions/ReserveMission.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const notifier_1 = __webpack_require__(/*! ../../notifier */ 6);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class ReserveMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "claimer");
	    }
	    initMission() {
	        if (!this.hasVision)
	            return; //
	        this.controller = this.room.controller;
	        if (this.memory.needBulldozer === undefined) {
	            this.memory.needBulldozer = this.checkBulldozer();
	        }
	    }
	    roleCall() {
	        let needReserver = !this.controller.my && (!this.controller.reservation ||
	            this.controller.reservation.ticksToEnd < 3000);
	        let maxReservers = needReserver ? 1 : 0;
	        let potency = this.spawnGroup.room.controller.level === 8 ? 5 : 2;
	        let reserverBody = () => this.configBody({
	            claim: potency,
	            move: potency
	        });
	        this.reservers = this.headCount("claimer", reserverBody, maxReservers);
	        this.bulldozers = this.headCount("dozer", () => this.bodyRatio(4, 0, 1, 1), this.memory.needBulldozer ? 1 : 0);
	    }
	    missionActions() {
	        for (let reserver of this.reservers) {
	            this.reserverActions(reserver);
	        }
	        for (let dozer of this.bulldozers) {
	            this.bulldozerActions(dozer);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    reserverActions(reserver) {
	        if (!this.controller) {
	            reserver.blindMoveTo(this.flag);
	            return; // early
	        }
	        if (reserver.pos.isNearTo(this.controller)) {
	            reserver.reserveController(this.controller);
	            if (!this.memory.wallCheck) {
	                this.memory.wallCheck = this.destroyWalls(reserver, this.room);
	            }
	        }
	        else {
	            reserver.blindMoveTo(this.controller);
	        }
	    }
	    destroyWalls(surveyor, room) {
	        if (!room.controller)
	            return true;
	        if (room.controller.my) {
	            room.findStructures(STRUCTURE_WALL).forEach((w) => w.destroy());
	            if (room.controller.level === 1) {
	                room.controller.unclaim();
	            }
	            return true;
	        }
	        else {
	            let roomAvailable = Game.gcl.level - _.filter(Game.rooms, (r) => r.controller && r.controller.my).length;
	            if (this.room.findStructures(STRUCTURE_WALL).length > 0 && !constants_1.ARTROOMS[room.name] && roomAvailable > 0) {
	                surveyor.claimController(room.controller);
	                return false;
	            }
	            else {
	                return true;
	            }
	        }
	    }
	    checkBulldozer() {
	        let ret = this.empire.findTravelPath(this.spawnGroup, this.room.controller);
	        if (!ret.incomplete) {
	            console.log(`RESERVER: No bulldozer necessary in ${this.opName}`);
	            return false;
	        }
	        let ignoredStructures = this.empire.findTravelPath(this.spawnGroup, this.room.controller, { range: 1, ignoreStructures: true });
	        if (ignoredStructures.incomplete) {
	            notifier_1.notifier.add(`RESERVER: bad bulldozer path in ${this.opName}, please investigate.`);
	            console.log(helper_1.helper.debugPath(ret.path, this.opName));
	            return false;
	        }
	        for (let position of ignoredStructures.path) {
	            if (position.roomName !== this.room.name) {
	                continue;
	            }
	            if (position.isPassible(true)) {
	                continue;
	            }
	            if (position.lookForStructure(STRUCTURE_WALL) || position.lookForStructure(STRUCTURE_RAMPART))
	                return true;
	        }
	    }
	    bulldozerActions(dozer) {
	        if (dozer.pos.isNearTo(this.room.controller)) {
	            this.memory.needBulldozer = false;
	            notifier_1.notifier.add(`RESERVER: bulldozer cleared path in ${this.opName}`);
	            dozer.suicide();
	        }
	        else {
	            if (dozer.room === this.room) {
	                let outcome = this.empire.travelTo(dozer, this.room.controller, {
	                    ignoreStructures: true,
	                    ignoreStuck: true,
	                    returnPosition: true,
	                });
	                if (outcome instanceof RoomPosition) {
	                    let structure = outcome.lookFor(LOOK_STRUCTURES)[0];
	                    if (structure) {
	                        dozer.dismantle(structure);
	                    }
	                }
	            }
	            else {
	                this.empire.travelTo(dozer, this.room.controller);
	            }
	        }
	    }
	}
	exports.ReserveMission = ReserveMission;


/***/ },
/* 28 */
/*!*********************************************!*\
  !*** ./src/ai/missions/BodyguardMission.ts ***!
  \*********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class BodyguardMission extends Mission_1.Mission {
	    /**
	     * Remote defense for non-owned rooms. If boosted invaders are likely, use EnhancedBodyguardMission
	     * @param operation
	     * @param allowSpawn
	     */
	    constructor(operation, allowSpawn = true) {
	        super(operation, "bodyguard", allowSpawn);
	    }
	    initMission() {
	        if (!this.hasVision)
	            return; // early
	        this.hostiles = this.room.hostiles;
	        if (this.opType === "mining") {
	            this.trackEnergyTillInvader();
	        }
	    }
	    roleCall() {
	        let maxDefenders = 0;
	        if (this.memory.invaderProbable) {
	            maxDefenders = 1;
	        }
	        if (this.hasVision) {
	            if (this.hostiles.length > 0) {
	                maxDefenders = Math.ceil(this.hostiles.length / 2);
	            }
	            if (this.opType !== "mining" && this.room.findStructures(STRUCTURE_TOWER).length === 0) {
	                maxDefenders = 1;
	            }
	        }
	        let defenderBody = () => {
	            let unit = this.configBody({
	                tough: 1,
	                move: 5,
	                attack: 3,
	                heal: 1
	            });
	            let potency = Math.min(this.spawnGroup.maxUnits(unit, 1), 3);
	            return this.configBody({
	                tough: potency,
	                move: potency * 5,
	                attack: potency * 3,
	                heal: potency
	            });
	        };
	        this.defenders = this.headCount("leeroy", defenderBody, maxDefenders, { prespawn: 50 });
	    }
	    missionActions() {
	        for (let defender of this.defenders) {
	            this.defenderActions(defender);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    defenderActions(defender) {
	        if (!this.hasVision || this.hostiles.length === 0) {
	            this.idleNear(defender, this.flag);
	            if (defender.hits < defender.hitsMax) {
	                defender.heal(defender);
	            }
	            return; // early
	        }
	        let attacking = false;
	        let closest = defender.pos.findClosestByRange(this.hostiles);
	        if (closest) {
	            let range = defender.pos.getRangeTo(closest);
	            if (range > 1) {
	                defender.blindMoveTo(closest, { maxRooms: 1, ignoreRoads: true });
	            }
	            else {
	                attacking = defender.attack(closest) === OK;
	                defender.move(defender.pos.getDirectionTo(closest));
	            }
	        }
	        else {
	            defender.blindMoveTo(this.hostiles[0]);
	        }
	        if (!attacking && defender.hits < defender.hitsMax) {
	            defender.heal(defender);
	        }
	    }
	    /**
	     * Tracks energy harvested and pre-spawns a defender when an invader becomes likely
	     */
	    trackEnergyTillInvader() {
	        if (!this.memory.invaderTrack) {
	            this.memory.invaderTrack = {
	                energyHarvested: 0,
	                tickLastSeen: Game.time,
	                energyPossible: 0
	            };
	        }
	        let memory = this.memory.invaderTrack;
	        // filter source keepers
	        let hostiles = this.hostiles;
	        let harvested = 0;
	        let possible = 0;
	        let sources = this.room.find(FIND_SOURCES);
	        for (let source of sources) {
	            if (source.ticksToRegeneration === 1) {
	                harvested += source.energyCapacity - source.energy;
	                possible += source.energyCapacity;
	            }
	        }
	        memory.energyHarvested += harvested;
	        memory.energyPossible += possible;
	        if (sources.length === 3) {
	            this.memory.invaderProbable = memory.energyHarvested > 65000;
	        }
	        else if (sources.length === 2 && Game.time - memory.tickLastSeen < 20000) {
	            this.memory.invaderProbable = memory.energyHarvested > 75000;
	        }
	        else if (sources.length === 1 && Game.time - memory.tickLastSeen < 20000) {
	            this.memory.invaderProbable = memory.energyHarvested > 90000;
	        }
	        else {
	            this.memory.invaderProbable = false;
	        }
	        if (hostiles.length > 0 && Game.time - memory.tickLastSeen > CREEP_LIFE_TIME) {
	            // reset trackers
	            memory.energyPossible = 0;
	            memory.energyHarvested = 0;
	            memory.tickLastSeen = Game.time;
	        }
	    }
	}
	exports.BodyguardMission = BodyguardMission;


/***/ },
/* 29 */
/*!****************************************!*\
  !*** ./src/ai/missions/SwapMission.ts ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	class SwapMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "swap");
	    }
	    initMission() {
	        if (!this.hasVision)
	            return;
	        this.empire.registerSwap(this.room);
	        this.mineral = this.room.find(FIND_MINERALS)[0];
	        this.towers = this.room.findStructures(STRUCTURE_TOWER);
	        this.terminal = this.room.terminal;
	        this.storage = this.room.storage;
	        // turn off activate when controller gets claimed
	        if (this.memory.needMasons === undefined || Game.time % 10 === 0) {
	            let ramparts = this.room.findStructures(STRUCTURE_RAMPART);
	            this.memory.needMasons = false;
	            for (let rampart of ramparts) {
	                if (rampart.hits < 1000000) {
	                    this.memory.needMasons = true;
	                }
	                if (this.towers.length > 0 && rampart.hits < 1000) {
	                    this.towers[0].repair(rampart);
	                }
	            }
	        }
	        this.invader = this.room.hostiles[0];
	        this.isActive = this.room.controller.my;
	    }
	    roleCall() {
	        // postMasters
	        let maxPostMasters = this.isActive && this.room.controller.level >= 4 ? 1 : 0;
	        let postMasterBody = () => this.workerBody(0, 40, 1);
	        this.postMasters = this.headCount("postMaster", postMasterBody, maxPostMasters, { prespawn: 50 });
	        let maxMasons = this.memory.needMasons && this.room.controller.level >= 6 ? 1 : 0;
	        let masonBody = () => {
	            return this.workerBody(20, 4, 10);
	        };
	        this.masons = this.headCount("swapMason", masonBody, maxMasons);
	    }
	    missionActions() {
	        for (let postMaster of this.postMasters) {
	            this.postMasterActions(postMaster);
	        }
	        for (let mason of this.masons) {
	            this.swapMasonActions(mason);
	        }
	        if (this.invader) {
	            for (let tower of this.towers)
	                tower.attack(this.invader);
	        }
	        this.transferMinerals();
	        this.swapOut();
	        this.sellExcessMineral();
	    }
	    finalizeMission() {
	        if (!this.memory.fortRoomNames) {
	            let roomNames = _.map(this.empire.terminals, (t) => t.room.name);
	            this.memory.fortRoomNames = _.sortBy(roomNames, (s) => Game.map.getRoomLinearDistance(s, this.room.name, true));
	        }
	    }
	    invalidateMissionCache() {
	        this.memory.fortRoomNames = undefined;
	    }
	    postMasterActions(postMaster) {
	        if (!postMaster.memory.inPosition) {
	            let position = this.terminal.pos.getPositionAtDirection(this.terminal.pos.getDirectionTo(this.storage));
	            if (postMaster.pos.inRangeTo(position, 0)) {
	                postMaster.memory.inPosition = true;
	                postMaster.memory.scavanger = RESOURCE_ENERGY;
	            }
	            else {
	                postMaster.moveItOrLoseIt(position, "postMaster");
	                return; // early
	            }
	        }
	        if (!this.isActive)
	            return; // early
	        if (postMaster.carry.energy > 0) {
	            for (let tower of this.towers) {
	                if (tower.energy === tower.energyCapacity)
	                    continue;
	                postMaster.transfer(tower, RESOURCE_ENERGY);
	                return; // early
	            }
	            if (this.room.controller.level >= 6 && this.storage.store.energy < constants_1.SWAP_RESERVE) {
	                postMaster.transfer(this.storage, RESOURCE_ENERGY);
	            }
	            return; // early
	        }
	        if (this.terminal.store.energy >= 30000 && postMaster.carry.energy < postMaster.carryCapacity) {
	            postMaster.withdraw(this.terminal, RESOURCE_ENERGY);
	        }
	    }
	    transferMinerals() {
	        if (this.room.controller.level < 6)
	            return;
	        if (this.terminal.store.energy >= 20000 && this.terminal.store[this.mineral.mineralType] >= constants_1.RESERVE_AMOUNT) {
	            for (let roomName of this.memory.fortRoomNames) {
	                let room = Game.rooms[roomName];
	                if (!room || room.controller.level < 6)
	                    continue;
	                let terminal = room.terminal;
	                if (!terminal)
	                    continue;
	                let shortageFound = !terminal.store[this.mineral.mineralType]
	                    || terminal.store[this.mineral.mineralType] < constants_1.RESERVE_AMOUNT * 2;
	                if (shortageFound) {
	                    let outcome = this.terminal.send(this.mineral.mineralType, constants_1.RESERVE_AMOUNT, terminal.room.name);
	                    if (outcome === OK) {
	                        console.log("SWAP: sending", constants_1.RESERVE_AMOUNT, this.mineral.mineralType, "to", terminal.room.name);
	                    }
	                    break;
	                }
	            }
	        }
	    }
	    swapOut() {
	        // switch to other another satellite
	        if (Game.time % 100 === 0
	            && this.room.controller.level >= 6
	            && this.mineral.ticksToRegeneration > 10000
	            && this.storage.store.energy >= constants_1.SWAP_RESERVE
	            && this.terminal.store.energy >= 50000) {
	            console.log(this.name, "needs to swap out mining operations");
	            this.empire.engageSwap(this.room);
	        }
	    }
	    sellExcessMineral() {
	        if (this.room.controller.level < 6 || Game.time % 100 !== 1)
	            return; // early
	        let amount = this.room.terminal.store[this.mineral.mineralType];
	        let needtoSell = amount > 100000;
	        if (!needtoSell)
	            return; // early
	        console.log("TRADE: too much mineral in swap mission " + this.opName + ":", amount);
	        this.empire.sellExcess(this.room, this.mineral.mineralType, constants_1.RESERVE_AMOUNT);
	    }
	    swapMasonActions(mason) {
	        let ramparts = _.sortBy(this.room.findStructures(STRUCTURE_RAMPART), "hits");
	        if (ramparts.length === 0 || mason.pos.roomName !== this.flag.pos.roomName) {
	            this.idleNear(mason, this.flag);
	            return;
	        }
	        let hasLoad = this.hasLoad(mason);
	        if (!hasLoad) {
	            this.procureEnergy(mason);
	            return;
	        }
	        let range = mason.pos.getRangeTo(ramparts[0]);
	        if (range > 3) {
	            mason.blindMoveTo(ramparts[0]);
	        }
	        else {
	            mason.repair(ramparts[0]);
	            mason.yieldRoad(ramparts[0]);
	        }
	    }
	}
	exports.SwapMission = SwapMission;


/***/ },
/* 30 */
/*!*****************************************!*\
  !*** ./src/ai/missions/ClaimMission.ts ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class ClaimMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "claimer");
	    }
	    initMission() {
	        //if (!this.hasVision) return; // early
	        if (this.room) {
	            this.controller = this.room.controller;
	        }
	    }
	    roleCall() {
	        let needClaimer = (this.controller && !this.controller.my) || !this.hasVision;
	        let maxClaimers = needClaimer ? 1 : 0;
	        this.claimers = this.headCount("claimer", () => [CLAIM, MOVE], maxClaimers, { blindSpawn: true });
	    }
	    missionActions() {
	        for (let claimer of this.claimers) {
	            this.claimerActions(claimer);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    claimerActions(claimer) {
	        if (!this.controller) {
	            this.idleNear(claimer, this.flag);
	            return; // early
	        }
	        if (claimer.pos.isNearTo(this.controller)) {
	            claimer.claimController(this.controller);
	        }
	        else {
	            claimer.blindMoveTo(this.controller);
	        }
	    }
	}
	exports.ClaimMission = ClaimMission;


/***/ },
/* 31 */
/*!*****************************************************!*\
  !*** ./src/ai/missions/EnhancedBodyguardMission.ts ***!
  \*****************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ../missions/Mission */ 11);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class EnhancedBodyguardMission extends Mission_1.Mission {
	    constructor(operation, allowSpawn = true) {
	        super(operation, "defense", allowSpawn);
	    }
	    initMission() {
	        if (!this.hasVision)
	            return; // early
	        this.hostiles = _.filter(this.room.hostiles, (hostile) => hostile.owner.username !== "Source Keeper");
	        this.trackEnergyTillInvader();
	        if (!this.spawnGroup.room.terminal)
	            return;
	        if (this.memory.allowUnboosted === undefined) {
	            let store = this.spawnGroup.room.terminal.store;
	            this.memory.allowUnboosted = store[RESOURCE_CATALYZED_UTRIUM_ACID] >= 1000
	                && store[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE] >= 1000;
	        }
	        for (let id in this.memory.ticksToLive) {
	            let creep = Game.getObjectById(id);
	            if (creep)
	                continue;
	            let ticksToLive = this.memory.ticksToLive[id];
	            if (ticksToLive > 10 && this.memory.allowUnboosted) {
	                console.log("DEFENSE:", this.opName, "lost a leeroy, increasing potency");
	                this.memory.potencyUp = true;
	            }
	            else if (this.memory.potencyUp) {
	                console.log("DEFENSE:", this.opName, "leeroy died of old age, decreasing potency:");
	                this.memory.potencyUp = false;
	            }
	            delete this.memory.ticksToLive[id];
	        }
	    }
	    roleCall() {
	        let maxSquads = 0;
	        if (this.memory.invaderProbable) {
	            maxSquads = 1;
	        }
	        if (this.hasVision && this.hostiles.length > 0) {
	            maxSquads = 1;
	        }
	        let attackerMemory;
	        if (this.memory.potencyUp) {
	            attackerMemory = { boosts: [RESOURCE_CATALYZED_UTRIUM_ACID], allowUnboosted: true };
	        }
	        let healerMemory;
	        if (this.memory.potencyUp) {
	            healerMemory = { boosts: [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE], allowUnboosted: true };
	        }
	        let squadAttackerBody = () => {
	            if (this.memory.potencyUp) {
	                return this.configBody({
	                    [ATTACK]: 10,
	                    [RANGED_ATTACK]: 2,
	                    [MOVE]: 12
	                });
	            }
	            else {
	                return this.configBody({
	                    [ATTACK]: 20,
	                    [RANGED_ATTACK]: 5,
	                    [MOVE]: 25
	                });
	            }
	        };
	        let squadHealerBody = () => {
	            if (this.memory.potencyUp) {
	                return this.configBody({
	                    [TOUGH]: 8,
	                    [MOVE]: 12,
	                    [HEAL]: 4,
	                });
	            }
	            else {
	                return this.configBody({
	                    [TOUGH]: 4,
	                    [MOVE]: 16,
	                    [HEAL]: 12,
	                });
	            }
	        };
	        this.squadAttackers = this.headCount("lee", squadAttackerBody, maxSquads, { prespawn: 50, memory: attackerMemory, skipMoveToRoom: true });
	        this.squadHealers = this.headCount("roy", squadHealerBody, maxSquads, { prespawn: 50, memory: healerMemory, skipMoveToRoom: true });
	    }
	    missionActions() {
	        this.findPartnerships(this.squadAttackers, "attacker");
	        this.findPartnerships(this.squadHealers, "healer");
	        for (let attacker of this.squadAttackers) {
	            this.squadActions(attacker);
	        }
	        for (let healer of this.squadHealers) {
	            this.healerActions(healer);
	        }
	    }
	    finalizeMission() {
	        if (!this.memory.ticksToLive)
	            this.memory.ticksToLive = {};
	        for (let creep of this.squadAttackers) {
	            this.memory.ticksToLive[creep.id] = creep.ticksToLive;
	        }
	        for (let creep of this.squadHealers) {
	            this.memory.ticksToLive[creep.id] = creep.ticksToLive;
	        }
	    }
	    invalidateMissionCache() {
	        this.memory.allowUnboosted = undefined;
	    }
	    squadActions(attacker) {
	        // find healer, flee if there isn't one
	        let healer = Game.creeps[attacker.memory.partner];
	        if (!healer) {
	            attacker.memory.partner = undefined;
	            if (this.room && attacker.room.name === this.room.name) {
	                let fleeing = attacker.fleeHostiles();
	                if (fleeing)
	                    return;
	            }
	            this.idleNear(attacker, this.flag);
	            return;
	        }
	        if (healer.spawning) {
	            if (attacker.room.name === healer.room.name) {
	                attacker.idleOffRoad(this.spawnGroup.spawns[0]);
	            }
	            else {
	                attacker.blindMoveTo(this.spawnGroup.spawns[0]);
	            }
	            return;
	        }
	        // room is safe
	        if (!this.hostiles || this.hostiles.length === 0) {
	            healer.memory.mindControl = false;
	            this.idleNear(attacker, this.flag);
	            return;
	        }
	        let attacking = false;
	        let rangeAttacking = false;
	        healer.memory.mindControl = true;
	        let target = attacker.pos.findClosestByRange(_.filter(this.hostiles, (c) => c.partCount(HEAL) > 0));
	        if (!target) {
	            target = attacker.pos.findClosestByRange(this.hostiles);
	        }
	        if (!target && attacker.memory.targetId) {
	            target = Game.getObjectById(attacker.memory.targetId);
	            if (!target)
	                attacker.memory.targetId = undefined;
	        }
	        if (healer.hits < healer.hitsMax * .5 || attacker.hits < attacker.hitsMax * .5) {
	            this.memory.healUp = true;
	        }
	        if (this.memory.healUp === true) {
	            this.squadTravel(healer, attacker, this.spawnGroup.spawns[0]);
	            if (healer.hits > healer.hitsMax * .8 && attacker.hits > attacker.hitsMax * .8) {
	                this.memory.healUp = false;
	            }
	        }
	        else if (target) {
	            attacker.memory.targetId = target.id;
	            let range = attacker.pos.getRangeTo(target);
	            if (range === 1) {
	                attacker.rangedMassAttack();
	                attacking = attacker.attack(target) === OK;
	            }
	            else if (range <= 3) {
	                rangeAttacking = attacker.rangedAttack(target) === OK;
	            }
	            if (attacker.room.name !== target.room.name) {
	                this.squadTravel(attacker, healer, target);
	            }
	            else if (range > 3 || (range > 1 && !(Game.time - attacker.memory.fleeTick === 1))) {
	                this.squadTravel(attacker, healer, target, { maxRooms: 1 });
	            }
	            else if (range > 1) {
	                let fleePath = PathFinder.search(target.pos, { pos: attacker.pos, range: 5 }, { flee: true, maxRooms: 1 });
	                // will only flee-bust  on consecutive ticks
	                if (fleePath.incomplete || !fleePath.path[1] || !fleePath.path[1].isNearExit(0)) {
	                    this.squadTravel(attacker, healer, target, { maxRooms: 1, ignoreRoads: true });
	                }
	                else {
	                    attacker.memory.fleeTick = Game.time;
	                    this.squadTravel(attacker, healer, { pos: fleePath.path[1] }, { maxRooms: 1, ignoreRoads: true });
	                }
	            }
	            else {
	                if (!target.isNearExit(0)) {
	                    // directly adjacent, move on to same position
	                    this.squadTravel(attacker, healer, target);
	                }
	                else {
	                    let direction = attacker.pos.getDirectionTo(target);
	                    if (direction % 2 === 1)
	                        return; // not a diagonal position, already in best position;
	                    let clockwisePosition = attacker.pos.getPositionAtDirection(helper_1.helper.clampDirection(direction + 1));
	                    if (!clockwisePosition.isNearExit(0)) {
	                        this.squadTravel(attacker, healer, { pos: clockwisePosition });
	                    }
	                    else {
	                        let counterClockwisePosition = attacker.pos.getPositionAtDirection(helper_1.helper.clampDirection(direction - 1));
	                        this.squadTravel(attacker, healer, { pos: counterClockwisePosition });
	                    }
	                }
	            }
	        }
	        else {
	            this.squadTravel(attacker, healer, this.flag);
	        }
	        let closest = attacker.pos.findClosestByRange(this.hostiles);
	        if (closest) {
	            let range = attacker.pos.getRangeTo(closest);
	            if (!attacking && range === 1) {
	                attacker.attack(closest);
	                if (!rangeAttacking) {
	                    rangeAttacking = true;
	                    attacker.rangedMassAttack();
	                }
	            }
	            if (!rangeAttacking && range <= 3) {
	                attacker.rangedAttack(closest);
	            }
	        }
	    }
	    healerActions(healer) {
	        if (!this.hostiles || this.hostiles.length === 0) {
	            if (healer.hits < healer.hitsMax) {
	                healer.heal(healer);
	            }
	            else {
	                this.healHurtCreeps(healer);
	            }
	            return;
	        }
	        // hostiles in room
	        let attacker = Game.creeps[healer.memory.partner];
	        if (!attacker) {
	            healer.memory.partner = undefined;
	        }
	        if (!attacker || attacker.spawning) {
	            if (healer.hits < healer.hitsMax) {
	                healer.heal(healer);
	            }
	            if (attacker && attacker.room.name === healer.room.name) {
	                healer.idleOffRoad(this.spawnGroup.spawns[0]);
	            }
	            else {
	                healer.blindMoveTo(this.spawnGroup.spawns[0]);
	            }
	            return;
	        }
	        // attacker is partnered and spawned
	        let range = healer.pos.getRangeTo(attacker);
	        if (range <= 3) {
	            if (attacker.hitsMax - attacker.hits > healer.hitsMax - healer.hits) {
	                if (range > 1) {
	                    healer.rangedHeal(attacker);
	                }
	                else {
	                    healer.heal(attacker);
	                }
	            }
	            else {
	                healer.heal(healer);
	            }
	        }
	        else if (healer.hits < healer.hitsMax) {
	            healer.heal(healer);
	        }
	    }
	    findHurtCreep(defender) {
	        if (!this.room)
	            return;
	        if (defender.memory.healId) {
	            let creep = Game.getObjectById(defender.memory.healId);
	            if (creep && creep.room.name === defender.room.name && creep.hits < creep.hitsMax) {
	                return creep;
	            }
	            else {
	                defender.memory.healId = undefined;
	                return this.findHurtCreep(defender);
	            }
	        }
	        else if (!defender.memory.healCheck || Game.time - defender.memory.healCheck > 25) {
	            defender.memory.healCheck = Game.time;
	            if (!this.hurtCreeps || this.hurtCreeps.length === 0) {
	                this.hurtCreeps = this.room.find(FIND_MY_CREEPS, { filter: (c) => {
	                        return c.hits < c.hitsMax && c.ticksToLive > 100 && c.partCount(WORK) > 0;
	                    } });
	            }
	            if (this.hurtCreeps.length === 0) {
	                this.hurtCreeps = this.room.find(FIND_MY_CREEPS, { filter: (c) => {
	                        return c.hits < c.hitsMax && c.ticksToLive > 100 && c.partCount(CARRY) > 0 && c.carry.energy < c.carryCapacity;
	                    } });
	            }
	            if (this.hurtCreeps.length > 0) {
	                let closest = defender.pos.findClosestByRange(this.hurtCreeps);
	                if (closest) {
	                    this.hurtCreeps = _.pull(this.hurtCreeps, closest);
	                    defender.memory.healId = closest.id;
	                    return closest;
	                }
	            }
	        }
	    }
	    healHurtCreeps(defender) {
	        let hurtCreep = this.findHurtCreep(defender);
	        if (!hurtCreep) {
	            this.idleNear(defender, this.flag);
	            return;
	        }
	        // move to creep
	        let range = defender.pos.getRangeTo(hurtCreep);
	        if (range > 1) {
	            defender.blindMoveTo(hurtCreep, { maxRooms: 1 });
	        }
	        else {
	            defender.yieldRoad(hurtCreep);
	        }
	        if (range === 1) {
	            defender.heal(hurtCreep);
	        }
	        else if (range <= 3) {
	            defender.rangedHeal(hurtCreep);
	        }
	    }
	    squadTravel(attacker, healer, target, ops) {
	        let healerOps = {};
	        if (attacker.room.name === healer.room.name) {
	            healerOps.maxRooms = 1;
	        }
	        let range = attacker.pos.getRangeTo(healer);
	        if (attacker.pos.isNearExit(1)) {
	            attacker.blindMoveTo(target, ops);
	            healer.blindMoveTo(attacker);
	        }
	        else if (attacker.room.name !== healer.room.name) {
	            if (healer.isNearExit(1)) {
	                attacker.blindMoveTo(target, ops);
	            }
	            healer.blindMoveTo(attacker);
	        }
	        else if (range > 2) {
	            attacker.blindMoveTo(healer, ops);
	            healer.blindMoveTo(attacker, ops, true);
	        }
	        else if (range === 2) {
	            healer.blindMoveTo(attacker, ops, true);
	        }
	        else if ((attacker.fatigue === 0 && healer.fatigue === 0)) {
	            if (attacker.pos.isNearTo(target)) {
	                attacker.move(attacker.pos.getDirectionTo(target));
	            }
	            else {
	                attacker.blindMoveTo(target);
	            }
	            healer.move(healer.pos.getDirectionTo(attacker));
	        }
	    }
	    trackEnergyTillInvader() {
	        if (!this.memory.invaderTrack) {
	            this.memory.invaderTrack = { energyHarvested: 0, tickLastSeen: Game.time, energyPossible: 0, log: [] };
	        }
	        let memory = this.memory.invaderTrack;
	        // filter source keepers
	        let hostiles = this.hostiles;
	        let harvested = 0;
	        let possible = 0;
	        let sources = this.room.find(FIND_SOURCES);
	        for (let source of sources) {
	            if (source.ticksToRegeneration === 1) {
	                harvested += source.energyCapacity - source.energy;
	                possible += source.energyCapacity;
	            }
	        }
	        memory.energyHarvested += harvested;
	        memory.energyPossible += possible;
	        if (sources.length === 3) {
	            this.memory.invaderProbable = memory.energyHarvested > 65000;
	        }
	        else if (sources.length === 2 && Game.time - memory.tickLastSeen < 20000) {
	            this.memory.invaderProbable = memory.energyHarvested > 75000;
	        }
	        else if (sources.length === 1 && Game.time - memory.tickLastSeen < 20000) {
	            this.memory.invaderProbable = memory.energyHarvested > 90000;
	        }
	        else {
	            this.memory.invaderProbable = false;
	        }
	        if (hostiles.length > 0 && Game.time - memory.tickLastSeen > 1500) {
	            // reset trackers
	            memory.energyPossible = 0;
	            memory.energyHarvested = 0;
	            memory.tickLastSeen = Game.time;
	        }
	    }
	}
	exports.EnhancedBodyguardMission = EnhancedBodyguardMission;


/***/ },
/* 32 */
/*!**********************************************!*\
  !*** ./src/ai/operations/KeeperOperation.ts ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const ScoutMission_1 = __webpack_require__(/*! ../missions/ScoutMission */ 25);
	const MiningMission_1 = __webpack_require__(/*! ../missions/MiningMission */ 18);
	const RemoteBuildMission_1 = __webpack_require__(/*! ../missions/RemoteBuildMission */ 26);
	const GeologyMission_1 = __webpack_require__(/*! ../missions/GeologyMission */ 22);
	const LairMission_1 = __webpack_require__(/*! ../missions/LairMission */ 33);
	const EnhancedBodyguardMission_1 = __webpack_require__(/*! ../missions/EnhancedBodyguardMission */ 31);
	class KeeperOperation extends Operation_1.Operation {
	    /**
	     * Remote mining, spawns Scout if there is no vision, spawns a MiningMission for each source in the room. Can also
	     * mine minerals from core rooms
	     * @param flag
	     * @param name
	     * @param type
	     * @param empire
	     */
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	    }
	    initOperation() {
	        this.findOperationWaypoints();
	        if (this.waypoints.length > 0 && !this.memory.spawnRoom) {
	            console.log("SPAWN: waypoints detected, manually set spawn room, example:", this.name +
	                ".setSpawnRoom(otherOpName.flag.room.name)");
	            return;
	        }
	        this.spawnGroup = this.getRemoteSpawnGroup();
	        if (!this.spawnGroup) {
	            console.log("ATTN: no spawnGroup found for", this.name);
	            return; // early
	        }
	        this.addMission(new ScoutMission_1.ScoutMission(this));
	        this.addMission(new EnhancedBodyguardMission_1.EnhancedBodyguardMission(this));
	        this.addMission(new LairMission_1.LairMission(this));
	        if (!this.hasVision)
	            return; // early
	        for (let i = 0; i < this.sources.length; i++) {
	            if (this.sources[i].pos.lookFor(LOOK_FLAGS).length > 0)
	                continue;
	            this.addMission(new MiningMission_1.MiningMission(this, "miner" + i, this.sources[i]));
	        }
	        this.addMission(new RemoteBuildMission_1.RemoteBuildMission(this, true));
	        if (this.mineral.pos.lookFor(LOOK_FLAGS).length === 0) {
	            this.addMission(new GeologyMission_1.GeologyMission(this));
	        }
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	        if (Math.random() < .01) {
	            this.memory.spawnRooms = undefined;
	        }
	    }
	    buildKeeperRoads(operation, segments = [0, 1, 2, 3, 4]) {
	        let opFlag = Game.flags["keeper_" + operation];
	        _.forEach(segments, function (segment) {
	            let path = KeeperOperation.getKeeperPath(operation, segment);
	            _.forEach(path, function (p) {
	                opFlag.room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
	            });
	        });
	    }
	    static getKeeperPath(operation, segment) {
	        let A;
	        if (segment === 0) {
	            A = Game.flags["keeper_" + operation];
	        }
	        else {
	            A = Game.flags[operation + "_lair:" + (segment - 1)];
	        }
	        let B;
	        B = Game.flags[operation + "_lair:" + segment];
	        if (!B) {
	            B = Game.flags[operation + "_lair:0"];
	        }
	        if (!A || !B) {
	            return;
	        }
	        let r = Game.rooms[A.pos.roomName];
	        if (!r) {
	            return;
	        }
	        if (!_.isEmpty(A.pos.findInRange(FIND_SOURCES, 6))) {
	            A = A.pos.findInRange(FIND_SOURCES, 6)[0];
	        }
	        if (!_.isEmpty(B.pos.findInRange(FIND_SOURCES, 6))) {
	            B = B.pos.findInRange(FIND_SOURCES, 6)[0];
	        }
	        if (!_.isEmpty(A.pos.findInRange(FIND_MINERALS, 6))) {
	            A = A.pos.findInRange(FIND_MINERALS, 6)[0];
	        }
	        if (!_.isEmpty(B.pos.findInRange(FIND_MINERALS, 6))) {
	            B = B.pos.findInRange(FIND_MINERALS, 6)[0];
	        }
	        return A.pos.findPathTo(B.pos, { ignoreCreeps: true });
	    }
	}
	exports.KeeperOperation = KeeperOperation;


/***/ },
/* 33 */
/*!****************************************!*\
  !*** ./src/ai/missions/LairMission.ts ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class LairMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "lair");
	    }
	    initMission() {
	        if (!this.hasVision)
	            return; // early
	        // should be ordered in a preferable travel order
	        this.lairs = _.filter(this.room.findStructures(STRUCTURE_KEEPER_LAIR), (s) => s.pos.lookFor(LOOK_FLAGS).length === 0);
	        if (!this.memory.travelOrder || this.memory.travelOrder.length !== this.lairs.length) {
	        }
	        this.distanceToSpawn = this.findDistanceToSpawn(this.flag.pos);
	        this.assignKeepers();
	        this.targetLair = this.findTargetLair();
	        if (this.waypoints) {
	            let destination = Game.flags[this.opName + "_sourceDestination"];
	            if (destination) {
	                let structure = destination.pos.lookFor(LOOK_STRUCTURES)[0];
	                if (structure) {
	                    this.storeStructure = structure;
	                }
	            }
	        }
	        else {
	            this.storeStructure = this.spawnGroup.room.storage;
	        }
	    }
	    roleCall() {
	        let maxTrappers = this.lairs && this.lairs.length > 0 ? 1 : 0;
	        this.trappers = this.headCount("trapper", () => this.configBody({ move: 25, attack: 19, heal: 6 }), maxTrappers, {
	            prespawn: this.distanceToSpawn + 100,
	            skipMoveToRoom: true,
	        });
	        let maxScavengers = this.lairs && this.lairs.length >= 3 && this.storeStructure ? 1 : 0;
	        let body = () => this.workerBody(0, 33, 17);
	        this.scavengers = this.headCount("scavenger", body, maxScavengers, 50);
	    }
	    missionActions() {
	        for (let trapper of this.trappers) {
	            this.trapperActions(trapper);
	        }
	        for (let scavenger of this.scavengers) {
	            this.scavengersActions(scavenger);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    trapperActions(trapper) {
	        if (trapper.pos.roomName !== this.flag.pos.roomName || !this.targetLair) {
	            if (trapper.hits < trapper.hitsMax) {
	                trapper.heal(trapper);
	            }
	            trapper.blindMoveTo(this.flag);
	            return; // early
	        }
	        let isAttacking = false;
	        let nearestHostile = trapper.pos.findClosestByRange(this.room.hostiles);
	        if (nearestHostile && trapper.pos.isNearTo(nearestHostile)) {
	            isAttacking = trapper.attack(nearestHostile) === OK;
	            trapper.move(trapper.pos.getDirectionTo(nearestHostile));
	        }
	        let keeper = this.targetLair.keeper;
	        let range;
	        if (keeper) {
	            range = trapper.pos.getRangeTo(keeper);
	            if (range > 1) {
	                trapper.blindMoveTo(keeper, { maxRooms: 1 });
	            }
	        }
	        else {
	            trapper.blindMoveTo(this.targetLair, { maxRooms: 1 });
	        }
	        if (!isAttacking && (trapper.hits < trapper.hitsMax || range <= 3)) {
	            trapper.heal(trapper);
	        }
	    }
	    scavengersActions(scavenger) {
	        let fleeing = scavenger.fleeHostiles();
	        if (fleeing)
	            return; // early
	        let hasLoad = this.hasLoad(scavenger);
	        if (hasLoad) {
	            let storage = this.storeStructure;
	            if (scavenger.pos.isNearTo(storage)) {
	                scavenger.transfer(storage, RESOURCE_ENERGY);
	                scavenger.blindMoveTo(this.flag);
	            }
	            else {
	                scavenger.blindMoveTo(storage);
	            }
	            return;
	        }
	        if (scavenger.room.name !== this.flag.pos.roomName) {
	            this.idleNear(scavenger, this.flag);
	            return; // early;
	        }
	        let closest = this.findDroppedEnergy(scavenger);
	        if (closest) {
	            if (scavenger.pos.isNearTo(closest)) {
	                scavenger.pickup(closest);
	                scavenger.say("yoink!", true);
	            }
	            else {
	                scavenger.blindMoveTo(closest, { maxRooms: 1 });
	            }
	        }
	        else {
	            this.idleNear(scavenger, this.flag);
	        }
	    }
	    assignKeepers() {
	        if (!this.lairs)
	            return;
	        let lairs = this.room.findStructures(STRUCTURE_KEEPER_LAIR);
	        let hostiles = this.room.hostiles;
	        for (let hostile of hostiles) {
	            if (hostile.owner.username === "Source Keeper") {
	                let closestLair = hostile.pos.findClosestByRange(lairs);
	                if (!_.includes(this.lairs, closestLair))
	                    continue;
	                closestLair.keeper = hostile;
	            }
	        }
	    }
	    findTargetLair() {
	        if (this.lairs.length > 0) {
	            let lowestTicks = Number.MAX_VALUE;
	            let lowestLair;
	            for (let lair of this.lairs) {
	                let lastTicks = 0;
	                if (lair.keeper) {
	                    return lair;
	                }
	                else {
	                    // if this lair is going to spawn sooner than the last one in the list, return it
	                    if (lair.ticksToSpawn < lastTicks) {
	                        return lair;
	                    }
	                    lastTicks = lair.ticksToSpawn;
	                    if (lair.ticksToSpawn < lowestTicks) {
	                        lowestLair = lair;
	                        lowestTicks = lair.ticksToSpawn;
	                    }
	                }
	            }
	            return lowestLair;
	        }
	    }
	    findDroppedEnergy(scavenger) {
	        if (scavenger.memory.resourceId) {
	            let resource = Game.getObjectById(scavenger.memory.resourceId);
	            if (resource) {
	                return resource;
	            }
	            else {
	                scavenger.memory.resourceId = undefined;
	                return this.findDroppedEnergy(scavenger);
	            }
	        }
	        else {
	            let resource = scavenger.pos.findClosestByRange(_.filter(this.room.find(FIND_DROPPED_RESOURCES), (r) => r.amount > 100 && r.resourceType === RESOURCE_ENERGY));
	            if (resource) {
	                scavenger.memory.resourceId = resource.id;
	                return resource;
	            }
	        }
	    }
	    findTravelOrder(lairs) {
	    }
	}
	exports.LairMission = LairMission;


/***/ },
/* 34 */
/*!************************************************!*\
  !*** ./src/ai/operations/ConquestOperation.ts ***!
  \************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const RefillMission_1 = __webpack_require__(/*! ../missions/RefillMission */ 12);
	const DefenseMission_1 = __webpack_require__(/*! ../missions/DefenseMission */ 13);
	const MiningMission_1 = __webpack_require__(/*! ../missions/MiningMission */ 18);
	const LinkNetworkMission_1 = __webpack_require__(/*! ../missions/LinkNetworkMission */ 20);
	const UpgradeMission_1 = __webpack_require__(/*! ../missions/UpgradeMission */ 21);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const ScoutMission_1 = __webpack_require__(/*! ../missions/ScoutMission */ 25);
	const BodyguardMission_1 = __webpack_require__(/*! ../missions/BodyguardMission */ 28);
	const TransportMission_1 = __webpack_require__(/*! ../missions/TransportMission */ 35);
	const ClaimMission_1 = __webpack_require__(/*! ../missions/ClaimMission */ 30);
	const RemoteBuildMission_1 = __webpack_require__(/*! ../missions/RemoteBuildMission */ 26);
	const CONQUEST_MASON_POTENCY = 4;
	const CONQUEST_LOCAL_MIN_SPAWN_ENERGY = 1300;
	class ConquestOperation extends Operation_1.Operation {
	    /**
	     * Facilitates the establishment of new owned-rooms by spawning necessary creeps from a nearby room. Will spawn a
	     * claimer as needed. Spawning responsibilities can be changed-over to the local room by simply removing this operation
	     * flag and replacing it with a FortOperation flag of the same name
	     * @param flag
	     * @param name
	     * @param type
	     * @param empire
	     */
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	        this.priority = constants_1.OperationPriority.Medium;
	    }
	    initOperation() {
	        this.findOperationWaypoints();
	        if (!this.memory.spawnRoom) {
	            if (Game.time % 3 === 0) {
	                console.log(this.name, "needs a spawn room, example:", this.name + ".setSpawnRoom(otherOpName.flag.room.name)");
	            }
	            return; // early
	        }
	        this.spawnGroup = this.empire.getSpawnGroup(this.memory.spawnRoom);
	        if (!this.spawnGroup) {
	            console.log("Invalid spawn room specified for", this.name);
	            return;
	        }
	        this.addMission(new ScoutMission_1.ScoutMission(this));
	        if (!this.hasVision || !this.flag.room.controller.my) {
	            this.addMission(new ClaimMission_1.ClaimMission(this));
	        }
	        if (!this.hasVision)
	            return; // early
	        if (this.flag.room.findStructures(STRUCTURE_TOWER).length === 0) {
	            this.addMission(new BodyguardMission_1.BodyguardMission(this));
	        }
	        // build construction
	        this.addMission(new RemoteBuildMission_1.RemoteBuildMission(this, false));
	        // upgrader controller
	        this.addMission(new UpgradeMission_1.UpgradeMission(this, true));
	        // bring in energy from spawnroom (requires a flag with name "opName_destination" be placed on controller battery)
	        let destinationFlag = Game.flags[`${this.name}_destination`];
	        if (destinationFlag && this.memory.maxTransportCarts) {
	            let storage = this.spawnGroup.room.storage;
	            let storeStructure = destinationFlag.pos.lookFor(LOOK_STRUCTURES)[0];
	            if (storage && storeStructure) {
	                let maxCarts = 5 * Game.map.getRoomLinearDistance(storage.pos.roomName, storeStructure.pos.roomName);
	                if (this.memory.maxTransportCarts) {
	                    maxCarts = this.memory.maxTransportCarts;
	                }
	                let offRoadTransport = false;
	                if (this.memory.offRoadTransport) {
	                    offRoadTransport = this.memory.offRoadTransport;
	                }
	                this.addMission(new TransportMission_1.TransportMission(this, maxCarts, storage, storeStructure, RESOURCE_ENERGY, offRoadTransport));
	            }
	        }
	        // the following can be spawned locally
	        let localSpawnGroup = this.empire.getSpawnGroup(this.flag.room.name);
	        if (localSpawnGroup && localSpawnGroup.maxSpawnEnergy >= CONQUEST_LOCAL_MIN_SPAWN_ENERGY) {
	            this.waypoints = undefined;
	            this.spawnGroup = localSpawnGroup;
	            this.addMission(new RefillMission_1.RefillMission(this));
	        }
	        for (let i = 0; i < this.sources.length; i++) {
	            if (this.sources[i].pos.lookFor(LOOK_FLAGS).length > 0)
	                continue;
	            this.addMission(new MiningMission_1.MiningMission(this, "miner" + i, this.sources[i]));
	        }
	        // use link array near storage to fire energy at controller link (pre-rcl8)
	        this.addMission(new LinkNetworkMission_1.LinkNetworkMission(this));
	        // shoot towers and refill
	        this.addMission(new DefenseMission_1.DefenseMission(this));
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	    }
	}
	exports.ConquestOperation = ConquestOperation;


/***/ },
/* 35 */
/*!*********************************************!*\
  !*** ./src/ai/missions/TransportMission.ts ***!
  \*********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class TransportMission extends Mission_1.Mission {
	    constructor(operation, maxCarts, origin, destination, resourceType, offroad = false) {
	        super(operation, "transport");
	        this.maxCarts = maxCarts;
	        if (origin) {
	            this.origin = origin;
	            this.memory.originPos = origin.pos;
	        }
	        if (destination) {
	            this.destination = destination;
	            this.memory.destinationPos = destination.pos;
	        }
	        this.resourceType = resourceType;
	        this.offroad = offroad;
	    }
	    initMission() {
	        this.waypoints = [];
	        if (!this.origin) {
	            let originFlag = Game.flags[this.opName + "_origin"];
	            if (originFlag) {
	                this.memory.originPos = originFlag.pos;
	                if (originFlag.room) {
	                    this.origin = originFlag.pos.lookFor(LOOK_STRUCTURES)[0];
	                }
	            }
	        }
	        if (!this.destination) {
	            let destinationFlag = Game.flags[this.opName + "_destination"];
	            if (destinationFlag) {
	                this.memory.destinationPos = destinationFlag.pos;
	                if (destinationFlag.room) {
	                    this.destination = destinationFlag.pos.lookFor(LOOK_STRUCTURES)[0];
	                }
	            }
	        }
	        this.waypoints = this.getFlagSet("_waypoints_", 1);
	    }
	    roleCall() {
	        let body = () => {
	            if (this.offroad) {
	                return this.bodyRatio(0, 1, 1, 1);
	            }
	            else {
	                return this.bodyRatio(0, 2, 1, 1);
	            }
	        };
	        let memory = { scavanger: this.resourceType, prep: true };
	        this.carts = this.headCount("cart", body, this.maxCarts, { memory: memory });
	    }
	    missionActions() {
	        for (let cart of this.carts) {
	            if (!this.memory.originPos || !this.memory.destinationPos) {
	                this.idleNear(cart, this.flag);
	            }
	            this.cartActions(cart);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    cartActions(cart) {
	        let hasLoad = this.hasLoad(cart);
	        if (!hasLoad) {
	            if (!this.origin) {
	                let originPos = helper_1.helper.deserializeRoomPosition(this.memory.originPos);
	                cart.blindMoveTo(originPos);
	            }
	            else if (!cart.pos.isNearTo(this.origin)) {
	                cart.blindMoveTo(this.origin);
	            }
	            else {
	                let outcome;
	                if (this.resourceType) {
	                    outcome = cart.withdraw(this.origin, this.resourceType);
	                }
	                else if (this.origin instanceof StructureLab) {
	                    outcome = cart.withdraw(this.origin, this.origin.mineralType);
	                }
	                else {
	                    outcome = cart.withdrawEverything(this.origin);
	                }
	                if (outcome === OK) {
	                    cart.blindMoveTo(this.destination);
	                }
	            }
	            return; // early
	        }
	        // hasLoad = true
	        if (!this.destination) {
	            let destinationPos = helper_1.helper.deserializeRoomPosition(this.memory.destinationPos);
	            cart.blindMoveTo(destinationPos);
	        }
	        else if (!cart.pos.isNearTo(this.destination)) {
	            cart.blindMoveTo(this.destination);
	        }
	        else {
	            let outcome;
	            if (this.resourceType) {
	                outcome = cart.transfer(this.destination, this.resourceType);
	            }
	            else {
	                outcome = cart.transferEverything(this.destination);
	            }
	            if (outcome === OK) {
	                cart.blindMoveTo(this.origin);
	            }
	        }
	    }
	}
	exports.TransportMission = TransportMission;


/***/ },
/* 36 */
/*!****************************************!*\
  !*** ./src/helpers/consoleCommands.ts ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const constants_1 = __webpack_require__(/*! ../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ./helper */ 5);
	exports.consoleCommands = {
	    /**
	     * Remove construction sites from a room
	     * @param roomName
	     * @param leaveProgressStarted - leave sites already started
	     * @param structureType
	     */
	    removeConstructionSites(roomName, leaveProgressStarted = true, structureType) {
	        Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES).forEach((site) => {
	            if ((!structureType || site.structureType === structureType) && (!leaveProgressStarted || site.progress === 0)) {
	                site.remove();
	            }
	        });
	    },
	    // shorthand
	    rc(roomName, leaveProgressStarted, structureType) {
	        this.removeConstructionSites(roomName, leaveProgressStarted, structureType);
	    },
	    /**
	     * Remove all flags that contain a substring in the name, good for wiping out a previously used operation
	     * @param substr
	     */
	    removeFlags(substr) {
	        _.forEach(Game.flags, (flag) => {
	            if (_.includes(flag.name, substr)) {
	                console.log(`removing flag ${flag.name} in ${flag.pos.roomName}`);
	                flag.remove();
	            }
	        });
	    },
	    // shorthand
	    rf(substr) {
	        this.removeFlags(substr);
	    },
	    /**
	     * Displays all total raw minerals in every storage/terminal
	     */
	    minv() {
	        for (let mineralType of constants_1.MINERALS_RAW) {
	            console.log(mineralType + ":", emp.inventory[mineralType]);
	        }
	    },
	    /**
	     * Displays all final compounds in every storage/terminal
	     */
	    pinv() {
	        for (let mineralType of constants_1.PRODUCT_LIST) {
	            console.log(mineralType + ":", emp.inventory[mineralType]);
	        }
	    },
	    testCode() {
	        // test code
	    },
	    /**
	     * remove most memory while leaving more important stuff intact, strongly not recommended unless you know what you are
	     * doing
	     */
	    wipeMemory() {
	        for (let flagName in Memory.flags) {
	            let flag = Game.flags[flagName];
	            if (flag) {
	                for (let propertyName of Object.keys(flag.memory)) {
	                    if (propertyName === "swapMining")
	                        continue;
	                    if (propertyName === "powerMining")
	                        continue;
	                    if (propertyName === "power")
	                        continue;
	                    if (propertyName === "spawnRoom")
	                        continue;
	                    if (propertyName === "distance")
	                        continue;
	                    if (propertyName === "centerPosition")
	                        continue;
	                    if (propertyName === "rotation")
	                        continue;
	                    if (propertyName === "radius")
	                        continue;
	                    if (propertyName === "layoutMap")
	                        continue;
	                    delete flag.memory[propertyName];
	                }
	            }
	            else {
	                delete Memory.flags[flagName];
	            }
	        }
	        for (let creepName in Memory.creeps) {
	            let creep = Game.creeps[creepName];
	            if (!creep) {
	                delete Memory.creeps[creepName];
	            }
	        }
	    },
	    /**
	     * remove old properties in memory that are no longer being used by the AI
	     */
	    removeUnusedProperties() {
	        delete Memory.empire["allyForts"];
	        delete Memory.empire["allySwaps"];
	        for (let flagName in Memory.flags) {
	            let flag = Game.flags[flagName];
	            if (flag) {
	                let mem = Memory.flags[flagName];
	                delete mem.network;
	            }
	            else {
	                delete Memory.flags[flagName];
	            }
	        }
	        for (let creepName in Memory.creeps) {
	            let creep = Game.creeps[creepName];
	            if (!creep) {
	                delete Memory.creeps[creepName];
	            }
	        }
	    },
	    removeMissionData(missionName) {
	        for (let flagName in Memory.flags) {
	            delete Memory.flags[flagName][missionName];
	        }
	    },
	    /**
	     * find which rooms contain a resource type in terminal
	     * @param resourceType
	     */
	    findResource(resourceType) {
	        for (let terminal of emp.terminals) {
	            if (terminal.store[resourceType]) {
	                console.log(terminal.room.name, terminal.store[resourceType]);
	            }
	        }
	    },
	    /**
	     * Empty resources from a terminal, will only try to send one resource each tick so this must be called repeatedly
	     * on multiple ticks with the same arguments to completely empty a terminal
	     * @param origin
	     * @param destination
	     * @returns {any}
	     */
	    emptyTerminal(origin, destination) {
	        let originTerminal = Game.rooms[origin].terminal;
	        let outcome;
	        for (let resourceType in originTerminal.store) {
	            if (!originTerminal.store.hasOwnProperty(resourceType))
	                continue;
	            let amount = originTerminal.store[resourceType];
	            if (amount >= 100) {
	                if (resourceType !== RESOURCE_ENERGY) {
	                    outcome = originTerminal.send(resourceType, amount, destination);
	                    break;
	                }
	                else if (Object.keys(originTerminal.store).length === 1) {
	                    let distance = Game.map.getRoomLinearDistance(origin, destination, true);
	                    let stored = originTerminal.store.energy;
	                    let amountSendable = Math.floor(stored / (1 + 0.1 * distance));
	                    console.log("sending", amountSendable, "out of", stored);
	                    outcome = originTerminal.send(RESOURCE_ENERGY, amountSendable, destination);
	                }
	            }
	        }
	        return outcome;
	    },
	    /**
	     * Changes the name of an operation, giving it a new flag. May result in some unintended consequences
	     * @param opName
	     * @param newOpName
	     * @returns {any}
	     */
	    changeOpName(opName, newOpName) {
	        let operation = Game.operations[opName];
	        if (!operation)
	            return "you don't have an operation by that name";
	        let newFlagName = operation.type + "_" + newOpName;
	        let outcome = operation.flag.pos.createFlag(newFlagName, operation.flag.color, operation.flag.secondaryColor);
	        if (_.isString(outcome)) {
	            Memory.flags[newFlagName] = operation.memory;
	            operation.flag.remove();
	            return `success, changed ${opName} to ${newOpName} (removing old flag)`;
	        }
	        else {
	            return "error changing name: " + outcome;
	        }
	    },
	    /**
	     * Place an order for a resource to be sent to any room. Good for making one-time deals.
	     * @param resourceType
	     * @param amount
	     * @param roomName
	     * @param efficiency - the number of terminals that should send the resource per tick, use a lower number to only send
	     * from the nearest terminals
	     * @returns {any}
	     */
	    order(resourceType, amount, roomName, efficiency = 10) {
	        if (!(amount > 0)) {
	            return "usage: order(resourceType, amount, roomName, efficiency?)";
	        }
	        if (Game.map.getRoomLinearDistance("E0S0", roomName) < 0) {
	            return "usage: order(resourceType, amount, roomName, efficiency?)";
	        }
	        if (efficiency <= 0) {
	            return "efficiency must be >= 1";
	        }
	        Memory.resourceOrder[Game.time] = { resourceType: resourceType, amount: amount, roomName: roomName,
	            efficiency: efficiency, amountSent: 0 };
	        return "TRADE: scheduling " + amount + " " + resourceType + " to be sent to " + roomName;
	    },
	    /**
	     * One-time send resource from all terminals to a specific room. For more control use cc.order()
	     * @param resourceType
	     * @param amount
	     * @param roomName
	     */
	    sendFromAll(resourceType, amount, roomName) {
	        _.forEach(Game.rooms, (room) => {
	            if (room.controller && room.controller.level > 6 && room.terminal && room.terminal.my) {
	                let outcome = room.terminal.send(resourceType, amount, roomName);
	                console.log(room.name, " sent ", amount, " to ", roomName);
	            }
	        });
	    },
	    patchTraderMemory() {
	        for (let username in Memory.traders) {
	            let data = Memory.traders[username];
	            if (data.recieved) {
	                for (let resourceType in data.recieved) {
	                    let amount = data.recieved[resourceType];
	                    if (data[resourceType] === undefined)
	                        data[resourceType] = 0;
	                    data[resourceType] += amount;
	                }
	            }
	            if (data.sent) {
	                for (let resourceType in data.sent) {
	                    let amount = data.sent[resourceType];
	                    if (data[resourceType] === undefined)
	                        data[resourceType] = 0;
	                    data[resourceType] -= amount;
	                }
	            }
	            delete data.recieved;
	            delete data.sent;
	        }
	    },
	    /**
	     * If this looks silly it is because it is, I used to it go from one naming convention to another
	     * @param opName
	     * @returns {any}
	     */
	    roomConvention(opName, alternate) {
	        let controllerOp = Game.operations[opName + 0];
	        if (!controllerOp) {
	            return "owned room doesn't exist";
	        }
	        for (let direction = 1; direction <= 8; direction++) {
	            let tempName = opName + "temp" + direction;
	            if (!Game.operations[tempName])
	                continue;
	            console.log(`found temp ${tempName}`);
	            let desiredName = opName + direction;
	            let currentOp = Game.operations[desiredName];
	            if (currentOp) {
	                console.log(`current op with that name, changing name to temp`);
	                let tempDir = helper_1.helper.findRelativeRoomDir(controllerOp.flag.room.name, currentOp.flag.room.name);
	                return this.changeOpName(desiredName, opName + "temp" + tempDir);
	            }
	            console.log(`no temp conflicts`);
	            return this.changeOpName(tempName, desiredName);
	        }
	        for (let direction = 1; direction <= 9; direction++) {
	            let testOpName = opName + direction;
	            let testOp = Game.operations[testOpName];
	            if (!testOp && alternate) {
	                testOp = Game.operations[alternate + direction];
	                if (testOp) {
	                    testOpName = alternate + direction;
	                }
	            }
	            if (!testOp) {
	                continue;
	            }
	            let correctDir = helper_1.helper.findRelativeRoomDir(controllerOp.flag.room.name, testOp.flag.room.name);
	            if (correctDir === direction) {
	                continue;
	            }
	            let correctOpName = opName + correctDir;
	            console.log(`inconsistent name (${testOpName} at dir ${correctDir} should be ${correctOpName})`);
	            let currentOp = Game.operations[correctOpName];
	            if (currentOp) {
	                console.log(`current op with that name, changing name to temp`);
	                let tempDir = helper_1.helper.findRelativeRoomDir(controllerOp.flag.room.name, currentOp.flag.room.name);
	                return this.changeOpName(correctOpName, opName + "temp" + tempDir);
	            }
	            else {
	                console.log(`no current op with that name`);
	                return this.changeOpName(testOpName, correctOpName);
	            }
	        }
	        return `all flags consistent`;
	    }
	};


/***/ },
/* 37 */
/*!************************************************!*\
  !*** ./src/ai/operations/DemolishOperation.ts ***!
  \************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const DemolishMission_1 = __webpack_require__(/*! ../missions/DemolishMission */ 38);
	class DemolishOperation extends Operation_1.Operation {
	    /**
	     * Spawn a demolisher when there are flags that match his pattern ("Flag + n"), he will visit those flags and remove the
	     * structures underneath. This pattern happens to be the default flag pattern used by the game UI, be careful.
	     * To have it spawn a scavanger to harvest energy, place a flag with name "opName_store" over a container/storage/terminal
	     * @param flag
	     * @param name
	     * @param type
	     * @param empire
	     */
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	    }
	    initOperation() {
	        this.spawnGroup = this.empire.getSpawnGroup(this.flag.room.name);
	        this.addMission(new DemolishMission_1.DemolishMission(this));
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	    }
	}
	exports.DemolishOperation = DemolishOperation;


/***/ },
/* 38 */
/*!********************************************!*\
  !*** ./src/ai/missions/DemolishMission.ts ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class DemolishMission extends Mission_1.Mission {
	    /**
	     * Spawn a demolisher when there are flags that match his pattern ("Flag + n"), he will visit those flags and remove the
	     * structures underneath. This pattern happens to be the default flag pattern used by the game UI, be careful
	     * @param operation
	     * @param potency
	     * @param storeStructure When a storeStructure is provided, it will spawn a scavanger to deliver energy
	     * @param allowSpawn
	     */
	    constructor(operation) {
	        super(operation, "demolish");
	        this.demoFlags = [];
	        this.demoStructures = [];
	    }
	    initMission() {
	        for (let i = 0; i <= 50; i++) {
	            let flag = Game.flags["Flag" + i];
	            if (!flag)
	                continue;
	            this.demoFlags.push(flag);
	            if (!flag.room)
	                continue;
	            let structure = flag.pos.lookFor(LOOK_STRUCTURES)[0];
	            if (structure) {
	                this.demoStructures.push(structure);
	            }
	            else {
	                flag.remove();
	            }
	        }
	        this.storeStructure = this.checkStoreStructure();
	    }
	    roleCall() {
	        let max = 0;
	        if (this.demoFlags.length > 0) {
	            max = 1;
	            if (this.memory.max !== undefined) {
	                max = this.memory.max;
	            }
	        }
	        let demoBody = () => {
	            return this.bodyRatio(1, 0, 1, 1);
	        };
	        this.demolishers = this.headCount("demolisher", demoBody, max);
	        let maxScavangers = 0;
	        if (this.demoFlags.length > 0 && this.storeStructure) {
	            maxScavangers = max;
	        }
	        this.scavangers = this.headCount("scavanger", () => this.bodyRatio(0, 1, 1, 1), maxScavangers);
	    }
	    missionActions() {
	        for (let demolisher of this.demolishers) {
	            this.demolisherActions(demolisher);
	        }
	        for (let scavanger of this.scavangers) {
	            this.scavangerActions(scavanger, _.head(this.demolishers));
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    demolisherActions(demolisher) {
	        let structure = _.head(this.demoStructures);
	        if (structure) {
	            if (demolisher.pos.isNearTo(structure)) {
	                demolisher.dismantle(structure);
	            }
	            else {
	                demolisher.blindMoveTo(structure);
	            }
	            return;
	        }
	        let flag = _.head(this.demoFlags);
	        if (flag) {
	            demolisher.blindMoveTo(flag);
	            return;
	        }
	        demolisher.idleOffRoad(this.flag);
	    }
	    scavangerActions(scavanger, demolisher) {
	        if (!demolisher) {
	            if (this.demoFlags.length > 0) {
	                scavanger.blindMoveTo(this.demoFlags[0]);
	            }
	            else {
	                this.idleNear(scavanger, this.flag);
	            }
	            return;
	        }
	        let hasLoad = this.hasLoad(scavanger);
	        if (!hasLoad) {
	            if (scavanger.room !== demolisher.room) {
	                scavanger.blindMoveTo(demolisher);
	                return; // early
	            }
	            let resource = this.findScavangerResource(scavanger, demolisher);
	            if (resource) {
	                if (scavanger.pos.isNearTo(resource)) {
	                    scavanger.pickup(resource);
	                }
	                else {
	                    scavanger.blindMoveTo(resource);
	                }
	            }
	            else {
	                scavanger.blindMoveTo(demolisher);
	            }
	            return; // early
	        }
	        if (_.sum(this.storeStructure.store) === this.storeStructure.storeCapacity) {
	            scavanger.idleOffRoad(demolisher);
	            return; // early
	        }
	        if (scavanger.pos.isNearTo(this.storeStructure)) {
	            scavanger.transfer(this.storeStructure, RESOURCE_ENERGY);
	            scavanger.memory.resourceId = undefined;
	        }
	        else {
	            scavanger.blindMoveTo(this.storeStructure);
	        }
	    }
	    findScavangerResource(scavanger, demolisher) {
	        if (scavanger.memory.resourceId) {
	            let resource = Game.getObjectById(scavanger.memory.resourceId);
	            if (resource) {
	                return resource;
	            }
	            else {
	                scavanger.memory.resourceId = undefined;
	                return this.findScavangerResource(scavanger, demolisher);
	            }
	        }
	        else {
	            let resources = _.filter(demolisher.room.find(FIND_DROPPED_RESOURCES), (r) => r.resourceType === RESOURCE_ENERGY);
	            let closest = scavanger.pos.findClosestByRange(resources);
	            if (closest) {
	                scavanger.memory.resourceId = closest.id;
	                return closest;
	            }
	        }
	    }
	    checkStoreStructure() {
	        let flag = Game.flags[`${this.opName}_store`];
	        if (flag && flag.room) {
	            let storeStructure = _(flag.pos.lookFor(LOOK_STRUCTURES))
	                .filter((s) => s.store !== undefined)
	                .head();
	            if (storeStructure)
	                return storeStructure;
	        }
	    }
	}
	exports.DemolishMission = DemolishMission;


/***/ },
/* 39 */
/*!*************************************************!*\
  !*** ./src/ai/operations/TransportOperation.ts ***!
  \*************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const TransportMission_1 = __webpack_require__(/*! ../missions/TransportMission */ 35);
	class TransportOperation extends Operation_1.Operation {
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	    }
	    initOperation() {
	        this.spawnGroup = this.empire.getSpawnGroup(this.flag.room.name);
	        this.findOperationWaypoints();
	        let max = this.memory.max !== undefined ? this.memory.max : 1;
	        this.addMission(new TransportMission_1.TransportMission(this, max, undefined, undefined, this.memory.resourceType, this.memory.offRoad));
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	    }
	}
	exports.TransportOperation = TransportOperation;


/***/ },
/* 40 */
/*!********************************************!*\
  !*** ./src/ai/operations/RaidOperation.ts ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const FireflyMission_1 = __webpack_require__(/*! ../missions/FireflyMission */ 41);
	const WreckerMission_1 = __webpack_require__(/*! ../missions/WreckerMission */ 44);
	const BrawlerMission_1 = __webpack_require__(/*! ../missions/BrawlerMission */ 45);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class RaidOperation extends Operation_1.Operation {
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	        this.squadTypes = {
	            firefly: FireflyMission_1.FireflyMission,
	            wreck: WreckerMission_1.WreckerMission,
	            brawler: BrawlerMission_1.BrawlerMission,
	        };
	        this.squadNames = ["alfa", "bravo", "charlie"];
	        this.raidMissions = [];
	        this.priority = constants_1.OperationPriority.VeryHigh;
	    }
	    initOperation() {
	        this.flagPlacement();
	        this.checkNewPlacement();
	        this.spawnGroup = this.empire.getSpawnGroup(this.flag.room.name);
	        this.raidData = this.generateRaidData();
	        if (!this.raidData)
	            return;
	        let spawnGroups = this.findSpawnGroups();
	        let squadCount = this.memory.squadCount;
	        if (!squadCount)
	            squadCount = 0;
	        for (let i = 0; i < squadCount; i++) {
	            let name = this.squadNames[i];
	            let config = this.memory.squadConfig[name];
	            let spawnGroup = spawnGroups[i % spawnGroups.length];
	            let allowSpawn = i < this.memory.maxSquads && this.memory.allowSpawn;
	            let missionClass = this.squadTypes[config.type];
	            let mission = new missionClass(this, name, this.raidData, spawnGroup, config.boostLevel, allowSpawn);
	            this.raidMissions.push(mission);
	            this.addMission(mission);
	        }
	    }
	    finalizeOperation() {
	        if (!this.raidData)
	            return;
	        let spawnCount = 0;
	        for (let mission of this.raidMissions) {
	            if (mission.spawned) {
	                spawnCount++;
	            }
	            else {
	                if (this.memory.queue[mission.getName()]) {
	                    this.memory.squadConfig[mission.getName()] = this.memory.queue[mission.getName()];
	                    let config = this.memory.squadConfig[mission.getName()];
	                    console.log("RAID: updating", mission.getName(), "to be of type", config.type, "with boostLevel", config.boostLevel);
	                    delete this.memory.queue[mission.getName()];
	                }
	            }
	        }
	        this.memory.squadCount = Math.max(this.memory.maxSquads, spawnCount);
	        if (!this.memory.waveComplete && spawnCount >= this.memory.maxSquads) {
	            this.memory.waveComplete = true;
	        }
	        if (this.memory.waveComplete && spawnCount === 0) {
	            this.memory.waveComplete = false;
	        }
	        this.memory.allowSpawn = (!this.memory.spawnSync || !this.memory.waveComplete) && !this.memory.raidComplete;
	        let attackRoom = this.raidData.breachFlags[0].room;
	        if (attackRoom && attackRoom.controller && attackRoom.controller.safeMode) {
	            this.memory.raidComplete = true;
	            this.memory.fallback = true;
	        }
	    }
	    invalidateOperationCache() {
	    }
	    findBreachFlags() {
	        if (this.raidData && this.raidData.breachFlags) {
	            return this.raidData.breachFlags;
	        }
	        let breachFlags = [];
	        for (let i = 0; i < 20; i++) {
	            let flag = Game.flags[this.name + "_breach_" + i];
	            if (flag) {
	                breachFlags.push(flag);
	            }
	            else {
	                break;
	            }
	        }
	        return breachFlags;
	    }
	    generateRaidData() {
	        if (!this.memory.queue)
	            this.memory.queue = {};
	        if (!this.memory.squadConfig)
	            this.memory.squadConfig = {};
	        let breachFlags = this.findBreachFlags();
	        let fallback = Game.flags[this.name + "_fallback"];
	        if (breachFlags.length === 0 || !fallback) {
	            if (Game.time % 3 === 0) {
	                console.log("RAID: please set breach flags (ex: " + this.name + "_breach_0, etc.) and fallback (ex: "
	                    + this.name + "_fallback)");
	            }
	            if (this.memory.auto) {
	                let completed = this.automateParams();
	                if (!completed)
	                    return;
	            }
	            else {
	                return;
	            }
	        }
	        if (this.memory.defaultBoostLevel === undefined) {
	            if (Game.time % 3 === 0) {
	                console.log("RAID: please set a default boostLevel, ex: " + this.name + ".setDefaultBoostLevel(2)");
	            }
	            return;
	        }
	        if (this.memory.maxSquads === undefined) {
	            if (Game.time % 3 === 0) {
	                console.log("RAID: please set a default number of squads, 0 to stop spawning, ex: " + this.name + ".setMaxSquads(1)");
	            }
	            return;
	        }
	        if (this.memory.defaultSquad === undefined) {
	            if (Game.time % 3 === 0) {
	                console.log("RAID: please set a default squad type, ex: " + this.name + ".setDefaultType(\"wreck\")");
	            }
	            return;
	        }
	        // init squadConfig
	        for (let i = 0; i < this.memory.maxSquads; i++) {
	            let name = this.squadNames[i];
	            if (!this.memory.squadConfig[name])
	                this.memory.squadConfig[name] = {
	                    type: this.memory.defaultSquad,
	                    boostLevel: this.memory.defaultBoostLevel
	                };
	        }
	        return {
	            raidCreeps: [],
	            obstacles: [],
	            injuredCreeps: undefined,
	            breachFlags: breachFlags,
	            attackRoom: breachFlags[0].room,
	            breachStructures: this.findBreachStructure(breachFlags),
	            targetStructures: this.findTargetStructures(breachFlags[0].room),
	            fallback: this.memory.fallback,
	            fallbackFlag: fallback,
	        };
	    }
	    findSpawnGroups() {
	        if (!this.memory.additionalRooms)
	            this.memory.additionalRooms = [];
	        let spawnGroups = [this.spawnGroup];
	        for (let roomName of this.memory.additionalRooms) {
	            let spawnGroup = this.empire.getSpawnGroup(roomName);
	            if (!spawnGroup)
	                continue;
	            spawnGroups.push(spawnGroup);
	        }
	        return spawnGroups;
	    }
	    checkNewPlacement() {
	        if (!this.memory.tickLastActive)
	            this.memory.tickLastActive = Game.time;
	        if (!this.memory.saveValues && Game.time - this.memory.tickLastActive > 100) {
	            console.log("RAID: new flag placement detected, resetting raid values");
	            this.resetRaid();
	        }
	        this.memory.tickLastActive = Game.time;
	    }
	    resetRaid() {
	        for (let property in this.memory) {
	            if (!this.memory.hasOwnProperty(property))
	                continue;
	            delete this.memory[property];
	        }
	    }
	    findPositions(breachFlags, fallback) {
	        let attackPos = breachFlags[0].pos;
	        let fallbackPos = fallback.pos;
	        if (this.memory.attackRoomName !== attackPos.roomName || this.memory.fallbackRoomName !== fallbackPos.roomName) {
	            this.memory.attackRoomName = attackPos.roomName;
	            this.memory.fallbackRoomName = fallbackPos.roomName;
	            console.log("RAID: flag configuration change detected, recalculating position flags");
	            this.resetPositions(attackPos, fallbackPos);
	        }
	        return {
	            alfa: {
	                healer: Game.flags[this.name + "_alfaHeal"],
	                attacker: Game.flags[this.name + "_alfaAttack"],
	            },
	            bravo: {
	                healer: Game.flags[this.name + "_bravoHeal"],
	                attacker: Game.flags[this.name + "_bravoAttack"],
	            },
	            charlie: {
	                healer: Game.flags[this.name + "_charlieHeal"],
	                attacker: Game.flags[this.name + "_charlieAttack"],
	            },
	            fallback: fallback,
	        };
	    }
	    findAttackDirection(attackRoomCoords, fallbackRoomCoords) {
	        let directionLetter;
	        if (attackRoomCoords.x < fallbackRoomCoords.x)
	            directionLetter = attackRoomCoords.xDir;
	        else if (attackRoomCoords.x > fallbackRoomCoords.x)
	            directionLetter = helper_1.helper.negaDirection(attackRoomCoords.xDir);
	        else if (attackRoomCoords.y < fallbackRoomCoords.y)
	            directionLetter = attackRoomCoords.yDir;
	        else if (attackRoomCoords.y > fallbackRoomCoords.y)
	            directionLetter = helper_1.helper.negaDirection(attackRoomCoords.yDir);
	        if (directionLetter === "N")
	            return constants_1.Direction.North;
	        else if (directionLetter === "E")
	            return constants_1.Direction.East;
	        else if (directionLetter === "S")
	            return constants_1.Direction.South;
	        else
	            return constants_1.Direction.West;
	    }
	    resetPositions(attackPos, fallbackPos) {
	        let attackCoords = helper_1.helper.getRoomCoordinates(attackPos.roomName);
	        let fallbackCoords = helper_1.helper.getRoomCoordinates(fallbackPos.roomName);
	        let attackDirection = this.findAttackDirection(attackCoords, fallbackCoords);
	        let alfaAttackPos = attackPos.getPositionAtDirection(helper_1.helper.clampDirection(attackDirection - 1));
	        let alfaHealPos = alfaAttackPos.getPositionAtDirection(helper_1.helper.clampDirection(attackDirection - 2));
	        let bravoAttackPos = attackPos.getPositionAtDirection(helper_1.helper.clampDirection(attackDirection + 1));
	        let bravoHealPos = bravoAttackPos.getPositionAtDirection(helper_1.helper.clampDirection(attackDirection + 2));
	        let charlieAttackPos = attackPos.getPositionAtDirection(attackDirection);
	        let charlieHealPos = charlieAttackPos.getPositionAtDirection(attackDirection);
	        let runNextTick = false;
	        // alfa flags
	        let alfaAttackFlag = Game.flags[this.name + "_alfaAttack"];
	        if (!alfaAttackFlag) {
	            runNextTick = true;
	            this.spawnGroup.pos.createFlag(this.name + "_alfaAttack", COLOR_BLUE, COLOR_RED);
	        }
	        else {
	            alfaAttackFlag.setPosition(alfaAttackPos);
	        }
	        let alfaHealFlag = Game.flags[this.name + "_alfaHeal"];
	        if (!alfaHealFlag) {
	            runNextTick = true;
	            this.spawnGroup.pos.createFlag(this.name + "_alfaHeal", COLOR_BLUE, COLOR_GREEN);
	        }
	        else {
	            alfaHealFlag.setPosition(alfaHealPos);
	        }
	        // bravo flags
	        let bravoAttackFlag = Game.flags[this.name + "_bravoAttack"];
	        if (!bravoAttackFlag) {
	            runNextTick = true;
	            this.spawnGroup.pos.createFlag(this.name + "_bravoAttack", COLOR_YELLOW, COLOR_RED);
	        }
	        else {
	            bravoAttackFlag.setPosition(bravoAttackPos);
	        }
	        let bravoHealFlag = Game.flags[this.name + "_bravoHeal"];
	        if (!bravoHealFlag) {
	            runNextTick = true;
	            this.spawnGroup.pos.createFlag(this.name + "_bravoHeal", COLOR_YELLOW, COLOR_GREEN);
	        }
	        else {
	            bravoHealFlag.setPosition(bravoHealPos);
	        }
	        // charlie flags
	        let charlieAttackFlag = Game.flags[this.name + "_charlieAttack"];
	        if (!charlieAttackFlag) {
	            runNextTick = true;
	            this.spawnGroup.pos.createFlag(this.name + "_charlieAttack", COLOR_BROWN, COLOR_RED);
	        }
	        else {
	            charlieAttackFlag.setPosition(charlieAttackPos);
	        }
	        let charlieHealFlag = Game.flags[this.name + "_charlieHeal"];
	        if (!charlieHealFlag) {
	            runNextTick = true;
	            this.spawnGroup.pos.createFlag(this.name + "_charlieHeal", COLOR_BROWN, COLOR_GREEN);
	        }
	        else {
	            charlieHealFlag.setPosition(charlieHealPos);
	        }
	        if (runNextTick) {
	            this.memory.attackRoomName = undefined;
	        }
	    }
	    findBreachStructure(breachFlags) {
	        let breachStructures = [];
	        for (let flag of breachFlags) {
	            if (!flag.room)
	                continue;
	            let structure = flag.pos.lookForStructure(STRUCTURE_ROAD);
	            if (!structure) {
	                structure = flag.pos.lookForStructure(STRUCTURE_RAMPART);
	            }
	            if (structure) {
	                breachStructures.push(structure);
	            }
	        }
	        return breachStructures;
	    }
	    setMaxSquads(max) {
	        let oldValue = this.memory.maxSquads;
	        this.memory.maxSquads = max;
	        return "RAID: changing number of active squads from " + oldValue + " to " + max;
	    }
	    queueSquad(name, type, boostlLevel) {
	        if (name === "a") {
	            name = "alpha";
	        }
	        else if (name === "b") {
	            name = "bravo";
	        }
	        else if (name === "c") {
	            name = "charlie";
	        }
	        if (!type || !_.includes(Object.keys(this.squadTypes), type)) {
	            return "invalid squad type";
	        }
	        let config = { type: type, boostLevel: boostlLevel };
	        if (boostlLevel === undefined) {
	            if (this.memory.defaultBoostLevel === undefined) {
	                return "no boostLevel given or defaultBoostLevel set";
	            }
	            config.boostLevel = this.memory.defaultBoostLevel;
	        }
	        this.memory.queue[name] = config;
	        return "the next " + name + " squad will be a " + config.type + " with boostLevel " + config.boostLevel;
	    }
	    setDefaultType(squadType) {
	        if (!_.includes(Object.keys(this.squadTypes), squadType))
	            return "RAID: ERROR, invalid squad type";
	        let oldValue = this.memory.defaultSquad;
	        this.memory.defaultSquad = squadType;
	        return "RAID: changing default squad from " + oldValue + " to " + squadType;
	    }
	    setDefaultBoostLevel(level) {
	        if (level >= 0 && level <= 4) {
	            let oldValue = this.memory.defaultBoostLevel;
	            this.memory.defaultBoostLevel = level;
	            return "RAID: changed from " + oldValue + " to " + level;
	        }
	        else {
	            return "RAID: ERROR, " + level + " is invalid as a boostLevel";
	        }
	    }
	    resetFlags() {
	        let breachFlag = Game.flags[this.name + "_breach_0"];
	        let fallbackFlag = Game.flags[this.name + "_fallback"];
	        if (breachFlag && fallbackFlag) {
	            this.resetPositions(breachFlag.pos, fallbackFlag.pos);
	        }
	    }
	    addRoomName(roomName) {
	        if (!this.memory.additionalRooms)
	            this.memory.additionalRooms = [];
	        if (_.includes(this.memory.additionalRooms, roomName)) {
	            return "RAID: that room is already being used";
	        }
	        else {
	            this.memory.additionalRooms.push(roomName);
	            return "RAID: additional rooms being used for spawning: " + this.memory.additionalRooms;
	        }
	    }
	    removeRoomName(roomName) {
	        if (_.includes(this.memory.additionalRooms, roomName)) {
	            return "RAID: that room is already being used";
	        }
	        else {
	            this.memory.additionalRooms = _.pull(this.memory.additionalRooms, roomName);
	            return "RAID: removing " + roomName + ", current list: " + this.memory.additionalRooms;
	        }
	    }
	    findTargetStructures(attackRoom) {
	        if (!attackRoom) {
	            return;
	        }
	        if (!this.memory.manualTargetIds)
	            this.memory.manualTargetIds = [];
	        let manualTargets = [];
	        for (let i = 0; i < 10; i++) {
	            let flag = Game.flags[this.name + "_targets_" + i];
	            if (!flag || !flag.room)
	                continue;
	            let structure = _.filter(flag.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType !== STRUCTURE_ROAD)[0];
	            if (!structure)
	                flag.remove();
	            manualTargets.push(structure);
	        }
	        if (manualTargets.length > 0) {
	            return manualTargets;
	        }
	        let attackOrder = _.get(this, "memory.attackOrder", [STRUCTURE_TOWER, STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TERMINAL, STRUCTURE_STORAGE, STRUCTURE_NUKER, STRUCTURE_LAB, STRUCTURE_LINK, STRUCTURE_OBSERVER]);
	        let nonRamparted = [];
	        for (let structureType of attackOrder) {
	            nonRamparted = nonRamparted.concat(_.filter(attackRoom.findStructures(structureType), (s) => s.pos.lookForStructure(STRUCTURE_RAMPART) === undefined));
	        }
	        if (nonRamparted.length > 0) {
	            return nonRamparted;
	        }
	        for (let structureType of attackOrder) {
	            let structures = attackRoom.findStructures(structureType);
	            if (structures.length > 0) {
	                return structures;
	            }
	        }
	        // if we made it this far, all structures have been eliminated
	        this.memory.raidComplete = true;
	    }
	    reportStatus() {
	        console.log("__________RAID STATUS__________");
	        console.log("active squads:");
	        // let activeSquads: RaidSquad[] = this.memory.squads.active;
	        // for (let squad of activeSquads) {
	        //    console.log(squad.name.toUpperCase() + ":", squad.type + " (" + squad.boostLevel + ")",
	        //        "spawnRoom:", squad.spawnRoomName, "spawned:", squad.spawned, "alive:", squad.alive);
	        // }
	    }
	    waypointProgress(index) {
	        for (let missionName in this.missions) {
	            let mission = this.missions[missionName];
	            if (mission["healer"]) {
	                mission["healer"].memory.waypointsCovered = false;
	                if (index !== undefined) {
	                    mission["healer"].memory.waypointIndex = index;
	                }
	            }
	        }
	    }
	    preset(presetName) {
	        if (presetName === "danger") {
	            console.log(this.queueSquad("bravo", "firefly", 2));
	            console.log(this.setDefaultBoostLevel(2));
	            console.log(this.setMaxSquads(3));
	            console.log(this.setDefaultType("brawler"));
	            return "spawning a raid that can deal with attacks from behind";
	        }
	        else if (presetName === "cosmo") {
	            console.log(this.queueSquad("alfa", "brawler", 2));
	            console.log(this.queueSquad("bravo", "firefly", 2));
	            console.log(this.queueSquad("charlie", "wreck", 2));
	            console.log(this.setDefaultBoostLevel(2));
	            console.log(this.setMaxSquads(3));
	            console.log(this.setDefaultType("brawler"));
	            return "spawning a raid that is a good balance between damage rate and defense";
	        }
	    }
	    copyWaypoints(from, to) {
	        for (let i = 0; i < 100; i++) {
	            let flag = Game.flags[`${from}_waypoints_${i}`];
	            if (flag) {
	            }
	        }
	    }
	    addRoom(roomName) {
	        if (roomName === "clear") {
	            this.memory.additionalRooms = undefined;
	        }
	        else {
	            if (!this.memory.additionalRooms)
	                this.memory.additionalRooms = [];
	            let spawnGroup = this.empire.getSpawnGroup(roomName);
	            if (spawnGroup) {
	                return this.memory.additionalRooms.push(roomName);
	            }
	            else {
	                return "not an owned room";
	            }
	        }
	    }
	    automateParams() {
	        if (!this.memory.attackRoomName) {
	            console.log(`RAID: ${this.name} automation incomplete, no attackRoom specified`);
	            return false;
	        }
	        let observer = this.flag.room.findStructures(STRUCTURE_OBSERVER)[0];
	        if (!observer) {
	            console.log(`RAID: ${this.name} automation incomplete, no observer`);
	            return false;
	        }
	        observer.observeRoom(this.memory.attackRoomName, "raid", true);
	        if (!observer.observation || observer.observation.room.name !== this.memory.attackRoomName) {
	            console.log(`RAID: ${this.name} automation incomplete, observation not loaded`);
	            return false;
	        }
	        let completed = this.placeFlags();
	        if (!completed)
	            return false;
	    }
	    placeFlags() {
	        let attackRoom = Game.rooms[this.memory.attackRoomName];
	        let destination = attackRoom.storage;
	        if (!destination) {
	            destination = attackRoom.find(FIND_HOSTILE_SPAWNS)[0];
	        }
	        if (!destination) {
	            console.log(`RAID: ${this.name} automation incomplete, no suitable structure to attack`);
	            return false;
	        }
	        let ret = this.empire.findTravelPath(this.spawnGroup, destination, { ignoreStructures: true });
	        if (ret.incomplete) {
	            console.log(`RAID: ${this.name} automation incomplete, incomplete path to attackRoom`);
	            return false;
	        }
	        let stagingPosition;
	        for (let i = 0; i < ret.path.length; i++) {
	            let position = ret.path[i];
	            if (position.isNearExit(0))
	                continue;
	            if (position.roomName === this.memory.attackRoomName) {
	                stagingPosition = position;
	                for (let j = i; j >= 0; j--) {
	                    position = ret.path[j];
	                    if (position.isNearExit(1))
	                        continue;
	                    if (position.roomName !== this.memory.attackRoomName) {
	                        this.placeRaidFlag(position, `${this.name}_fallback`, COLOR_GREY);
	                        break;
	                    }
	                }
	                break;
	            }
	        }
	        let complete = this.placeBreachFlags(stagingPosition, destination, attackRoom);
	        if (!complete)
	            return;
	        this.setDefaultBoostLevel(0);
	        this.setMaxSquads(1);
	        this.setDefaultType("brawler");
	    }
	    placeBreachFlags(stagingPosition, destination, attackRoom) {
	        let callback = (roomName) => {
	            if (roomName !== attackRoom.name)
	                return;
	            let matrix = new PathFinder.CostMatrix();
	            let walls = [];
	            walls.concat(attackRoom.findStructures(STRUCTURE_WALL));
	            walls.concat(attackRoom.findStructures(STRUCTURE_RAMPART));
	            let maxHits = 0;
	            for (let wall of walls) {
	                if (wall.hits > maxHits) {
	                    maxHits = wall.hits;
	                }
	            }
	            for (let wall of walls) {
	                let cost = Math.ceil((wall.hits / wall.hitsMax) * 10);
	                matrix.set(wall.pos.x, wall.pos.y, cost);
	            }
	            return matrix;
	        };
	        let ret = PathFinder.search(stagingPosition, { pos: destination.pos, range: 1 }, {
	            maxRooms: 1,
	            roomCallback: callback,
	        });
	        if (ret.incomplete) {
	            console.log(`RAID: ${this.name} automation incomplete, path incomplete for placing breach flags`);
	            return false;
	        }
	        let count = 0;
	        for (let position of ret.path) {
	            if (position.lookForStructure(STRUCTURE_WALL) || position.lookForStructure(STRUCTURE_RAMPART)) {
	                this.placeRaidFlag(position, `${this.name}_breach_${count}`, COLOR_GREY);
	                count++;
	            }
	        }
	        if (count === 0) {
	            for (let position of ret.path) {
	                if (position.isNearExit(1))
	                    continue;
	                console.log(`RAID: no walls found in ${this.name}, placing empty breach position`);
	                position.createFlag(`${this.name}_breach_${count}`);
	                break;
	            }
	        }
	        return true;
	    }
	    placeRaidFlag(pos, name, color = COLOR_WHITE) {
	        let flag = Game.flags[name];
	        if (flag) {
	            console.log(`RAID: moving flag to position: ${name}`);
	            flag.setPosition(pos);
	            return;
	        }
	        let room = Game.rooms[pos.roomName];
	        if (room) {
	            pos.createFlag(name, color);
	            return;
	        }
	        else {
	            this.flag.pos.createFlag(name, color);
	            this.memory.placeFlags[name] = pos;
	        }
	    }
	    flagPlacement() {
	        if (!this.memory.placeFlags) {
	            this.memory.placeFlags = {};
	        }
	        for (let flagName in this.memory.placeFlags) {
	            let position = helper_1.helper.deserializeRoomPosition(this.memory.placeFlags[flagName]);
	            let flag = Game.flags[flagName];
	            flag.setPosition(position);
	            delete this.memory.placeFlags[flagName];
	        }
	    }
	}
	exports.RaidOperation = RaidOperation;


/***/ },
/* 41 */
/*!*******************************************!*\
  !*** ./src/ai/missions/FireflyMission.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const RaidMission_1 = __webpack_require__(/*! ./RaidMission */ 42);
	const interfaces_1 = __webpack_require__(/*! ../../interfaces */ 43);
	class FireflyMission extends RaidMission_1.RaidMission {
	    constructor(operation, name, raidData, spawnGroup, boostLevel, allowSpawn) {
	        super(operation, name, raidData, spawnGroup, boostLevel, allowSpawn);
	        this.attackerBody = () => {
	            if (this.boostLevel === interfaces_1.BoostLevel.Training) {
	                return this.configBody({ [TOUGH]: 1, [MOVE]: 2, [RANGED_ATTACK]: 1 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.Unboosted) {
	                return this.configBody({ [TOUGH]: 5, [MOVE]: 25, [RANGED_ATTACK]: 20 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.SuperTough) {
	                return this.configBody({ [TOUGH]: 24, [MOVE]: 10, [RANGED_ATTACK]: 16 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.RCL7) {
	                return this.configBody({ [TOUGH]: 12, [MOVE]: 8, [RANGED_ATTACK]: 20 });
	            }
	            else {
	                return this.configBody({ [TOUGH]: 12, [MOVE]: 10, [RANGED_ATTACK]: 28 });
	            }
	        };
	        this.specialistPart = RANGED_ATTACK;
	        this.specialistBoost = RESOURCE_CATALYZED_KEANIUM_ALKALIDE;
	        this.spawnCost = 12440;
	        this.attackRange = 3;
	        this.attacksCreeps = true;
	        this.attackerBoosts = [
	            RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
	            RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
	            RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
	        ];
	        this.killCreeps = operation.memory.killCreeps;
	    }
	    clearActions(attackingCreep) {
	        this.standardClearActions(attackingCreep);
	    }
	    focusCreeps() {
	        let closest = this.attacker.pos.findClosestByRange(_.filter(this.attacker.room.hostiles, (c) => {
	            return c.owner.username !== "Source Keeper" && c.body.length > 10;
	        }));
	        if (closest) {
	            let range = this.attacker.pos.getRangeTo(closest);
	            if (range > 3) {
	                this.squadTravel(this.attacker, this.healer, closest);
	            }
	            else if (range < 3) {
	                this.squadFlee(closest);
	            }
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	}
	exports.FireflyMission = FireflyMission;


/***/ },
/* 42 */
/*!****************************************!*\
  !*** ./src/ai/missions/RaidMission.ts ***!
  \****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const interfaces_1 = __webpack_require__(/*! ../../interfaces */ 43);
	class RaidMission extends Mission_1.Mission {
	    constructor(operation, name, raidData, spawnGroup, boostLevel, allowSpawn) {
	        super(operation, name, allowSpawn);
	        this.healerBody = () => {
	            if (this.boostLevel === interfaces_1.BoostLevel.Training) {
	                return this.configBody({ [TOUGH]: 1, [MOVE]: 2, [HEAL]: 1 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.Unboosted) {
	                return this.configBody({ [TOUGH]: 5, [MOVE]: 25, [HEAL]: 20 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.SuperTough) {
	                return this.configBody({ [TOUGH]: 12, [MOVE]: 10, [HEAL]: 28 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.RCL7) {
	                return this.configBody({ [TOUGH]: 12, [MOVE]: 8, [HEAL]: 20 });
	            }
	            else {
	                return this.configBody({ [TOUGH]: 12, [MOVE]: 10, [HEAL]: 28 });
	            }
	        };
	        this.attackerBody = () => {
	            if (this.boostLevel === interfaces_1.BoostLevel.Training) {
	                return this.configBody({ [TOUGH]: 1, [MOVE]: 3, [this.specialistPart]: 1, [RANGED_ATTACK]: 1 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.Unboosted) {
	                return this.configBody({ [TOUGH]: 5, [MOVE]: 25, [this.specialistPart]: 19, [RANGED_ATTACK]: 1 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.SuperTough) {
	                return this.configBody({ [TOUGH]: 24, [MOVE]: 10, [this.specialistPart]: 15, [RANGED_ATTACK]: 1 });
	            }
	            else if (this.boostLevel === interfaces_1.BoostLevel.RCL7) {
	                return this.configBody({ [TOUGH]: 12, [MOVE]: 8, [this.specialistPart]: 19, [RANGED_ATTACK]: 1 });
	            }
	            else {
	                return this.configBody({ [TOUGH]: 12, [MOVE]: 10, [this.specialistPart]: 27, [RANGED_ATTACK]: 1 });
	            }
	        };
	        this.raidData = raidData;
	        this.spawnGroup = spawnGroup;
	        this.boostLevel = boostLevel;
	    }
	    initMission() {
	        this.raidWaypoints = this.getFlagSet("_waypoints_", 15);
	        this.raidWaypoints.push(this.raidData.fallbackFlag);
	        if (this.boostLevel === interfaces_1.BoostLevel.Training || this.boostLevel === interfaces_1.BoostLevel.Unboosted) {
	            this.healerBoosts = [];
	            this.attackerBoosts = [];
	        }
	        else {
	            this.healerBoosts = [
	                RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
	                RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
	                RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE
	            ];
	        }
	        // if (this.raidData.breachFlags[0].room && !this.memory.fallback && this.raidData.breachFlags[0].room.controller.safeMode.)
	    }
	    roleCall() {
	        let max = !this.memory.spawned ? 1 : 0;
	        let reservation = { spawns: 2, currentEnergy: undefined };
	        if (this.spawnGroup.maxSpawnEnergy >= this.spawnCost) {
	            reservation.currentEnergy = this.spawnCost;
	        }
	        this.attacker = _.head(this.headCount(this.name + "Attacker", this.attackerBody, max, {
	            memory: { boosts: this.attackerBoosts },
	            reservation: reservation
	        }));
	        if (this.attacker) {
	            this.raidData.raidCreeps.push(this.attacker);
	            this.raidData.obstacles.push(this.attacker);
	        }
	        this.healer = _.head(this.headCount(this.name + "Healer", this.healerBody, max, {
	            memory: { boosts: this.healerBoosts }
	        }));
	        if (this.healer) {
	            this.raidData.raidCreeps.push(this.healer);
	        }
	    }
	    missionActions() {
	        /* ------PREPARE PHASE------ */
	        // prep, wait for the other to boost
	        let prepared = this.preparePhase();
	        if (!prepared)
	            return;
	        // healing and attacking will be active from this point on
	        this.healCreeps();
	        let attackingCreep = this.attackCreeps();
	        // creeps report about situation
	        this.raidTalk();
	        if (this.killCreeps || this.memory.targetId) {
	            let foundHostiles = this.focusCreeps();
	            if (foundHostiles)
	                return;
	        }
	        /* ------TRAVEL PHASE------ */
	        let waypointsTraveled = this.waypointSquadTravel(this.healer, this.attacker, this.raidWaypoints);
	        if (!waypointsTraveled)
	            return;
	        /* --------FALLBACK-------- */
	        if (this.raidData.fallback) {
	            this.squadTravel(this.healer, this.attacker, this.raidData.fallbackFlag);
	            return;
	        }
	        /* -------ENTRY PHASE------ */
	        if (this.healer.room !== this.raidData.attackRoom || this.healer.pos.isNearExit(0)) {
	            this.squadTravel(this.healer, this.attacker, this.raidData.breachFlags[0]);
	            return;
	        }
	        if (this.attacker.room !== this.raidData.attackRoom || this.attacker.pos.isNearExit(0)) {
	            this.squadTravel(this.attacker, this.healer, this.raidData.breachFlags[0]);
	            return;
	        }
	        /* ------CLEAR PHASE------ */
	        if (this.raidData.targetStructures && this.raidData.targetStructures.length > 0) {
	            if (!this.healer.memory.clearPhase) {
	                this.healer.memory.clearPhase = true;
	                console.log(`RAID: breach cleared! (${this.opName} ${this.name})`);
	            }
	            this.clearActions(attackingCreep);
	            return;
	        }
	        if (!this.healer.memory.finishPhase) {
	            this.healer.memory.finishPhase = true;
	            console.log(`RAID: all structures cleared! (${this.opName} ${this.name})`);
	        }
	        /* ------FINISH PHASE------ */
	        this.finishActions(attackingCreep);
	    }
	    finalizeMission() {
	        if (!this.memory.spawned && this.memory.spawn[this.name + "Attacker"].length > 0
	            && this.memory.spawn[this.name + "Healer"].length > 0) {
	            this.memory.spawned = true;
	        }
	        if (this.memory.spawned && this.memory.spawn[this.name + "Attacker"].length === 0
	            && this.memory.spawn[this.name + "Healer"].length === 0) {
	            this.memory.spawned = false;
	        }
	        this.spawned = this.memory.spawned;
	        if (Game.time % 10 === 0 && !this.spawned && this.allowSpawn) {
	            console.log(`RAID: ${this.opName} ${this.name} squad ready (reservation)`);
	        }
	        if (this.attacker && this.attacker.room.name !== this.raidData.breachFlags[0].pos.roomName) {
	            this.attacker.memory.flagReached = false;
	        }
	        if (this.healer && this.healer.room.name !== this.raidData.breachFlags[0].pos.roomName) {
	            this.healer.memory.flagReached = false;
	        }
	    }
	    invalidateMissionCache() {
	    }
	    standardClearActions(attackingCreep) {
	        let target;
	        if (this.raidData.breachStructures.length > 0) {
	            target = this.findMissionTarget(this.raidData.breachStructures);
	        }
	        else if (this.raidData.targetStructures.length > 0) {
	            target = this.findMissionTarget(this.raidData.targetStructures);
	        }
	        else {
	            target = this.findMissionTarget(this.room.hostiles);
	        }
	        if (this.attacker.pos.inRangeTo(target, this.attackRange)) {
	            this.attacker.dismantle(target);
	            if (!attackingCreep) {
	                this.attacker.rangedMassAttack();
	                this.attacker.attack(target);
	                if (target.pos.lookFor(LOOK_TERRAIN)[0] !== "swamp") {
	                    this.squadTravel(this.attacker, this.healer, target);
	                }
	            }
	            if (!this.healer.pos.isNearTo(this.attacker)) {
	                this.healer.blindMoveTo(this.attacker);
	            }
	        }
	        else {
	            this.squadTravel(this.attacker, this.healer, target, this.attackRange);
	        }
	    }
	    finishActions(attackingCreep) {
	        this.squadTravel(this.healer, this.attacker, this.raidData.fallbackFlag);
	    }
	    waypointSquadTravel(healer, attacker, waypoints) {
	        if (healer.memory.waypointsCovered) {
	            return true;
	        }
	        if (healer.memory.waypointIndex === undefined) {
	            healer.memory.waypointIndex = 0;
	        }
	        if (healer.memory.waypointIndex >= waypoints.length) {
	            healer.memory.waypointsCovered = true;
	            return true;
	        }
	        let leader = attacker;
	        let follower = healer;
	        if (this.memory.healerLead) {
	            leader = healer;
	            follower = attacker;
	        }
	        let waypoint = waypoints[healer.memory.waypointIndex];
	        if (waypoint.room && leader.pos.inRangeTo(waypoint, 1)) {
	            console.log(`RAID: waypoint ${healer.memory.waypointIndex} reached (${this.opName} ${this.name})`);
	            healer.memory.waypointIndex++;
	        }
	        // travel through portal with follower
	        if (leader.pos.lookForStructure(STRUCTURE_PORTAL)) {
	            leader.blindMoveTo(waypoint);
	            follower.blindMoveTo(waypoints[healer.memory.waypointIndex - 1]);
	            return false;
	        }
	        this.squadTravel(leader, follower, waypoint);
	    }
	    squadTravel(leader, follower, destination, range = 1) {
	        if (follower.fatigue > 0)
	            return ERR_BUSY;
	        if (leader.room.name !== destination.pos.roomName || leader.isNearExit(0)) {
	            range = 1;
	        }
	        if (leader.room === follower.room) {
	            if (follower.pos.isNearTo(leader)) {
	                this.empire.travelTo(leader, destination, { range: range });
	                if (!leader.isNearExit(0) || !this.raidData.attackRoom || this.raidData.attackRoom !== destination.room) {
	                    follower.move(follower.pos.getDirectionTo(leader));
	                }
	            }
	            else {
	                this.empire.travelTo(follower, leader);
	            }
	        }
	        else {
	            if (leader.isNearExit(1)) {
	                this.empire.travelTo(leader, destination, { range: range });
	            }
	            if (!this.raidData.attackRoom || this.raidData.attackRoom !== destination.room) {
	                this.empire.travelTo(follower, leader);
	            }
	        }
	    }
	    squadFlee(roomObject) {
	        if (this.attacker.fatigue > 0)
	            return ERR_BUSY;
	        if (this.attacker.pos.isNearTo(this.healer)) {
	            if (this.attacker.pos.inRangeTo(roomObject, 2)) {
	                this.healer.fleeByPath(roomObject);
	                this.attacker.move(this.attacker.pos.getDirectionTo(this.healer));
	            }
	        }
	        else {
	            this.attacker.moveTo(this.healer, { reusePath: 0 });
	        }
	    }
	    healCreeps() {
	        if (!this.healer)
	            return;
	        if (!this.raidData.injuredCreeps) {
	            this.raidData.injuredCreeps = {};
	            for (let creep of this.raidData.raidCreeps) {
	                if (creep.hits === creep.hitsMax)
	                    continue;
	                this.raidData.injuredCreeps[creep.name] = creep.hits;
	            }
	        }
	        let injuredCreeps = _.map(Object.keys(this.raidData.injuredCreeps), (name) => Game.creeps[name]);
	        for (let creep of injuredCreeps) {
	            if (!(creep instanceof Creep)) {
	                console.log(`found a bad creep in injured creeps: ${creep}`);
	            }
	        }
	        let healedAmount = (healer, shortRange) => {
	            let healPerPart = 4;
	            if (this.boostLevel !== interfaces_1.BoostLevel.Unboosted) {
	                healPerPart *= 4;
	            }
	            if (shortRange) {
	                healPerPart *= 3;
	            }
	            return healer.partCount(HEAL) * healPerPart;
	        };
	        let closeRange = _(this.healer.pos.findInRange(injuredCreeps, 1))
	            .sortBy("hits")
	            .head();
	        if (closeRange) {
	            if (!this.healer)
	                console.log("no healer?");
	            let outcome = this.healer.heal(closeRange);
	            if (outcome !== OK)
	                console.log(`healing error: ${outcome}`);
	            this.raidData.injuredCreeps[closeRange.name] += healedAmount(this.healer, true);
	            if (this.raidData.injuredCreeps[closeRange.name] > closeRange.hitsMax) {
	                delete this.raidData.injuredCreeps[closeRange.name];
	            }
	            return;
	        }
	        let longRange = _(this.healer.pos.findInRange(injuredCreeps, 3))
	            .sortBy("hits")
	            .head();
	        if (longRange) {
	            if (!this.healer)
	                console.log("no healer?");
	            let outcome = this.healer.rangedHeal(longRange);
	            if (outcome !== OK)
	                console.log(`healing error: ${outcome}`);
	            this.raidData.injuredCreeps[longRange.name] += healedAmount(this.healer, true);
	            if (this.raidData.injuredCreeps[longRange.name] > longRange.hitsMax) {
	                delete this.raidData.injuredCreeps[longRange.name];
	            }
	            return;
	        }
	        if (this.healer.room.name === this.raidData.breachFlags[0].pos.roomName) {
	            this.healer.heal(this.attacker);
	        }
	    }
	    attackCreeps() {
	        let creepTargets = _(this.attacker.pos.findInRange(this.attacker.room.hostiles, 3))
	            .filter((c) => _.filter(c.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_RAMPART).length === 0)
	            .sortBy("hits")
	            .value();
	        if (creepTargets.length === 0) {
	            return false;
	        }
	        let closest = this.attacker.pos.findClosestByRange(creepTargets);
	        let range = this.attacker.pos.getRangeTo(closest);
	        if (range === 1 || creepTargets.length > 1) {
	            this.attacker.rangedMassAttack();
	        }
	        else {
	            this.attacker.rangedAttack(closest);
	        }
	        if (range === 1 && this.attacker.partCount(ATTACK)) {
	            this.attacker.attack(closest);
	            return true;
	        }
	        if (this.attacker.partCount(RANGED_ATTACK) > 1) {
	            return true;
	        }
	    }
	    raidPath(pathingCreep, destination, avoids) {
	        let ret = PathFinder.search(pathingCreep.pos, { pos: destination, range: 1 });
	        let opts = { costCallback: function (roomName, matrix) {
	                for (let object of avoids) {
	                    if (this.room !== object.roomName)
	                        continue;
	                    matrix.set(object.x, object.y, 0xff);
	                }
	                return matrix;
	            } };
	        return pathingCreep.blindMoveTo(destination, opts);
	    }
	    preparePhase() {
	        if (this.attacker && !this.healer) {
	            let closest = this.attacker.pos.findClosestByRange(this.room.hostiles);
	            if (closest) {
	                let range = this.attacker.pos.getRangeTo(closest);
	                if (range <= this.attackRange) {
	                    this.attacker.attack(closest);
	                    this.attacker.rangedAttack(closest);
	                    if (range < this.attackRange) {
	                        this.attacker.fleeByPath(closest);
	                    }
	                }
	                else {
	                    this.attacker.blindMoveTo(closest);
	                }
	            }
	            else if (this.attacker.room === this.raidData.attackRoom) {
	                let closest = this.attacker.pos.findClosestByRange(this.raidData.targetStructures);
	                if (closest) {
	                    if (this.attacker.pos.inRangeTo(closest, this.attackRange)) {
	                        this.attacker.dismantle(closest);
	                        this.attacker.attack(closest);
	                        this.attacker.rangedMassAttack();
	                    }
	                    else {
	                        this.attacker.blindMoveTo(closest);
	                    }
	                }
	            }
	            else {
	                this.attacker.idleOffRoad(this.flag);
	            }
	        }
	        if (this.healer && !this.attacker) {
	            this.healCreeps();
	            this.healer.idleOffRoad(this.flag);
	        }
	        return this.attacker && this.healer;
	    }
	    raidTalk() {
	        if (this.attacker.hits < this.attacker.hitsMax) {
	            this.attacker.say("" + this.attacker.hits);
	        }
	        if (this.healer.hits < this.healer.hitsMax) {
	            this.healer.say("" + this.healer.hits);
	        }
	    }
	    focusCreeps() {
	        if (!this.attacksCreeps) {
	            return false;
	        }
	        let closest = this.attacker.pos.findClosestByRange(_.filter(this.attacker.room.hostiles, (c) => {
	            return c.owner.username !== "Source Keeper" && c.body.length > 10;
	        }));
	        if (closest) {
	            let range = this.attacker.pos.getRangeTo(closest);
	            if (range > 1) {
	                this.squadTravel(this.attacker, this.healer, closest);
	            }
	            else if (range === 1 && this.healer.fatigue === 0) {
	                this.attacker.move(this.attacker.pos.getDirectionTo(closest));
	                if (this.healer.pos.getRangeTo(this.attacker) === 1) {
	                    this.healer.move(this.healer.pos.getDirectionTo(this.attacker));
	                }
	                else {
	                    this.healer.blindMoveTo(this.attacker, undefined, true);
	                }
	            }
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	    findMissionTarget(possibleTargets) {
	        if (this.attacker.memory.attackTargetId) {
	            let target = Game.getObjectById(this.attacker.memory.attackTargetId);
	            if (target && this.hasValidPath(this.attacker, target)) {
	                return target;
	            }
	            else {
	                delete this.attacker.memory.attackTargetId;
	                return this.findMissionTarget(possibleTargets);
	            }
	        }
	        else {
	            let closest = this.attacker.pos.findClosestByRange(possibleTargets);
	            if (!closest) {
	                return;
	            }
	            if (this.hasValidPath(this.attacker, closest)) {
	                this.attacker.memory.attackTargetId = closest.id;
	                return closest;
	            }
	            let sortedTargets = _.sortBy(possibleTargets, (s) => this.attacker.pos.getRangeTo(s));
	            for (let target of sortedTargets) {
	                if (this.hasValidPath(this.attacker, target)) {
	                    this.attacker.memory.structureTargetId = target.id;
	                    return target;
	                }
	            }
	        }
	    }
	    hasValidPath(origin, destination) {
	        let obstacles = _.filter(this.raidData.obstacles, (c) => c !== this.attacker);
	        let ret = this.empire.findTravelPath(origin, destination, { obstacles: obstacles });
	        return !ret.incomplete;
	    }
	}
	exports.RaidMission = RaidMission;


/***/ },
/* 43 */
/*!***************************!*\
  !*** ./src/interfaces.ts ***!
  \***************************/
/***/ function(module, exports) {

	"use strict";
	var BoostLevel;
	(function (BoostLevel) {
	    BoostLevel[BoostLevel["Training"] = 0] = "Training";
	    BoostLevel[BoostLevel["Unboosted"] = 1] = "Unboosted";
	    BoostLevel[BoostLevel["Boosted"] = 2] = "Boosted";
	    BoostLevel[BoostLevel["SuperTough"] = 3] = "SuperTough";
	    BoostLevel[BoostLevel["RCL7"] = 4] = "RCL7";
	})(BoostLevel = exports.BoostLevel || (exports.BoostLevel = {}));


/***/ },
/* 44 */
/*!*******************************************!*\
  !*** ./src/ai/missions/WreckerMission.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const RaidMission_1 = __webpack_require__(/*! ./RaidMission */ 42);
	class WreckerMission extends RaidMission_1.RaidMission {
	    constructor(operation, name, raidData, spawnGroup, boostLevel, allowSpawn) {
	        super(operation, name, raidData, spawnGroup, boostLevel, allowSpawn);
	        this.specialistPart = WORK;
	        this.specialistBoost = RESOURCE_CATALYZED_ZYNTHIUM_ACID;
	        this.spawnCost = 11090;
	        this.attackRange = 1;
	        this.attacksCreeps = false;
	        this.attackerBoosts = [
	            RESOURCE_CATALYZED_ZYNTHIUM_ACID,
	            RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
	            RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
	            RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
	        ];
	    }
	    clearActions(attackingCreep) {
	        this.standardClearActions(attackingCreep);
	    }
	}
	exports.WreckerMission = WreckerMission;


/***/ },
/* 45 */
/*!*******************************************!*\
  !*** ./src/ai/missions/BrawlerMission.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const RaidMission_1 = __webpack_require__(/*! ./RaidMission */ 42);
	class BrawlerMission extends RaidMission_1.RaidMission {
	    constructor(operation, name, raidData, spawnGroup, boostLevel, allowSpawn) {
	        super(operation, name, raidData, spawnGroup, boostLevel, allowSpawn);
	        this.specialistPart = ATTACK;
	        this.specialistBoost = RESOURCE_CATALYZED_UTRIUM_ACID;
	        this.spawnCost = 10550;
	        this.attackRange = 1;
	        this.attacksCreeps = true;
	        this.attackerBoosts = [
	            RESOURCE_CATALYZED_UTRIUM_ACID,
	            RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
	            RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
	            RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
	        ];
	        this.killCreeps = operation.memory.killCreeps;
	    }
	    clearActions(attackingCreep) {
	        this.standardClearActions(attackingCreep);
	    }
	}
	exports.BrawlerMission = BrawlerMission;


/***/ },
/* 46 */
/*!********************************************!*\
  !*** ./src/ai/operations/QuadOperation.ts ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const DefenseMission_1 = __webpack_require__(/*! ../missions/DefenseMission */ 13);
	const ControllerOperation_1 = __webpack_require__(/*! ./ControllerOperation */ 47);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const QUAD_RADIUS = 6;
	class QuadOperation extends ControllerOperation_1.ControllerOperation {
	    constructor() {
	        /**
	         * Manages the activities of an owned room, assumes bonzaiferroni's build spec
	         * @param flag
	         * @param name
	         * @param type
	         * @param empire
	         */
	        super(...arguments);
	        this.staticStructures = {
	            [STRUCTURE_SPAWN]: [{ x: 2, y: 0 }, { x: 0, y: -2 }, { x: -2, y: 0 }],
	            [STRUCTURE_TOWER]: [
	                { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }
	            ],
	            [STRUCTURE_EXTENSION]: [
	                { x: 3, y: -1 }, { x: 2, y: -2 }, { x: 1, y: -3 }, { x: 3, y: -2 }, { x: 2, y: -3 },
	                { x: 0, y: -4 }, { x: -1, y: -3 }, { x: -2, y: -2 }, { x: -3, y: -1 }, { x: -3, y: -2 },
	                { x: -2, y: -3 }, { x: -2, y: -4 }, { x: 4, y: 0 }, { x: -4, y: 0 }, { x: -3, y: 1 },
	                { x: -1, y: 1 }, { x: 3, y: 1 }, { x: 4, y: -2 }, { x: 3, y: -3 }, { x: 2, y: -4 },
	                { x: -3, y: -3 }, { x: -4, y: -2 }, { x: 5, y: -3 }, { x: 4, y: -4 }, { x: 3, y: -5 },
	                { x: -3, y: -5 }, { x: -4, y: -4 }, { x: -5, y: -3 }, { x: 3, y: 2 }, { x: 3, y: 3 },
	                { x: 4, y: 2 }, { x: 3, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 3 }, { x: 5, y: 1 },
	                { x: 5, y: 0 }, { x: 5, y: -1 }, { x: 5, y: -4 }, { x: 5, y: -5 }, { x: 4, y: -5 },
	                { x: 1, y: -5 }, { x: 0, y: -5 }, { x: -1, y: -5 }, { x: -4, y: -5 }, { x: -5, y: -5 },
	                { x: -5, y: -4 }, { x: -5, y: -1 }, { x: -5, y: 0 }, { x: -5, y: 1 }, { x: 4, y: 5 },
	                { x: 5, y: 4 }, { x: 5, y: 5 }, { x: -6, y: 2 }, { x: -6, y: -2 }, { x: -2, y: -6 },
	                { x: 2, y: 4 }, { x: 2, y: -6 }, { x: 6, y: -2 }, { x: 6, y: 2 }, { x: 2, y: 3 },
	            ],
	            [STRUCTURE_STORAGE]: [{ x: 0, y: 4 }],
	            [STRUCTURE_TERMINAL]: [{ x: -2, y: 2 }],
	            [STRUCTURE_NUKER]: [{ x: 0, y: 6 }],
	            [STRUCTURE_POWER_SPAWN]: [{ x: 0, y: 2 }],
	            [STRUCTURE_OBSERVER]: [{ x: -5, y: 5 }],
	            [STRUCTURE_LAB]: [
	                { x: -2, y: 4 }, { x: -3, y: 3 }, { x: -4, y: 2 }, { x: -3, y: 5 }, { x: -4, y: 4 },
	                { x: -5, y: 3 }, { x: -2, y: 3 }, { x: -3, y: 2 }, { x: -4, y: 5 }, { x: -5, y: 4 }
	            ],
	            [STRUCTURE_ROAD]: [
	                // diamond (n = 12)
	                { x: 3, y: 0 }, { x: 2, y: -1 }, { x: 1, y: -2 }, { x: 0, y: -3 }, { x: -1, y: -2 },
	                { x: -2, y: -1 }, { x: -3, y: 0 }, { x: -2, y: 1 }, { x: -1, y: 2 }, { x: 0, y: 3 },
	                { x: 1, y: 2 }, { x: 2, y: 1 },
	                // x-pattern (n = 24)
	                { x: 4, y: -1 }, { x: 5, y: -2 }, { x: 4, y: -3 },
	                { x: 3, y: -4 }, { x: 2, y: -5 }, { x: 1, y: -4 }, { x: -1, y: -4 }, { x: -2, y: -5 },
	                { x: -3, y: -4 }, { x: -4, y: -3 }, { x: -5, y: -2 }, { x: -4, y: -1 }, { x: -4, y: 1 },
	                { x: -5, y: 2 }, { x: -4, y: 3 }, { x: -3, y: 4 }, { x: -2, y: 5 }, { x: -1, y: 4 },
	                { x: 1, y: 4 }, { x: 2, y: 5 }, { x: 3, y: 4 }, { x: 4, y: 3 }, { x: 5, y: 2 },
	                { x: 4, y: 1 },
	                // outside (n = 33)
	                { x: 6, y: -3 }, { x: 6, y: -4 }, { x: 6, y: -5 }, { x: 5, y: -6 },
	                { x: 4, y: -6 }, { x: 3, y: -6 }, { x: 1, y: -6 }, { x: 0, y: -6 }, { x: -1, y: -6 },
	                { x: -3, y: -6 }, { x: -4, y: -6 }, { x: -5, y: -6 }, { x: -6, y: -5 }, { x: -6, y: -4 },
	                { x: -6, y: -3 }, { x: -6, y: -1 }, { x: -6, y: 0 }, { x: -6, y: 1 }, { x: -6, y: 3 },
	                { x: -6, y: 4 }, { x: -6, y: 5 }, { x: -5, y: 6 }, { x: -4, y: 6 }, { x: -3, y: 6 },
	                { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 },
	                { x: 6, y: 3 }, { x: 6, y: 1 }, { x: 6, y: 0 }, { x: 6, y: -1 },
	            ],
	            [STRUCTURE_RAMPART]: [
	                // top wall (n = 12)
	                { x: -5, y: -6 }, { x: -4, y: -6 }, { x: -3, y: -6 }, { x: -2, y: -6 }, { x: -1, y: -6 },
	                { x: 0, y: -6 }, { x: 1, y: -6 }, { x: 2, y: -6 }, { x: 3, y: -6 }, { x: 4, y: -6 },
	                { x: 5, y: -6 }, { x: 5, y: -5 },
	                // right wall (n = 12)
	                { x: 6, y: -5 }, { x: 6, y: -4 }, { x: 6, y: -3 }, { x: 6, y: -2 }, { x: 6, y: -1 },
	                { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 },
	                { x: 6, y: 5 }, { x: 5, y: 5 },
	                // bottom wall (n = 12)
	                { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 },
	                { x: 0, y: 6 }, { x: -1, y: 6 }, { x: -2, y: 6 }, { x: -3, y: 6 }, { x: -4, y: 6 },
	                { x: -5, y: 6 }, { x: -5, y: 5 },
	                // left wall (n = 12)
	                { x: -6, y: 5 }, { x: -6, y: 4 }, { x: -6, y: 3 }, { x: -6, y: 2 }, { x: -6, y: 1 },
	                { x: -6, y: 0 }, { x: -6, y: -1 }, { x: -6, y: -2 }, { x: -6, y: -3 }, { x: -6, y: -4 },
	                { x: -6, y: -5 }, { x: -5, y: -5 },
	                // storage (n = 1)
	                { x: 0, y: 4 }
	            ]
	        };
	    }
	    addDefense() {
	        this.addMission(new DefenseMission_1.DefenseMission(this));
	    }
	    initAutoLayout() {
	        if (!this.memory.layoutMap) {
	            this.memory.layoutMap = {};
	            this.memory.radius = QUAD_RADIUS;
	        }
	    }
	    temporaryPlacement(level) {
	        if (!this.memory.temporaryPlacement)
	            this.memory.temporaryPlacement = {};
	        if (!this.memory.temporaryPlacement[level]) {
	            let actions = [];
	            // links
	            if (level === 5) {
	                actions.push({ actionType: "place", structureType: STRUCTURE_LINK, coord: { x: 2, y: 2 } });
	            }
	            if (level === 6) {
	                actions.push({ actionType: "place", structureType: STRUCTURE_LINK, coord: { x: 2, y: 3 } });
	            }
	            if (level === 7) {
	                actions.push({ actionType: "place", structureType: STRUCTURE_LINK, coord: { x: 2, y: 4 } });
	            }
	            if (level === 8) {
	                actions.push({ actionType: "remove", structureType: STRUCTURE_LINK, coord: { x: 2, y: 3 } });
	                actions.push({ actionType: "remove", structureType: STRUCTURE_LINK, coord: { x: 2, y: 4 } });
	            }
	            for (let action of actions) {
	                let outcome;
	                let position = helper_1.helper.coordToPosition(action.coord, this.memory.centerPosition, this.memory.rotation);
	                if (action.actionType === "place") {
	                    outcome = position.createConstructionSite(action.structureType);
	                }
	                else {
	                    let structure = position.lookForStructure(action.structureType);
	                    if (structure) {
	                        outcome = structure.destroy();
	                    }
	                    else {
	                        outcome = "noStructure";
	                    }
	                }
	                if (outcome === OK) {
	                    console.log(`LAYOUT: ${action.actionType}d temporary ${action.structureType} (${this.name}, level: ${level})`);
	                }
	                else {
	                    console.log(`LAYOUT: problem with temp placement, please follow up in ${this.name}`);
	                    console.log(`tried to ${action.actionType} ${action.structureType} at level ${level}, outcome: ${outcome}`);
	                }
	            }
	            this.memory.temporaryPlacement[level] = true;
	        }
	    }
	}
	exports.QuadOperation = QuadOperation;


/***/ },
/* 47 */
/*!**************************************************!*\
  !*** ./src/ai/operations/ControllerOperation.ts ***!
  \**************************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const EmergencyMission_1 = __webpack_require__(/*! ../missions/EmergencyMission */ 10);
	const RefillMission_1 = __webpack_require__(/*! ../missions/RefillMission */ 12);
	const PowerMission_1 = __webpack_require__(/*! ../missions/PowerMission */ 14);
	const TerminalNetworkMission_1 = __webpack_require__(/*! ../missions/TerminalNetworkMission */ 15);
	const IgorMission_1 = __webpack_require__(/*! ../missions/IgorMission */ 16);
	const LinkMiningMission_1 = __webpack_require__(/*! ../missions/LinkMiningMission */ 17);
	const MiningMission_1 = __webpack_require__(/*! ../missions/MiningMission */ 18);
	const BuildMission_1 = __webpack_require__(/*! ../missions/BuildMission */ 19);
	const LinkNetworkMission_1 = __webpack_require__(/*! ../missions/LinkNetworkMission */ 20);
	const GeologyMission_1 = __webpack_require__(/*! ../missions/GeologyMission */ 22);
	const UpgradeMission_1 = __webpack_require__(/*! ../missions/UpgradeMission */ 21);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const SeedAnalysis_1 = __webpack_require__(/*! ../SeedAnalysis */ 48);
	const MasonMission_1 = __webpack_require__(/*! ../missions/MasonMission */ 49);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const BodyguardMission_1 = __webpack_require__(/*! ../missions/BodyguardMission */ 28);
	const RemoteBuildMission_1 = __webpack_require__(/*! ../missions/RemoteBuildMission */ 26);
	const ScoutMission_1 = __webpack_require__(/*! ../missions/ScoutMission */ 25);
	const ClaimMission_1 = __webpack_require__(/*! ../missions/ClaimMission */ 30);
	const RadarMission_1 = __webpack_require__(/*! ../missions/RadarMission */ 50);
	const notifier_1 = __webpack_require__(/*! ../../notifier */ 6);
	const SurveyMission_1 = __webpack_require__(/*! ../missions/SurveyMission */ 51);
	const GEO_SPAWN_COST = 5000;
	class ControllerOperation extends Operation_1.Operation {
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	        this.priority = constants_1.OperationPriority.OwnedRoom;
	        if (this.flag.room && this.flag.room.controller.level < 6) {
	            this.priority = constants_1.OperationPriority.VeryHigh;
	        }
	    }
	    initOperation() {
	        this.autoLayout();
	        // scout room
	        this.spawnGroup = this.empire.getSpawnGroup(this.flag.pos.roomName);
	        if (!this.spawnGroup) {
	            if (!this.memory.spawnRooms) {
	                return;
	            }
	            this.spawnGroup = this.getRemoteSpawnGroup(8);
	            this.addMission(new ScoutMission_1.ScoutMission(this));
	            this.addMission(new ClaimMission_1.ClaimMission(this));
	            if (!this.hasVision)
	                return;
	            this.addMission(new BodyguardMission_1.BodyguardMission(this));
	            this.addMission(new RemoteBuildMission_1.RemoteBuildMission(this, false));
	        }
	        this.empire.register(this.flag.room);
	        if (this.flag.room.findStructures(STRUCTURE_SPAWN).length > 0) {
	            // spawn emergency miner if needed
	            this.addMission(new EmergencyMission_1.EmergencyMinerMission(this));
	            // refill spawning energy - will spawn small spawnCart if needed
	            this.addMission(new RefillMission_1.RefillMission(this));
	        }
	        this.addDefense();
	        this.addMission(new PowerMission_1.PowerMission(this));
	        // energy network
	        if (this.flag.room.terminal && this.flag.room.storage) {
	            this.addMission(new TerminalNetworkMission_1.TerminalNetworkMission(this));
	            this.addMission(new IgorMission_1.IgorMission(this));
	            this.addMission(new RadarMission_1.RadarMission(this));
	        }
	        // harvest energy
	        for (let i = 0; i < this.sources.length; i++) {
	            if (this.sources[i].pos.lookFor(LOOK_FLAGS).length > 0)
	                continue;
	            let source = this.sources[i];
	            if (this.flag.room.controller.level === 8 && this.flag.room.storage) {
	                let link = source.findMemoStructure(STRUCTURE_LINK, 2, true);
	                if (link) {
	                    this.addMission(new LinkMiningMission_1.LinkMiningMission(this, "miner" + i, source, link));
	                    continue;
	                }
	                else {
	                    this.placeLink(source);
	                }
	            }
	            this.addMission(new MiningMission_1.MiningMission(this, "miner" + i, source));
	        }
	        // build construction
	        let buildMission = new BuildMission_1.BuildMission(this);
	        this.addMission(buildMission);
	        if (this.flag.room.storage) {
	            // use link array near storage to fire energy at controller link (pre-rcl8)
	            this.addMission(new LinkNetworkMission_1.LinkNetworkMission(this));
	            // mine minerals
	            this.addMission(new GeologyMission_1.GeologyMission(this));
	            // scout and place harvest flags
	            this.addMission(new SurveyMission_1.SurveyMission(this));
	        }
	        // upgrader controller
	        let boostUpgraders = this.flag.room.controller.level < 8;
	        let upgradeMission = new UpgradeMission_1.UpgradeMission(this, boostUpgraders);
	        this.addMission(upgradeMission);
	        // repair walls
	        this.addMission(new MasonMission_1.MasonMission(this));
	        this.towerRepair();
	        // reassign spawngroups for remote boosting
	        if (this.flag.room.controller.level < 6) {
	            if (!this.memory.spawnRooms)
	                return;
	            let boostSpawnGroup = this.getRemoteSpawnGroup(6);
	            if (boostSpawnGroup) {
	                if (this.flag.room.controller.level < 3) {
	                    let bodyguard = new BodyguardMission_1.BodyguardMission(this);
	                    this.addMission(bodyguard);
	                    bodyguard.setSpawnGroup(boostSpawnGroup);
	                    let remoteBuilder = new RemoteBuildMission_1.RemoteBuildMission(this, false);
	                    this.addMission(remoteBuilder);
	                    remoteBuilder.setSpawnGroup(boostSpawnGroup);
	                }
	                if (Game.map.getRoomLinearDistance(this.flag.room.name, boostSpawnGroup.room.name) > 4) {
	                    return;
	                }
	                if (boostSpawnGroup.room.controller.level >= 8) {
	                    buildMission.activateBoost = true;
	                    upgradeMission.setSpawnGroup(boostSpawnGroup);
	                    buildMission.setSpawnGroup(boostSpawnGroup);
	                }
	            }
	        }
	    }
	    finalizeOperation() {
	        this.getRemoteSpawnGroup(8);
	    }
	    invalidateOperationCache() {
	        if (Math.random() < .01) {
	            this.memory.spawnRooms = undefined;
	        }
	    }
	    nuke(x, y, roomName) {
	        let nuker = _.head(this.flag.room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_NUKER } }));
	        let outcome = nuker.launchNuke(new RoomPosition(x, y, roomName));
	        if (outcome === OK) {
	            this.empire.addNuke({ tick: Game.time, roomName: roomName });
	            return "NUKER: Bombs away! \\o/";
	        }
	        else {
	            return `NUKER: error: ${outcome}`;
	        }
	    }
	    addAllyRoom(roomName) {
	        if (_.includes(this.empire.memory.allyRooms, roomName)) {
	            return "NETWORK: " + roomName + " is already being scanned by " + this.name;
	        }
	        this.empire.addAllyRoom(roomName);
	        return "NETWORK: added " + roomName + " to rooms scanned by " + this.name;
	    }
	    moveLayout(x, y, rotation) {
	        this.memory.centerPosition = new RoomPosition(x, y, this.flag.pos.roomName);
	        this.memory.rotation = rotation;
	        this.memory.layoutMap = undefined;
	        this.showLayout(false);
	        return `moving layout, run command ${this.name}.showLayout(true) to display`;
	    }
	    showLayout(show) {
	        if (!this.memory.rotation === undefined || !this.memory.centerPosition) {
	            return "No layout defined";
	        }
	        if (!show) {
	            for (let flagName in Game.flags) {
	                let flag = Game.flags[flagName];
	                if (flag.name.indexOf(`${this.name}_layout`) >= 0) {
	                    flag.remove();
	                }
	            }
	            return "removing layout flags";
	        }
	        for (let structureType of Object.keys(CONSTRUCTION_COST)) {
	            let coords = this.layoutCoords(structureType);
	            let order = 0;
	            for (let coord of coords) {
	                let flagName = `${this.name}_layout_${structureType}_${order++}`;
	                let flag = Game.flags[flagName];
	                if (flag) {
	                    flag.setPosition(coord.x, coord.y);
	                    continue;
	                }
	                let position = helper_1.helper.coordToPosition(coord, this.memory.centerPosition, this.memory.rotation);
	                let color = COLOR_WHITE;
	                if (structureType === STRUCTURE_EXTENSION || structureType === STRUCTURE_SPAWN
	                    || structureType === STRUCTURE_STORAGE || structureType === STRUCTURE_NUKER) {
	                    color = COLOR_YELLOW;
	                }
	                else if (structureType === STRUCTURE_TOWER) {
	                    color = COLOR_BLUE;
	                }
	                else if (structureType === STRUCTURE_LAB || structureType === STRUCTURE_TERMINAL) {
	                    color = COLOR_CYAN;
	                }
	                else if (structureType === STRUCTURE_POWER_SPAWN) {
	                    color = COLOR_RED;
	                }
	                else if (structureType === STRUCTURE_OBSERVER) {
	                    color = COLOR_BROWN;
	                }
	                else if (structureType === STRUCTURE_ROAD) {
	                    color = COLOR_GREY;
	                }
	                else if (structureType === STRUCTURE_RAMPART) {
	                    color = COLOR_GREEN;
	                }
	                position.createFlag(flagName, color);
	            }
	        }
	        return "showing layout flags";
	    }
	    autoLayout() {
	        this.initWithSpawn();
	        if (!this.memory.centerPosition || this.memory.rotation === undefined)
	            return;
	        this.initAutoLayout();
	        this.buildLayout();
	    }
	    buildLayout() {
	        if (!this.flag.room)
	            return;
	        let structureTypes = Object.keys(CONSTRUCTION_COST);
	        if (this.memory.checkLayoutIndex === undefined || this.memory.checkLayoutIndex >= structureTypes.length) {
	            this.memory.checkLayoutIndex = 0;
	        }
	        let structureType = structureTypes[this.memory.checkLayoutIndex++];
	        this.fixedPlacement(structureType);
	        this.temporaryPlacement(this.flag.room.controller.level);
	    }
	    fixedPlacement(structureType) {
	        let controllerLevel = this.flag.room.controller.level;
	        let constructionPriority = Math.max(controllerLevel * 10, 40);
	        if (controllerLevel === 1) {
	            constructionPriority = 90;
	        }
	        if (Object.keys(Game.constructionSites).length > constructionPriority)
	            return;
	        if (structureType === STRUCTURE_RAMPART && controllerLevel < 5)
	            return;
	        if (!this.memory.lastChecked)
	            this.memory.lastChecked = {};
	        if (Game.time - this.memory.lastChecked[structureType] < 1000)
	            return;
	        let coords = this.layoutCoords(structureType);
	        let allowedCount = this.allowedCount(structureType, controllerLevel);
	        for (let i = 0; i < coords.length; i++) {
	            if (i >= allowedCount)
	                break;
	            let coord = coords[i];
	            let position = helper_1.helper.coordToPosition(coord, this.memory.centerPosition, this.memory.rotation);
	            let structure = position.lookForStructure(structureType);
	            if (structure) {
	                this.repairLayout(structure);
	                continue;
	            }
	            let hasConstruction = position.lookFor(LOOK_CONSTRUCTION_SITES)[0];
	            if (hasConstruction)
	                continue;
	            let outcome = position.createConstructionSite(structureType);
	            if (outcome === OK) {
	                console.log(`LAYOUT: placing ${structureType} at ${position} (${this.name})`);
	            }
	            else {
	            }
	            return;
	        }
	        this.memory.lastChecked[structureType] = Game.time;
	    }
	    recalculateLayout(layoutType) {
	        if (!this.memory.seedData) {
	            let sourceData = [];
	            for (let source of this.flag.room.find(FIND_SOURCES)) {
	                sourceData.push({ pos: source.pos, amount: 3000 });
	            }
	            this.memory.seedData = {
	                sourceData: sourceData,
	                seedScan: {},
	                seedSelectData: undefined
	            };
	        }
	        let analysis = new SeedAnalysis_1.SeedAnalysis(this.flag.room, this.memory.seedData);
	        let results = analysis.run(this.staticStructures, layoutType);
	        if (results) {
	            let centerPosition = new RoomPosition(results.origin.x, results.origin.y, this.flag.room.name);
	            if (results.seedType === this.type) {
	                console.log(`${this.name} found best seed of type ${results.seedType}, initiating auto-layout`);
	                this.memory.centerPosition = centerPosition;
	                this.memory.rotation = results.rotation;
	            }
	            else {
	                console.log(`${this.name} found best seed of another type, replacing operation`);
	                let flagName = `${results.seedType}_${this.name}`;
	                Memory.flags[flagName] = { centerPosition: centerPosition, rotation: results.rotation };
	                this.flag.pos.createFlag(flagName, COLOR_GREY);
	                this.flag.remove();
	            }
	            this.memory.seedData = undefined; // clean-up memory
	        }
	        else {
	            console.log(`${this.name} could not find a suitable auto-layout, consider using another spawn location or room`);
	        }
	    }
	    allowedCount(structureType, level) {
	        if (level < 5 && (structureType === STRUCTURE_RAMPART || structureType === STRUCTURE_WALL
	            || structureType === STRUCTURE_ROAD)) {
	            return 0;
	        }
	        return Math.min(CONTROLLER_STRUCTURES[structureType][level], this.layoutCoords(structureType).length);
	    }
	    layoutCoords(structureType) {
	        if (this.staticStructures[structureType]) {
	            return this.staticStructures[structureType];
	        }
	        else if (this.memory.layoutMap && this.memory.layoutMap[structureType]) {
	            return this.memory.layoutMap[structureType];
	        }
	        else {
	            return [];
	        }
	    }
	    initWithSpawn() {
	        if (!this.flag.room)
	            return;
	        if (!this.memory.centerPosition || this.memory.rotation === undefined) {
	            let structureCount = this.flag.room.find(FIND_STRUCTURES).length;
	            if (structureCount === 1) {
	                this.recalculateLayout();
	            }
	            else if (structureCount > 1) {
	                this.recalculateLayout(this.type);
	            }
	            return;
	        }
	    }
	    towerRepair() {
	        let structureType = STRUCTURE_RAMPART;
	        if (Game.time % 2 === 0) {
	            structureType = STRUCTURE_ROAD;
	        }
	        let coords = this.layoutCoords(structureType);
	        if (!this.memory.repairIndices) {
	            this.memory.repairIndices = {};
	        }
	        if (this.memory.repairIndices[structureType] === undefined ||
	            this.memory.repairIndices[structureType] >= coords.length) {
	            this.memory.repairIndices[structureType] = 0;
	        }
	        let coord = coords[this.memory.repairIndices[structureType]++];
	        let position = helper_1.helper.coordToPosition(coord, this.memory.centerPosition, this.memory.rotation);
	        let structure = position.lookForStructure(structureType);
	        if (structure) {
	            this.repairLayout(structure);
	        }
	    }
	    // deprecated
	    findRemoteSpawn(distanceLimit, levelRequirement = 8) {
	        let remoteSpawn = _(this.empire.spawnGroups)
	            .filter((s) => {
	            return Game.map.getRoomLinearDistance(this.flag.pos.roomName, s.room.name) <= distanceLimit
	                && s.room.controller.level >= levelRequirement
	                && s.averageAvailability > .3
	                && s.isAvailable;
	        })
	            .sortBy((s) => {
	            return Game.map.getRoomLinearDistance(this.flag.pos.roomName, s.room.name);
	        })
	            .head();
	        return remoteSpawn;
	    }
	    repairLayout(structure) {
	        let repairsNeeded = Math.floor((structure.hitsMax - structure.hits) / 800);
	        if (structure.structureType === STRUCTURE_RAMPART) {
	            if (structure.hits >= 100000) {
	                return;
	            }
	        }
	        else {
	            if (repairsNeeded === 0) {
	                return;
	            }
	        }
	        let towers = this.flag.room.findStructures(STRUCTURE_TOWER);
	        for (let tower of towers) {
	            if (repairsNeeded === 0) {
	                return;
	            }
	            if (tower.alreadyFired) {
	                continue;
	            }
	            if (!tower.pos.inRangeTo(structure, Math.max(5, this.memory.radius - 3))) {
	                continue;
	            }
	            let outcome = tower.repair(structure);
	            repairsNeeded--;
	        }
	        if (repairsNeeded > 0 && towers.length > 0) {
	            structure.pos.findClosestByRange(towers).repair(structure);
	        }
	    }
	    placeLink(source) {
	        if (source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2).length > 0)
	            return;
	        if (source.pos.findInRange(source.room.findStructures(STRUCTURE_LINK), 2).length > 0)
	            return;
	        let positions = [];
	        for (let xDelta = -2; xDelta <= 2; xDelta++) {
	            for (let yDelta = -2; yDelta <= 2; yDelta++) {
	                if (Math.abs(xDelta) !== 2 && Math.abs(yDelta) !== 2) {
	                    continue;
	                }
	                let position = new RoomPosition(source.pos.x + xDelta, source.pos.y + yDelta, this.flag.room.name);
	                if (!position.isPassible(true))
	                    continue;
	                if (position.findInRange(FIND_SOURCES, 2).length > 1)
	                    continue;
	                if (position.getPathDistanceTo(source.pos) > 1)
	                    continue;
	                positions.push(position);
	            }
	        }
	        positions = _.sortBy(positions, (p) => p.getRangeTo(this.flag.room.storage));
	        positions[0].createConstructionSite(STRUCTURE_LINK);
	        notifier_1.notifier.add(`placed link ${this.flag.room.name}`);
	    }
	}
	exports.ControllerOperation = ControllerOperation;


/***/ },
/* 48 */
/*!********************************!*\
  !*** ./src/ai/SeedAnalysis.ts ***!
  \********************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const helper_1 = __webpack_require__(/*! ../helpers/helper */ 5);
	class SeedAnalysis {
	    constructor(room, seedData) {
	        this.data = seedData;
	        this.room = room;
	    }
	    run(staticStructures, layoutType) {
	        let layoutTypes;
	        if (layoutType) {
	            layoutTypes = [layoutType];
	        }
	        else {
	            layoutTypes = ["quad", "flex"];
	        }
	        for (let type of layoutTypes) {
	            if (!this.data.seedScan[type]) {
	                this.findSeeds(type);
	            }
	            if (this.data.seedScan[type].length > 0) {
	                if (staticStructures) {
	                    let result = this.findByStructures(type, staticStructures);
	                    if (result)
	                        return result;
	                }
	                else {
	                    return this.selectSeed(type, this.data.seedScan[type]);
	                }
	            }
	        }
	        console.log(`No viable seeds in ${this.room.name}`);
	    }
	    findSeeds(seedType) {
	        let radius;
	        let wallMargin;
	        let taper;
	        if (seedType === "quad") {
	            radius = 6;
	            wallMargin = 0;
	            taper = 1;
	        }
	        else if (seedType === "flex") {
	            radius = 4;
	            wallMargin = 1;
	            taper = 4;
	        }
	        let requiredWallOffset = 2;
	        let totalMargin = requiredWallOffset + radius + wallMargin;
	        if (!this.data.seedScan[seedType]) {
	            console.log(`AUTO: initiating seed scan: ${seedType}`);
	            this.data.seedScan[seedType] = [];
	        }
	        let indexX = totalMargin;
	        while (indexX <= 49 - totalMargin) {
	            let indexY = totalMargin;
	            while (indexY <= 49 - totalMargin) {
	                let area = this.room.lookForAtArea(LOOK_TERRAIN, indexY - radius, indexX - radius, indexY + radius, indexX + radius);
	                let foundSeed = this.checkArea(indexX, indexY, radius, taper, area);
	                if (foundSeed) {
	                    this.data.seedScan[seedType].push({ x: indexX, y: indexY });
	                }
	                indexY++;
	            }
	            indexX++;
	        }
	        console.log(`found ${this.data.seedScan[seedType].length} ${seedType} seeds`);
	        if (this.data.seedScan[seedType].length > 0) {
	            this.data.seedScan[seedType] = _.sortBy(this.data.seedScan[seedType], (c) => {
	                // sort by distance to controller
	                return this.room.controller.pos.getRangeTo(new RoomPosition(c.x, c.y, this.room.name));
	            });
	        }
	    }
	    checkArea(xOrigin, yOrigin, radius, taper, area) {
	        for (let xDelta = -radius; xDelta <= radius; xDelta++) {
	            for (let yDelta = -radius; yDelta <= radius; yDelta++) {
	                if (Math.abs(xDelta) + Math.abs(yDelta) > radius * 2 - taper)
	                    continue;
	                if (area[yOrigin + yDelta][xOrigin + xDelta][0] === "wall") {
	                    console.log(`x: ${xOrigin} y: ${yOrigin} disqualified due to wall at ${xOrigin + xDelta}, ${yOrigin + yDelta}`);
	                    return false;
	                }
	            }
	        }
	        // check source proximity
	        let originPosition = new RoomPosition(xOrigin, yOrigin, this.room.name);
	        for (let source of this.room.find(FIND_SOURCES)) {
	            if (originPosition.inRangeTo(source, radius + 2)) {
	                return false;
	            }
	        }
	        return true;
	    }
	    selectSeed(seedType, seeds) {
	        let storageDelta;
	        if (seedType === "quad") {
	            storageDelta = { x: 0, y: 4 };
	        }
	        else if (seedType === "flex") {
	            storageDelta = { x: 0, y: -3 };
	        }
	        else {
	            console.log("unrecognized seed type");
	            return;
	        }
	        if (!this.data.seedSelectData) {
	            this.data.seedSelectData = {
	                index: 0,
	                rotation: 0,
	                best: { seedType: seedType, origin: undefined, rotation: undefined, energyPerDistance: 0 }
	            };
	        }
	        let data = this.data.seedSelectData;
	        if (data.rotation > 3) {
	            data.index++;
	            data.rotation = 0;
	        }
	        if (data.index >= seeds.length) {
	            if (data.best.origin) {
	                console.log(`${this.room.name} determined best seed, ${data.best.seedType} at ${data.best.origin.x},${data.best.origin.y} with rotation ${data.rotation}`);
	                this.data.seedSelectData = undefined;
	                return data.best;
	            }
	            else {
	                console.log(`unable to find suitable seed selection in ${this.room.name}`);
	            }
	        }
	        let storagePosition = helper_1.helper.coordToPosition(storageDelta, new RoomPosition(seeds[data.index].x, seeds[data.index].y, this.room.name), data.rotation);
	        let energyPerDistance = 0;
	        for (let sourceDatum of this.data.sourceData) {
	            let sourcePosition = helper_1.helper.deserializeRoomPosition(sourceDatum.pos);
	            let ret = PathFinder.search(storagePosition, [{ pos: sourcePosition, range: 1 }], {
	                swampCost: 1,
	                maxOps: 4000,
	            });
	            let pathLength = 100;
	            if (!ret.incomplete) {
	                pathLength = Math.max(ret.path.length, 50);
	            }
	            energyPerDistance += sourceDatum.amount / pathLength;
	        }
	        if (energyPerDistance > data.best.energyPerDistance) {
	            console.log(`${this.room.name} found better seed, energyPerDistance: ${energyPerDistance}`);
	            data.best = { seedType: seedType, origin: seeds[data.index], rotation: data.rotation,
	                energyPerDistance: energyPerDistance };
	        }
	        // update rotation for next tick
	        data.rotation++;
	    }
	    findBySpawn(seedType, spawn) {
	        let spawnCoords;
	        if (seedType === "quad") {
	            spawnCoords = [{ x: 2, y: 0 }, { x: 0, y: -2 }, { x: -2, y: 0 }];
	        }
	        else {
	            spawnCoords = [{ x: -2, y: 1 }, { x: -1, y: 2 }, { x: 0, y: 3 }];
	        }
	        let seeds = this.data.seedScan[seedType];
	        for (let seed of seeds) {
	            let centerPosition = new RoomPosition(seed.x, seed.y, this.room.name);
	            for (let coord of spawnCoords) {
	                for (let rotation = 0; rotation <= 3; rotation++) {
	                    let testPosition = helper_1.helper.coordToPosition(coord, centerPosition, rotation);
	                    if (spawn.pos.inRangeTo(testPosition, 0)) {
	                        console.log(`seed: ${JSON.stringify(seed)}, centerPos: ${centerPosition}, rotation: ${rotation},` +
	                            `\ncoord: ${JSON.stringify(coord)} testPos: ${testPosition}, spawnPos: ${spawn.pos}`);
	                        return { seedType: seedType, origin: seed, rotation: rotation, energyPerDistance: undefined };
	                    }
	                }
	            }
	        }
	    }
	    findByStructures(seedType, staticStructures) {
	        let mostHits = 0;
	        let bestSeed;
	        let bestRotation;
	        let seeds = this.data.seedScan[seedType];
	        for (let seed of seeds) {
	            let centerPosition = new RoomPosition(seed.x, seed.y, this.room.name);
	            for (let rotation = 0; rotation <= 3; rotation++) {
	                let structureHits = 0;
	                for (let structureType of [STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_LAB, STRUCTURE_TERMINAL]) {
	                    let coords = staticStructures[structureType];
	                    for (let coord of coords) {
	                        let testPosition = helper_1.helper.coordToPosition(coord, centerPosition, rotation);
	                        if (testPosition.lookForStructure(structureType)) {
	                            structureHits++;
	                        }
	                    }
	                }
	                if (structureHits > mostHits) {
	                    mostHits = structureHits;
	                    bestSeed = seed;
	                    bestRotation = rotation;
	                }
	            }
	        }
	        if (mostHits > 0) {
	            return { seedType: seedType, origin: bestSeed, rotation: bestRotation, energyPerDistance: undefined };
	        }
	    }
	}
	exports.SeedAnalysis = SeedAnalysis;


/***/ },
/* 49 */
/*!*****************************************!*\
  !*** ./src/ai/missions/MasonMission.ts ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const MIN_RAMPART_HITS = 50000000;
	class MasonMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "mason");
	    }
	    initMission() {
	        if (!this.memory.needMason) {
	            if (this.room.controller.level < 8) {
	                this.memory.needMason = false;
	            }
	            else {
	                let lowestRampart = _(this.room.findStructures(STRUCTURE_RAMPART)).sortBy("hits").head();
	                this.memory.needMason = lowestRampart && lowestRampart.hits < MIN_RAMPART_HITS;
	            }
	        }
	    }
	    roleCall() {
	        let max = 0;
	        if (this.memory.needMason) {
	            max = 1;
	        }
	        this.masons = this.headCount("mason", () => this.workerBody(16, 8, 12), max);
	    }
	    missionActions() {
	        for (let mason of this.masons) {
	            this.masonActions(mason);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        this.memory.needMason = undefined;
	    }
	    masonActions(mason) {
	        let rampart = this.findMasonTarget(mason);
	        let range = mason.pos.getRangeTo(rampart);
	        if (rampart && range <= 3) {
	            mason.repair(rampart);
	        }
	        if (mason.carry.energy < mason.carryCapacity - 200) {
	            let fullExtensions = _.filter(mason.pos.findInRange(mason.room.findStructures(STRUCTURE_EXTENSION), 1), (e) => e.energy > 0);
	            if (fullExtensions.length > 0) {
	                mason.withdraw(fullExtensions[0], RESOURCE_ENERGY);
	            }
	        }
	        let hasLoad = this.masonHasLoad(mason);
	        if (hasLoad) {
	            if (rampart) {
	                if (range > 3) {
	                    mason.blindMoveTo(rampart);
	                }
	                else {
	                    this.findMasonPosition(mason, rampart);
	                }
	            }
	        }
	        else {
	            let extension = this.findFullExtension(mason);
	            if (extension) {
	                if (mason.pos.isNearTo(extension)) {
	                    mason.withdraw(extension, RESOURCE_ENERGY);
	                }
	                else {
	                    mason.blindMoveTo(extension);
	                }
	            }
	            else {
	                if (mason.name === "vigo5_mason_61")
	                    console.log("none");
	                mason.idleOffRoad(this.flag);
	            }
	        }
	    }
	    findMasonTarget(mason) {
	        let findRampart = () => {
	            let lowestHits = 100000;
	            let lowestRampart = _(this.room.findStructures(STRUCTURE_RAMPART)).sortBy("hits").head();
	            if (lowestRampart) {
	                lowestHits = lowestRampart.hits;
	            }
	            let myRampart = _(this.room.findStructures(STRUCTURE_RAMPART))
	                .filter((s) => s.hits < lowestHits + 100000)
	                .sortBy((s) => mason.pos.getRangeTo(s))
	                .head();
	            if (myRampart)
	                return myRampart;
	        };
	        let forgetRampart = (s) => mason.ticksToLive % 500 === 0;
	        return mason.rememberStructure(findRampart, forgetRampart, "rampartId");
	    }
	    findFullExtension(mason) {
	        let findExtension = () => {
	            let fullExtensions = _.filter(this.room.findStructures(STRUCTURE_EXTENSION), (e) => e.energy > 0);
	            return mason.pos.findClosestByRange(fullExtensions);
	        };
	        let forgetExtension = (extension) => extension.energy === 0;
	        let extension = mason.rememberStructure(findExtension, forgetExtension, "extensionId", true);
	        return mason.pos.findClosestByRange([this.room.storage, extension]);
	    }
	    findMasonPosition(mason, rampart) {
	        if (mason.pos.lookForStructure(STRUCTURE_ROAD)) {
	            let position = rampart.pos;
	            if (position.lookFor(LOOK_STRUCTURES).length > 1) {
	                let testPosition = mason.pos.findClosestByRange(_.filter(position.openAdjacentSpots(), (p) => !p.lookForStructure(STRUCTURE_ROAD)));
	                if (testPosition) {
	                    position = testPosition;
	                }
	            }
	            if (!mason.pos.inRangeTo(position, 0)) {
	                mason.blindMoveTo(position);
	            }
	        }
	    }
	    masonHasLoad(mason) {
	        if (mason.memory.hasLoad && mason.carry.energy <= mason.carryCapacity * .25) {
	            mason.memory.hasLoad = false;
	            delete mason.memory.extensionId;
	        }
	        else if (!mason.memory.hasLoad && mason.carry.energy >= mason.carryCapacity * .9) {
	            mason.memory.hasLoad = true;
	        }
	        return mason.memory.hasLoad;
	    }
	}
	exports.MasonMission = MasonMission;


/***/ },
/* 50 */
/*!*****************************************!*\
  !*** ./src/ai/missions/RadarMission.ts ***!
  \*****************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const notifier_1 = __webpack_require__(/*! ../../notifier */ 6);
	class RadarMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "radar");
	    }
	    initMission() {
	    }
	    roleCall() {
	    }
	    missionActions() {
	        let observer = this.findObserver();
	        if (!observer) {
	            return;
	        }
	        if (!this.memory.fullScanComplete) {
	            this.fullScan(observer);
	            return;
	        }
	        this.allyScan(observer);
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	        if (Game.time > this.memory.tickLastScanned + 10000) {
	            this.memory.fullScanComplete = false;
	        }
	    }
	    findObserver() {
	        let observer = this.room.findStructures(STRUCTURE_OBSERVER)[0];
	        if (!observer) {
	            if (this.room.controller.level === 8 && Game.time % 100 === 0) {
	                console.log("NETWORK: please add an observer to", this.opName, "to participate in network");
	            }
	            return;
	        }
	        return observer;
	    }
	    allyScan(observer) {
	        if (observer.observation && observer.observation.purpose === constants_1.OBSERVER_PURPOSE_ALLYTRADE) {
	            let room = observer.observation.room;
	            if (!room.controller.owner || !constants_1.TRADE_PARTNERS[room.controller.owner.username]) {
	                this.empire.removeAllyRoom(room.name);
	            }
	        }
	        if (Math.random() > .2) {
	            return;
	        }
	        this.memory.scanIndex = this.empire.observeAllyRoom(observer, this.memory.scanIndex);
	    }
	    fullScan(observer) {
	        if (!this.memory.fullScanData) {
	            console.log("NETWORK: Beginning full radar scan for", this.opName);
	            this.memory.fullScanData = {
	                x: -10,
	                y: -10,
	            };
	        }
	        let scanData = this.memory.fullScanData;
	        if (observer.observation && observer.observation.purpose === "allySearch") {
	            let room = observer.observation.room;
	            if (room.controller && room.controller.owner) {
	                if (room.controller.owner.username !== constants_1.USERNAME) {
	                    this.empire.addHostileRoom(room.name, room.controller.level);
	                }
	                else {
	                    if (this.empire.memory.hostileRooms[room.name]) {
	                        notifier_1.notifier.add(`RADAR: previously hostile room found empty: ${room.name}`);
	                        this.empire.removeHostileRoom(room.name);
	                    }
	                }
	                if (constants_1.TRADE_PARTNERS[room.controller.owner.username] && room.storage && room.terminal
	                    && room.controller.level >= 6 && !room.terminal.my) {
	                    this.empire.addAllyRoom(room.name);
	                }
	            }
	            // increment
	            scanData.x++;
	            if (scanData.x > 10) {
	                scanData.x = -10;
	                scanData.y++;
	                if (scanData.y > 10) {
	                    this.memory.tickLastScanned = Game.time;
	                    this.memory.fullScanComplete = true;
	                    this.memory.fullScanData = undefined;
	                    console.log(`NETWORK: Scan of ally rooms complete at ${this.opName}`);
	                    return;
	                }
	            }
	        }
	        let roomName = helper_1.helper.findRelativeRoomName(this.room.name, scanData.x, scanData.y);
	        observer.observeRoom(roomName, "allySearch");
	    }
	}
	exports.RadarMission = RadarMission;


/***/ },
/* 51 */
/*!******************************************!*\
  !*** ./src/ai/missions/SurveyMission.ts ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const SurveyAnalyzer_1 = __webpack_require__(/*! ./SurveyAnalyzer */ 52);
	class SurveyMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "survey");
	    }
	    initMission() {
	        if (this.memory.surveyComplete) {
	            return;
	        }
	        let analyzer = new SurveyAnalyzer_1.SurveyAnalyzer(this);
	        this.needsVision = analyzer.run();
	    }
	    roleCall() {
	        let maxSurveyors = 0;
	        if (this.needsVision && !this.room.findStructures(STRUCTURE_OBSERVER)[0] || this.chosenRoom) {
	            maxSurveyors = 1;
	        }
	        this.surveyors = this.headCount("surveyor", () => this.workerBody(0, 0, 1), maxSurveyors);
	    }
	    missionActions() {
	        for (let surveyor of this.surveyors) {
	            if (this.needsVision) {
	                this.explorerActions(surveyor);
	            }
	        }
	        if (this.needsVision) {
	            let observer = this.room.findStructures(STRUCTURE_OBSERVER)[0];
	            if (!observer) {
	                return;
	            }
	            observer.observeRoom(this.needsVision);
	        }
	    }
	    finalizeMission() {
	    }
	    invalidateMissionCache() {
	    }
	    explorerActions(explorer) {
	        if (this.needsVision) {
	            this.empire.travelTo(explorer, { pos: helper_1.helper.pathablePosition(this.needsVision) });
	        }
	    }
	}
	exports.SurveyMission = SurveyMission;


/***/ },
/* 52 */
/*!*******************************************!*\
  !*** ./src/ai/missions/SurveyAnalyzer.ts ***!
  \*******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const notifier_1 = __webpack_require__(/*! ../../notifier */ 6);
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	class SurveyAnalyzer {
	    constructor(mission) {
	        this.room = mission.getRoom();
	        this.empire = mission.getEmpire();
	        this.spawnGroup = mission.getSpawnGroup();
	        this.memory = mission.getMemory();
	        this.opName = mission.getOpName();
	    }
	    run() {
	        // place flag in chosen room
	        if (Game.time < this.memory.nextAnalysis) {
	            return;
	        }
	        if (this.memory.chosenRoom) {
	            let room = Game.rooms[this.memory.chosenRoom];
	            if (room) {
	                this.placeFlag(room);
	                delete this.memory.chosenRoom;
	                if (Object.keys(this.memory.surveyRooms).length === 0) {
	                    notifier_1.notifier.add(`SURVEY: no more rooms to evaluate in ${this.room.name}`);
	                }
	                else {
	                    this.memory.nextAnalysis = Game.time + 1000;
	                }
	            }
	            return this.memory.chosenRoom;
	        }
	        // analyze rooms
	        let exploreRoomName;
	        if (!this.memory.surveyRooms) {
	            this.memory.surveyRooms = this.initSurveyData();
	        }
	        exploreRoomName = this.completeSurveyData(this.memory.surveyRooms);
	        if (exploreRoomName)
	            return exploreRoomName;
	        exploreRoomName = this.updateOwnershipData();
	        if (exploreRoomName)
	            return;
	        let chosenRoom;
	        let readyList = this.checkReady();
	        if (readyList && Object.keys(readyList).length > 0) {
	            chosenRoom = this.chooseRoom(readyList);
	        }
	        if (chosenRoom) {
	            this.memory.chosenRoom = chosenRoom;
	        }
	        else if (this.memory.nextAnalysis < Game.time) {
	            this.memory.nextAnalysis = Game.time + 1000;
	        }
	    }
	    initSurveyData() {
	        let data = {};
	        // find core
	        let roomCoords = helper_1.helper.getRoomCoordinates(this.room.name);
	        let coreX = "" + Math.floor(roomCoords.x / 10) + 5;
	        let coreY = "" + Math.floor(roomCoords.y / 10) + 5;
	        let nearestCore = roomCoords.xDir + coreX + roomCoords.yDir + coreY;
	        if (Game.map.getRoomLinearDistance(this.room.name, nearestCore) <= 2 &&
	            this.spawnGroup.averageAvailability > 1.5) {
	            data[nearestCore] = { danger: true };
	        }
	        let adjacentRoomNames = this.findAdjacentRooms(this.room.name, 1, [constants_1.ROOMTYPE_ALLEY]);
	        for (let roomName of adjacentRoomNames) {
	            let noSafePath = false;
	            let roomsInPath = this.empire.findAllowedRooms(this.room.name, roomName, { allowHostile: true, restrictDistance: 1 });
	            if (roomsInPath) {
	                for (let roomName in roomsInPath) {
	                    if (this.empire.memory.hostileRooms[roomName]) {
	                        noSafePath = true;
	                    }
	                }
	            }
	            else {
	                noSafePath = true;
	            }
	            let type = helper_1.helper.roomTypeFromName(roomName);
	            if (type === constants_1.ROOMTYPE_SOURCEKEEPER || noSafePath) {
	                data[roomName] = { danger: true };
	            }
	            else {
	                data[roomName] = { danger: false };
	            }
	        }
	        return data;
	    }
	    findAdjacentRooms(startRoomName, distance = 1, filterOut = []) {
	        let alreadyChecked = { [startRoomName]: true };
	        let adjacentRooms = [];
	        let testRooms = [startRoomName];
	        while (testRooms.length > 0) {
	            let testRoom = testRooms.pop();
	            alreadyChecked[testRoom] = true;
	            for (let value of _.values(Game.map.describeExits(testRoom))) {
	                if (alreadyChecked[value])
	                    continue;
	                if (Game.map.getRoomLinearDistance(startRoomName, value) > distance)
	                    continue;
	                if (_.includes(filterOut, helper_1.helper.roomTypeFromName(value)))
	                    continue;
	                adjacentRooms.push(value);
	                testRooms.push(value);
	                alreadyChecked[value] = true;
	            }
	        }
	        return adjacentRooms;
	    }
	    completeSurveyData(surveyRooms) {
	        for (let roomName in surveyRooms) {
	            let data = surveyRooms[roomName];
	            if (data.sourceCount)
	                continue;
	            let room = Game.rooms[roomName];
	            if (room) {
	                this.analyzeRoom(room, data);
	                continue;
	            }
	            if (!data.danger) {
	                return roomName;
	            }
	            else {
	                if (this.room.controller.level < 8)
	                    continue;
	                return roomName;
	            }
	        }
	    }
	    analyzeRoom(room, data) {
	        // mineral
	        if (!room.controller) {
	            data.mineralType = room.find(FIND_MINERALS)[0].mineralType;
	        }
	        // owner
	        data.owner = this.checkOwnership(room);
	        data.lastCheckedOwner = Game.time;
	        if (data.owner === constants_1.USERNAME) {
	            delete this.memory.surveyRooms[room.name];
	            return;
	        }
	        // source info
	        let roomDistance = Game.map.getRoomLinearDistance(this.room.name, room.name);
	        let sources = room.find(FIND_SOURCES);
	        let roomType = helper_1.helper.roomTypeFromName(room.name);
	        let distances = [];
	        data.sourceCount = 0;
	        for (let source of sources) {
	            data.sourceCount++;
	            let ret = PathFinder.search(this.room.storage.pos, { pos: source.pos, range: 1 }, {
	                swampCost: 1,
	                plainCost: 1,
	                roomCallback: (roomName) => {
	                    if (Game.map.getRoomLinearDistance(this.room.name, roomName) > roomDistance) {
	                        return false;
	                    }
	                }
	            });
	            if (ret.incomplete) {
	                notifier_1.notifier.add(`SURVEY: Incomplete path from ${this.room.storage.pos} to ${source.pos}`);
	            }
	            let distance = ret.path.length;
	            distances.push(distance);
	            let cartsNeeded = Mission_1.Mission.analyzeTransport(distance, Mission_1.Mission.loadFromSource(source), 12900).cartsNeeded;
	            // disqualify due to source distance
	            if (cartsNeeded > data.sourceCount) {
	                delete this.memory.surveyRooms[room.name];
	                return;
	            }
	        }
	        data.averageDistance = _.sum(distances) / distances.length;
	        // walls
	        data.hasWalls = room.findStructures(STRUCTURE_WALL).length > 0;
	    }
	    checkOwnership(room) {
	        let flags = room.find(FIND_FLAGS);
	        for (let flag of flags) {
	            if (flag.name.indexOf("mining") >= 0 || flag.name.indexOf("keeper") >= 0) {
	                return constants_1.USERNAME;
	            }
	        }
	        if (room.controller) {
	            if (room.controller.reservation) {
	                return room.controller.reservation.username;
	            }
	            else if (room.controller.owner) {
	                return room.controller.owner.username;
	            }
	        }
	        else {
	            for (let source of room.find(FIND_SOURCES)) {
	                let nearbyCreeps = _.filter(source.pos.findInRange(FIND_CREEPS, 1), (c) => !c.owner || c.owner.username !== "Source Keeper");
	                if (nearbyCreeps.length === 0) {
	                    continue;
	                }
	                return nearbyCreeps[0].owner.username;
	            }
	        }
	    }
	    updateOwnershipData() {
	        for (let roomName in this.memory.surveyRooms) {
	            let data = this.memory.surveyRooms[roomName];
	            // owner
	            if (Game.time > data.lastCheckedOwner + 10000) {
	                let room = Game.rooms[roomName];
	                if (room) {
	                    data.owner = this.checkOwnership(room);
	                    if (data.owner === constants_1.USERNAME) {
	                        delete this.memory.surveyRooms[room.name];
	                    }
	                    else {
	                        data.lastCheckedOwner = Game.time;
	                    }
	                }
	                else {
	                    return roomName;
	                }
	            }
	        }
	    }
	    checkReady() {
	        if (!this.empire.underCPULimit()) {
	            notifier_1.notifier.add(`SURVEY: avoiding placement, cpu is over limit`);
	            this.memory.nextAnalysis = Game.time + 10000;
	            return;
	        }
	        let readyList = {};
	        for (let roomName in this.memory.surveyRooms) {
	            let data = this.memory.surveyRooms[roomName];
	            // owner
	            if (!data.sourceCount) {
	                continue;
	            }
	            // don't claim rooms if any nearby rooms with another owner
	            if (data.owner) {
	                return;
	            }
	            // spawning availability
	            let availabilityRequired = this.spawnGroup.spawns.length / 3;
	            if (Game.map.getRoomLinearDistance(this.room.name, roomName) > 1) {
	                availabilityRequired = 1.2;
	            }
	            if (this.spawnGroup.averageAvailability < availabilityRequired) {
	                continue;
	            }
	            readyList[roomName] = data;
	        }
	        return readyList;
	    }
	    chooseRoom(readySurveyRooms) {
	        let bestScore = 0;
	        let bestChoice;
	        for (let roomName in readySurveyRooms) {
	            let data = readySurveyRooms[roomName];
	            let score = data.sourceCount * 1000 - data.averageDistance;
	            if (score > bestScore) {
	                bestChoice = roomName;
	                bestScore = score;
	            }
	        }
	        return bestChoice;
	    }
	    placeFlag(room) {
	        let direction = helper_1.helper.findRelativeRoomDir(this.room.name, room.name);
	        let opName = this.opName.substr(0, this.opName.length - 1) + direction;
	        if (Game.map.getRoomLinearDistance(this.room.name, room.name) > 1) {
	            opName += direction;
	        }
	        let opType = "mining";
	        if (room.roomType === constants_1.ROOMTYPE_SOURCEKEEPER) {
	            opType = "keeper";
	        }
	        let flagName = `${opType}_${opName}`;
	        helper_1.helper.pathablePosition(room.name).createFlag(flagName, COLOR_GREY);
	        notifier_1.notifier.add(`SURVEY: created new operation in ${room.name}: ${flagName}`);
	    }
	}
	exports.SurveyAnalyzer = SurveyAnalyzer;


/***/ },
/* 53 */
/*!********************************************!*\
  !*** ./src/ai/operations/AutoOperation.ts ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const SeedAnalysis_1 = __webpack_require__(/*! ../SeedAnalysis */ 48);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const ScoutMission_1 = __webpack_require__(/*! ../missions/ScoutMission */ 25);
	const MAX_SOURCE_DISTANCE = 100;
	const PATHFINDER_RANGE_ALLOWANCE = 20;
	class AutoOperation extends Operation_1.Operation {
	    /**
	     * Experimental operation for making decisions about room layout. Eventually this will be a process that happens
	     * automatically and the code will be part of a Mission rather than Operation.
	     * @param flag
	     * @param name
	     * @param type
	     * @param empire
	     */
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	        this.priority = constants_1.OperationPriority.OwnedRoom;
	    }
	    initOperation() {
	        this.spawnGroup = this.getRemoteSpawnGroup();
	        if (!this.spawnGroup)
	            return;
	        this.addMission(new ScoutMission_1.ScoutMission(this));
	        if (!this.flag.room)
	            return;
	        this.autoLayout();
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	    }
	    autoLayout() {
	        if (this.memory.seedSelection)
	            return;
	        if (!this.memory.seedData)
	            this.memory.seedData = {
	                sourceData: undefined,
	                seedScan: {},
	                seedSelectData: undefined,
	            };
	        if (this.memory.seedData.sourceData) {
	            let analysis = new SeedAnalysis_1.SeedAnalysis(this.flag.room, this.memory.seedData);
	            this.memory.seedSelection = analysis.run();
	        }
	        else {
	            this.memory.didWalkabout = this.doWalkabout();
	        }
	    }
	    doWalkabout() {
	        if (!this.memory.walkaboutProgress) {
	            this.memory.walkaboutProgress = {
	                roomsInRange: undefined,
	                sourceData: [],
	            };
	        }
	        let progress = this.memory.walkaboutProgress;
	        if (!progress.roomsInRange) {
	            progress.roomsInRange = this.findRoomsToCheck(this.flag.room.name);
	        }
	        if (progress.roomsInRange.length > 0) {
	            let roomName = progress.roomsInRange[0];
	            if (Game.rooms[roomName]) {
	                let sources = Game.rooms[roomName].find(FIND_SOURCES);
	                let sourceData = [];
	                let allSourcesReasonable = true;
	                for (let source of sources) {
	                    let reasonablePathDistance = this.checkReasonablePathDistance(source);
	                    if (!reasonablePathDistance) {
	                        allSourcesReasonable = false;
	                        break;
	                    }
	                    sourceData.push({ pos: source.pos, amount: Math.min(SOURCE_ENERGY_CAPACITY, source.energyCapacity) });
	                }
	                if (allSourcesReasonable) {
	                    console.log(`found ${sourceData.length} reasonable sources in ${roomName}`);
	                    progress.sourceData = progress.sourceData.concat(sourceData);
	                }
	                _.pull(progress.roomsInRange, roomName);
	            }
	            else {
	                let walkaboutCreep = Game.creeps[this.name + "_walkabout"];
	                if (walkaboutCreep) {
	                    if (Game.time % 10 === 0) {
	                        console.log(`${this.name} walkabout creep is visiting ${roomName}`);
	                    }
	                    walkaboutCreep.avoidSK({ pos: new RoomPosition(25, 25, roomName) });
	                }
	                else {
	                    this.spawnGroup.spawn([MOVE], this.name + "_walkabout", undefined, undefined);
	                }
	            }
	            return false;
	        }
	        this.memory.seedData.sourceData = progress.sourceData;
	        this.memory.walkaboutProgress = undefined;
	        return true;
	    }
	    findRoomsToCheck(origin) {
	        let roomsToCheck = [origin];
	        let roomsAlreadyChecked = [origin];
	        let roomsInRange = [];
	        while (roomsToCheck.length > 0) {
	            let nextRoom = roomsToCheck.pop();
	            let inRange = Game.map.getRoomLinearDistance(origin, nextRoom) <= 1;
	            if (!inRange)
	                continue;
	            roomsInRange.push(nextRoom);
	            let exits = Game.map.describeExits(nextRoom);
	            for (let direction in exits) {
	                let roomName = exits[direction];
	                if (_.include(roomsAlreadyChecked, roomName))
	                    continue;
	                roomsAlreadyChecked.push(nextRoom);
	                if (_.include(roomsToCheck, roomName))
	                    continue;
	                roomsToCheck.push(roomName);
	            }
	        }
	        return roomsInRange;
	    }
	    checkReasonablePathDistance(source) {
	        let ret = PathFinder.search(source.pos, [{ pos: new RoomPosition(25, 25, this.flag.room.name), range: PATHFINDER_RANGE_ALLOWANCE }], {
	            maxOps: 10000,
	        });
	        if (ret.incomplete) {
	            console.log("checkReasonablePathDistance return value incomplete");
	            return false;
	        }
	        else {
	            return ret.path.length <= MAX_SOURCE_DISTANCE - PATHFINDER_RANGE_ALLOWANCE;
	        }
	    }
	    /**
	     * Place flags to show which positions (seeds) are being used for further analysis
	     * @param seedType
	     * @param show
	     * @returns {string}
	     */
	    debugSeeds(seedType, show) {
	        if (show) {
	            let flag = Game.flags[`${this.name}_${seedType}_0`];
	            if (flag)
	                return `first remove flags: ${this.name}.debugSeeds("${seedType}", false)`;
	            if (!this.memory.seedData.seedScan || !this.memory.seedData.seedScan[seedType]) {
	                return `there is no data for ${seedType}`;
	            }
	            for (let i = 0; i < this.memory.seedData.seedScan[seedType].length; i++) {
	                let coord = this.memory.seedData.seedScan[seedType][i];
	                new RoomPosition(coord.x, coord.y, this.flag.room.name).createFlag(`${this.name}_${seedType}_${i}`, COLOR_GREY);
	            }
	        }
	        else {
	            for (let i = 0; i < 2500; i++) {
	                let flag = Game.flags[`${this.name}_${seedType}_${i}`];
	                if (flag)
	                    flag.remove();
	                else
	                    break;
	            }
	        }
	    }
	}
	exports.AutoOperation = AutoOperation;


/***/ },
/* 54 */
/*!********************************************!*\
  !*** ./src/ai/operations/FlexOperation.ts ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const ControllerOperation_1 = __webpack_require__(/*! ./ControllerOperation */ 47);
	const FlexGenerator_1 = __webpack_require__(/*! ../FlexGenerator */ 55);
	const DefenseMission_1 = __webpack_require__(/*! ../missions/DefenseMission */ 13);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	class FlexOperation extends ControllerOperation_1.ControllerOperation {
	    constructor() {
	        super(...arguments);
	        this.staticStructures = {
	            [STRUCTURE_STORAGE]: [{ x: 0, y: -3 }],
	            [STRUCTURE_TERMINAL]: [{ x: -2, y: -1 }],
	            [STRUCTURE_SPAWN]: [{ x: -2, y: 1 }, { x: -1, y: 2 }, { x: 0, y: 3 }],
	            [STRUCTURE_NUKER]: [{ x: 3, y: 0 }],
	            [STRUCTURE_POWER_SPAWN]: [{ x: -3, y: 0 }],
	            [STRUCTURE_LAB]: [
	                { x: 1, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 1 },
	                { x: 1, y: 2 }, { x: 2, y: 0 }, { x: 0, y: 2 },
	                { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: -1 }, { x: -1, y: 1 },
	            ],
	        };
	    }
	    addDefense() {
	        this.addMission(new DefenseMission_1.DefenseMission(this));
	    }
	    temporaryPlacement(level) {
	        if (!this.memory.temporaryPlacement)
	            this.memory.temporaryPlacement = {};
	        if (!this.memory.temporaryPlacement[level]) {
	            let actions = [];
	            // links
	            if (level === 5) {
	                actions.push({ actionType: "place", structureType: STRUCTURE_LINK, coord: { x: 2, y: -1 } });
	            }
	            if (level === 6) {
	                actions.push({ actionType: "place", structureType: STRUCTURE_LINK, coord: { x: 1, y: -1 } });
	            }
	            if (level === 7) {
	                actions.push({ actionType: "place", structureType: STRUCTURE_LINK, coord: { x: 0, y: -1 } });
	            }
	            if (level === 8) {
	                actions.push({ actionType: "remove", structureType: STRUCTURE_LINK, coord: { x: 1, y: -1 } });
	                actions.push({ actionType: "remove", structureType: STRUCTURE_LINK, coord: { x: 0, y: -1 } });
	            }
	            for (let action of actions) {
	                let outcome;
	                let position = helper_1.helper.coordToPosition(action.coord, this.memory.centerPosition, this.memory.rotation);
	                if (action.actionType === "place") {
	                    outcome = position.createConstructionSite(action.structureType);
	                }
	                else {
	                    let structure = position.lookForStructure(action.structureType);
	                    if (structure) {
	                        outcome = structure.destroy();
	                    }
	                    else {
	                        outcome = "noStructure";
	                    }
	                }
	                if (outcome === OK) {
	                    console.log(`LAYOUT: ${action.actionType}d temporary ${action.structureType} (${this.name}, level: ${level})`);
	                }
	                else {
	                    console.log(`LAYOUT: problem with temp placement, please follow up in ${this.name}`);
	                    console.log(`tried to ${action.actionType} ${action.structureType} at level ${level}, outcome: ${outcome}`);
	                }
	            }
	            this.memory.temporaryPlacement[level] = true;
	        }
	    }
	    initAutoLayout() {
	        if (!this.memory.layoutMap) {
	            if (this.memory.flexLayoutMap) {
	                // temporary patch for variable identifier change
	                this.memory.layoutMap = this.memory.flexLayoutMap;
	                this.memory.radius = this.memory.flexRadius;
	            }
	            else {
	                let map = new FlexGenerator_1.FlexGenerator(this.memory.centerPosition, this.memory.rotation, this.staticStructures);
	                this.memory.layoutMap = map.generate();
	                this.memory.radius = map.radius + 1;
	            }
	        }
	    }
	}
	exports.FlexOperation = FlexOperation;


/***/ },
/* 55 */
/*!*********************************!*\
  !*** ./src/ai/FlexGenerator.ts ***!
  \*********************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const helper_1 = __webpack_require__(/*! ../helpers/helper */ 5);
	class FlexGenerator {
	    constructor(centerPosition, rotation, staticStructures) {
	        this.leftMost = 0;
	        this.rightMost = 0;
	        this.topMost = 0;
	        this.bottomMost = 0;
	        this.radius = 0;
	        this.remaining = {
	            [STRUCTURE_TOWER]: 6,
	            [STRUCTURE_EXTENSION]: 60,
	            [STRUCTURE_OBSERVER]: 1,
	        };
	        this.map = {};
	        this.roadPositions = [];
	        this.noRoadAccess = [];
	        this.recheckCount = 0;
	        if (!(centerPosition instanceof RoomPosition)) {
	            centerPosition = helper_1.helper.deserializeRoomPosition(centerPosition);
	        }
	        this.centerPosition = centerPosition;
	        this.roomName = centerPosition.roomName;
	        this.rotation = rotation;
	        this.leftMost = centerPosition.x;
	        this.rightMost = centerPosition.x;
	        this.topMost = centerPosition.y;
	        this.bottomMost = centerPosition.y;
	        this.coreStructureCoordinates = staticStructures;
	    }
	    generate() {
	        this.addFixedStructuresToMap();
	        this.addUsingExpandingRadius();
	        this.addWalls();
	        this.removeStragglingRoads();
	        return this.generateCoords();
	    }
	    addFixedStructuresToMap() {
	        this.coreStructureCoordinates[STRUCTURE_ROAD] = [
	            { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: -1, y: -1 }, { x: -2, y: -2 },
	            { x: -2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: -4 }, { x: 1, y: -3 }, { x: 2, y: -2 },
	            { x: 3, y: -1 }, { x: 4, y: 0 }, { x: 3, y: 1 }, { x: 1, y: 3 }, { x: 0, y: 4 },
	            { x: -1, y: 3 }, { x: -3, y: 1 }, { x: -4, y: 0 }, { x: -3, y: -1 }, { x: -1, y: -3 },
	        ];
	        this.coreStructureCoordinates["empty"] = [
	            { x: -1, y: -2 }, { x: 1, y: -2 }, { x: 2, y: -1 }
	        ];
	        for (let structureType in this.coreStructureCoordinates) {
	            let coords = this.coreStructureCoordinates[structureType];
	            for (let coord of coords) {
	                let position = helper_1.helper.coordToPosition(coord, this.centerPosition, this.rotation);
	                this.addStructurePosition(position, structureType);
	            }
	        }
	    }
	    addUsingExpandingRadius() {
	        let iterations = 0;
	        while (_.sum(this.remaining) > 0 && iterations < 100) {
	            iterations++;
	            for (let xDelta = -this.radius; xDelta <= this.radius; xDelta++) {
	                let x = this.centerPosition.x + xDelta;
	                if (x < 3 || x > 46) {
	                    continue;
	                }
	                for (let yDelta = -this.radius; yDelta <= this.radius; yDelta++) {
	                    // only consider points on perimeter of gradually expanding rectangle
	                    if (Math.abs(yDelta) !== this.radius && Math.abs(xDelta) !== this.radius)
	                        continue;
	                    let y = this.centerPosition.y + yDelta;
	                    if (y < 3 || y > 46) {
	                        continue;
	                    }
	                    let position = new RoomPosition(x, y, this.roomName);
	                    if (position.lookFor(LOOK_TERRAIN)[0] === "wall")
	                        continue;
	                    this.addRemaining(xDelta, yDelta);
	                }
	            }
	            this.radius++;
	        }
	        if (iterations === 100) {
	            console.log("WARNING: layout process entered endless loop, life is terrible, give up all hope");
	        }
	    }
	    addRemaining(xDelta, yDelta, save = true) {
	        let x = this.centerPosition.x + xDelta;
	        let y = this.centerPosition.y + yDelta;
	        let alreadyUsed = this.checkIfUsed(x, y);
	        console.log(`alreadyUsed: ${alreadyUsed} x: ${xDelta}, y: ${yDelta}`);
	        if (alreadyUsed)
	            return;
	        let position = new RoomPosition(x, y, this.roomName);
	        if (Game.rooms[this.roomName]) {
	            if (position.inRangeTo(position.findClosestByRange(FIND_SOURCES), 2))
	                return;
	            if (position.inRangeTo(Game.rooms[this.roomName].controller, 2))
	                return;
	        }
	        let foundRoad = false;
	        for (let roadPos of this.roadPositions) {
	            if (position.isNearTo(roadPos)) {
	                let structureType = this.findStructureType(xDelta, yDelta);
	                console.log("findStructureType: " + structureType);
	                if (structureType) {
	                    this.addStructurePosition(position, structureType);
	                    this.remaining[structureType]--;
	                    foundRoad = true;
	                    break;
	                }
	            }
	        }
	        if (!foundRoad && save) {
	            this.noRoadAccess.push({ x: xDelta, y: yDelta });
	        }
	    }
	    recheckNonAccess() {
	        // if (this.recheckCount > 100) return;
	        this.recheckCount++;
	        if (this.recheckCount > 100)
	            throw "too fucking long";
	        console.log("rechecking " + this.recheckCount, this.noRoadAccess.length);
	        this.noRoadAccess = _.filter(this.noRoadAccess, (c) => !this.checkIfUsed(c.x, c.y));
	        for (let coord of this.noRoadAccess) {
	            this.addRemaining(coord.x, coord.y, false);
	        }
	    }
	    checkIfUsed(x, y) {
	        return this.map[x] !== undefined && this.map[x][y] !== undefined;
	    }
	    addStructurePosition(pos, structureType, overwrite = false) {
	        if (!this.map[pos.x])
	            this.map[pos.x] = {};
	        let existingStructureType = this.map[pos.x][pos.y];
	        if (existingStructureType) {
	            if (overwrite) {
	                this.remaining[existingStructureType]++;
	            }
	            else {
	                return;
	            }
	        }
	        this.map[pos.x][pos.y] = structureType;
	        if (structureType === STRUCTURE_ROAD) {
	            console.log("foundRoad, add pos and recheck: " + pos);
	            this.roadPositions.push(pos);
	            this.recheckNonAccess();
	        }
	        else if (structureType !== STRUCTURE_RAMPART && structureType !== STRUCTURE_WALL) {
	            if (pos.x < this.leftMost) {
	                this.leftMost = pos.x;
	            }
	            if (pos.x > this.rightMost) {
	                this.rightMost = pos.x;
	            }
	            if (pos.y < this.topMost) {
	                this.topMost = pos.y;
	            }
	            if (pos.y > this.bottomMost) {
	                this.bottomMost = pos.y;
	            }
	        }
	    }
	    findStructureType(xDelta, yDelta) {
	        let isRoadCoord = this.checkValidRoadCoord(xDelta, yDelta);
	        if (isRoadCoord) {
	            return STRUCTURE_ROAD;
	        }
	        else {
	            for (let structureType in this.remaining) {
	                if (this.remaining[structureType]) {
	                    return structureType;
	                }
	            }
	        }
	    }
	    addWalls() {
	        // push edge by 1 to make room for walls
	        let leftWall = this.leftMost - 1;
	        let rightWall = this.rightMost + 1;
	        let topWall = this.topMost - 1;
	        let bottomWall = this.bottomMost + 1;
	        let allWallPositions = [];
	        let validWallPositions = [];
	        console.log(leftWall, rightWall, topWall, bottomWall);
	        // mark off matrix, natural walls are impassible, all other tiles get 1
	        let exitPositions = [];
	        let matrix = new PathFinder.CostMatrix();
	        let lastPositionWasExit = { left: false, right: false, top: false, bottom: false };
	        for (let x = 0; x < 50; x++) {
	            for (let y = 0; y < 50; y++) {
	                let currentBorder;
	                if (x === 0)
	                    currentBorder = "left";
	                else if (x === 49)
	                    currentBorder = "right";
	                else if (y === 0)
	                    currentBorder = "top";
	                else if (y === 49)
	                    currentBorder = "bottom";
	                let position = new RoomPosition(x, y, this.roomName);
	                if (position.lookFor(LOOK_TERRAIN)[0] === "wall") {
	                    matrix.set(x, y, 0xff);
	                    if (currentBorder) {
	                        lastPositionWasExit[currentBorder] = false;
	                    }
	                }
	                else {
	                    matrix.set(x, y, 1);
	                    if (currentBorder) {
	                        if (!lastPositionWasExit[currentBorder]) {
	                            exitPositions.push(position);
	                        }
	                        lastPositionWasExit[currentBorder] = true;
	                    }
	                }
	            }
	        }
	        console.log(`LAYOUT: found ${exitPositions.length} exits to path from`);
	        // start with every wall position being valid around the border
	        for (let x = leftWall; x <= rightWall; x++) {
	            for (let y = topWall; y <= bottomWall; y++) {
	                if (x !== leftWall && x !== rightWall && y !== topWall && y !== bottomWall)
	                    continue;
	                let position = new RoomPosition(x, y, this.roomName);
	                if (position.lookFor(LOOK_TERRAIN)[0] === "wall")
	                    continue;
	                allWallPositions.push(position);
	                matrix.set(x, y, 0xff);
	            }
	        }
	        // send theoretical invaders at the center from each exit and remove the walls that don't make a
	        // difference on whether they reach the center
	        let centerPosition = new RoomPosition(this.centerPosition.x, this.centerPosition.y, this.roomName);
	        for (let wallPosition of allWallPositions) {
	            let breach = false;
	            matrix.set(wallPosition.x, wallPosition.y, 1);
	            for (let exitPosition of exitPositions) {
	                let ret = PathFinder.search(exitPosition, [{ pos: centerPosition, range: 0 }], {
	                    maxRooms: 1,
	                    roomCallback: (roomName) => {
	                        if (roomName === this.roomName) {
	                            return matrix;
	                        }
	                    }
	                });
	                if (!ret.incomplete && ret.path[ret.path.length - 1].inRangeTo(centerPosition, 0)) {
	                    breach = true;
	                    break;
	                }
	            }
	            if (breach) {
	                validWallPositions.push(wallPosition);
	                matrix.set(wallPosition.x, wallPosition.y, 0xff);
	            }
	            else {
	            }
	        }
	        for (let position of validWallPositions) {
	            this.addStructurePosition(position, STRUCTURE_RAMPART, true);
	        }
	        this.wallCount = validWallPositions.length;
	    }
	    generateCoords() {
	        let roomPositions = {};
	        for (let x in this.map) {
	            for (let y in this.map[x]) {
	                let structureType = this.map[x][y];
	                if (structureType !== STRUCTURE_ROAD && _.includes(Object.keys(this.coreStructureCoordinates), structureType))
	                    continue;
	                if (!roomPositions[structureType])
	                    roomPositions[structureType] = [];
	                roomPositions[structureType].push(new RoomPosition(Number.parseInt(x), Number.parseInt(y), this.roomName));
	            }
	        }
	        let flexLayoutMap = {};
	        let centerPosition = new RoomPosition(this.centerPosition.x, this.centerPosition.y, this.roomName);
	        for (let structureType in roomPositions) {
	            let sortedByDistance = _.sortBy(roomPositions[structureType], (pos) => pos.getRangeTo(centerPosition));
	            flexLayoutMap[structureType] = [];
	            for (let position of sortedByDistance) {
	                let coord = helper_1.helper.positionToCoord(position, this.centerPosition, this.rotation);
	                flexLayoutMap[structureType].push(coord);
	            }
	        }
	        return flexLayoutMap;
	    }
	    checkValidRoadCoord(xDelta, yDelta) {
	        // creates the 5-cluster pattern for extensions/roads that you can see in my rooms
	        let combinedDeviance = Math.abs(xDelta) + Math.abs(yDelta);
	        if (combinedDeviance % 2 !== 0) {
	            return false;
	        }
	        else if (xDelta % 2 === 0 && combinedDeviance % 4 !== 0) {
	            let pos = helper_1.helper.coordToPosition({ x: xDelta, y: yDelta }, this.centerPosition);
	            // check narrow passage due to natural walls
	            for (let direction = 2; direction <= 8; direction += 2) {
	                if (pos.getPositionAtDirection(direction).lookFor(LOOK_TERRAIN)[0] === "wall") {
	                    return true;
	                }
	            }
	            return false;
	        }
	        else {
	            return true;
	        }
	    }
	    removeStragglingRoads() {
	        for (let x in this.map) {
	            for (let y in this.map[x]) {
	                let xInt = Number.parseInt(x);
	                let yInt = Number.parseInt(y);
	                if (xInt < this.leftMost - 1 || xInt > this.rightMost + 1
	                    || yInt < this.topMost - 1 || yInt > this.bottomMost + 1) {
	                    this.map[x][y] = undefined;
	                }
	            }
	        }
	    }
	}
	exports.FlexGenerator = FlexGenerator;


/***/ },
/* 56 */
/*!**********************************************!*\
  !*** ./src/ai/operations/ZombieOperation.ts ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Operation_1 = __webpack_require__(/*! ./Operation */ 9);
	const constants_1 = __webpack_require__(/*! ../../config/constants */ 4);
	const ZombieMission_1 = __webpack_require__(/*! ../missions/ZombieMission */ 57);
	class ZombieOperation extends Operation_1.Operation {
	    constructor(flag, name, type, empire) {
	        super(flag, name, type, empire);
	        this.priority = constants_1.OperationPriority.Low;
	    }
	    initOperation() {
	        this.spawnGroup = this.getRemoteSpawnGroup(4, 8);
	        if (!this.spawnGroup)
	            return;
	        this.addMission(new ZombieMission_1.ZombieMission(this));
	    }
	    finalizeOperation() {
	    }
	    invalidateOperationCache() {
	    }
	}
	exports.ZombieOperation = ZombieOperation;


/***/ },
/* 57 */
/*!******************************************!*\
  !*** ./src/ai/missions/ZombieMission.ts ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const Mission_1 = __webpack_require__(/*! ./Mission */ 11);
	const helper_1 = __webpack_require__(/*! ../../helpers/helper */ 5);
	const notifier_1 = __webpack_require__(/*! ../../notifier */ 6);
	class ZombieMission extends Mission_1.Mission {
	    constructor(operation) {
	        super(operation, "zombie");
	        this.getBody = () => {
	            if (this.memory.expectedDamage === 0) {
	                return this.workerBody(10, 0, 10);
	            }
	            if (this.memory.expectedDamage <= 240) {
	                let healCount = Math.ceil(this.memory.expectedDamage / HEAL_POWER);
	                let moveCount = 17; // move once every other tick
	                let dismantleCount = MAX_CREEP_SIZE - healCount - moveCount;
	                return this.configBody({ [WORK]: dismantleCount, [MOVE]: 17, [HEAL]: healCount });
	            }
	            if (this.memory.expectedDamage <= 600) {
	                let healCount = Math.ceil((this.memory.expectedDamage * .3) / HEAL_POWER); // boosting tough
	                let dismantleCount = 28 - healCount;
	                return this.configBody({ [TOUGH]: 5, [WORK]: dismantleCount, [MOVE]: 17, [HEAL]: healCount });
	            }
	            if (this.memory.expectedDamage <= 1600) {
	                let healCount = Math.ceil((this.memory.expectedDamage * .3) / (HEAL_POWER * 4)); // boosting heal and tough
	                let dismantleCount = 30 - healCount;
	                return this.configBody({ [TOUGH]: 10, [WORK]: dismantleCount, [MOVE]: 10, [HEAL]: healCount });
	            }
	        };
	    }
	    initMission() {
	        if (!this.memory.matrix) {
	            this.memory.matrix = this.findMatrix();
	        }
	    }
	    roleCall() {
	        let max = 0;
	        if (this.memory.status === "attack") {
	            max = 2;
	        }
	        this.zombies = this.headCount("zombie", this.getBody, max, {
	            memory: { boosts: this.getBoosts(), safeCount: 0 },
	            prespawn: this.memory.prespawn,
	            skipMoveToRoom: true,
	            blindSpawn: true
	        });
	    }
	    missionActions() {
	        for (let zombie of this.zombies) {
	            this.zombieActions(zombie);
	        }
	    }
	    finalizeMission() {
	        if (this.memory.status === "remove" || (this.room && this.room.controller.safeMode)) {
	            notifier_1.notifier.add(`ZOMBIE: removing ${this.opName}. safemode: ${this.room && this.room.controller.safeMode}`);
	            this.flag.remove();
	        }
	    }
	    invalidateMissionCache() {
	    }
	    zombieActions(zombie) {
	        if (zombie.hits < zombie.hitsMax) {
	            zombie.heal(zombie);
	        }
	        if (this.memory.fallback && !zombie.memory.reachedFallback) {
	            let fallback = helper_1.helper.deserializeRoomPosition(this.memory.fallback);
	            if (zombie.pos.isNearTo(fallback) && zombie.hits === zombie.hitsMax) {
	                if (!zombie.memory.prespawn) {
	                    zombie.memory.prespawn = true;
	                    this.memory.prespawn = 1500 - zombie.ticksToLive;
	                }
	                zombie.memory.reachedFallback = true;
	            }
	            this.empire.travelTo(zombie, { pos: fallback });
	            return;
	        }
	        if (zombie.pos.isNearExit(0)) {
	            if (zombie.hits > zombie.hitsMax - 500) {
	                zombie.memory.safeCount++;
	            }
	            else {
	                zombie.memory.safeCount = 0;
	            }
	            if (zombie.memory.safeCount < 10) {
	                return;
	            }
	        }
	        else {
	            zombie.memory.safeCount = 0;
	        }
	        let threshold = 500;
	        if (this.memory.expectedDamage > 240) {
	            threshold = 250;
	        }
	        if (zombie.hits < zombie.hitsMax - threshold) {
	            zombie.memory.reachedFallback = false;
	        }
	        let destination = this.flag;
	        if (!zombie.memory.retreat) {
	            if (zombie.pos.roomName === this.flag.pos.roomName) {
	                let closestSpawn = zombie.pos.findClosestByRange(this.room.findStructures(STRUCTURE_SPAWN));
	                if (closestSpawn) {
	                    destination = closestSpawn;
	                    if (zombie.hits === zombie.hitsMax && zombie.pos.isNearTo(closestSpawn)) {
	                    }
	                }
	                else {
	                    notifier_1.notifier.add(`ZOMBIE: mission complete in ${this.room.name}`);
	                    this.memory.status = "remove";
	                }
	            }
	        }
	        let position = this.moveZombie(zombie, destination, zombie.memory.demolishing);
	        zombie.memory.demolishing = false;
	        if (zombie.hits === zombie.hitsMax && position instanceof RoomPosition &&
	            zombie.room == this.room && !zombie.pos.isNearExit(0)) {
	            let structure = position.lookFor(LOOK_STRUCTURES)[0];
	            if (structure && structure.structureType !== STRUCTURE_CONTAINER && structure.structureType !== STRUCTURE_ROAD) {
	                zombie.memory.demolishing = true;
	                zombie.dismantle(structure);
	            }
	        }
	    }
	    moveZombie(zombie, destination, ignoreStuck) {
	        let roomCallback = (roomName) => {
	            if (roomName === this.flag.pos.roomName) {
	                let matrix = PathFinder.CostMatrix.deserialize(this.memory.matrix);
	                for (let zombie of this.zombies) {
	                    if (zombie.room === this.room && !zombie.pos.isNearExit(0)) {
	                        matrix.set(zombie.pos.x, zombie.pos.y, 0xff);
	                    }
	                }
	                return matrix;
	            }
	        };
	        return this.empire.travelTo(zombie, destination, {
	            ignoreStuck: ignoreStuck,
	            returnPosition: true,
	            roomCallback: roomCallback,
	        });
	    }
	    findMatrix() {
	        if (!this.hasVision) {
	            let observer = this.spawnGroup.room.findStructures(STRUCTURE_OBSERVER)[0];
	            if (!observer) {
	                return;
	            }
	            observer.observeRoom(this.flag.pos.roomName);
	            return;
	        }
	        let spawns = this.room.findStructures(STRUCTURE_SPAWN);
	        if (spawns.length === 0) {
	            this.memory.status = "remove";
	            return;
	        }
	        let matrix = new PathFinder.CostMatrix();
	        let towers = this.room.findStructures(STRUCTURE_TOWER);
	        if (towers.length === 0) {
	            this.memory.status = "attack";
	            this.memory.expectedDamage = 0;
	            this.memory.fallback = spawns[0].pos;
	            notifier_1.notifier.add(`ZOMBIE: init zombie at ${this.room.name}, expectedDamage: 0`);
	            return matrix.serialize();
	        }
	        let bestExit;
	        let ret = PathFinder.search(this.spawnGroup.pos, { pos: spawns[0].pos, range: 1 }, {
	            roomCallback: (roomName) => {
	                if (roomName !== this.room.name && this.empire.memory.hostileRooms[roomName]) {
	                    return false;
	                }
	                let room = Game.rooms[roomName];
	                if (room) {
	                    return room.defaultMatrix;
	                }
	            }
	        });
	        if (!ret.incomplete) {
	            console.log(`found path!`);
	            bestExit = _.find(ret.path, (p) => p.roomName === this.room.name);
	        }
	        let allowedExits = {};
	        let exitData = Game.map.describeExits(this.room.name);
	        for (let direction in exitData) {
	            let roomName = exitData[direction];
	            let allowedRooms = this.empire.findAllowedRooms(this.spawnGroup.pos.roomName, roomName);
	            if (allowedRooms && Object.keys(allowedRooms).length <= 8) {
	                allowedExits[direction] = true;
	            }
	        }
	        if (Object.keys(allowedExits).length === 0) {
	            this.memory.status = "remove";
	            return;
	        }
	        let exitPositions = [];
	        for (let x = 0; x < 50; x++) {
	            for (let y = 0; y < 50; y++) {
	                if (x !== 0 && y !== 0 && x !== 49 && y !== 49) {
	                    continue;
	                }
	                if (Game.map.getTerrainAt(x, y, this.room.name) === "wall") {
	                    continue;
	                }
	                matrix.set(x, y, 0xff);
	                if (bestExit) {
	                    continue;
	                }
	                if (allowedExits["1"] && y === 0) {
	                    exitPositions.push(new RoomPosition(x, y, this.room.name));
	                }
	                else if (allowedExits["3"] && x === 49) {
	                    exitPositions.push(new RoomPosition(x, y, this.room.name));
	                }
	                else if (allowedExits["5"] && y === 49) {
	                    exitPositions.push(new RoomPosition(x, y, this.room.name));
	                }
	                else if (allowedExits["7"] && x === 0) {
	                    exitPositions.push(new RoomPosition(x, y, this.room.name));
	                }
	            }
	        }
	        if (!bestExit) {
	            bestExit = _(exitPositions)
	                .sortBy((p) => -_.sum(towers, (t) => p.getRangeTo(t)))
	                .head();
	        }
	        matrix.set(bestExit.x, bestExit.y, 1);
	        let walls = this.room.findStructures(STRUCTURE_WALL)
	            .concat(this.room.findStructures(STRUCTURE_RAMPART));
	        if (walls.length > 0) {
	            let highestHits = _(walls).sortBy("hits").last().hits;
	            for (let wall of walls) {
	                matrix.set(wall.pos.x, wall.pos.y, Math.ceil(wall.hits * 10 / highestHits) * 10);
	            }
	        }
	        let expectedDamage = 0;
	        for (let tower of towers) {
	            let range = bestExit.getRangeTo(tower);
	            expectedDamage += helper_1.helper.towerDamageAtRange(range);
	        }
	        expectedDamage /= 2;
	        if (expectedDamage > 1600) {
	            this.memory.status = "upgrade";
	            return;
	        }
	        this.memory.expectedDamage = expectedDamage;
	        this.memory.bestExit = bestExit;
	        if (this.room.storage) {
	            matrix.set(this.room.storage.pos.x, this.room.storage.pos.y, 0xff);
	        }
	        if (this.room.terminal) {
	            matrix.set(this.room.terminal.pos.x, this.room.terminal.pos.y, 0xff);
	        }
	        let fallback = _.clone(bestExit);
	        if (fallback.x === 0) {
	            fallback.x = 48;
	            fallback.roomName = helper_1.helper.findRelativeRoomName(fallback.roomName, -1, 0);
	        }
	        else if (fallback.x === 49) {
	            fallback.x = 1;
	            fallback.roomName = helper_1.helper.findRelativeRoomName(fallback.roomName, 1, 0);
	        }
	        else if (fallback.y === 0) {
	            fallback.y = 48;
	            fallback.roomName = helper_1.helper.findRelativeRoomName(fallback.roomName, 0, -1);
	        }
	        else {
	            fallback.y = 1;
	            fallback.roomName = helper_1.helper.findRelativeRoomName(fallback.roomName, 0, 1);
	        }
	        this.memory.fallback = fallback;
	        helper_1.helper.showMatrix(matrix);
	        this.memory.status = "attack";
	        notifier_1.notifier.add(`ZOMBIE: init zombie at ${this.room.name}, expectedDamage: ${this.memory.expectedDamage}, bestExit: ${bestExit}`);
	        return matrix.serialize();
	    }
	    getBoosts() {
	        if (this.memory.expectedDamage <= 240) {
	            return;
	        }
	        if (this.memory.expectedDamage <= 600) {
	            return [RESOURCE_CATALYZED_GHODIUM_ALKALIDE];
	        }
	        else {
	            return [RESOURCE_CATALYZED_GHODIUM_ALKALIDE, RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
	                RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYZED_ZYNTHIUM_ACID];
	        }
	    }
	}
	exports.ZombieMission = ZombieMission;


/***/ },
/* 58 */
/*!******************************************!*\
  !*** ./src/prototypes/initPrototypes.ts ***!
  \******************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const helper_1 = __webpack_require__(/*! ../helpers/helper */ 5);
	const initRoomPrototype_1 = __webpack_require__(/*! ./initRoomPrototype */ 59);
	const initRoomPositionPrototype_1 = __webpack_require__(/*! ./initRoomPositionPrototype */ 60);
	const initCreepPrototype_1 = __webpack_require__(/*! ./initCreepPrototype */ 61);
	function initPrototypes() {
	    initRoomPrototype_1.initRoomPrototype();
	    initRoomPositionPrototype_1.initRoomPositionPrototype();
	    initCreepPrototype_1.initCreepPrototype();
	    // misc prototype modifications
	    /**
	     * Will remember an instance of structureType that it finds within range, good for storing mining containers, etc.
	     * There should only be one instance of that structureType within range, per object
	     * @param structureType
	     * @param range
	     * @param immediate
	     * @returns {T}
	     */
	    RoomObject.prototype.findMemoStructure = function (structureType, range, immediate = false) {
	        if (!this.room.memory[structureType])
	            this.room.memory[structureType] = {};
	        if (this.room.memory[structureType][this.id]) {
	            let structure = Game.getObjectById(this.room.memory[structureType][this.id]);
	            if (structure) {
	                return structure;
	            }
	            else {
	                this.room.memory[structureType][this.id] = undefined;
	                return this.findMemoStructure(structureType, range, immediate);
	            }
	        }
	        else if (Game.time % 10 === 7 || immediate) {
	            let structures = this.pos.findInRange(this.room.findStructures(structureType), range);
	            if (structures.length > 0) {
	                this.room.memory[structureType][this.id] = structures[0].id;
	            }
	        }
	    };
	    /**
	     * Looks for structure to be used as an energy holder for upgraders
	     * @returns { StructureLink | StructureStorage | StructureContainer }
	     */
	    StructureController.prototype.getBattery = function (structureType) {
	        if (this.room.memory.controllerBatteryId) {
	            let batt = Game.getObjectById(this.room.memory.controllerBatteryId);
	            if (batt) {
	                return batt;
	            }
	            else {
	                this.room.memory.controllerBatteryId = undefined;
	                this.room.memory.upgraderPositions = undefined;
	            }
	        }
	        else {
	            let battery = _(this.pos.findInRange(FIND_STRUCTURES, 4))
	                .filter((structure) => {
	                if (structureType) {
	                    return structure.structureType === structureType;
	                }
	                else {
	                    if (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_LINK) {
	                        let sourcesInRange = structure.pos.findInRange(FIND_SOURCES, 2);
	                        return sourcesInRange.length === 0;
	                    }
	                }
	            })
	                .head();
	            if (battery) {
	                this.room.memory.controllerBatteryId = battery.id;
	                return battery;
	            }
	        }
	    };
	    /**
	     * Positions on which it is viable for an upgrader to stand relative to battery/controller
	     * @returns {Array}
	     */
	    StructureController.prototype.getUpgraderPositions = function () {
	        if (this.upgraderPositions) {
	            return this.upgraderPositions;
	        }
	        else {
	            if (this.room.memory.upgraderPositions) {
	                this.upgraderPositions = [];
	                for (let position of this.room.memory.upgraderPositions) {
	                    this.upgraderPositions.push(helper_1.helper.deserializeRoomPosition(position));
	                }
	                return this.upgraderPositions;
	            }
	            else {
	                let controller = this;
	                let battery = this.getBattery();
	                if (!battery) {
	                    return;
	                }
	                let positions = [];
	                for (let i = 1; i <= 8; i++) {
	                    let position = battery.pos.getPositionAtDirection(i);
	                    if (!position.isPassible(true) || !position.inRangeTo(controller, 3)
	                        || position.lookFor(LOOK_STRUCTURES).length > 0)
	                        continue;
	                    positions.push(position);
	                }
	                this.room.memory.upgraderPositions = positions;
	                return positions;
	            }
	        }
	    };
	    StructureObserver.prototype._observeRoom = StructureObserver.prototype.observeRoom;
	    StructureObserver.prototype.observeRoom = function (roomName, purpose = "unknown", override = false) {
	        let makeObservation = (observation) => {
	            this.observation; // load the current observation before overwriting
	            this.room.memory.observation = observation;
	            this.alreadyObserved = true;
	            return this._observeRoom(observation.roomName);
	        };
	        if (override) {
	            return makeObservation({ roomName: roomName, purpose: purpose });
	        }
	        else {
	            if (!this.room.memory.obsQueue)
	                this.room.memory.obsQueue = [];
	            let queue = this.room.memory.obsQueue;
	            if (!_.find(queue, (item) => item.purpose === purpose)) {
	                queue.push({ purpose: purpose, roomName: roomName });
	            }
	            if (!this.alreadyObserved) {
	                return makeObservation(queue.shift());
	            }
	            else {
	                return OK;
	            }
	        }
	    };
	    Object.defineProperty(StructureObserver.prototype, "observation", {
	        get: function () {
	            if (!this._observation) {
	                let observation = this.room.memory.observation;
	                if (observation) {
	                    let room = Game.rooms[observation.roomName];
	                    if (room) {
	                        observation.room = room;
	                        this._observation = observation;
	                    }
	                    else {
	                    }
	                }
	            }
	            return this._observation;
	        }
	    });
	    StructureTerminal.prototype._send = StructureTerminal.prototype.send;
	    StructureTerminal.prototype.send = function (resourceType, amount, roomName, description) {
	        if (this.alreadySent) {
	            return ERR_BUSY;
	        }
	        else {
	            this.alreadySent = true;
	            return this._send(resourceType, amount, roomName, description);
	        }
	    };
	    StructureTower.prototype._repair = StructureTower.prototype.repair;
	    StructureTower.prototype.repair = function (target) {
	        if (!this.alreadyFired) {
	            this.alreadyFired = true;
	            return this._repair(target);
	        }
	        else {
	            return ERR_BUSY;
	        }
	    };
	}
	exports.initPrototypes = initPrototypes;


/***/ },
/* 59 */
/*!*********************************************!*\
  !*** ./src/prototypes/initRoomPrototype.ts ***!
  \*********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const helper_1 = __webpack_require__(/*! ../helpers/helper */ 5);
	const constants_1 = __webpack_require__(/*! ../config/constants */ 4);
	function initRoomPrototype() {
	    Object.defineProperty(Room.prototype, "hostiles", {
	        get: function myProperty() {
	            if (!Game.cache.hostiles[this.name]) {
	                let hostiles = this.find(FIND_HOSTILE_CREEPS);
	                let filteredHostiles = [];
	                for (let hostile of hostiles) {
	                    let username = hostile.owner.username;
	                    let isEnemy = helper_1.helper.checkEnemy(username, this.name);
	                    if (isEnemy) {
	                        filteredHostiles.push(hostile);
	                    }
	                }
	                Game.cache.hostiles[this.name] = filteredHostiles;
	            }
	            return Game.cache.hostiles[this.name];
	        }
	    });
	    Object.defineProperty(Room.prototype, "hostilesAndLairs", {
	        get: function myProperty() {
	            if (!Game.cache.hostilesAndLairs[this.name]) {
	                let lairs = _.filter(this.findStructures(STRUCTURE_KEEPER_LAIR), (lair) => {
	                    return !lair.ticksToSpawn || lair.ticksToSpawn < 10;
	                });
	                Game.cache.hostilesAndLairs[this.name] = lairs.concat(this.hostiles);
	            }
	            return Game.cache.hostilesAndLairs[this.name];
	        }
	    });
	    Object.defineProperty(Room.prototype, "roomType", {
	        get: function myProperty() {
	            if (!this.memory.roomType) {
	                // source keeper
	                let lairs = this.findStructures(STRUCTURE_KEEPER_LAIR);
	                if (lairs.length > 0) {
	                    this.memory.roomType = constants_1.ROOMTYPE_SOURCEKEEPER;
	                }
	                // core
	                if (!this.memory.roomType) {
	                    let sources = this.find(FIND_SOURCES);
	                    if (sources.length === 3) {
	                        this.memory.roomType = constants_1.ROOMTYPE_CORE;
	                    }
	                }
	                // controller rooms
	                if (!this.memory.roomType) {
	                    if (this.controller) {
	                        this.memory.roomType = constants_1.ROOMTYPE_CONTROLLER;
	                    }
	                    else {
	                        this.memory.roomType = constants_1.ROOMTYPE_ALLEY;
	                    }
	                }
	            }
	            return this.memory.roomType;
	        }
	    });
	    /**
	     * Returns array of structures, caching results on a per-tick basis
	     * @param structureType
	     * @returns {Structure[]}
	     */
	    Room.prototype.findStructures = function (structureType) {
	        if (!Game.cache.structures[this.name]) {
	            Game.cache.structures[this.name] = _.groupBy(this.find(FIND_STRUCTURES), (s) => s.structureType);
	        }
	        return Game.cache.structures[this.name][structureType] || [];
	    };
	    /**
	     * Finds creeps and containers in room that will give up energy, primarily useful when a storage is not available
	     * Caches results on a per-tick basis. Useful before storage is available or in remote mining rooms.
	     * @param roomObject - When this optional argument is supplied, return closest source
	     * @returns {StructureContainer|Creep} - Returns source with highest amount of available energy, unless roomObject is
	     * supplied
	     */
	    Room.prototype.getAltBattery = function (roomObject) {
	        if (!this.altBatteries) {
	            let possibilities = [];
	            let containers = this.findStructures(STRUCTURE_CONTAINER);
	            if (this.controller && this.controller.getBattery() instanceof StructureContainer) {
	                _.pull(containers, this.controller.getBattery());
	            }
	            for (let container of containers) {
	                if (container.store.energy >= 50) {
	                    possibilities.push(container);
	                }
	            }
	            let creeps = this.find(FIND_MY_CREEPS, { filter: (c) => c.memory.donatesEnergy });
	            for (let creep of creeps) {
	                if (creep.carry.energy >= 50) {
	                    possibilities.push(creep);
	                }
	            }
	            if (this.terminal && this.terminal.store.energy >= 50) {
	                possibilities.push(this.terminal);
	            }
	            this.altBatteries = _.sortBy(possibilities, (p) => {
	                return p.store.energy;
	            });
	        }
	        if (roomObject) {
	            return roomObject.pos.findClosestByRange(this.altBatteries);
	        }
	        else {
	            return _.last(this.altBatteries);
	        }
	    };
	    /**
	     * Returns room coordinates for a given room
	     * @returns {*}
	     */
	    Object.defineProperty(Room.prototype, "coords", {
	        get: function myProperty() {
	            if (!this.memory.coordinates) {
	                this.memory.coordinates = helper_1.helper.getRoomCoordinates(this.name);
	            }
	            return this.memory.coordinates;
	        }
	    });
	    Object.defineProperty(Room.prototype, "defaultMatrix", {
	        get: function myProperty() {
	            if (!this._defaultMatrix) {
	                let matrix = new PathFinder.CostMatrix();
	                this._defaultMatrix = helper_1.helper.addStructuresToMatrix(matrix, this);
	            }
	            return this._defaultMatrix;
	        }
	    });
	}
	exports.initRoomPrototype = initRoomPrototype;


/***/ },
/* 60 */
/*!*****************************************************!*\
  !*** ./src/prototypes/initRoomPositionPrototype.ts ***!
  \*****************************************************/
/***/ function(module, exports) {

	"use strict";
	function initRoomPositionPrototype() {
	    RoomPosition.prototype.isNearExit = function (range) {
	        return this.x - range <= 0 || this.x + range >= 49 || this.y - range <= 0 || this.y + range >= 49;
	    };
	    RoomPosition.prototype.getFleeOptions = function (roomObject) {
	        let fleePositions = [];
	        let currentRange = this.getRangeTo(roomObject);
	        for (let i = 1; i <= 8; i++) {
	            let fleePosition = this.getPositionAtDirection(i);
	            if (fleePosition.x > 0 && fleePosition.x < 49 && fleePosition.y > 0 && fleePosition.y < 49) {
	                let rangeToHostile = fleePosition.getRangeTo(roomObject);
	                if (rangeToHostile > 0) {
	                    if (rangeToHostile < currentRange) {
	                        fleePosition["veryDangerous"] = true;
	                    }
	                    else if (rangeToHostile === currentRange) {
	                        fleePosition["dangerous"] = true;
	                    }
	                    fleePositions.push(fleePosition);
	                }
	            }
	        }
	        return fleePositions;
	    };
	    RoomPosition.prototype.bestFleePosition = function (hostile, ignoreRoads = false, swampRat = false) {
	        let options = [];
	        let fleeOptions = this.getFleeOptions(hostile);
	        for (let i = 0; i < fleeOptions.length; i++) {
	            let option = fleeOptions[i];
	            let terrain = option.lookFor(LOOK_TERRAIN)[0];
	            if (terrain !== "wall") {
	                let creepsInTheWay = option.lookFor(LOOK_CREEPS);
	                if (creepsInTheWay.length === 0) {
	                    let structures = option.lookFor(LOOK_STRUCTURES);
	                    let hasRoad = false;
	                    let impassible = false;
	                    for (let structure of structures) {
	                        if (_.includes(OBSTACLE_OBJECT_TYPES, structure.structureType)) {
	                            // can't go through it
	                            impassible = true;
	                            break;
	                        }
	                        if (structure.structureType === STRUCTURE_ROAD) {
	                            hasRoad = true;
	                        }
	                    }
	                    if (!impassible) {
	                        let preference = 0;
	                        if (option.dangerous) {
	                            preference += 10;
	                        }
	                        else if (option.veryDangerous) {
	                            preference += 20;
	                        }
	                        if (hasRoad) {
	                            if (ignoreRoads) {
	                                preference += 2;
	                            }
	                            else {
	                                preference += 1;
	                            }
	                        }
	                        else if (terrain === "plain") {
	                            preference += 2;
	                        }
	                        else if (terrain === "swamp") {
	                            if (swampRat) {
	                                preference += 1;
	                            }
	                            else {
	                                preference += 5;
	                            }
	                        }
	                        options.push({ position: option, preference: preference });
	                    }
	                }
	            }
	        }
	        if (options.length > 0) {
	            options = _(options)
	                .shuffle()
	                .sortBy("preference")
	                .value();
	            return options[0].position;
	        }
	    };
	    /**
	     * Returns the nearest object to the current position based on the linear distance of rooms;
	     * @param roomObjects
	     * @returns {any}
	     */
	    RoomPosition.prototype.findClosestByRoomRange = function (roomObjects) {
	        if (roomObjects.length === 0)
	            return;
	        let sorted = _.sortBy(roomObjects, (s) => Game.map.getRoomLinearDistance(s.pos.roomName, this.roomName));
	        return _.head(sorted);
	    };
	    /**
	     * Returns the nearest object to the current position, works for objects that may not be in the same room;
	     * @param roomObjects
	     * @returns {any}
	     */
	    RoomPosition.prototype.findClosestByLongPath = function (roomObjects) {
	        if (roomObjects.length === 0)
	            return;
	        let sorted = _.sortBy(roomObjects, (s) => Game.map.getRoomLinearDistance(s.pos.roomName, this.roomName));
	        let closestLinearDistance = Game.map.getRoomLinearDistance(sorted[0].pos.roomName, this.roomName);
	        if (closestLinearDistance >= 5) {
	            return sorted[0];
	        }
	        let acceptableRange = closestLinearDistance + 1;
	        let filtered = _.filter(sorted, (s) => Game.map.getRoomLinearDistance(s.pos.roomName, this.roomName) <= acceptableRange);
	        let bestPathLength = Number.MAX_VALUE;
	        let bestObject;
	        for (let roomObject of filtered) {
	            let results = PathFinder.search(this, { pos: roomObject.pos, range: 1 });
	            if (results.incomplete) {
	                console.log("findClosestByLongPath: object in", roomObject.pos.roomName, "was overlooked");
	                continue;
	            }
	            let pathLength = results.path.length;
	            if (pathLength < bestPathLength) {
	                bestObject = roomObject;
	                bestPathLength = pathLength;
	            }
	        }
	        return bestObject;
	    };
	    /**
	     * Returns all surrounding positions that are currently open
	     * @param ignoreCreeps - if true, will consider positions containing a creep to be open
	     * @returns {RoomPosition[]}
	     */
	    RoomPosition.prototype.openAdjacentSpots = function (ignoreCreeps) {
	        let positions = [];
	        for (let i = 1; i <= 8; i++) {
	            let testPosition = this.getPositionAtDirection(i);
	            if (testPosition.isPassible(ignoreCreeps)) {
	                // passed all tests
	                positions.push(testPosition);
	            }
	        }
	        return positions;
	    };
	    /**
	     * returns position at direction relative to this position
	     * @param direction
	     * @param range - optional, can return position with linear distance > 1
	     * @returns {RoomPosition}
	     */
	    RoomPosition.prototype.getPositionAtDirection = function (direction, range) {
	        if (!range) {
	            range = 1;
	        }
	        let x = this.x;
	        let y = this.y;
	        let room = this.roomName;
	        if (direction === 1) {
	            y -= range;
	        }
	        else if (direction === 2) {
	            y -= range;
	            x += range;
	        }
	        else if (direction === 3) {
	            x += range;
	        }
	        else if (direction === 4) {
	            x += range;
	            y += range;
	        }
	        else if (direction === 5) {
	            y += range;
	        }
	        else if (direction === 6) {
	            y += range;
	            x -= range;
	        }
	        else if (direction === 7) {
	            x -= range;
	        }
	        else if (direction === 8) {
	            x -= range;
	            y -= range;
	        }
	        return new RoomPosition(x, y, room);
	    };
	    /**
	     * Look if position is currently open/passible
	     * @param ignoreCreeps - if true, consider positions containing creeps to be open
	     * @returns {boolean}
	     */
	    RoomPosition.prototype.isPassible = function (ignoreCreeps) {
	        // look for walls
	        if (_.head(this.lookFor(LOOK_TERRAIN)) !== "wall") {
	            // look for creeps
	            if (ignoreCreeps || this.lookFor(LOOK_CREEPS).length === 0) {
	                // look for impassible structions
	                if (_.filter(this.lookFor(LOOK_STRUCTURES), (struct) => {
	                    return struct.structureType !== STRUCTURE_ROAD
	                        && struct.structureType !== STRUCTURE_CONTAINER
	                        && struct.structureType !== STRUCTURE_RAMPART;
	                }).length === 0) {
	                    // passed all tests
	                    return true;
	                }
	            }
	        }
	        return false;
	    };
	    /**
	     * @param structureType
	     * @returns {Structure} structure of type structureType that resides at position (null if no structure of that type is present)
	     */
	    RoomPosition.prototype.lookForStructure = function (structureType) {
	        let structures = this.lookFor(LOOK_STRUCTURES);
	        return _.find(structures, { structureType: structureType });
	    };
	    /**
	     *
	     */
	    RoomPosition.prototype.walkablePath = function (pos, ignoreRoads = false) {
	        let ret = PathFinder.search(this, { pos: pos, range: 1 }, {
	            maxOps: 3000,
	            plainCost: 2,
	            swampCost: 10,
	            roomCallback: (roomName) => {
	                let room = Game.rooms[roomName];
	                if (room) {
	                    if (!room.basicMatrix) {
	                        let costs = new PathFinder.CostMatrix();
	                        let structures = room.find(FIND_STRUCTURES);
	                        for (let structure of structures) {
	                            if (structure instanceof StructureRoad) {
	                                if (!ignoreRoads) {
	                                    costs.set(structure.pos.x, structure.pos.y, 1);
	                                }
	                            }
	                            else if (structure instanceof StructureRampart) {
	                                if (!structure.my) {
	                                    costs.set(structure.pos.x, structure.pos.y, 0xff);
	                                }
	                            }
	                            else if (structure.structureType !== STRUCTURE_CONTAINER) {
	                                costs.set(structure.pos.x, structure.pos.y, 0xff);
	                            }
	                        }
	                        room.basicMatrix = costs;
	                    }
	                    return room.basicMatrix;
	                }
	            }
	        });
	        if (ret.incomplete) {
	            console.log("ERROR: roomPosition.walkablePath(pos) PathFinding was incomplete, ops:", ret.ops);
	        }
	        else {
	            return ret.path;
	        }
	    };
	    RoomPosition.prototype.getPathDistanceTo = function (pos, ignoreRoads = false) {
	        let path = this.walkablePath(pos, ignoreRoads);
	        if (path) {
	            return path.length;
	        }
	        else {
	            return Game.map.getRoomLinearDistance(pos.roomName, this.roomName) * 50;
	        }
	    };
	}
	exports.initRoomPositionPrototype = initRoomPositionPrototype;


/***/ },
/* 61 */
/*!**********************************************!*\
  !*** ./src/prototypes/initCreepPrototype.ts ***!
  \**********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const constants_1 = __webpack_require__(/*! ../config/constants */ 4);
	const helper_1 = __webpack_require__(/*! ../helpers/helper */ 5);
	function initCreepPrototype() {
	    Creep.prototype.seekBoost = function (boosts, allowUnboosted) {
	        if (!boosts)
	            return true;
	        if (this.room.findStructures(STRUCTURE_LAB).length === 0)
	            return true;
	        let boosted = true;
	        for (let boost of boosts) {
	            if (this.memory[boost])
	                continue;
	            let requests = this.room.memory.boostRequests;
	            if (!requests) {
	                this.memory[boost] = true;
	                continue;
	            }
	            if (!requests[boost]) {
	                requests[boost] = { flagName: undefined, requesterIds: [] };
	            }
	            // check if already boosted
	            let boostedPart = _.find(this.body, { boost: boost });
	            if (boostedPart) {
	                this.memory[boost] = true;
	                requests[boost].requesterIds = _.pull(requests[boost].requesterIds, this.id);
	                continue;
	            }
	            boosted = false;
	            if (!_.includes(requests[boost].requesterIds, this.id)) {
	                requests[boost].requesterIds.push(this.id);
	            }
	            if (this.spawning)
	                continue;
	            let flag = Game.flags[requests[boost].flagName];
	            if (!flag)
	                continue;
	            let lab = flag.pos.lookForStructure(STRUCTURE_LAB);
	            if (lab.mineralType === boost && lab.mineralAmount >= constants_1.IGOR_CAPACITY && lab.energy >= constants_1.IGOR_CAPACITY) {
	                if (this.pos.isNearTo(lab)) {
	                    lab.boostCreep(this);
	                }
	                else {
	                    this.blindMoveTo(lab);
	                    return false;
	                }
	            }
	            else if (allowUnboosted) {
	                console.log("BOOST: no boost for", this.name, " so moving on (allowUnboosted = true)");
	                requests[boost].requesterIds = _.pull(requests[boost].requesterIds, this.id);
	                this.memory[boost] = true;
	            }
	            else {
	                if (Game.time % 10 === 0)
	                    console.log("BOOST: no boost for", this.name, " it will wait for some boost (allowUnboosted = false)");
	                this.idleOffRoad(this.room.storage);
	                return false;
	            }
	        }
	        return boosted;
	    };
	    Creep.prototype.fleeHostiles = function (pathFinding) {
	        if (!this.fleeObjects) {
	            let lairs = this.room.findStructures(STRUCTURE_KEEPER_LAIR);
	            let fleeObjects = lairs.length > 0 ? this.room.hostilesAndLairs : this.room.hostiles;
	            this.fleeObjects = _.filter(fleeObjects, (c) => {
	                if (c instanceof Creep) {
	                    return _.find(c.body, (part) => {
	                        return part.type === ATTACK || part.type === RANGED_ATTACK;
	                    }) !== null;
	                }
	                else {
	                    return true;
	                }
	            });
	        }
	        if (this.fleeObjects.length === 0)
	            return false;
	        let closest = this.pos.findClosestByRange(this.fleeObjects);
	        if (closest) {
	            let range = this.pos.getRangeTo(closest);
	            if (range < 3 && this.carry.energy > 0 && closest instanceof Creep) {
	                this.drop(RESOURCE_ENERGY);
	            }
	            let fleeRange = closest.owner.username === "Source Keeper" ? 5 : 8;
	            if (range < fleeRange) {
	                if (pathFinding) {
	                    this.fleeByPath(closest);
	                }
	                else {
	                    let fleePosition = this.pos.bestFleePosition(closest);
	                    if (fleePosition) {
	                        this.move(this.pos.getDirectionTo(fleePosition));
	                    }
	                }
	                return true;
	            }
	        }
	        return false;
	    };
	    Creep.prototype.fleeByPath = function (roomObject) {
	        let avoidPositions = _.map(this.pos.findInRange(this.room.hostiles, 5), (c) => { return { pos: c.pos, range: 10 }; });
	        let ret = PathFinder.search(this.pos, avoidPositions, {
	            flee: true,
	            maxRooms: 1,
	            roomCallback: (roomName) => {
	                if (roomName !== this.room.name)
	                    return;
	                if (!this.room.structureMatrix) {
	                    let matrix = new PathFinder.CostMatrix();
	                    helper_1.helper.addStructuresToMatrix(matrix, this.room);
	                    this.room.structureMatrix = matrix;
	                }
	                return this.room.structureMatrix;
	            }
	        });
	        return this.move(this.pos.getDirectionTo(ret.path[0]));
	    };
	    /**
	     * General-purpose cpu-efficient movement function that uses ignoreCreeps: true, a high reusePath value and stuck-detection
	     * @param destination
	     * @param ops - pathfinding ops, ignoreCreeps and reusePath will be overwritten
	     * @param dareDevil
	     * @returns {number} - Error code
	     */
	    Creep.prototype.blindMoveTo = function (destination, ops, dareDevil = false) {
	        if (this.spawning) {
	            return 0;
	        }
	        if (this.fatigue > 0) {
	            return ERR_TIRED;
	        }
	        if (!this.memory.position) {
	            this.memory.position = this.pos;
	        }
	        if (!ops) {
	            ops = {};
	        }
	        // check if trying to move last tick
	        let movingLastTick = true;
	        if (!this.memory.lastTickMoving)
	            this.memory.lastTickMoving = 0;
	        if (Game.time - this.memory.lastTickMoving > 1) {
	            movingLastTick = false;
	        }
	        this.memory.lastTickMoving = Game.time;
	        // check if stuck
	        let stuck = this.pos.inRangeTo(this.memory.position.x, this.memory.position.y, 0);
	        this.memory.position = this.pos;
	        if (stuck && movingLastTick) {
	            if (!this.memory.stuckCount)
	                this.memory.stuckCount = 0;
	            this.memory.stuckCount++;
	            if (dareDevil && this.memory.stuckCount > 0) {
	                this.memory.detourTicks = 5;
	            }
	            else if (this.memory.stuckCount >= 2) {
	                this.memory.detourTicks = 5;
	            }
	            if (this.memory.stuckCount > 500 && !this.memory.stuckNoted) {
	                console.log(this.name, "is stuck at", this.pos, "stuckCount:", this.memory.stuckCount);
	                this.memory.stuckNoted = true;
	            }
	        }
	        else {
	            this.memory.stuckCount = 0;
	        }
	        if (this.memory.detourTicks > 0) {
	            this.memory.detourTicks--;
	            if (dareDevil) {
	                ops.reusePath = 0;
	            }
	            else {
	                ops.reusePath = 5;
	            }
	            return this.moveTo(destination, ops);
	        }
	        else {
	            ops.reusePath = 50;
	            ops.ignoreCreeps = true;
	            return this.moveTo(destination, ops);
	        }
	    };
	    /**
	     * Moves a creep to a position using creep.blindMoveTo(position), when at range === 1 will remove any occuping creep
	     * @param position
	     * @param name - if given, will suicide the occupying creep if string occurs anywhere in name (allows easy role replacement)
	     * and will transfer any resources in creeps' carry
	     * @returns {number}
	     */
	    Creep.prototype.moveItOrLoseIt = function (position, name) {
	        if (this.fatigue > 0) {
	            return OK;
	        }
	        let range = this.pos.getRangeTo(position);
	        if (range === 0)
	            return OK;
	        if (range > 1) {
	            return this.blindMoveTo(position);
	        }
	        // take care of creep that might be in the way
	        let occupier = _.head(position.lookFor(LOOK_CREEPS));
	        if (occupier && occupier.name) {
	            if (name && occupier.name.indexOf(name) >= 0) {
	                for (let resourceType in occupier.carry) {
	                    let amount = occupier.carry[resourceType];
	                    if (amount > 0) {
	                        occupier.transfer(this, resourceType);
	                    }
	                }
	                this.say("my spot!");
	                occupier.suicide();
	            }
	            else {
	                let direction = occupier.pos.getDirectionTo(this);
	                occupier.move(direction);
	                this.say("move it");
	            }
	        }
	        // move
	        let direction = this.pos.getDirectionTo(position);
	        this.move(direction);
	    };
	    /**
	     * Can be used to keep idling creeps out of the way, like when a road repairer doesn't have any roads needing repair
	     * or a spawn refiller who currently has full extensions. Clear roads allow for better creep.BlindMoveTo() behavior
	     * @param defaultPoint
	     * @param maintainDistance
	     * @returns {any}
	     */
	    Creep.prototype.idleOffRoad = function (defaultPoint, maintainDistance = false) {
	        let offRoad = this.pos.lookForStructure(STRUCTURE_ROAD) === undefined;
	        if (offRoad)
	            return OK;
	        if (this.memory.idlePosition) {
	            let pos = helper_1.helper.deserializeRoomPosition(this.memory.idlePosition);
	            if (!this.pos.inRangeTo(pos, 0)) {
	                return this.moveItOrLoseIt(pos);
	            }
	            return OK;
	        }
	        let positions = _.sortBy(this.pos.openAdjacentSpots(), (p) => p.getRangeTo(defaultPoint));
	        if (maintainDistance) {
	            let currentRange = this.pos.getRangeTo(defaultPoint);
	            positions = _.filter(positions, (p) => p.getRangeTo(defaultPoint) <= currentRange);
	        }
	        let swampPosition;
	        for (let position of positions) {
	            if (position.lookForStructure(STRUCTURE_ROAD))
	                continue;
	            let terrain = position.lookFor(LOOK_TERRAIN)[0];
	            if (terrain === "swamp") {
	                swampPosition = position;
	            }
	            else {
	                return this.move(this.pos.getDirectionTo(position));
	            }
	        }
	        if (swampPosition) {
	            return this.move(this.pos.getDirectionTo(swampPosition));
	        }
	        return this.blindMoveTo(defaultPoint);
	    };
	    /**
	     * another function for keeping roads clear, this one is more useful for builders and road repairers that are
	     * currently working, will move off road without going out of range of target
	     * @param target - target for which you do not want to move out of range
	     * @param allowSwamps
	     * @returns {number}
	     */
	    Creep.prototype.yieldRoad = function (target, allowSwamps = true) {
	        let isOffRoad = this.pos.lookForStructure(STRUCTURE_ROAD) === undefined;
	        if (isOffRoad)
	            return OK;
	        let swampPosition;
	        // find movement options
	        let direction = this.pos.getDirectionTo(target);
	        for (let i = -2; i <= 2; i++) {
	            let relDirection = direction + i;
	            relDirection = helper_1.helper.clampDirection(relDirection);
	            let position = this.pos.getPositionAtDirection(relDirection);
	            if (!position.inRangeTo(target, 3))
	                continue;
	            if (position.lookFor(LOOK_STRUCTURES).length > 0)
	                continue;
	            if (!position.isPassible())
	                continue;
	            if (position.isNearExit(0))
	                continue;
	            if (position.lookFor(LOOK_TERRAIN)[0] === "swamp") {
	                swampPosition = position;
	                continue;
	            }
	            return this.move(relDirection);
	        }
	        if (swampPosition && allowSwamps) {
	            return this.move(this.pos.getDirectionTo(swampPosition));
	        }
	        return this.blindMoveTo(target);
	    };
	    Creep.prototype._withdraw = Creep.prototype.withdraw;
	    /**
	     * Overrides the API's creep.withdraw() function to allow consistent transfer code whether the resource holder is
	     * a structure or a creep;
	     * @param target
	     * @param resourceType
	     * @param amount
	     * @returns {number}
	     */
	    Creep.prototype.withdraw = function (target, resourceType, amount) {
	        if (target instanceof Creep) {
	            return target.transfer(this, resourceType, amount);
	        }
	        else {
	            return this._withdraw(target, resourceType, amount);
	        }
	    };
	    Object.defineProperty(Creep.prototype, "store", {
	        get: function myProperty() {
	            return this.carry;
	        }
	    });
	    Object.defineProperty(Creep.prototype, "storeCapacity", {
	        get: function myProperty() {
	            return this.carryCapacity;
	        }
	    });
	    /**
	     * Only withdraw from a store-holder if there is enough resource to transfer (or if holder is full), cpu-efficiency effort
	     * @param target
	     * @param resourceType
	     * @returns {number}
	     */
	    Creep.prototype.withdrawIfFull = function (target, resourceType) {
	        if (!this.pos.isNearTo(target)) {
	            return ERR_NOT_IN_RANGE;
	        }
	        let storageAvailable = this.carryCapacity - _.sum(this.carry);
	        let targetStorageAvailable = target.storeCapacity - _.sum(target.store);
	        if (target.store[resourceType] >= storageAvailable || targetStorageAvailable === 0) {
	            return this.withdraw(target, resourceType);
	        }
	        else {
	            return ERR_NOT_ENOUGH_RESOURCES;
	        }
	    };
	    Creep.prototype.withdrawEverything = function (target) {
	        for (let resourceType in target.store) {
	            let amount = target.store[resourceType];
	            if (amount > 0) {
	                return this.withdraw(target, resourceType);
	            }
	        }
	        return ERR_NOT_ENOUGH_RESOURCES;
	    };
	    Creep.prototype.transferEverything = function (target) {
	        for (let resourceType in this.carry) {
	            let amount = this.carry[resourceType];
	            if (amount > 0) {
	                return this.transfer(target, resourceType);
	            }
	        }
	        return ERR_NOT_ENOUGH_RESOURCES;
	    };
	    /**
	     * Find a structure, cache, and invalidate cache based on the functions provided
	     * @param findStructure
	     * @param forget
	     * @param immediate
	     * @param prop
	     * @returns {Structure}
	     */
	    Creep.prototype.rememberStructure = function (findStructure, forget, prop = "remStructureId", immediate = false) {
	        if (this.memory[prop]) {
	            let structure = Game.getObjectById(this.memory[prop]);
	            if (structure && !forget(structure)) {
	                return structure;
	            }
	            else {
	                this.memory[prop] = undefined;
	                return this.rememberStructure(findStructure, forget, prop, true);
	            }
	        }
	        else if (Game.time % 10 === 0 || immediate) {
	            let object = findStructure();
	            if (object) {
	                this.memory[prop] = object.id;
	                return object;
	            }
	        }
	    };
	    /**
	     * Find a creep, cache, and invalidate cache based on the functions provided
	     * @param findCreep
	     * @param forget
	     * @returns {Structure}
	     */
	    Creep.prototype.rememberCreep = function (findCreep, forget) {
	        if (this.memory.remCreepId) {
	            let creep = Game.getObjectById(this.memory.remCreepId);
	            if (creep && !forget(creep)) {
	                return creep;
	            }
	            else {
	                this.memory.remCreepId = undefined;
	                return this.rememberCreep(findCreep, forget);
	            }
	        }
	        else {
	            let object = findCreep();
	            if (object) {
	                this.memory.remCreepId = object.id;
	                return object;
	            }
	        }
	    };
	    /**
	     * Find the nearest energy source with greater than 50 energy, cache with creep memory;
	     * @returns {Creep | StructureContainer}
	     */
	    Creep.prototype.rememberBattery = function () {
	        if (this.memory.batteryId) {
	            let battery = Game.getObjectById(this.memory.batteryId);
	            if (battery && battery.store.energy >= 50) {
	                return battery;
	            }
	            else {
	                this.memory.batteryId = undefined;
	                return this.rememberBattery();
	            }
	        }
	        else {
	            let battery = this.room.getAltBattery(this);
	            if (battery) {
	                this.memory.batteryId = battery.id;
	                return battery;
	            }
	        }
	    };
	    Creep.prototype.isNearExit = function (range) {
	        return this.pos.isNearExit(range);
	    };
	    Creep.prototype.travelByWaypoint = function (waypoints) {
	        if (!waypoints)
	            return constants_1.DESTINATION_REACHED;
	        if (this.memory.waypointIndex === undefined) {
	            this.memory.waypointIndex = 0;
	        }
	        if (this.memory.waypointIndex >= waypoints.length)
	            return constants_1.DESTINATION_REACHED;
	        if (this.fatigue > 0)
	            return ERR_BUSY;
	        let waypoint = waypoints[this.memory.waypointIndex];
	        if (waypoint.room && this.pos.inRangeTo(waypoint, 1)) {
	            this.memory.waypointIndex++;
	        }
	        let waypointPortalPresent = _.filter(this.pos.lookFor(LOOK_FLAGS), (f) => _.filter(f.pos.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_PORTAL).length > 0).length > 0;
	        if (!waypointPortalPresent) {
	            return this.avoidSK(waypoint);
	        }
	        else {
	            console.log("####### waypointPortalPresent!", this.name, this.pos, Game.time);
	        }
	    };
	    Creep.prototype.avoidSK = function (destination, opts) {
	        let costCall = (roomName, costs) => {
	            if (roomName === this.room.name) {
	                this.room.find(FIND_HOSTILE_CREEPS).forEach(function (keeper) {
	                    if (keeper.owner.username === "Source Keeper") {
	                        let range = 4;
	                        for (let xDelta = -range; xDelta <= range; xDelta++) {
	                            for (let yDelta = -range; yDelta <= range; yDelta++) {
	                                costs.set(keeper.pos.x + xDelta, keeper.pos.y + yDelta, 0xff);
	                            }
	                        }
	                    }
	                });
	            }
	            return costs;
	        };
	        let options = {};
	        if (this.room.roomType === constants_1.ROOMTYPE_SOURCEKEEPER) {
	            options.costCallback = costCall;
	        }
	        return this.blindMoveTo(destination, options);
	    };
	    Creep.prototype.partCount = function (partType) {
	        let count = 0;
	        for (let part of this.body) {
	            if (part.type === partType) {
	                count++;
	            }
	        }
	        return count;
	    };
	    /**
	     * Pass in position of recycle bin (aka container next to spawn) and will creep go recycle itself there
	     * @param container
	     */
	    Creep.prototype.recycleSelf = function (container) {
	        if (!container) {
	            console.log(this.name, " needs a container to recycle self");
	            return;
	        }
	        let binTooFull = (this.ticksToLive + _.sum(container.store)) > container.storeCapacity;
	        if (binTooFull) {
	            console.log(this.name, " is waiting for space in recycle bin in ", this.pos.roomName);
	            return;
	        }
	        if (!this.pos.isEqualTo(container.pos)) {
	            this.blindMoveTo(container, { range: 0 });
	            console.log(this.name, " is heading to recycle bin");
	            return;
	        }
	        let spawn = this.pos.findClosestByRange(FIND_MY_SPAWNS);
	        if (!spawn) {
	            console.log("recycleBin is missing spawn in", this.room.name);
	            return;
	        }
	        let recycleOutcome = spawn.recycleCreep(this);
	        if (recycleOutcome === OK) {
	            console.log(this.pos.roomName, " recycled creep ", this.name);
	        }
	        else if (recycleOutcome === -9) {
	            console.log(this.name, " is moving to recycle bin at ", container.pos);
	            this.blindMoveTo(container, { range: 0 });
	            return;
	        }
	        else {
	            console.log(this.room.name, " recycling error: ", recycleOutcome);
	        }
	        return;
	    };
	}
	exports.initCreepPrototype = initCreepPrototype;


/***/ },
/* 62 */
/*!************************!*\
  !*** ./src/sandbox.ts ***!
  \************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const profiler_1 = __webpack_require__(/*! ./profiler */ 7);
	exports.sandBox = {
	    run: function () {
	        let claimerFlag = Game.flags["claimerFlag"];
	        if (claimerFlag) {
	            let claimer = Game.creeps["claimer"];
	            if (!claimer) {
	                let closest;
	                let bestDistance = Number.MAX_VALUE;
	                for (let roomName in global.emp.spawnGroups) {
	                    let distance = Game.map.getRoomLinearDistance(claimerFlag.pos.roomName, roomName);
	                    if (distance < bestDistance) {
	                        bestDistance = distance;
	                        closest = global.emp.spawnGroups[roomName];
	                    }
	                }
	                closest.spawn([CLAIM, MOVE], "claimer", undefined, undefined);
	                return;
	            }
	            if (claimer.pos.inRangeTo(claimerFlag, 0)) {
	                claimer.claimController(claimer.room.controller);
	                console.log("### claimer waiting");
	            }
	            else {
	                emp.travelTo(claimer, claimerFlag);
	            }
	        }
	        let testFlag = Game.flags["testerFlag"];
	        if (testFlag) {
	            let creepNames = ["travelTo"];
	            for (let creepName of creepNames) {
	                let creep = Game.creeps[creepName];
	                if (!creep) {
	                    let closest;
	                    let bestDistance = Number.MAX_VALUE;
	                    for (let roomName in global.emp.spawnGroups) {
	                        let distance = Game.map.getRoomLinearDistance(testFlag.pos.roomName, roomName);
	                        if (distance < bestDistance) {
	                            bestDistance = distance;
	                            closest = global.emp.spawnGroups[roomName];
	                        }
	                    }
	                    closest.spawn([MOVE], creepName, undefined, undefined);
	                    continue;
	                }
	                if (creepName === "blindMoveTo") {
	                    if (!creep.pos.inRangeTo(testFlag, 1)) {
	                        profiler_1.profiler.start("blindMoveTo");
	                        creep.blindMoveTo(testFlag);
	                        profiler_1.profiler.end("blindMoveTo");
	                    }
	                }
	                if (creepName === "travelTo") {
	                    if (!creep.pos.inRangeTo(testFlag, 1)) {
	                        profiler_1.profiler.start("travelTo");
	                        emp.travelTo(creep, testFlag);
	                        profiler_1.profiler.end("travelTo");
	                    }
	                }
	            }
	        }
	    }
	};


/***/ }
/******/ ]);