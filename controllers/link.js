import { asyncHandler } from "../utils/asyncHandler.js";
import {
  fetchAllLinks,
  fetchLinkById,
  insertLink,
  modifyLink,
  removeLink,
} from "../services/link.js";
// import service functions — these do the actual work

export const getAllLinks = asyncHandler(async (req, res) => {
  // asyncHandler wraps this so errors go to error middleware

  const { category, page } = req.query;
  // read query strings — GET /api/links?category=tools&page=2
  // category = 'tools', page = '2'

  const links = await fetchAllLinks({ category, page });
  // call service, pass filters
  // await because fetchAllLinks will query database (async)

  res.json(links);
  // send array of links as JSON with 200 status (default)
});

export const getLinkById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // req.params.id = the :id from the URL
  // GET /api/links/5 → id = '5' (always a string)

  const link = await fetchLinkById(id);
  // ask service for this specific link

  if (!link) {
    // if service returns null — link doesn't exist
    res.status(404).json({ error: "Link not found" });
    return;
    // return stops function — without it res.json below also runs
  }

  res.json(link);
  // send the link object
});

export const createLink = asyncHandler(async (req, res) => {
  const { title, url, category, description } = req.body;
  // req.body = the JSON the client sent
  // client sends: { "title": "MDN", "url": "https://mdn.com", ... }
  // destructure the fields we need
  const userId = 1;
  const newLink = await insertLink({
    title,
    url,
    category,
    description,
    userId,
  });
  // pass to service — service saves to database
  // returns the newly created link with id and created_at

  res.status(201).json(newLink);
  // 201 = Created (not 200)
  // send back the created link so client knows the id
});

export const updateLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // which link to update

  const { title, url, category, description } = req.body;
  // what to update it to

  const updated = await modifyLink(id, { title, url, category, description });
  // service handles the update

  if (!updated) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.json(updated);
  // send back updated link
});

export const deleteLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // which link to delete

  const deleted = await removeLink(id);
  // service deletes from database

  if (!deleted) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.json({ message: `Link ${id} deleted successfully` });
  // 200 with confirmation message
});
