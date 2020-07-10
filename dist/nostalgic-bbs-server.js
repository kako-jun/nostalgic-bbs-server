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
var crypto_1 = __importDefault(require("crypto"));
var app = express_1.default();
var NostalgicBBS = (function () {
    function NostalgicBBS(listening_port) {
        if (listening_port === void 0) { listening_port = 42012; }
        this.rootPath = path_1.default.resolve(os_1.default.homedir(), ".nostalgic-bbs");
        if (!this.exist(path_1.default.resolve(this.rootPath, "json"))) {
            fs_1.default.mkdirSync(path_1.default.resolve(this.rootPath, "json"), { recursive: true });
            this.createIDFiles("default", "", 0, false, "", 42, 1000, 142, 42, 1000);
        }
        if (!this.exist(path_1.default.resolve(this.rootPath, "json", "config.json"))) {
            this.writeJSON(path_1.default.resolve(this.rootPath, "json", "config.json"), {
                listening_port: listening_port,
            });
        }
        if (!this.exist(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"))) {
            this.writeJSON(path_1.default.resolve(this.rootPath, "json", "ignore_list.json"), {
                host_list: [],
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
        app.use(function (req, res, next) {
            res.header("Content-Type", "application/json");
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
            next();
        });
        app.use(body_parser_1.default.urlencoded({ extended: true }));
        app.use(body_parser_1.default.json());
        app.get("/api/admin/new", function (req, res) {
            console.log("/api/admin/new called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.createIDFiles(id, password, 0, false, "", 42, 1000, 142, 42, 1000)) {
                res.send({ error: "ID '" + id + "' already exists." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            res.send(idConfig);
        });
        app.get("/api/admin/config", function (req, res) {
            console.log("/api/admin/config called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({ error: "Wrong ID or password." });
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
                interval_minutes = idConfig.interval_minutes || 0;
            }
            var comment_moderated = false;
            if (req.query.comment_moderated !== undefined) {
                comment_moderated = req.query.comment_moderated === "true" ? true : false;
            }
            else {
                comment_moderated = idConfig.comment_moderated || false;
            }
            var john_doe = "";
            if (typeof req.query.john_doe === "string" && req.query.john_doe !== undefined) {
                john_doe = req.query.john_doe;
            }
            else {
                john_doe = idConfig.john_doe || "";
            }
            var max_threads_num = 0;
            if (req.query.max_threads_num !== undefined) {
                if (Number(req.query.max_threads_num) >= 0) {
                    max_threads_num = Number(req.query.max_threads_num);
                }
            }
            else {
                max_threads_num = idConfig.max_threads_num || 0;
            }
            var max_comments_num = 0;
            if (req.query.max_comments_num !== undefined) {
                if (Number(req.query.max_comments_num) >= 0) {
                    max_comments_num = Number(req.query.max_comments_num);
                }
            }
            else {
                max_comments_num = idConfig.max_comments_num || 0;
            }
            var max_thread_title_length = 0;
            if (req.query.max_thread_title_length !== undefined) {
                if (Number(req.query.max_thread_title_length) >= 0) {
                    max_thread_title_length = Number(req.query.max_thread_title_length);
                }
            }
            else {
                max_thread_title_length = idConfig.max_thread_title_length || 0;
            }
            var max_comment_name_length = 0;
            if (req.query.max_comment_name_length !== undefined) {
                if (Number(req.query.max_comment_name_length) >= 0) {
                    max_comment_name_length = Number(req.query.max_comment_name_length);
                }
            }
            else {
                max_comment_name_length = idConfig.max_comment_name_length || 0;
            }
            var max_comment_text_length = 0;
            if (req.query.max_comment_text_length !== undefined) {
                if (Number(req.query.max_comment_text_length) >= 0) {
                    max_comment_text_length = Number(req.query.max_comment_text_length);
                }
            }
            else {
                max_comment_text_length = idConfig.max_comment_text_length || 0;
            }
            var dstIDConfig = {
                interval_minutes: interval_minutes,
                comment_moderated: comment_moderated,
                john_doe: john_doe,
                max_threads_num: max_threads_num,
                max_comments_num: max_comments_num,
                max_thread_title_length: max_thread_title_length,
                max_comment_name_length: max_comment_name_length,
                max_comment_text_length: max_comment_text_length,
            };
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"), dstIDConfig);
            res.send(dstIDConfig);
        });
        app.get("/api/admin/threads", function (req, res) {
            console.log("/api/admin/threads called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({ error: "Wrong ID or password." });
                return;
            }
            var threads = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"));
            var threadsAndComments = lodash_1.default.map(threads.thread_IDs, function (thread_id) {
                var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", thread_id + ".json"));
                var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                    return comment.visible === false;
                }).length;
                var created_at = "";
                if (thread.comments.length > 0) {
                    created_at = thread.comments[0].dt;
                }
                var updated_at = "";
                if (thread.comments.length > 0) {
                    updated_at = thread.comments[thread.comments.length - 1].dt;
                }
                return {
                    id: thread_id,
                    title: thread.title,
                    comments_num: thread.comments.length,
                    invisible_num: invisible_num,
                    created_at: created_at,
                    updated_at: updated_at,
                };
            });
            res.send(threadsAndComments);
        });
        app.get("/api/threads", function (req, res) {
            console.log("/api/threads called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (typeof id !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            var threads = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"));
            var threadsAndComments = lodash_1.default.map(threads.thread_IDs, function (thread_id) {
                var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", thread_id + ".json"));
                var comments = _this.convertCommentsForUser(thread.comments);
                var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                    return comment.visible === false;
                }).length;
                return {
                    id: thread_id,
                    title: thread.title,
                    comments: comments,
                    invisible_num: invisible_num,
                };
            });
            res.send(threadsAndComments);
        });
        app.get("/api/threads/new", function (req, res) {
            console.log("/api/threads/new called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (typeof id !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            if (!_this.isIntervalOK(idConfig, id, host)) {
                return;
            }
            var title = req.query.title || "";
            if (typeof title !== "string") {
                return;
            }
            if (title === "") {
                res.send({ error: "Too few parameters." });
                return;
            }
            if (title.length > idConfig.max_thread_title_length) {
                return;
            }
            var threads = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"));
            if (threads.thread_IDs.length > idConfig.max_threads_num) {
                return;
            }
            var nextThreadID = 0;
            if (threads.thread_IDs.length > 0) {
                var lastThreadID = lodash_1.default.max(threads.thread_IDs);
                if (lastThreadID !== undefined) {
                    nextThreadID = lastThreadID + 1;
                }
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads"))) {
                fs_1.default.mkdirSync(path_1.default.resolve(_this.rootPath, "json", id, "threads"), { recursive: true });
            }
            if (_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads", nextThreadID + ".json"))) {
                res.send({ error: "ID '" + nextThreadID + "' already exists." });
                return;
            }
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", nextThreadID + ".json"), {
                id: nextThreadID,
                title: title,
                comments: [],
            });
            threads.thread_IDs.push(nextThreadID);
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"), threads);
            var threadsAndComments = lodash_1.default.map(threads.thread_IDs, function (thread_id) {
                var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", thread_id + ".json"));
                var comments = _this.convertCommentsForUser(thread.comments);
                var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                    return comment.visible === false;
                }).length;
                return {
                    id: thread_id,
                    title: thread.title,
                    comments: comments,
                    invisible_num: invisible_num,
                };
            });
            res.send(threadsAndComments);
        });
        app.get("/api/admin/threads/remove", function (req, res) {
            console.log("/api/admin/threads/remove called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({ error: "Wrong ID or password." });
                return;
            }
            var threadID = Number(req.query.thread_id) || -1;
            if (threadID < 0) {
                res.send({ error: "Too few parameters." });
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"))) {
                res.send({ error: "ID '" + threadID + "' not found." });
                return;
            }
            var threads = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"));
            if (!_this.removeFile(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"))) {
                res.send({ error: "Unable to remove the file." });
                return;
            }
            threads.thread_IDs = lodash_1.default.filter(threads.thread_IDs, function (thread_id) {
                return thread_id !== threadID;
            });
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads.json"), threads);
            res.send(threads);
        });
        app.get("/api/threads/:threadID", function (req, res) {
            console.log("/api/threads/:threadID called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (typeof id !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            var threadID = Number(req.params.threadID);
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"))) {
                res.send({ error: "ID '" + threadID + "' not found." });
                return;
            }
            var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"));
            var comments = _this.convertCommentsForUser(thread.comments);
            var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                return comment.visible === false;
            }).length;
            res.send({
                id: thread.id,
                title: thread.title,
                comments: comments,
                invisible_num: invisible_num,
            });
        });
        app.get("/api/threads/:threadID/comments/preview", function (req, res) {
            console.log("/api/threads/:threadID/comments/new called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (typeof id !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            var threadID = Number(req.params.threadID);
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"))) {
                res.send({ error: "ID '" + threadID + "' not found." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            var name = req.query.name || idConfig.john_doe;
            var text = req.query.text || "";
            var info = req.query.info || "";
            if (typeof name !== "string" || typeof text !== "string" || typeof info !== "string") {
                return;
            }
            if (name === "" || text === "") {
                res.send({ error: "Too few parameters." });
                return;
            }
            if (name.length > idConfig.max_comment_name_length) {
                return;
            }
            if (text.length > idConfig.max_comment_text_length) {
                return;
            }
            var trip = "";
            if (name.match(/#/)) {
                var splited = name.split(/#/);
                name = splited[0];
                trip = _this.generateTrip(name, splited[1]);
            }
            var dt = moment_1.default();
            var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"));
            if (thread.comments.length > idConfig.max_comments_num) {
                return;
            }
            thread = _this.addComment(thread, {
                dt: dt,
                name: name,
                trip: trip,
                text: text,
                host: host,
                info: info,
                visible: true,
            });
            var comments = _this.convertCommentsForUser(thread.comments);
            var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                return comment.visible === false;
            }).length;
            res.send({
                id: thread.id,
                title: thread.title,
                comments: comments,
                invisible_num: invisible_num,
            });
        });
        app.get("/api/threads/:threadID/comments/new", function (req, res) {
            console.log("/api/threads/:threadID/comments/new called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            if (typeof id !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            var idConfig = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "config.json"));
            if (!_this.isIntervalOK(idConfig, id, host)) {
                return;
            }
            var threadID = Number(req.params.threadID);
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"))) {
                res.send({ error: "ID '" + threadID + "' not found." });
                return;
            }
            var name = req.query.name || idConfig.john_doe;
            var text = req.query.text || "";
            var info = req.query.info || "";
            if (typeof name !== "string" || typeof text !== "string" || typeof info !== "string") {
                return;
            }
            if (name === "" || text === "") {
                res.send({ error: "Too few parameters." });
                return;
            }
            if (name.length > idConfig.max_comment_name_length) {
                return;
            }
            if (text.length > idConfig.max_comment_text_length) {
                return;
            }
            var trip = "";
            if (name.match(/#/)) {
                var splited = name.split(/#/);
                name = splited[0];
                trip = _this.generateTrip(name, splited[1]);
            }
            var dt = moment_1.default();
            var visible = false;
            if (!idConfig.comment_moderated) {
                visible = true;
            }
            var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"));
            if (thread.comments.length > idConfig.max_comments_num) {
                return;
            }
            thread = _this.addComment(thread, {
                dt: dt,
                name: name,
                trip: trip,
                text: text,
                host: host,
                info: info,
                visible: visible,
            });
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"), thread);
            var comments = _this.convertCommentsForUser(thread.comments);
            var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                return comment.visible === false;
            }).length;
            res.send({
                id: thread.id,
                title: thread.title,
                comments: comments,
                invisible_num: invisible_num,
            });
        });
        app.get("/api/admin/threads/:threadID/comments/update", function (req, res) {
            console.log("/api/admin/threads/:threadID/comments/update called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({ error: "Wrong ID or password." });
                return;
            }
            var threadID = Number(req.params.threadID);
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"))) {
                res.send({ error: "ID '" + threadID + "' not found." });
                return;
            }
            var commentID = Number(req.query.comment_id) || -1;
            var visible = Boolean(req.query.visible) || false;
            if (commentID < 0) {
                res.send({ error: "Too few parameters." });
                return;
            }
            var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"));
            thread = _this.updateComment(thread, commentID, {
                visible: visible,
            });
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"), thread);
            var comments = _this.convertCommentsForUser(thread.comments);
            var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                return comment.visible === false;
            }).length;
            res.send({
                id: thread.id,
                title: thread.title,
                comments: comments,
                invisible_num: invisible_num,
            });
        });
        app.get("/api/admin/threads/:threadID/comments/remove", function (req, res) {
            console.log("/api/admin/threads/:threadID/comments/remove called.");
            var host = req.headers["x-forwarded-for"] || "";
            if (_this.isIgnore(host)) {
                return;
            }
            var id = req.query.id || "default";
            var password = req.query.password || "";
            if (typeof id !== "string" || typeof password !== "string") {
                return;
            }
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id))) {
                res.send({ error: "ID '" + id + "' not found." });
                return;
            }
            if (!_this.isPasswordCorrect(id, password)) {
                res.send({ error: "Wrong ID or password." });
                return;
            }
            var threadID = Number(req.params.threadID);
            if (!_this.exist(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"))) {
                res.send({ error: "ID '" + threadID + "' not found." });
                return;
            }
            var commentID = Number(req.query.comment_id) || -1;
            if (commentID < 0) {
                res.send({ error: "Too few parameters." });
                return;
            }
            var thread = _this.readJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"));
            thread = _this.removeComment(thread, commentID);
            _this.writeJSON(path_1.default.resolve(_this.rootPath, "json", id, "threads", threadID + ".json"), thread);
            var comments = _this.convertCommentsForUser(thread.comments);
            var invisible_num = lodash_1.default.filter(thread.comments, function (comment) {
                return comment.visible === false;
            }).length;
            res.send({
                id: thread.id,
                title: thread.title,
                comments: comments,
                invisible_num: invisible_num,
            });
        });
    };
    NostalgicBBS.prototype.readJSON = function (jsonPath) {
        var json = JSON.parse(fs_1.default.readFileSync(jsonPath, { encoding: "utf-8" }));
        return json;
    };
    NostalgicBBS.prototype.writeJSON = function (jsonPath, json) {
        var jsonStr = JSON.stringify(json, null, 2);
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
    NostalgicBBS.prototype.removeFile = function (filePath) {
        try {
            fs_1.default.unlinkSync(filePath);
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
    NostalgicBBS.prototype.createIDFiles = function (id, password, interval_minutes, comment_moderated, john_doe, max_threads_num, max_comments_num, max_thread_title_length, max_comment_name_length, max_comment_text_length) {
        var idDirPath = path_1.default.resolve(this.rootPath, "json", id);
        if (this.exist(idDirPath)) {
            return false;
        }
        else {
            fs_1.default.mkdirSync(idDirPath, { recursive: true });
        }
        this.writeJSON(path_1.default.resolve(idDirPath, "password.json"), {
            password: password,
        });
        this.writeJSON(path_1.default.resolve(idDirPath, "config.json"), {
            interval_minutes: interval_minutes,
            comment_moderated: comment_moderated,
            john_doe: john_doe,
            max_threads_num: max_threads_num,
            max_comments_num: max_comments_num,
            max_thread_title_length: max_thread_title_length,
            max_comment_name_length: max_comment_name_length,
            max_comment_text_length: max_comment_text_length,
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
            if (now.valueOf() - pre.valueOf() < idConfig.interval_minutes * 60 * 1000) {
                return false;
            }
        }
        ips[host] = now;
        this.writeJSON(path_1.default.resolve(this.rootPath, "json", id, "ips.json"), ips);
        return true;
    };
    NostalgicBBS.prototype.convertCommentsForUser = function (adminComments) {
        var visibleComments = lodash_1.default.filter(adminComments, function (adminComment) {
            return adminComment.visible;
        });
        return lodash_1.default.map(visibleComments, function (adminComment) {
            return {
                id: adminComment.id,
                dt: adminComment.dt,
                name: adminComment.name,
                trip: adminComment.trip,
                text: adminComment.text,
            };
        });
    };
    NostalgicBBS.prototype.addComment = function (thread, params) {
        var nextCommentID = 0;
        if (thread.comments.length > 0) {
            var lastComment = lodash_1.default.maxBy(thread.comments, "id");
            if (lastComment) {
                nextCommentID = lastComment.id + 1;
            }
        }
        thread.comments.push({
            id: nextCommentID,
            dt: params.dt,
            name: params.name,
            trip: params.trip,
            text: params.text,
            host: params.host,
            info: params.info,
            visible: params.visible,
        });
        return thread;
    };
    NostalgicBBS.prototype.updateComment = function (thread, commentID, params) {
        var found = lodash_1.default.find(thread.comments, function (comment) {
            return comment.id === commentID;
        });
        if (found) {
            found.visible = params.visible;
        }
        return thread;
    };
    NostalgicBBS.prototype.removeComment = function (thread, commentID) {
        thread.comments = lodash_1.default.filter(thread.comments, function (comment) {
            return comment.id !== commentID;
        });
        return thread;
    };
    NostalgicBBS.prototype.generateTrip = function (name, tripkey) {
        var cipher = crypto_1.default.createCipher("aes-256-cbc", tripkey);
        cipher.update(name, "utf8", "hex");
        var cipheredText = cipher.final("hex");
        return cipheredText.slice(-10);
    };
    return NostalgicBBS;
}());
module.exports = NostalgicBBS;
