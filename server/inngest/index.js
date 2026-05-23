import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create Inngest client
export const inngest = new Inngest({ id: "project-management" });

/* -----------------------------
   USER CREATE
------------------------------*/
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk", event: "clerk/user.created" },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses?.[0]?.email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`,
        image: data.image_url ?? "",
      },
    });
  }
);

/* -----------------------------
   USER DELETE
------------------------------*/
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk", event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.delete({
      where: {
        id: data.id,
      },
    });
  }
);

/* -----------------------------
   USER UPDATE
------------------------------*/
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk", event: "clerk/user.updated" },
  async ({ event }) => {
    const { data } = event;

    await prisma.user.update({
      where: {
        id: data.id,
      },
      data: {
        email: data.email_addresses?.[0]?.email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`,
        image: data.image_url ?? "",
      },
    });
  }
);

// Inngest Function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
  {id:'sync-workspace-from-clerk'},
  {event:'clerk/organization.created'},
  async ({ event}) =>{
    const {data} = event;
    await prisma.workspace.create({
      data:{
        id:data.id,
        name:data.name,
        slug:data.slug,
        ownerId:data,created_by,
        image_url:data.image_url
      }
    })

    //  Add creator as ADMIN MEMBER
    await prisma.workspaceMember.create({
      data:{
        userId:data.created_by,
        workspaceId:data.id,
        role:"ADMIN"

      }
    })
  }
)


// Inngest Function to update workspace data in database
const syncWorkspaceCreation = inngest.createFunction(
  {id:'update-workspace-from-clerk'},
  {event:'clerk/organization.updated'},
  async ({event}) =>{
    const {data} = event;
    await prisma.workspace.update({
      where:{
        id:data.id
      },
      data:{
        name:data.name,
        slug:data.slug,
        image_url:data.image_url,

      }
    })

  }
)

//  Inngest function to delete workspace from database
 const syncWorkspaceDeletion = inngest.createFunction(
  {id:'delete-wokspace-with-clerk'},
  {event:'clerk/organization.deleted'},
  async ({event})=>{
    const {data} = event;
    await prisma.workspace.delete({
      where:{
        id:data.id
      }
    })
  }
 )


//  Inngest function to save workspace member data to a database

const syncWorkspaceMemberCreation = inngest.createFunction(
  {id:'sync-workspace-member-from-clerk'},
  {event:'clerk/orgnaizationInvitation.accepted'},
  async ({event}) => {
    const {data} = event;
    await prisma.workspaceMember.create({
      data:{
        userId:data.user_id,
        workspaceId: data.organization_id,
        role:String(data.role_name).toUpperCase(),
      }
    })
  }
)

/* -----------------------------
   EXPORT FUNCTIONS
------------------------------*/
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation
];