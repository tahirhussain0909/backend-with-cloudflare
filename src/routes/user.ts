import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
import { userSchema } from "@tahirhussain0909/zod-for-medium";
import { UserTypes } from "@tahirhussain0909/zod-for-medium";

import hashPassword from "../utils/hashPassword";

const route = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

route.post("/signup", async (c) => {
  try {
    const parsedbody = userSchema.safeParse(await c.req.json());
    if (!parsedbody.success) {
      return c.json(
        {
          message: "Invalid Inputs from here",
        },
        400
      );
    }
    const { name, email, password }: UserTypes = parsedbody.data;
    const hashedPassword = await hashPassword(password);
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    await prisma.$connect();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    await prisma.$disconnect();
    return c.json(
      {
        token: `Bearer ${token}`,
      },
      200
    );
  } catch {
    return c.json(
      {
        message: "Something Went Wrong!",
      },
      500
    );
  }
});

route.post("/signin", async (c) => {
  try {
    const parsedbody = userSchema.safeParse(await c.req.json());
    if (!parsedbody.success) {
      return c.json(
        {
          message: "Invalid Inputs",
        },
        400
      );
    }
    const { email, password }: UserTypes = parsedbody.data;
    const hashedPassword = await hashPassword(password);
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    await prisma.$connect();
    const user = await prisma.user.findUnique({
      where: {
        email,
        password: hashedPassword,
      },
    });
    if (!user) {
      return c.json(
        {
          message: "User not found",
        },
        400
      );
    }
    const token = await sign({ id: user.id }, c.env.JWT_SECRET);
    await prisma.$disconnect();
    return c.json(
      {
        token: `Bearer ${token}`,
      },
      200
    );
  } catch {
    return c.json(
      {
        message: "Something Went Wrong!",
      },
      500
    );
  }
});

route.get("/details", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    await prisma.$connect();
    const user = await prisma.user.findFirst();
    await prisma.$disconnect();
    return c.json(user, 200);
  } catch {
    return c.json(
      {
        message: "Something Went Wrong!",
      },
      500
    );
  }
});

export default route;
