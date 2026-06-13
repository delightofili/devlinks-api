import http from "http";

const server = http.createServer((req, res) => {
  const { method, url } = req;
  if (method === "GET" && url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Welcome to DevLinks API" }));
    return;
  }

  const links = [
    {
      id: 1,
      title: "something",
      url: "https://something.com",
      category: "tools",
    },
    {
      id: 2,
      title: "something2",
      url: "https://something2.com",
      category: "tools2",
    },
    {
      id: 3,
      title: "something3",
      url: "https://something3.com",
      category: "tools3",
    },
  ];

  if (method === "GET" && url === "/api/links") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(links));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//yeah
