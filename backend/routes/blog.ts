import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { createBlogInput, updateBlogInput } from 'iforgotmyname22-common-blog';



export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string,
    },
    Variables : {
        userId: string
    }
}>();





blogRouter.use('/*', async (c, next) => {
  const jwt = c.req.header('Authorization');
  if (!jwt) {
    return c.json({ error: "unauthorized" }, 403);
  }

  try {
    const token = jwt.split(' ')[1];
    const payload = await verify(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ error: "unauthorized" }, 403);
    }
    c.set('userId', String(payload.id));
    await next();
  } catch (error) {
    return c.json({ error: "invalid token" }, 403);
  }
});


blogRouter.get('/bulk', async(c) => {
   
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())
    
   
    const blogs=await prisma.post.findMany({
      select:{
        content:true,
        title:true,
        id:true,
        author:{
          select:{
            name:true
          }
        }
      }
    })
    return c.json({
      blogs
    })
  
  })



blogRouter.post('/', async(c) => {

  const body= await c.req.json()
  const {success} = createBlogInput.safeParse(body)
      if(!success){
          c.status(411)
          return c.json({
              message:"input not correct"
          })
      }
  const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL
  }).$extends(withAccelerate())
  const usid=c.get("userId")
  const blog=await prisma.post.create({
    data:{
        title:body.title,
        content:body.content,
        authorId:usid
    }
  })
  return c.json({
    id:blog.id
  })
})




blogRouter.put('/', async(c) => {
    const body= await c.req.json()
    const {success} = updateBlogInput.safeParse(body)
        if(!success){
            c.status(411)
            return c.json({
                message:"input not correct"
            })
        }
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())
    const blog=await prisma.post.update({
        where:{
            id:body.id
        },
      data:{
          title:body.title,
          content:body.content,
      }
    })
    return c.json({
      id:blog.id
    })
})




blogRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
 
  try {
    const blog = await prisma.post.findFirst({
      where: {
        id: id,
      },
      select:{
        content:true,
        title:true,
        id:true,
        author:{
          select:{
            name:true
          }
        }
      }
    });
    return c.json({ blog });
  } catch (error) {
    c.status(417);
    return c.json({
      message: "Error while getting blog post",
    });
  }
});





