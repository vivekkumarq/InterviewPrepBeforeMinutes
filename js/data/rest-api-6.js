registerPrimer("rest-api", `<h3>The mental model: nouns in the URL, verbs in the method, outcome in the status</h3>
<p>A REST API exposes <strong>resources</strong> (things, named with nouns: orders, customers, invoices) at URLs, and uses the <strong>HTTP method</strong> to say what to do with them. The server answers with a <strong>status code</strong> that tells the client what happened before it even reads the body. If you keep those three jobs separate, most design questions answer themselves.</p>
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
<h3>Worked example: designing a small API from nothing</h3>
<p>Requirement: "Library members can borrow books, return them, and see their current loans."</p>
<pre><code>Step 1: find the NOUNS.  books, members, loans   (a loan is a thing, with its own id)
Step 2: map operations to methods on those nouns.

GET    /books?author=orwell&amp;available=true      search the catalogue      200
GET    /books/{isbn}                              one book                  200 / 404
POST   /members/{id}/loans    {"isbn": "..."}     borrow a book             201 + Location
GET    /members/{id}/loans?status=active          a member's loans          200
POST   /loans/{loanId}/return                     return it                 200
GET    /loans/{loanId}                            one loan                  200 / 404

Step 3: decide the failure cases BEFORE writing code.
  book already on loan         409 Conflict
  member has 5 books out       422 Unprocessable Content (a business rule failed)
  loan belongs to someone else 404 (do not reveal that it exists)
  not logged in                401        logged in, not a librarian   403</code></pre>
<p><strong>Why <code>POST /loans/{id}/return</code> and not <code>DELETE /loans/{id}</code>?</strong> Returning a book does not delete the loan: the history must survive for fines and reports. When an action does not map cleanly onto create, read, update or delete, a POST to a sub-resource named after the action is the honest choice.</p>
<h3>The method table that most questions rely on</h3>
<table>
<tr><th>Method</th><th>Use</th><th>Safe</th><th>Idempotent</th></tr>
<tr><td>GET</td><td>Read</td><td>Yes</td><td>Yes</td></tr>
<tr><td>POST</td><td>Create, or trigger an action</td><td>No</td><td>No (make it so with an idempotency key)</td></tr>
<tr><td>PUT</td><td>Replace the whole resource</td><td>No</td><td>Yes</td></tr>
<tr><td>PATCH</td><td>Change some fields</td><td>No</td><td>Not guaranteed</td></tr>
<tr><td>DELETE</td><td>Remove</td><td>No</td><td>Yes</td></tr>
</table>
<p><em>Safe</em> means it changes nothing on the server. <em>Idempotent</em> means doing it twice has the same effect as doing it once, which is what makes a request safe to retry after a timeout.</p>`);

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
