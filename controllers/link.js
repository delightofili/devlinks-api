import { asyncHandler } from "../utils/asyncHandler.js";
import {
  fetchAllLinks,
  fetchLinkById,
  insertLink,
  modifyLink,
  removeLink,
} from "../services/link.js";
import prisma from "../lib/prisma.js";
import PDFDocument from "pdfkit";
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
  const userId = req.userId;
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

export const uploadGallery = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const urls = req.files.map((file) => `/uploads/${file.filename}`);

  res.json({ images: urls });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const avatarFile = req.files["avatar"]?.[0];
  const coverFile = req.files["coverPhoto"]?.[0];
});

export const exportLinks = asyncHandler(async (req, res) => {
  const links = await prisma.link.findMany({
    where: { user_id: req.userId },
  });

  const csvHeader = "Title,URL,Category,Created At\n";

  const csvRows = links
    .map((link) => `${link.title},${link.category},${link.created_at}`)
    .join("\n");

  const csvContent = csvHeader + csvRows;

  res.setHeader("Content-Type", "text/csv");

  res.setHeader("Content-Disposition", "attachment; filename=my-links.csv");
  res.send(csvContent);
});

//pdf generation

export const generateLinksReport = asyncHandler(async (req, res) => {
  const links = await prisma.link.findMany({
    where: { user_id: req.userId },
  });

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=links-report.pdf");

  doc.pipe(res);
  doc.fontSize(20).text("My DevLinks Report", { align: "center" });
  doc.moveDown();

  links.forEach((link) => {
    doc.fontSize(12).text(`${link.title} - ${link.url}
      `);
    doc.fontSize(10).fillColor("gray").text(link.category);
    doc.moveDown();
  });
  doc.end();
});
