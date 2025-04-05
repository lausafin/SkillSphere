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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSkillDto = void 0;
// src/skills/dto/create-skill.dto.ts
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var CreateSkillDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _categoryId_decorators;
    var _categoryId_initializers = [];
    var _categoryId_extraInitializers = [];
    var _currentScore_decorators;
    var _currentScore_initializers = [];
    var _currentScore_extraInitializers = [];
    var _maxScore_decorators;
    var _maxScore_initializers = [];
    var _maxScore_extraInitializers = [];
    var _ratingScaleType_decorators;
    var _ratingScaleType_initializers = [];
    var _ratingScaleType_extraInitializers = [];
    var _tags_decorators;
    var _tags_initializers = [];
    var _tags_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateSkillDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.categoryId = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _categoryId_initializers, void 0)); // Allow null or number
                this.currentScore = (__runInitializers(this, _categoryId_extraInitializers), __runInitializers(this, _currentScore_initializers, void 0));
                this.maxScore = (__runInitializers(this, _currentScore_extraInitializers), __runInitializers(this, _maxScore_initializers, void 0));
                this.ratingScaleType = (__runInitializers(this, _maxScore_extraInitializers), __runInitializers(this, _ratingScaleType_initializers, void 0));
                this.tags = (__runInitializers(this, _ratingScaleType_extraInitializers), __runInitializers(this, _tags_initializers, void 0));
                __runInitializers(this, _tags_extraInitializers);
            }
            return CreateSkillDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MaxLength)(100)];
            _description_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            _categoryId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_transformer_1.Type)(function () { return Number; })];
            _currentScore_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_transformer_1.Type)(function () { return Number; })];
            _maxScore_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(1000), (0, class_transformer_1.Type)(function () { return Number; })];
            _ratingScaleType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _tags_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.ArrayMaxSize)(10)];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _categoryId_decorators, { kind: "field", name: "categoryId", static: false, private: false, access: { has: function (obj) { return "categoryId" in obj; }, get: function (obj) { return obj.categoryId; }, set: function (obj, value) { obj.categoryId = value; } }, metadata: _metadata }, _categoryId_initializers, _categoryId_extraInitializers);
            __esDecorate(null, null, _currentScore_decorators, { kind: "field", name: "currentScore", static: false, private: false, access: { has: function (obj) { return "currentScore" in obj; }, get: function (obj) { return obj.currentScore; }, set: function (obj, value) { obj.currentScore = value; } }, metadata: _metadata }, _currentScore_initializers, _currentScore_extraInitializers);
            __esDecorate(null, null, _maxScore_decorators, { kind: "field", name: "maxScore", static: false, private: false, access: { has: function (obj) { return "maxScore" in obj; }, get: function (obj) { return obj.maxScore; }, set: function (obj, value) { obj.maxScore = value; } }, metadata: _metadata }, _maxScore_initializers, _maxScore_extraInitializers);
            __esDecorate(null, null, _ratingScaleType_decorators, { kind: "field", name: "ratingScaleType", static: false, private: false, access: { has: function (obj) { return "ratingScaleType" in obj; }, get: function (obj) { return obj.ratingScaleType; }, set: function (obj, value) { obj.ratingScaleType = value; } }, metadata: _metadata }, _ratingScaleType_initializers, _ratingScaleType_extraInitializers);
            __esDecorate(null, null, _tags_decorators, { kind: "field", name: "tags", static: false, private: false, access: { has: function (obj) { return "tags" in obj; }, get: function (obj) { return obj.tags; }, set: function (obj, value) { obj.tags = value; } }, metadata: _metadata }, _tags_initializers, _tags_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateSkillDto = CreateSkillDto;
