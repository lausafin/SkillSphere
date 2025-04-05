"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsService = void 0;
// src/skills/skills.service.ts
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var SkillsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var SkillsService = _classThis = /** @class */ (function () {
        function SkillsService_1(prisma) {
            this.prisma = prisma;
        }
        // Helper to handle tag creation/connection
        SkillsService_1.prototype.connectOrCreateTags = function (userId, tagNames) {
            return __awaiter(this, void 0, void 0, function () {
                var cleanTagNames, tagOperations, tags, error_1;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!tagNames || tagNames.length === 0)
                                return [2 /*return*/, undefined];
                            cleanTagNames = __spreadArray([], new Set(tagNames.map(function (name) { return name.trim(); }).filter(Boolean)), true);
                            if (cleanTagNames.length === 0)
                                return [2 /*return*/, undefined];
                            tagOperations = cleanTagNames.map(function (name) {
                                return _this.prisma.tag.upsert({
                                    where: { userId_name: { userId: userId, name: name } },
                                    update: {},
                                    create: { name: name, userId: userId },
                                    select: { id: true } // Select only ID for connection
                                });
                            });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, Promise.all(tagOperations)];
                        case 2:
                            tags = _a.sent();
                            //const tags = await this.prisma.$transaction(tagOperations);
                            return [2 /*return*/, tags]; // Returns array of { id: number }
                        case 3:
                            error_1 = _a.sent();
                            console.error("Error in connectOrCreateTags:", error_1);
                            // Decide how to handle partial failures if not using transaction
                            throw new Error("Could not process tags.");
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        // Helper to verify ownership
        SkillsService_1.prototype.verifySkillOwnership = function (userId, skillId) {
            return __awaiter(this, void 0, void 0, function () {
                var skill;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.skill.findUnique({
                                where: { id: skillId },
                            })];
                        case 1:
                            skill = _a.sent();
                            if (!skill) {
                                throw new common_1.NotFoundException("Skill with ID ".concat(skillId, " not found."));
                            }
                            if (skill.userId !== userId) {
                                throw new common_1.ForbiddenException('Access denied to this skill.');
                            }
                            return [2 /*return*/, skill];
                    }
                });
            });
        };
        SkillsService_1.prototype.create = function (userId, createSkillDto) {
            return __awaiter(this, void 0, void 0, function () {
                var category, tagConnections, skill, error_2;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (!createSkillDto.categoryId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.category.findFirst({ where: { id: createSkillDto.categoryId, userId: userId } })];
                        case 1:
                            category = _d.sent();
                            if (!category)
                                throw new common_1.ForbiddenException('Invalid category specified.');
                            _d.label = 2;
                        case 2: return [4 /*yield*/, this.connectOrCreateTags(userId, createSkillDto.tags || [])];
                        case 3:
                            tagConnections = _d.sent();
                            _d.label = 4;
                        case 4:
                            _d.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, this.prisma.skill.create({
                                    data: {
                                        userId: userId,
                                        name: createSkillDto.name,
                                        description: createSkillDto.description,
                                        categoryId: createSkillDto.categoryId, // Prisma handles null correctly
                                        currentScore: (_a = createSkillDto.currentScore) !== null && _a !== void 0 ? _a : 0,
                                        maxScore: (_b = createSkillDto.maxScore) !== null && _b !== void 0 ? _b : 10,
                                        ratingScaleType: (_c = createSkillDto.ratingScaleType) !== null && _c !== void 0 ? _c : 'numeric',
                                        tags: tagConnections ? { connect: tagConnections } : undefined,
                                    },
                                    include: { category: true, tags: { include: { tag: true } } }
                                })];
                        case 5:
                            skill = _d.sent();
                            return [2 /*return*/, skill];
                        case 6:
                            error_2 = _d.sent();
                            if (error_2 instanceof client_1.Prisma.PrismaClientKnownRequestError && error_2.code === 'P2002') {
                                throw new common_1.ConflictException("Skill with name \"".concat(createSkillDto.name, "\" already exists."));
                            }
                            console.error("Error creating skill:", error_2);
                            throw new Error("Could not create skill.");
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        SkillsService_1.prototype.findAll = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.skill.findMany({
                            where: { userId: userId },
                            include: { category: true, tags: { include: { tag: true } } },
                            orderBy: { updatedAt: 'desc' },
                        })];
                });
            });
        };
        SkillsService_1.prototype.findOne = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var skill;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.skill.findUnique({
                                where: { id: id },
                                include: {
                                    category: true,
                                    tags: { include: { tag: true } },
                                    progressLogs: { orderBy: { timestamp: 'desc' }, include: { evidence: true } },
                                    goals: true
                                }
                            })];
                        case 1:
                            skill = _a.sent();
                            if (!skill || skill.userId !== userId)
                                return [2 /*return*/, null];
                            return [2 /*return*/, skill];
                    }
                });
            });
        };
        SkillsService_1.prototype.update = function (userId, id, updateSkillDto) {
            return __awaiter(this, void 0, void 0, function () {
                var duplicate, category, tagUpdateOperation, newTagConnections, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: 
                        // Verify ownership first
                        return [4 /*yield*/, this.verifySkillOwnership(userId, id)];
                        case 1:
                            // Verify ownership first
                            _a.sent();
                            if (!updateSkillDto.name) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.skill.findFirst({
                                    where: { userId: userId, name: updateSkillDto.name, NOT: { id: id } }
                                })];
                        case 2:
                            duplicate = _a.sent();
                            if (duplicate) {
                                throw new common_1.ConflictException("Skill with name \"".concat(updateSkillDto.name, "\" already exists."));
                            }
                            _a.label = 3;
                        case 3:
                            if (!(updateSkillDto.categoryId !== undefined && updateSkillDto.categoryId !== null)) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.prisma.category.findFirst({ where: { id: updateSkillDto.categoryId, userId: userId } })];
                        case 4:
                            category = _a.sent();
                            if (!category)
                                throw new common_1.ForbiddenException('Invalid category specified.');
                            _a.label = 5;
                        case 5:
                            tagUpdateOperation = undefined;
                            if (!(updateSkillDto.tags !== undefined)) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.connectOrCreateTags(userId, updateSkillDto.tags)];
                        case 6:
                            newTagConnections = _a.sent();
                            tagUpdateOperation = { set: newTagConnections || [] }; // Use set to replace existing tags
                            _a.label = 7;
                        case 7:
                            _a.trys.push([7, 9, , 10]);
                            return [4 /*yield*/, this.prisma.skill.update({
                                    where: { id: id },
                                    data: {
                                        name: updateSkillDto.name,
                                        description: updateSkillDto.description,
                                        categoryId: updateSkillDto.categoryId, // Handles null correctly
                                        currentScore: updateSkillDto.currentScore,
                                        maxScore: updateSkillDto.maxScore,
                                        ratingScaleType: updateSkillDto.ratingScaleType,
                                        tags: tagUpdateOperation, // Apply tag update operation if defined
                                        // updatedAt automatically updated by Prisma
                                    },
                                    include: { category: true, tags: { include: { tag: true } } }
                                })];
                        case 8: return [2 /*return*/, _a.sent()];
                        case 9:
                            error_3 = _a.sent();
                            console.error("Error updating skill:", error_3);
                            throw new Error("Could not update skill.");
                        case 10: return [2 /*return*/];
                    }
                });
            });
        };
        SkillsService_1.prototype.remove = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.verifySkillOwnership(userId, id)];
                        case 1:
                            _a.sent(); // Check ownership
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            // Relations handled by Prisma onDelete settings in schema
                            return [4 /*yield*/, this.prisma.skill.delete({ where: { id: id } })];
                        case 3:
                            // Relations handled by Prisma onDelete settings in schema
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            error_4 = _a.sent();
                            console.error("Error deleting skill:", error_4);
                            throw new Error("Could not delete skill.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        // --- Progress Log Methods ---
        SkillsService_1.prototype.addProgressLog = function (userId, skillId, createLogDto) {
            return __awaiter(this, void 0, void 0, function () {
                var skill, error_5;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.verifySkillOwnership(userId, skillId)];
                        case 1:
                            skill = _a.sent();
                            if (createLogDto.score < 0 || createLogDto.score > skill.maxScore) {
                                throw new common_1.ForbiddenException("Score must be between 0 and ".concat(skill.maxScore, "."));
                            }
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var newLog;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, tx.skillProgressLog.create({
                                                    data: {
                                                        skillId: skillId,
                                                        score: createLogDto.score,
                                                        notes: createLogDto.notes,
                                                        timeSpentMinutes: createLogDto.timeSpentMinutes,
                                                        timestamp: (_a = createLogDto.timestamp) !== null && _a !== void 0 ? _a : new Date(),
                                                        // Add evidence handling here if needed
                                                    },
                                                    include: { evidence: true }
                                                })];
                                            case 1:
                                                newLog = _b.sent();
                                                // Update parent skill
                                                return [4 /*yield*/, tx.skill.update({
                                                        where: { id: skillId },
                                                        data: { currentScore: createLogDto.score, updatedAt: new Date() },
                                                    })];
                                            case 2:
                                                // Update parent skill
                                                _b.sent();
                                                return [2 /*return*/, newLog];
                                        }
                                    });
                                }); })];
                        case 3: 
                        // Use transaction for atomicity
                        return [2 /*return*/, _a.sent()];
                        case 4:
                            error_5 = _a.sent();
                            console.error("Error adding progress log:", error_5);
                            throw new Error("Could not add progress log.");
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        SkillsService_1.prototype.getProgressLogs = function (userId, skillId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.verifySkillOwnership(userId, skillId)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.skillProgressLog.findMany({
                                    where: { skillId: skillId },
                                    orderBy: { timestamp: 'desc' },
                                    include: { evidence: true }
                                })];
                    }
                });
            });
        };
        return SkillsService_1;
    }());
    __setFunctionName(_classThis, "SkillsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SkillsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SkillsService = _classThis;
}();
exports.SkillsService = SkillsService;
