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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
// src/categories/categories.service.ts
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var CategoriesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CategoriesService = _classThis = /** @class */ (function () {
        function CategoriesService_1(prisma) {
            this.prisma = prisma;
        }
        CategoriesService_1.prototype.create = function (userId, createCategoryDto) {
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.prisma.category.create({
                                    data: { name: createCategoryDto.name, userId: userId },
                                })];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_1 = _a.sent();
                            if (error_1 instanceof client_1.Prisma.PrismaClientKnownRequestError && error_1.code === 'P2002') {
                                throw new common_1.ConflictException("Category with name \"".concat(createCategoryDto.name, "\" already exists for this user."));
                            }
                            console.error("Error creating category:", error_1);
                            throw new Error('Could not create category.');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        CategoriesService_1.prototype.findAll = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.category.findMany({
                            where: { userId: userId },
                            orderBy: { name: 'asc' },
                        })];
                });
            });
        };
        // Internal helper or use directly in controller after fetching
        CategoriesService_1.prototype.findOne = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var category;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.category.findUnique({ where: { id: id } })];
                        case 1:
                            category = _a.sent();
                            // Ownership check
                            if (!category || category.userId !== userId) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, category];
                    }
                });
            });
        };
        CategoriesService_1.prototype.update = function (userId, id, updateCategoryDto) {
            return __awaiter(this, void 0, void 0, function () {
                var existingCategory, duplicate, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(userId, id)];
                        case 1:
                            existingCategory = _a.sent();
                            if (!existingCategory) {
                                throw new common_1.NotFoundException("Category with ID ".concat(id, " not found or access denied."));
                            }
                            if (!(updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.category.findFirst({
                                    where: { userId: userId, name: updateCategoryDto.name, NOT: { id: id } }
                                })];
                        case 2:
                            duplicate = _a.sent();
                            if (duplicate) {
                                throw new common_1.ConflictException("Category with name \"".concat(updateCategoryDto.name, "\" already exists."));
                            }
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.prisma.category.update({
                                    where: { id: id },
                                    data: { name: updateCategoryDto.name },
                                })];
                        case 4: return [2 /*return*/, _a.sent()];
                        case 5:
                            error_2 = _a.sent();
                            console.error("Error updating category:", error_2);
                            throw new Error('Could not update category.');
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        CategoriesService_1.prototype.remove = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var category, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(userId, id)];
                        case 1:
                            category = _a.sent();
                            if (!category) {
                                throw new common_1.NotFoundException("Category with ID ".concat(id, " not found or access denied."));
                            }
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.prisma.category.delete({ where: { id: id } })];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            error_3 = _a.sent();
                            console.error("Error deleting category:", error_3);
                            throw new Error('Could not delete category.');
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return CategoriesService_1;
    }());
    __setFunctionName(_classThis, "CategoriesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CategoriesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CategoriesService = _classThis;
}();
exports.CategoriesService = CategoriesService;
