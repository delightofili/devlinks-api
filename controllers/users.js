import prisma from "../lib/prisma";

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await prisma.users.delete({
      where: { id: id },
    });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}
