import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { blogSchema } from "@tahirhussain0909/zod-for-medium";
import { BlogTypes } from "@tahirhussain0909/zod-for-medium";
import authMiddleware from "../middlewares/auth";

const route = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    authorId: number;
  };
}>();

route.post("/blog-post", authMiddleware, async (c) => {
  try {
    const parsedBody = blogSchema.safeParse(await c.req.json());
    if (!parsedBody.success) {
      return c.json(
        {
          message: "Invalid Inputs",
        },
        400
      );
    }
    const { title, content, published }: BlogTypes = parsedBody.data;
    const authorId = c.get("authorId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    await prisma.$connect();
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        author: {
          connect: { id: authorId },
        },
      },
    });
    await prisma.$disconnect();
    return c.json(
      {
        message: "Blog is Posted Successfully",
        postId: post.id,
      },
      200
    );
  } catch {
    return c.json(
      {
        message: "Something went wrong",
      },
      500
    );
  }
});

route.get("/bulk", authMiddleware, async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const blogs = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });
    return c.json(
      {
        blogs,
      },
      200
    );
  } catch {
    return c.json(
      {
        message: "Something went wrong",
      },
      500
    );
  }
});

route.get("/blog/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ message: "Invalid blog ID" }, 400);
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    await prisma.$connect();
    const blog = await prisma.post.findFirst({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });
    await prisma.$disconnect();

    if (!blog) {
      return c.json({ message: "Blog not found" }, 404);
    }

    return c.json(blog, 200);
  } catch (error) {
    console.error("Error fetching blog:", error); // Log the error for debugging
    return c.json({ message: "Something went wrong" }, 500);
  }
});

route.put("/post-update", async (c) => {
  try {
    const body = await c.req.json();
    const { success } = blogSchema.safeParse(body);
    if (!success) {
      c.status(411);
      return c.json({
        message: "Inputs not correct",
      });
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    await prisma.$connect();
    const blog = await prisma.post.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    await prisma.$disconnect();
    return c.json({
      id: blog.id,
    });
  } catch {
    return c.json(
      {
        message: "Something went wrong",
      },
      500
    );
  }
});

export default route;
