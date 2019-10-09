"use strict";
import _ from "lodash";
import os from "os";
import fs from "fs";
import path from "path";
import moment from "moment";
import express from "express";
import bodyParser from "body-parser";
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
  visible: boolean;
  host: string;
  info: string;
  title: string;
}

interface Comment {
  id: number;
  visible: boolean;
  title: string;
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
      this.createIDFiles("default", "", 0);
    }

    if (!this.exist(path.resolve(this.rootPath, "json", "config.json"))) {
      this.writeJSON(path.resolve(this.rootPath, "json", "config.json"), {
        listening_port: listening_port
      });
    }

    if (!this.exist(path.resolve(this.rootPath, "json", "ignore_list.json"))) {
      this.writeJSON(path.resolve(this.rootPath, "json", "ignore_list.json"), {
        host_list: []
      });
    }

    this.appConfig = this.readJSON(
      path.resolve(this.rootPath, "json", "config.json")
    ) as AppConfig;

    this.initServer();
  }

  public start(): void {
    app.listen(this.appConfig.listening_port, () => {
      console.log("listening on port " + this.appConfig.listening_port + "!");
    });
  }

  private initServer(): void {
    app.set("trust proxy", true);

    // app.use(
    //   (
    //     req: express.Request,
    //     res: express.Response,
    //     next: express.NextFunction
    //   ) => {
    //     res.header("Content-Type", "application/json");
    //     res.header("Access-Control-Allow-Origin", "*");
    //     res.header(
    //       "Access-Control-Allow-Headers",
    //       "Origin, X-Requested-With, Content-Type, Accept"
    //     );
    //     res.header(
    //       "Access-Control-Allow-Methods",
    //       "POST, GET, PUT, DELETE, OPTIONS"
    //     );
    //     next();
    //   }
    // );

    app.use(
      bodyParser.urlencoded({
        extended: true
      })
    );

    app.use(bodyParser.json());

    app.get("/api/new", (req: express.Request, res: express.Response) => {
      console.log("/api/new called.");

      const host = req.headers["x-forwarded-for"] as string;
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.createIDFiles(id, password, 0)) {
        res.send({ error: "ID '" + id + "' already exists." });
        return;
      }

      const idConfig = this.readJSON(
        path.resolve(this.rootPath, "json", id, "config.json")
      ) as IDConfig;

      res.send(idConfig);
    });

    app.get("/api/config", (req: express.Request, res: express.Response) => {
      console.log("/api/config called.");

      const host = req.headers["x-forwarded-for"] as string;
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";
      const password = req.query.password || "";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({
          error: "ID '" + id + "' not found."
        });
        return;
      }

      if (!this.isPasswordCorrect(id, password)) {
        res.send({
          error: "Wrong ID or password."
        });
        return;
      }

      const idConfig = this.readJSON(
        path.resolve(this.rootPath, "json", id, "config.json")
      ) as IDConfig;

      let interval_minutes = 0;
      if (req.query.interval_minutes !== undefined) {
        if (Number(req.query.interval_minutes) >= 0) {
          interval_minutes = Number(req.query.interval_minutes);
        }
      } else {
        interval_minutes = idConfig.interval_minutes;
      }

      const dstIDConfig: IDConfig = {
        interval_minutes
      };

      this.writeJSON(
        path.resolve(this.rootPath, "json", id, "config.json"),
        dstIDConfig
      );

      res.send(dstIDConfig);
    });

    app.get("/api/threads", (req: express.Request, res: express.Response) => {
      console.log("/api/threads called.");

      const host = req.headers["x-forwarded-for"] as string;
      if (this.isIgnore(host)) {
        return;
      }

      const id = req.query.id || "default";

      if (!this.exist(path.resolve(this.rootPath, "json", id))) {
        res.send({
          error: "ID '" + id + "' not found."
        });
        return;
      }

      const threads = this.readJSON(
        path.resolve(this.rootPath, "json", id, "threads.json")
      ) as Threads;

      res.send(threads);
    });

    app.get(
      "/api/threads/comments",
      (req: express.Request, res: express.Response) => {
        console.log("/api/threads/comments called.");

        const host = req.headers["x-forwarded-for"] as string;
        if (this.isIgnore(host)) {
          return;
        }

        const id = req.query.id || "default";

        if (!this.exist(path.resolve(this.rootPath, "json", id))) {
          res.send({
            error: "ID '" + id + "' not found."
          });
          return;
        }

        const threads = this.readJSON(
          path.resolve(this.rootPath, "json", id, "threads.json")
        ) as Threads;

        const allComments = _.map(threads.thread_IDs, thread_id => {
          let thread = this.readJSON(
            path.resolve(
              this.rootPath,
              "json",
              id,
              "threads",
              thread_id + ".json"
            )
          ) as Thread;

          const invisible_num = _.countBy(thread.comments, comment => {
            return comment.visible === false;
          });

          const comments = _.map(thread.comments, comment => {
            return _.omit(comment, "host", "info");
          });

          thread = _.extend(thread, {
            invisible_num: invisible_num,
            comments: comments
          });

          return thread;
        });

        res.send(allComments);
      }
    );

    app.get(
      "/api/threads/:threadID",
      (req: express.Request, res: express.Response) => {
        console.log("/api/threads/:threadID called.");

        const host = req.headers["x-forwarded-for"] as string;
        if (this.isIgnore(host)) {
          return;
        }

        const id = req.query.id || "default";

        if (!this.exist(path.resolve(this.rootPath, "json", id))) {
          res.send({
            error: "ID '" + id + "' not found."
          });
          return;
        }

        const threadID = Number(req.params.threadID);

        const thread = this.readJSON(
          path.resolve(this.rootPath, "json", id, "threads", threadID + ".json")
        ) as Thread;

        res.send(thread);
      }
    );
  }

  private readJSON(jsonPath: string): Object {
    const json: Object = JSON.parse(
      fs.readFileSync(jsonPath, { encoding: "utf-8" })
    );
    return json;
  }

  private writeJSON(jsonPath: string, json: Object): void {
    const jsonStr = JSON.stringify(json, null, "  ");
    fs.writeFileSync(jsonPath, jsonStr, { encoding: "utf-8" });
  }

  private exist(filePath: string): boolean {
    try {
      fs.statSync(filePath);
      return true;
    } catch (error) {}

    return false;
  }

  private isIgnore(host: string): boolean {
    console.log(host);

    const ignoreList = this.readJSON(
      path.resolve(this.rootPath, "json", "ignore_list.json")
    ) as IgnoreList;

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
    interval_minutes: number
  ): boolean {
    const idDirPath = path.resolve(this.rootPath, "json", id);
    if (this.exist(idDirPath)) {
      return false;
    } else {
      fs.mkdirSync(idDirPath, { recursive: true });
    }

    this.writeJSON(path.resolve(idDirPath, "password.json"), {
      password: password
    });

    this.writeJSON(path.resolve(idDirPath, "config.json"), {
      interval_minutes: interval_minutes
    });

    this.writeJSON(path.resolve(idDirPath, "threads.json"), { thread_IDs: [] });

    this.writeJSON(path.resolve(idDirPath, "ips.json"), {});

    return true;
  }

  private isPasswordCorrect(id: string, password: string): boolean {
    const passwordObject = this.readJSON(
      path.resolve(this.rootPath, "json", id, "password.json")
    ) as Password;

    if (password === passwordObject.password) {
      return true;
    }

    return false;
  }

  private isIntervalOK(idConfig: IDConfig, id: string, host: string): boolean {
    const now = moment();

    const ips: any = this.readJSON(
      path.resolve(this.rootPath, "json", id, "ips.json")
    );
    if (ips[host]) {
      const pre = moment(ips[host]);
      if (
        now.valueOf() - pre.valueOf() <
        idConfig.interval_minutes * 60 * 1000
      ) {
        return false;
      }
    }

    ips[host] = now;
    this.writeJSON(path.resolve(this.rootPath, "json", id, "ips.json"), ips);
    return true;
  }
}

module.exports = NostalgicBBS;
// export default NostalgicBBS;
