registerPrimer("rest-api", `<p class="pr-lead">A <b>REST API</b> is how programs talk to each other over the web. A mobile app asks a server "give me order 42" or "create a new order", and the server replies. REST is a set of simple conventions for how those requests and replies should look, so that any developer can guess how an API works.</p>
<div class="pr-analogy"><b>Think of it like this</b>Think of a library. Every book has a shelf address (the <b>URL</b>). You tell the librarian what you want to do with it: borrow it, return it, look at it (the <b>HTTP method</b>). The librarian replies with a short answer code before handing anything over: "here you go", "not found", "you are not a member" (the <b>status code</b>).</div>

<h3>Key words you will see</h3>
<dl class="pr-terms">
<dt>Resource</dt><dd>A "thing" your API deals with, such as an order, a customer or a book. Named with nouns.</dd>
<dt>URL / endpoint</dt><dd>The address of a resource, such as <code>/orders/42</code>.</dd>
<dt>HTTP method</dt><dd>The action: <b>GET</b> (read), <b>POST</b> (create), <b>PUT</b> (replace), <b>PATCH</b> (change part), <b>DELETE</b> (remove).</dd>
<dt>Status code</dt><dd>A number saying how it went. 2xx success, 4xx the client made a mistake, 5xx the server failed.</dd>
<dt>JSON</dt><dd>The text format usually used for the data, like <code>{"id": 42, "status": "PAID"}</code>.</dd>
<dt>Idempotent</dt><dd>Doing the same request twice has the same effect as doing it once, so it is safe to retry.</dd>
<dt>Header</dt><dd>Extra information sent with a request or response, such as the login token or the data format.</dd>
</dl>

<h3>Step by step: one request and its reply</h3>
<ol class="pr-steps">
<li>The app sends <code>POST /customers/42/orders</code> with a JSON body describing the order and a login token in the <code>Authorization</code> header.</li>
<li>The URL says <b>which</b> resource (the orders of customer 42); the method POST says <b>what to do</b> (create one).</li>
<li>The server checks the token, validates the data and saves the order.</li>
<li>It replies <code>201 Created</code>, a <code>Location</code> header with the new order's address (<code>/orders/9001</code>), and the order as JSON.</li>
<li>The app reads the status code first. 201 means success, so it shows the new order.</li>
</ol>
<figure class="fig">
<svg viewBox="0 0 620 236" role="img" aria-label="Anatomy of an HTTP request and response: method, path, headers, body; status code, headers, body">
  <defs><marker id="pr-rest" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4z"/></marker></defs>
  <rect class="dg-box" x="10" y="14" width="290" height="208" rx="10"/>
  <text class="dg-t" x="24" y="36">Request</text>
  <rect class="dg-fill" x="24" y="46" width="60" height="26" rx="5"/><text class="dg-m" x="54" y="64" text-anchor="middle">POST</text>
  <rect class="dg-fill2" x="90" y="46" width="196" height="26" rx="5"/><text class="dg-m" x="98" y="64">/customers/42/orders</text>
  <text class="dg-s" x="24" y="90">method = the verb      path = the noun</text>
  <text class="dg-m" x="24" y="114">Authorization: Bearer eyJ…</text>
  <text class="dg-m" x="24" y="132">Content-Type: application/json</text>
  <text class="dg-m" x="24" y="150">Idempotency-Key: 7f3c…</text>
  <text class="dg-s" x="24" y="168">headers = metadata about the request</text>
  <text class="dg-m" x="24" y="196">{ "sku": "BOOK-1", "qty": 2 }</text>
  <text class="dg-s" x="24" y="212">body = the data</text>
  <line class="dg-line" x1="300" y1="118" x2="318" y2="118" marker-end="url(#pr-rest)"/>
  <rect class="dg-box" x="320" y="14" width="290" height="208" rx="10"/>
  <text class="dg-t" x="334" y="36">Response</text>
  <rect class="dg-fill" x="334" y="46" width="120" height="26" rx="5"/><text class="dg-m" x="394" y="64" text-anchor="middle">201 Created</text>
  <text class="dg-s" x="334" y="90">status = what happened, readable by machines</text>
  <text class="dg-m" x="334" y="114">Location: /orders/9001</text>
  <text class="dg-m" x="334" y="132">ETag: "v1"</text>
  <text class="dg-s" x="334" y="150">where the new thing lives, and its version</text>
  <text class="dg-m" x="334" y="178">{ "id": 9001, "status": "PLACED",</text>
  <text class="dg-m" x="334" y="196">  "total": 598.00 }</text>
  <text class="dg-s" x="334" y="212">body = the created resource</text>
</svg>
<figcaption>Every part has one job. Errors belong in the status code, not in a 200 with an "error" field.</figcaption>
</figure>

<h3>A worked example: designing a small API</h3>
<p>Requirement: "Library members can borrow books, return them, and see their current loans."</p>
<pre><code>GET    /books?author=orwell        search the catalogue           200
GET    /books/{isbn}               one book                       200 or 404
POST   /members/{id}/loans         borrow a book                  201
GET    /members/{id}/loans         a member's loans               200
POST   /loans/{loanId}/return      return the book                200</code></pre>
<ol class="pr-steps">
<li><b>Find the nouns:</b> books, members and loans. A loan is a real thing with its own id.</li>
<li><b>Use the method as the verb:</b> GET to read, POST to create. There are no verbs like <code>/getBooks</code> in the URLs.</li>
<li><b>Plan the failures:</b> book already on loan → 409 Conflict; not logged in → 401; logged in but not allowed → 403; book does not exist → 404.</li>
<li>Returning a book does not delete the loan (the history matters for fines), so it is a POST to a <code>/return</code> action rather than a DELETE.</li>
</ol>

<h3>The status codes you will use most</h3>
<ul>
<li><b>200 OK</b>: success, with data. <b>201 Created</b>: something new was made. <b>204 No Content</b>: success, nothing to return.</li>
<li><b>400 Bad Request</b>: the input is wrong. <b>401</b>: not logged in. <b>403</b>: not allowed. <b>404 Not Found</b>. <b>409 Conflict</b>: clashes with the current state.</li>
<li><b>500 Internal Server Error</b>: something broke on the server.</li>
</ul>

<h3>Common mistakes beginners make</h3>
<div class="pr-mistake">
<p class="pm-what">❌ Putting verbs in URLs</p>
<p>URLs like <code>/getAllUsers</code> or <code>/createOrder</code> repeat what the HTTP method already says, and every new action invents a new URL.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use nouns and let the method be the verb: <code>GET /users</code>, <code>POST /orders</code>.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Returning 200 for errors</p>
<p>Replying <code>200 OK</code> with <code>{"success": false}</code> confuses clients, monitoring tools and retry logic, which all trust the status code.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> return the correct error status (400, 404, 409...) with a clear JSON error message.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Using GET to change data</p>
<p>Browsers, crawlers and caches assume GET only reads. A link like <code>GET /deleteUser?id=5</code> can delete data by accident when something simply visits it.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> use POST, PUT, PATCH or DELETE for anything that changes data.</p>
</div>
<div class="pr-mistake">
<p class="pm-what">❌ Returning huge lists in one go</p>
<p>An endpoint that returns all 80,000 customers is slow today and gets worse every day.</p>
<p class="pm-fix"><strong>✅ Fix:</strong> paginate: return a page at a time with a sensible default size and a maximum.</p>
</div>

<h3>Remember this</h3>
<ul class="pr-remember">
<li>URLs name things (nouns); HTTP methods are the actions.</li>
<li>The status code tells the client what happened; use the right one.</li>
<li>GET only reads; never change data with GET.</li>
<li>Make requests safe to retry where possible (idempotent).</li>
<li>Paginate large lists and keep error responses consistent.</li>
</ul>
<p><b>Next:</b> the questions below cover status codes, versioning, pagination, idempotency, caching and API security.</p>`);

appendTopic("rest-api", [
{
  q: "Review this badly designed API and fix every problem you find",
  level: "beginner", hot: true, tags: ["api-design", "code-review", "status-codes", "must-know"],
  companies: ["Amazon", "Microsoft", "Atlassian", "Infosys", "TCS", "Accenture", "Razorpay", "Stripe"],
  a: `<p>A code-review question is a good test of API design because it needs judgement, not definitions. Here is an endpoint list from a real-looking pull request. Find the problems before reading the fixes.</p>
<pre><code>GET  /getAllUsers
POST /createUser
GET  /deleteUser?id=42
POST /users/update          {"id": 42, "email": "new@x.com"}
GET  /user/42/Orders
POST /orders/search          {"status": "SHIPPED"}

Responses:
  200 {"success": false, "error": "User not found"}
  200 {"success": true, "data": [ ...all 80,000 users... ]}
  500 {"error": "java.sql.SQLException: ORA-00942: table or view does not exist
        at com.corp.dao.UserDao.find(UserDao.java:88) ..."}</code></pre>
<table>
<tr><th>#</th><th>Problem</th><th>Why it matters</th><th>Fix</th></tr>
<tr><td>1</td><td>Verbs in URLs: <code>/getAllUsers</code>, <code>/createUser</code></td><td>The method already is the verb. Every new operation invents a new URL</td><td><code>GET /users</code>, <code>POST /users</code></td></tr>
<tr><td>2</td><td><strong><code>GET /deleteUser</code></strong></td><td>GET must be safe. Browsers prefetch links, crawlers follow them, caches replay them. This can delete users by accident</td><td><code>DELETE /users/42</code></td></tr>
<tr><td>3</td><td>Id in the body of an update to a generic URL</td><td>The URL no longer identifies the resource; logs, caching and access rules cannot see which user changed</td><td><code>PATCH /users/42</code> with <code>{"email": ...}</code></td></tr>
<tr><td>4</td><td>Inconsistent naming: <code>/user</code> vs <code>/users</code>, <code>Orders</code> capitalised</td><td>Clients guess wrong, and URL paths are case-sensitive</td><td>Plural lowercase nouns everywhere: <code>/users/42/orders</code></td></tr>
<tr><td>5</td><td>A search that only filters, done as <code>POST</code></td><td>Cannot be cached, bookmarked or retried safely</td><td><code>GET /orders?status=SHIPPED</code>. Keep POST search for genuinely huge or sensitive criteria</td></tr>
<tr><td>6</td><td><strong>200 with <code>"success": false</code></strong></td><td>Monitoring counts it as success; client libraries do not raise errors; retries and circuit breakers never trigger</td><td><code>404</code> with an error body</td></tr>
<tr><td>7</td><td>Returns all 80,000 users</td><td>Slow, memory-hungry, and it gets worse every day</td><td>Paginate with a default and a maximum limit</td></tr>
<tr><td>8</td><td><strong>Stack trace in the 500 body</strong></td><td>Tells an attacker your database, table names and code layout</td><td>Generic message and a correlation id; the details go to the logs</td></tr>
</table>
<pre><code>// After
GET    /users?limit=50&amp;cursor=...          200
POST   /users                               201  Location: /users/43
GET    /users/42                            200 | 404
PATCH  /users/42   {"email": "new@x.com"}   200 | 404 | 409 (email taken)
DELETE /users/42                            204 | 404
GET    /users/42/orders?status=SHIPPED      200

// One error shape everywhere: RFC 9457 "problem details"
404 Not Found
Content-Type: application/problem+json
{
  "type": "https://api.example.com/errors/user-not-found",
  "title": "User not found",
  "status": 404,
  "detail": "No user with id 42",
  "traceId": "4bf92f3577b34da6"
}
// Spring Boot 3 can produce this format for you:
//   spring.mvc.problemdetails.enabled=true, or return ProblemDetail from
//   an @ExceptionHandler</code></pre>
<p><strong>How to deliver this in an interview:</strong> go through the list by severity, not by line. Start with what can cause damage (GET deleting data, leaked stack traces), then correctness (status codes), then scalability (pagination), then consistency (naming). It shows you know which problems actually matter.</p>`
},
{
  q: "Two users edit the same record at once. Prevent the lost update with ETag and If-Match",
  level: "advanced", hot: true, tags: ["concurrency", "etag", "optimistic-locking", "http"],
  companies: ["Atlassian", "Microsoft", "Amazon", "Salesforce", "SAP", "Adobe", "Google"],
  a: `<p>The <strong>lost update</strong> problem: Asha and Ravi both open the same customer record. Asha changes the phone number and saves. Ravi, whose screen still shows the old data, changes the address and saves. Ravi's PUT sends the whole record, including the <em>old</em> phone number, and silently undoes Asha's change. Nobody gets an error.</p>
<pre><code>09:00  Asha   GET /customers/7      -&gt; {phone: "111", address: "Pune"}
09:00  Ravi   GET /customers/7      -&gt; {phone: "111", address: "Pune"}
09:01  Asha   PUT /customers/7  {phone: "222", address: "Pune"}      200
09:02  Ravi   PUT /customers/7  {phone: "111", address: "Mumbai"}    200
              -&gt; phone is back to "111". Asha's change is gone.</code></pre>
<p><strong>HTTP already has the fix: conditional requests.</strong> The server gives every version of the resource an <code>ETag</code> (a version tag). The client sends it back in <code>If-Match</code> when saving. If the resource has changed since the client read it, the tags no longer match and the server refuses with <strong>412 Precondition Failed</strong>.</p>
<pre><code>GET /customers/7
200 OK
ETag: "v5"
{ "phone": "111", "address": "Pune" }

PUT /customers/7            (Asha)
If-Match: "v5"
200 OK        ETag: "v6"     &lt;- version moved on

PUT /customers/7            (Ravi, still holding v5)
If-Match: "v5"
412 Precondition Failed      &lt;- nothing written. Ravi's client reloads,
                                shows him the new phone, and he re-applies
                                his address change on top of it.</code></pre>
<pre><code>// Server side: JPA's @Version column is the natural ETag
@Entity
class Customer {
    @Id Long id;
    @Version long version;                 // Hibernate increments it on every update
    String phone, address;
}

@GetMapping("/customers/{id}")
ResponseEntity&lt;CustomerDto&gt; get(@PathVariable long id) {
    Customer c = repo.findById(id).orElseThrow(NotFound::new);
    return ResponseEntity.ok().eTag("\\"" + c.getVersion() + "\\"").body(CustomerDto.from(c));
}

@PutMapping("/customers/{id}")
@Transactional
ResponseEntity&lt;CustomerDto&gt; put(@PathVariable long id,
                                @RequestHeader(value = "If-Match", required = false) String ifMatch,
                                @RequestBody CustomerDto body) {
    if (ifMatch == null) return ResponseEntity.status(428).build();   // Precondition Required
    Customer c = repo.findById(id).orElseThrow(NotFound::new);
    if (!ifMatch.equals("\\"" + c.getVersion() + "\\""))
        return ResponseEntity.status(412).build();
    c.setPhone(body.phone());
    c.setAddress(body.address());
    return ResponseEntity.ok().eTag("\\"" + (c.getVersion() + 1) + "\\"").body(CustomerDto.from(c));
}
// Two requests can still pass the check at the same instant. @Version is the
// real guard: the UPDATE runs "... where id=? and version=?", matches zero rows
// for the loser, and Hibernate throws OptimisticLockException. Map that to 412 too.</code></pre>
<table>
<tr><th>Status</th><th>Meaning here</th></tr>
<tr><td><strong>412</strong> Precondition Failed</td><td>Your copy is stale. Re-read and try again</td></tr>
<tr><td><strong>428</strong> Precondition Required</td><td>This endpoint requires If-Match. Stops clients that skip the check</td></tr>
<tr><td>304 Not Modified</td><td>The GET-side twin: <code>If-None-Match</code> with a current ETag means "your cached copy is still good"</td></tr>
<tr><td>409 Conflict</td><td>A business-level conflict (name taken). Not the right code for a version mismatch</td></tr>
</table>
<p><strong>Alternatives, and when they fit:</strong> PATCH with only the changed fields shrinks the problem (Ravi would only send the address) but does not remove it when two people edit the same field. Pessimistic locking ("Ravi is editing this record") suits long editing sessions in internal tools, but needs lock expiry. For most APIs, ETag plus <code>@Version</code> is the cheapest correct answer.</p>
<p><strong>The one-liner:</strong> "Optimistic concurrency over HTTP: return an ETag from the version column, require If-Match on writes, answer 412 when it is stale, and let <code>@Version</code> catch the race between the check and the write."</p>`
}
]);
