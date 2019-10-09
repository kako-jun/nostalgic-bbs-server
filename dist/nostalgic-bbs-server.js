"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var os_1 = __importDefault(require("os"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var moment_1 = __importDefault(require("moment"));
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var app = express_1.default();
var NostalgicBBS = (function () {
    function NostalgicBBS(listening_port) {
        if (listening_port === void 0) { listening_port = 42012; }
        this.rootPath = path_1.default.resolve(os_1.default.homedir(), ".nostalgic-bbs");
        if (!this.exist(path_1.default.resolve(this.rootPath, "json"))) {
            fs_1.default.mkdirSync(path_1.default.resolve(this.rootPath, "json"), { recursive: true });
            this.createIDFiles("default", "", 0);
        }
        if (!this.exist(path_1.default.resolve(this.rootPath, "json", "config.json"))) {
            this.writeJSON(path_1.default.resolve(this.rootPath, "json", "config.json"), {
                listening_port: listening_port
            });
        }
        if (!this.exist(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"))) {
            this.writeJSON(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"), {
                host_list: []
            });
        }
        this.appConfig = this.readJSON(path_1.default.resolve(this.rootPath, "json", "config.json"));
        this.initServer();
    }
    NostalgicBBS.prototype.start = function () {
        var _this = this;
        app.listen(this.appConfig.listening_port, function () {
            console.log("listening on port " + _this.appConfig.listening_port + "!");
        });
    };
    NostalgicBBS.prototype.initServer = function () {
        var _this = this;
        app.set("trust proxy", true);
        app.use(body_parser_1.default.urlencoded({
            extended: true
        }));
        app.use(body_parser_1.default.json());
        app.get("/api/new", function (req, res) {
            console.log("/api/new called.");
            var host = req.headers["x-forwarded-for"];
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (!_this.createIDFiles(id, password, 0)) {
                res.send({ error: "ID '" + id + "' already exists." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            res.send(idConfig);
        });
        app.get("/api/config", function (req, res) {
            console.log("/api/config called.");
            var host = req.headers["x-forwarded-for"];
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({
                    error: "ID '" + id + "' not found."
                });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({
                    error: "Wrong ID or password."
                });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            var interval_minutes = 0;
            if (req.query.interval_minutes !== undefined) {
                if (Number(req.query.interval_minutes) >= 0) {
                    interval_minutes = Number(req.query.interval_minutes);
                }
            }
            else {
                interval_minutes = idConfig.interval_minutes;
            }
            var dstIDConfig = {
                interval_minutes: interval_minutes
            };
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"), dstIDConfig);
            res.send(dstIDConfig);
        });
        app.get("/api/threads", function (req, res) {
            console.log("/api/threads called.");
            var host = req.headers["x-forwarded-for"];
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({
                    error: "ID '" + id + "' not found."
                });
                return;
            }
            var threads = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"));
            res.send(threads);
        });
        app.get("/api/threads/comments", function (req, res) {
            console.log("/api/threads/comments called.");
            var host = req.headers["x-forwarded-for"];
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({
                    error: "ID '" + id + "' not found."
                });
                return;
            }
            var threads = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"));
            var allComments = lodash_1.default.map(threads.thread_IDs, function (thread_id) {
                var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", thread_id + ".json"));
                var invisible_num = lodash_1.default.countBy(thread.comments, function (comment) {
                    return comment.visible === false;
                });
                var comments = lodash_1.default.map(thread.comments, function (comment) {
                    return lodash_1.default.omit(comment, "host", "info");
                });
                thread = lodash_1.default.extend(thread, {
                    invisible_num: invisible_num,
                    comments: comments
                });
                return thread;
            });
            res.send(allComments);
        });
        app.get("/api/threads/:threadID", function (req, res) {
            console.log("/api/threads/:threadID called.");
            var host = req.headers["x-forwarded-for"];
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({
                    error: "ID '" + id + "' not found."
                });
                return;
            }
            var threadID = Number(req.params.threadID);
            var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"));
            res.send(thread);
        });
    };
    NostalgicBBS.prototype.readJSON = function (jsonPath) {
        var json = JSON.parse(fs_1.default.readFileSync(jsonPath, { encoding: "utf-8" }));
        return json;
    };
    NostalgicBBS.prototype.writeJSON = function (jsonPath, json) {
        var jsonStr = JSON.stringify(json, null, "  ");
        fs_1.default.writeFileSync(jsonPath, jsonStr, { encoding: "utf-8" });
    };
    NostalgicBBS.prototype.exist = function (filePath) {
        try {
            fs_1.default.statSync(filePath);
            return true;
        }
        catch (error) { }
        return false;
    };
    NostalgicBBS.prototype.isIgnore = function (host) {
        console.log(host);
        var ignoreList = this.readJSON(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"));
        var found = lodash_1.default.find(ignoreList.host_list, function (h) {
            return h === host;
        });
        if (found) {
            return true;
        }
        return false;
    };
    NostalgicBBS.prototype.createIDFiles = function (id, password, interval_minutes) {
        var idDirPath = path_1.default.resolve(this.rootPath, "json", id);
        if (this.exist(idDirPath)) {
            return false;
        }
        else {
            fs_1.default.mkdirSync(idDirPath, { recursive: true });
        }
        this.writeJSON(path_1.default.resolve(idDirPath, "password.json"), {
            password: password
        });
        this.writeJSON(path_1.default.resolve(idDirPath, "config.json"), {
            interval_minutes: interval_minutes
        });
        this.writeJSON(path_1.default.resolve(idDirPath, "threads.json"), { thread_IDs: [] });
        this.writeJSON(path_1.default.resolve(idDirPath, "ips.json"), {});
        return true;
    };
    NostalgicBBS.prototype.isPasswordCorrect = function (id, password) {
        var passwordObject = this.readJSON(path_1.default.resolve(this.rootPath, "json", id, "password.json"));
        if (password === passwordObject.password) {
            return true;
        }
        return false;
    };
    NostalgicBBS.prototype.isIntervalOK = function (idConfig, id, host) {
        var now = moment_1.default();
        var ips = this.readJSON(path_1.default.resolve(this.rootPath, "json", id, "ips.json"));
        if (ips[host]) {
            var pre = moment_1.default(ips[host]);
            if (now.valueOf() - pre.valueOf() <
                idConfig.interval_minutes * 60 * 1000) {
                return false;
            }
        }
        ips[host] = now;
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", id, "ips.json"), ips);
        return true;
    };
    return NostalgicBBS;
}());
module.exports = NostalgicBBS;
