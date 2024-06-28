import { Hono } from "hono";

import userRouter from "./user";
import blogRouter from "./blog";

const route = new Hono();

route.route("/user", userRouter);
route.route("/blog", blogRouter);

export default route;
