import prisma from "../lib/prisma";

// hardcoded data for now — will be replaced with database queries
let links = [
  {
    id: 1,
    title: "MDN Docs",
    url: "https://developer.mozilla.org",
    category: "tools",
    description: "Web docs",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "CSS Tricks",
    url: "https://css-tricks.com",
    category: "articles",
    description: "CSS tips",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Node.js Docs",
    url: "https://nodejs.org",
    category: "tutorials",
    description: "Node docs",
    created_at: new Date().toISOString(),
  },
];

export async function fetchAllLinks({ category, page = 1, limit = 10 } = {}) {
  const where = {};
  // start with empty where clause - matches everything

  if (category) {
    where.category = category;
    //add category filter if provided

    const [links, total] = await Promise.all([
      //promise.all runs both queries simultaneously and it's faster...

      prisma.link.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true },
            //only get this user fields - never password
          },
          _count: {
            select: { upvotes: true, comments: true },
          },
        },
        orderBy: { created_at: "desc" },
        //newest first

        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.link.count({ where }),
    ]);

    return {
      links,
      total,
      page,
      totalPages: Math.celi(total / limit),
    };
  }
}

export async function fetchLinkById(id) {
  const link = links.find((link) => link.id === Number(id));
  // .find returns first matching item or undefined
  // Number(id) converts string '5' to number 5 for comparison

  return link || null;
  // return the link if found, null if not
}

export async function insertLink({ title, url, category, description }) {
  const newLink = {
    id: links.length + 1,
    // simple id — database will handle this properly later
    title,
    url,
    category,
    description,
    created_at: new Date().toISOString(),
    // ISO string — "2024-01-15T10:30:00.000Z"
  };

  links.push(newLink);
  // add to our array — database INSERT later

  return newLink;
  // return so controller can send it back to client
}

export async function modifyLink(id, data) {
  const index = links.findIndex((link) => link.id === Number(id));
  // findIndex returns position in array, or -1 if not found

  if (index === -1) return null;
  // not found — return null, controller handles 404

  links[index] = { ...links[index], ...data };
  // spread existing link, spread new data on top
  // new data overwrites matching fields, keeps others

  return links[index];
  // return updated link
}

export async function removeLink(id) {
  const index = links.findIndex((link) => link.id === Number(id));

  if (index === -1) return null;

  const deleted = links[index];
  // save reference before removing

  links.splice(index, 1);
  // splice(startIndex, deleteCount) — removes 1 item at index

  return deleted;
  // return deleted item so controller can confirm
}
