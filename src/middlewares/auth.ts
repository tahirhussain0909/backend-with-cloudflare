import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

const authMiddleware = createMiddleware(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header) {
    return c.json(
      {
        message: "Unauthorized",
      },
      400
    );
  }
  const token = header.split(" ")[1];
  try {
    const author = await verify(token, c.env.JWT_SECRET);
    c.set("authorId", author.id);
    await next();
  } catch {
    return c.json(
      {
        message: "Unauthorized",
      },
      400
    );
  }
});

export default authMiddleware;
