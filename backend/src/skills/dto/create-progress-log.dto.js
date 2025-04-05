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
exports.CreateProgressLogDto = void 0;
// src/skills/dto/create-progress-log.dto.ts
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var CreateProgressLogDto = function () {
    var _a;
    var _score_decorators;
    var _score_initializers = [];
    var _score_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    var _timeSpentMinutes_decorators;
    var _timeSpentMinutes_initializers = [];
    var _timeSpentMinutes_extraInitializers = [];
    var _timestamp_decorators;
    var _timestamp_initializers = [];
    var _timestamp_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateProgressLogDto() {
                this.score = __runInitializers(this, _score_initializers, void 0);
                this.notes = (__runInitializers(this, _score_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                this.timeSpentMinutes = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _timeSpentMinutes_initializers, void 0));
                this.timestamp = (__runInitializers(this, _timeSpentMinutes_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0)); // Receive as string, Prisma handles conversion
                __runInitializers(this, _timestamp_extraInitializers);
            }
            return CreateProgressLogDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _score_decorators = [(0, class_validator_1.IsNumber)({}, { message: 'Score must be a number.' }), (0, class_validator_1.Min)(0, { message: 'Score cannot be negative.' }), (0, class_validator_1.IsNotEmpty)({ message: 'Score is required.' })];
            _notes_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(2000, { message: 'Notes cannot be longer than 2000 characters.' })];
            _timeSpentMinutes_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)({ message: 'Time spent must be an integer (minutes).' }), (0, class_validator_1.Min)(0, { message: 'Time spent cannot be negative.' }), (0, class_transformer_1.Type)(function () { return Number; })];
            _timestamp_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)({}, { message: 'Timestamp must be a valid ISO 8601 date string.' })];
            __esDecorate(null, null, _score_decorators, { kind: "field", name: "score", static: false, private: false, access: { has: function (obj) { return "score" in obj; }, get: function (obj) { return obj.score; }, set: function (obj, value) { obj.score = value; } }, metadata: _metadata }, _score_initializers, _score_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _timeSpentMinutes_decorators, { kind: "field", name: "timeSpentMinutes", static: false, private: false, access: { has: function (obj) { return "timeSpentMinutes" in obj; }, get: function (obj) { return obj.timeSpentMinutes; }, set: function (obj, value) { obj.timeSpentMinutes = value; } }, metadata: _metadata }, _timeSpentMinutes_initializers, _timeSpentMinutes_extraInitializers);
            __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: function (obj) { return "timestamp" in obj; }, get: function (obj) { return obj.timestamp; }, set: function (obj, value) { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateProgressLogDto = CreateProgressLogDto;
