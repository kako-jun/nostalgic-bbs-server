"use strict";
import _ from "lodash";
import os from "os";
import fs from "fs";
import path from "path";
import moment from "moment";
import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
const app = express();

interface AppConfig {
  listening_port: number;
}

interface IgnoreList {
  host_list: Array<string>;
}

interface Password {
  password: string;
}

interface IDConfig {
  interval_minutes: number;
  comment_moderated: boolean;
  john_doe: string;
  max_threads_num: number;
  max_comments_num: number;
  max_thread_title_length: number;
  max_comment_name_length: number;
  max_comment_text_length: number;
}

interface Threads {
  thread_IDs: Array<number>;
}

interface Thread {
  id: number;
  title: string;
  comments: Array<AdminComment>;
}

interface AdminComment {
  id: number;
  dt: string;
  name: string;
  trip: string;
  text: string;
  host: string;
  info: string;
  visible: boolean;
}

interface Comment {
  id: number;
  dt: string;
  name: string;
  trip: string;
  text: string;
}

class NostalgicBBS {
  private rootPath: string;
  private appConfig: AppConfig;

  constructor(listening_port: number = 42012) {
    // instance variables
    // this.rootPath = path.dirname(import.meta.url.replace("file:///", ""));
    // this.rootPath = __dirname;
    this.rootPath = path.resolve(os.homedir(), ".nostalgic-bbs");
    if (!this.exist(path.resolve(this.rootPath, "json"))) {
      fs.mkdirSync(path.resolve(this.rootPath, "json"), { recursive: true });
      this.createIDFiles("default", "", 0, false, "", 42, 1000, 142, 42, 1000);
    }

    if (!this.exist(path.resolve(this.rootPath, "json", "config.json"))) {
      this.writeJSON(path.resolve(this.rootPath, "json", "config.json"), {
        listening_port
      });
    }

    if (!this.exist(path.resolve(this.rootPath, "json", "ignore_list.json"))) {
      this.writeJSON(path.resolve(this.rootPath, "json", "ignore_list.json"), {
        host_list: []
      });
    }

    this.appConfig = this.readJSON(path.resolve(this.rootPath, "json", "config.json")) as AppConfig;

    this.initServer();
  }

  public start(): void {
    app.listen(this.appConfig.listening_port, () => {
      console.log("listening on port " + this.appConfig.listening_port + "!");
    });
  }

  private initServer(): void {
    app.set("trust proxy", true);

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.header("Content-Type", "application/json");
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
      next();
    });

    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(bodyParser.json());

    app.get("/api/admin/new", (req: express.Request, res: express.Response) => {
      console.log("/api/admin/new called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.createIDFiles(id, password, 0, false, "", 42, 1000, 142, 42, 1000)) {
        res.send({ error: "ID '" + id + "' already exists." });
        return;
      }

      const idConfig = this.readJSON(path.resolve(this.rootPath, "json", id, "config.json")) as IDConfig;

      res.send(idConfig);
    });

    app.get("/api/admin/config", (req: express.Request, res: express.Response) => {
      console.log("/api/admin/config called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({ error: "Wrong ID or password." });
        return;
      }

      const idConfig = this.readJSON(path.resolve(this.rootPath, "json", id, "config.json")) as IDConfig;

      let interval_minutes = 0;
      if (req.query.interval_minutes !== undefined) {
        if (Number(req.query.interval_minutes) >= 0) {
          interval_minutes = Number(req.query.interval_minutes);
        }
      } else {
        interval_minutes = idConfig.interval_minutes || 0;
      }

      let comment_moderated = false;
      if (req.query.comment_moderated !== undefined) {
        comment_moderated = req.query.comment_moderated === "true" ? true : false;
      } else {
        comment_moderated = idConfig.comment_moderated || false;
      }

      let john_doe = "";
      if (req.query.john_doe !== undefined) {
        john_doe = req.query.john_doe;
      } else {
        john_doe = idConfig.john_doe || "";
      }

      let max_threads_num = 0;
      if (req.query.max_threads_num !== undefined) {
        if (Number(req.query.max_threads_num) >= 0) {
          max_threads_num = Number(req.query.max_threads_num);
        }
      } else {
        max_threads_num = idConfig.max_threads_num || 0;
      }

      let max_comments_num = 0;
      if (req.query.max_comments_num !== undefined) {
        if (Number(req.query.max_comments_num) >= 0) {
          max_comments_num = Number(req.query.max_comments_num);
        }
      } else {
        max_comments_num = idConfig.max_comments_num || 0;
      }

      let max_thread_title_length = 0;
      if (req.query.max_thread_title_length !== undefined) {
        if (Number(req.query.max_thread_title_length) >= 0) {
          max_thread_title_length = Number(req.query.max_thread_title_length);
        }
      } else {
        max_thread_title_length = idConfig.max_thread_title_length || 0;
      }

      let max_comment_name_length = 0;
      if (req.query.max_comment_name_length !== undefined) {
        if (Number(req.query.max_comment_name_length) >= 0) {
          max_comment_name_length = Number(req.query.max_comment_name_length);
        }
      } else {
        max_comment_name_length = idConfig.max_comment_name_length || 0;
      }

      let max_comment_text_length = 0;
      if (req.query.max_comment_text_length !== undefined) {
        if (Number(req.query.max_comment_text_length) >= 0) {
          max_comment_text_length = Number(req.query.max_comment_text_length);
        }
      } else {
        max_comment_text_length = idConfig.max_comment_text_length || 0;
      }

      const dstIDConfig: IDConfig = {
        interval_minutes,
        comment_moderated,
        john_doe,
        max_threads_num,
        max_comments_num,
        max_thread_title_length,
        max_comment_name_length,
        max_comment_text_length
      };

      this.writeJSON(path.resolve(this.rootPath, "json", id, "config.json"), dstIDConfig);

      res.send(dstIDConfig);
    });

    app.get("/api/admin/threads", (req: express.Request, res: express.Response) => {
      console.log("/api/admin/threads called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({ error: "Wrong ID or password." });
        return;
      }

      const threads = this.readJSON(path.resolve(this.rootPath, "json", id, "threads.json")) as Threads;

      const threadsAndComments = _.map(threads.thread_IDs, thread_id => {
        const thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", thread_id + ".json")) as Thread;

        const invisible_num = _.filter(thread.comments, comment => {
          return comment.visible === false;
        }).length;

        let created_at = "";
        if (thread.comments.length > 0) {
          created_at = thread.comments[0].dt;
        }

        let updated_at = "";
        if (thread.comments.length > 0) {
          updated_at = thread.comments[thread.comments.length - 1].dt;
        }

        return {
          id: thread_id,
          title: thread.title,
          comments_num: thread.comments.length,
          invisible_num,
          created_at,
          updated_at
        };
      });

      res.send(threadsAndComments);
    });

    app.get("/api/threads", (req: express.Request, res: express.Response) => {
      console.log("/api/threads called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      const threads = this.readJSON(path.resolve(this.rootPath, "json", id, "threads.json")) as Threads;

      const threadsAndComments = _.map(threads.thread_IDs, thread_id => {
        const thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", thread_id + ".json")) as Thread;

        const comments = this.convertCommentsForUser(thread.comments);

        const invisible_num = _.filter(thread.comments, comment => {
          return comment.visible === false;
        }).length;

        return {
          id: thread_id,
          title: thread.title,
          comments,
          invisible_num
        };
      });

      res.send(threadsAndComments);
    });

    app.get("/api/threads/new", (req: express.Request, res: express.Response) => {
      console.log("/api/threads/new called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      const idConfig = this.readJSON(path.resolve(this.rootPath, "json", id, "config.json")) as IDConfig;
      if (!this.isIntervalOK(idConfig, id, host)) {
        return;
      }

      const title = req.query.title || "";

      if (title === "") {
        res.send({ error: "Too few parameters." });
        return;
      }

      if (title.length > idConfig.max_thread_title_length) {
        return;
      }

      const threads = this.readJSON(path.resolve(this.rootPath, "json", id, "threads.json")) as Threads;

      if (threads.thread_IDs.length > idConfig.max_threads_num) {
        return;
      }

      let nextThreadID = 0;
      if (threads.thread_IDs.length > 0) {
        const lastThreadID = _.max(threads.thread_IDs);
        if (lastThreadID !== undefined) {
          nextThreadID = lastThreadID + 1;
        }
      }

      if (!this.exist(path.resolve(this.rootPath, "json", id, "threads"))) {
        fs.mkdirSync(path.resolve(this.rootPath, "json", id, "threads"), { recursive: true });
      }

      if (this.exist(path.resolve(this.rootPath, "json", id, "threads", nextThreadID + ".json"))) {
        res.send({ error: "ID '" + nextThreadID + "' already exists." });
        return;
      }

      this.writeJSON(path.resolve(this.rootPath, "json", id, "threads", nextThreadID + ".json"), {
        id: nextThreadID,
        title,
        comments: []
      });

      threads.thread_IDs.push(nextThreadID);
      this.writeJSON(path.resolve(this.rootPath, "json", id, "threads.json"), threads);

      const threadsAndComments = _.map(threads.thread_IDs, thread_id => {
        const thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", thread_id + ".json")) as Thread;

        const comments = this.convertCommentsForUser(thread.comments);

        const invisible_num = _.filter(thread.comments, comment => {
          return comment.visible === false;
        }).length;

        return {
          id: thread_id,
          title: thread.title,
          comments,
          invisible_num
        };
      });

      res.send(threadsAndComments);
    });

    app.get("/api/admin/threads/remove", (req: express.Request, res: express.Response) => {
      console.log("/api/admin/threads/remove called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({ error: "Wrong ID or password." });
        return;
      }

      const threadID = Number(req.query.thread_id) || -1;

      if (threadID < 0) {
        res.send({ error: "Too few parameters." });
        return;
      }

      if (!this.exist(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"))) {
        res.send({ error: "ID '" + threadID + "' not found." });
        return;
      }

      const threads = this.readJSON(path.resolve(this.rootPath, "json", id, "threads.json")) as Threads;

      if (!this.removeFile(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"))) {
        res.send({ error: "Unable to remove the file." });
        return;
      }

      threads.thread_IDs = _.filter(threads.thread_IDs, thread_id => {
        return thread_id !== threadID;
      });

      this.writeJSON(path.resolve(this.rootPath, "json", id, "threads.json"), threads);

      res.send(threads);
    });

    app.get("/api/threads/:threadID", (req: express.Request, res: express.Response) => {
      console.log("/api/threads/:threadID called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      const threadID = Number(req.params.threadID);

      if (!this.exist(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"))) {
        res.send({ error: "ID '" + threadID + "' not found." });
        return;
      }

      const thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json")) as Thread;

      const comments = this.convertCommentsForUser(thread.comments);

      const invisible_num = _.filter(thread.comments, comment => {
        return comment.visible === false;
      }).length;

      res.send({
        id: thread.id,
        title: thread.title,
        comments,
        invisible_num
      });
    });

    app.get("/api/threads/:threadID/comments/preview", (req: express.Request, res: express.Response) => {
      console.log("/api/threads/:threadID/comments/new called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      const threadID = Number(req.params.threadID);

      if (!this.exist(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"))) {
        res.send({ error: "ID '" + threadID + "' not found." });
        return;
      }

      const idConfig = this.readJSON(path.resolve(this.rootPath, "json", id, "config.json")) as IDConfig;

      let name = req.query.name || idConfig.john_doe;
      const text = req.query.text || "";
      const info = req.query.info || "";

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

      let trip = "";
      if (name.match(/#/)) {
        const splited = name.split(/#/);
        name = splited[0];
        trip = this.generateTrip(name, splited[1]);
      }

      const dt = moment();

      let thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json")) as Thread;

      if (thread.comments.length > idConfig.max_comments_num) {
        return;
      }

      thread = this.addComment(thread, {
        dt,
        name,
        trip,
        text,
        host,
        info,
        visible: true
      });

      const comments = this.convertCommentsForUser(thread.comments);

      const invisible_num = _.filter(thread.comments, comment => {
        return comment.visible === false;
      }).length;

      res.send({
        id: thread.id,
        title: thread.title,
        comments,
        invisible_num
      });
    });

    app.get("/api/threads/:threadID/comments/new", (req: express.Request, res: express.Response) => {
      console.log("/api/threads/:threadID/comments/new called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      const idConfig = this.readJSON(path.resolve(this.rootPath, "json", id, "config.json")) as IDConfig;
      if (!this.isIntervalOK(idConfig, id, host)) {
        return;
      }

      const threadID = Number(req.params.threadID);

      if (!this.exist(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"))) {
        res.send({ error: "ID '" + threadID + "' not found." });
        return;
      }

      let name = req.query.name || idConfig.john_doe;
      const text = req.query.text || "";
      const info = req.query.info || "";

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

      let trip = "";
      if (name.match(/#/)) {
        const splited = name.split(/#/);
        name = splited[0];
        trip = this.generateTrip(name, splited[1]);
      }

      const dt = moment();
      let visible = false;
      if (!idConfig.comment_moderated) {
        visible = true;
      }

      let thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json")) as Thread;

      if (thread.comments.length > idConfig.max_comments_num) {
        return;
      }

      thread = this.addComment(thread, {
        dt,
        name,
        trip,
        text,
        host,
        info,
        visible
      });

      this.writeJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"), thread);

      const comments = this.convertCommentsForUser(thread.comments);

      const invisible_num = _.filter(thread.comments, comment => {
        return comment.visible === false;
      }).length;

      res.send({
        id: thread.id,
        title: thread.title,
        comments,
        invisible_num
      });
    });

    app.get("/api/admin/threads/:threadID/comments/update", (req: express.Request, res: express.Response) => {
      console.log("/api/admin/threads/:threadID/comments/update called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({ error: "Wrong ID or password." });
        return;
      }

      const threadID = Number(req.params.threadID);

      if (!this.exist(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"))) {
        res.send({ error: "ID '" + threadID + "' not found." });
        return;
      }

      const commentID = Number(req.query.comment_id) || -1;
      const visible = Boolean(req.query.visible) || false;

      if (commentID < 0) {
        res.send({ error: "Too few parameters." });
        return;
      }

      let thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json")) as Thread;
      thread = this.updateComment(thread, commentID, {
        visible
      });

      this.writeJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"), thread);

      const comments = this.convertCommentsForUser(thread.comments);

      const invisible_num = _.filter(thread.comments, comment => {
        return comment.visible === false;
      }).length;

      res.send({
        id: thread.id,
        title: thread.title,
        comments,
        invisible_num
      });
    });

    app.get("/api/admin/threads/:threadID/comments/remove", (req: express.Request, res: express.Response) => {
      console.log("/api/admin/threads/:threadID/comments/remove called.");

      const host = (req.headers["x-forwarded-for"] as string) || "";
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({ error: "ID '" + id + "' not found." });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({ error: "Wrong ID or password." });
        return;
      }

      const threadID = Number(req.params.threadID);

      if (!this.exist(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"))) {
        res.send({ error: "ID '" + threadID + "' not found." });
        return;
      }

      const commentID = Number(req.query.comment_id) || -1;

      if (commentID < 0) {
        res.send({ error: "Too few parameters." });
        return;
      }

      let thread = this.readJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json")) as Thread;
      thread = this.removeComment(thread, commentID);

      this.writeJSON(path.resolve(this.rootPath, "json", id, "threads", threadID + ".json"), thread);

      const comments = this.convertCommentsForUser(thread.comments);

      const invisible_num = _.filter(thread.comments, comment => {
        return comment.visible === false;
      }).length;

      res.send({
        id: thread.id,
        title: thread.title,
        comments,
        invisible_num
      });
    });
  }

  private readJSON(jsonPath: string): Object {
    const json: Object = JSON.parse(fs.readFileSync(jsonPath, { encoding: "utf-8" }));
    return json;
  }

  private writeJSON(jsonPath: string, json: Object): void {
    const jsonStr = JSON.stringify(json, null, 2);
    fs.writeFileSync(jsonPath, jsonStr, { encoding: "utf-8" });
  }

  private exist(filePath: string): boolean {
    try {
      fs.statSync(filePath);
      return true;
    } catch (error) {}

    return false;
  }

  private removeFile(filePath: string): boolean {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {}

    return false;
  }

  private isIgnore(host: string): boolean {
    console.log(host);

    const ignoreList = this.readJSON(path.resolve(this.rootPath, "json", "ignore_list.json")) as IgnoreList;

    const found = _.find(ignoreList.host_list, h => {
      return h === host;
    });

    if (found) {
      return true;
    }

    return false;
  }

  private createIDFiles(
    id: string,
    password: string,
    interval_minutes: number,
    comment_moderated: boolean,
    john_doe: string,
    max_threads_num: number,
    max_comments_num: number,
    max_thread_title_length: number,
    max_comment_name_length: number,
    max_comment_text_length: number
  ): boolean {
    const idDirPath = path.resolve(this.rootPath, "json", id);
    if (this.exist(idDirPath)) {
      return false;
    } else {
      fs.mkdirSync(idDirPath, { recursive: true });
    }

    this.writeJSON(path.resolve(idDirPath, "password.json"), {
      password
    });

    this.writeJSON(path.resolve(idDirPath, "config.json"), {
      interval_minutes,
      comment_moderated,
      john_doe,
      max_threads_num,
      max_comments_num,
      max_thread_title_length,
      max_comment_name_length,
      max_comment_text_length
    });

    this.writeJSON(path.resolve(idDirPath, "threads.json"), { thread_IDs: [] });

    this.writeJSON(path.resolve(idDirPath, "ips.json"), {});

    return true;
  }

  private isPasswordCorrect(id: string, password: string): boolean {
    const passwordObject = this.readJSON(path.resolve(this.rootPath, "json", id, "password.json")) as Password;

    if (password === passwordObject.password) {
      return true;
    }

    return false;
  }

  private isIntervalOK(idConfig: IDConfig, id: string, host: string): boolean {
    const now = moment();

    const ips: any = this.readJSON(path.resolve(this.rootPath, "json", id, "ips.json"));
    if (ips[host]) {
      const pre = moment(ips[host]);
      if (now.valueOf() - pre.valueOf() < idConfig.interval_minutes * 60 * 1000) {
        return false;
      }
    }

    ips[host] = now;
    this.writeJSON(path.resolve(this.rootPath, "json", id, "ips.json"), ips);
    return true;
  }

  private convertCommentsForUser(adminComments: Array<AdminComment>): Array<Comment> {
    const visibleComments = _.filter(adminComments, adminComment => {
      return adminComment.visible;
    });

    return _.map(visibleComments, adminComment => {
      return {
        id: adminComment.id,
        dt: adminComment.dt,
        name: adminComment.name,
        trip: adminComment.trip,
        text: adminComment.text
      };
    });
  }

  private addComment(thread: Thread, params: any): Thread {
    let nextCommentID = 0;
    if (thread.comments.length > 0) {
      const lastComment = _.maxBy(thread.comments, "id");
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
      visible: params.visible
    });

    return thread;
  }

  private updateComment(thread: Thread, commentID: number, params: any): Thread {
    const found = _.find(thread.comments, comment => {
      return comment.id === commentID;
    });

    if (found) {
      found.visible = params.visible;
    }

    return thread;
  }

  private removeComment(thread: Thread, commentID: number): Thread {
    thread.comments = _.filter(thread.comments, comment => {
      return comment.id !== commentID;
    });

    return thread;
  }

  private generateTrip(name: string, tripkey: string): string {
    const cipher = crypto.createCipher("aes-256-cbc", tripkey);
    cipher.update(name, "utf8", "hex");
    const cipheredText = cipher.final("hex");
    return cipheredText.slice(-10);
  }
}

module.exports = NostalgicBBS;
// export default NostalgicBBS;
