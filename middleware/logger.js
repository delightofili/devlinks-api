export function logger(req, res, next) {
  // export so server.js can import it

  const start = Date.now();
  // record when request started — Date.now() returns milliseconds since 1970

  res.on("finish", () => {
    // 'finish' event fires when response is sent to client
    // we listen for it to know when the request is complete

    const duration = Date.now() - start;
    // subtract start time from current time = how long request took

    console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    // example output: GET /api/links 200 - 45ms
    // req.method = GET/POST etc
    // req.url = the path requested
    // res.statusCode = what we sent back (200, 404, 500 etc)
    // duration = milliseconds taken
  });

  next();
  // MUST call next() — without this request hangs forever
  // passes control to next middleware or route handler
}
