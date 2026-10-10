registerSimple("spring-boot", {
"How do you write your own Spring Boot starter?":
`A starter lets other teams add a feature just by adding one dependency, the way you add spring-boot-starter-web. You write an auto-configuration class that creates the needed beans only when it makes sense (using conditions like "only if the user has not defined their own"), list it in a special file so Boot finds it, and bundle its dependencies into a starter module.`,

"How do you test auto-configuration with ApplicationContextRunner?":
`<code>ApplicationContextRunner</code> starts a tiny Spring context with just the configuration you want to test, in milliseconds, with no web server or database. You can set properties, add or remove beans, and then check whether your auto-configuration created a bean or correctly stayed out of the way.`,

"What is the difference between application.properties, application.yml and profiles-specific files?":
`<code>application.properties</code> and <code>application.yml</code> hold the same settings in two formats: one key per line, or indented YAML. Files like <code>application-prod.yml</code> hold settings only for the "prod" profile and override the shared ones when that profile is active.`,

"How does Spring Boot logging work and how do you configure it?":
`Spring Boot sends all logging through SLF4J and, by default, prints it with Logback. You set log levels per package in <code>application.yml</code>, such as <code>logging.level.com.shop=DEBUG</code>. In production, log as structured JSON with a request id on every line, so logs are easy to search.`,

"What is @ConfigurationProperties with validation and constructor binding?":
`<code>@ConfigurationProperties</code> loads a whole group of related settings, such as everything under <code>payment.*</code>, into one typed class. Adding validation annotations like <code>@NotBlank</code> makes the app refuse to start if a setting is missing or wrong, so mistakes are caught at deploy time instead of in the middle of the night.`,

"How do you customise the Jackson ObjectMapper in Spring Boot?":
`Jackson is the library that turns Java objects into JSON and back. Rather than replacing it completely, change just what you need, either with <code>spring.jackson.*</code> settings or a small customiser bean. Replacing the whole ObjectMapper throws away the sensible setup Spring Boot already gave you.`,

"How do you implement file upload and download in Spring Boot?":
`Accept uploads as a <code>MultipartFile</code> in a controller and return downloads as a resource with the right headers. The important part is safety: limit file size, check the real file type, never use the user's file name directly as a path on disk, and stream large files instead of loading them all into memory.`,

"What are the Spring Boot Actuator health indicators and Kubernetes probes?":
`Actuator reports whether your app is healthy. Kubernetes asks two questions. <b>Liveness</b>: is the app stuck and in need of a restart? <b>Readiness</b>: is it ready to receive traffic? Never include the database in the liveness check, or a short database blip makes Kubernetes restart every instance at once.`,

"How do you expose custom metrics with Micrometer?":
`Micrometer lets you record your own numbers, such as orders placed or payment time, using counters, timers and gauges, and sends them to a monitoring system like Prometheus. Be careful with labels (tags): adding one with a user id or order id creates a separate series for every value and can overload the monitoring system.`,

"How do you handle CORS, filters and interceptors in Spring Boot?":
`<b>CORS</b> settings decide which websites' browser code may call your API. A <b>filter</b> runs around every request at the web-server level, good for things like logging or authentication. An <b>interceptor</b> runs inside Spring MVC and knows which controller method will handle the request. Pick the layer that has the information you need.`,

"Walk me through what happens when a Spring Boot application starts":
`<code>main()</code> calls <code>SpringApplication.run</code>. Boot works out what kind of app it is, loads settings from files and the environment, creates the Spring container, registers your beans, applies auto-configuration to fill the gaps, creates all the beans, starts the embedded web server, and finally marks the app as ready.`,

"How do you handle a 404 and other errors for both REST and MVC in one application?":
`Use a <code>@ControllerAdvice</code> to turn exceptions into proper error responses: JSON for API calls and an error page for browser pages. One catch: by default an unknown URL is not thrown as an exception, so your advice never sees it. You have to configure Spring to throw it, or handle it on the <code>/error</code> page.`,

"What is the difference between @RestController and @Controller, and how does @ResponseBody work?":
`A <code>@Controller</code> returns the name of a web page to show. A <code>@RestController</code> returns data, usually turned into JSON, because it adds <code>@ResponseBody</code> to every method. That annotation tells Spring to write the return value straight into the response using a converter such as Jackson.`,

"How do you implement retry and circuit breaking in a Spring Boot service?":
`When calling another service, <b>retry</b> tries again after a short wait if the failure is temporary, such as a timeout. A <b>circuit breaker</b> stops calling a service that keeps failing, so you fail fast and give it time to recover. Libraries such as Resilience4j add both with annotations. Only retry calls that are safe to repeat.`,

"How do you expose and secure Actuator endpoints in production?":
`Expose only what you need, usually <code>health</code>, <code>info</code> and <code>prometheus</code>, and put the rest behind authentication or on a separate internal port. Endpoints like <code>env</code> and <code>heapdump</code> can reveal passwords and private data if left open.`,

"What is the difference between application.properties and bootstrap.properties?":
`<code>bootstrap.properties</code> was used by older Spring Cloud apps to load settings needed before the main configuration, such as where the config server is. In current versions you instead write <code>spring.config.import</code> in the normal <code>application.yml</code>, so bootstrap files are now legacy.`,

"How do you handle request validation and return meaningful field-level errors?":
`Add rules like <code>@NotBlank</code> and <code>@Email</code> to your request class and put <code>@Valid</code> on the controller parameter. When validation fails, catch the error in a <code>@ControllerAdvice</code> and return a 400 response listing each field and what is wrong with it, so the user knows exactly what to fix.`,

"How do you write integration tests that do not slow the build to a crawl?":
`Starting Spring is the slow part, and Spring caches a started context between test classes only if their configuration is identical. So keep test configuration consistent, avoid many different mocks that force new contexts, use smaller "slice" tests where possible, and reuse one database container across tests.`,

"How do you externalise configuration, and what is the property precedence order?":
`Keep settings outside your code so the same build runs everywhere. Spring Boot reads them from many places, and the higher-priority source wins: command-line arguments beat environment variables, which beat profile files, which beat the default <code>application.yml</code>. That is how you override a setting per environment without rebuilding.`,

"How do you design error handling for a Spring Boot REST API?":
`Turn every error into a consistent JSON response with the right HTTP status: 400 for bad input, 401 when not logged in, 403 when not allowed, 404 when not found, 409 for conflicts, and 500 for unexpected errors. Handle it all in one <code>@RestControllerAdvice</code>, include a trace id, and never show internal details such as stack traces.`,

"What does Actuator give you, and how do you make a Spring Boot service production-ready?":
`Actuator adds endpoints for health checks, metrics and app information. Production-ready also means: separate liveness and readiness checks, metrics sent to a monitoring system, structured logs with trace ids, graceful shutdown so requests in progress finish, sensible timeouts, and secrets kept out of the code.`,

"How do you add observability — traces, metrics and correlated logs — to a Spring Boot service?":
`Observability means being able to see what your service is doing. <b>Metrics</b> show trends (requests per second, error rate), <b>traces</b> follow one request across services, and <b>logs</b> give the detail. The key is putting the same trace id in all three, so you can go from an alert straight to the exact failing request.`,

"How would you add an LLM feature to a Spring Boot service, and what breaks?":
`You call an AI model's API from a service, often with a library such as Spring AI. What breaks: responses take seconds, answers can vary, costs grow with usage, and users may try to trick the model. So stream the response, ask for structured output and validate it, set timeouts and limits, and never trust the model's output blindly.`,

"Walk me through what happens between main() and the first request being served":
`Boot decides the app type, loads settings, creates the Spring container, registers and creates all beans (yours plus auto-configured ones), starts the embedded web server, runs any startup runners, and then reports itself as ready. Only after that does the server start accepting requests.`,

"How do you make a Spring Boot service production-ready?":
`Add health checks, metrics, tracing and structured logs; set timeouts on every outgoing call; turn on graceful shutdown; size connection pools and memory properly; keep secrets in environment variables or a vault; and use database migrations. Then the service can be monitored, scaled and debugged in production.`,

"Call another service from Spring Boot with RestClient: timeouts, retries and error mapping":
`<code>RestClient</code> makes HTTP calls to other services. Always set a connect timeout and a read timeout, or one slow service can freeze yours. Turn errors into clear exceptions, retry only calls that are safe to repeat when the failure is temporary, and add a circuit breaker so a dead service is skipped quickly.`,

"Your Spring Boot app will not start. Read these errors and fix each one":
`When startup fails, Spring Boot prints a block titled "APPLICATION FAILED TO START" explaining what went wrong; read that first. The common causes: a bean that cannot be found (often a package scanning problem), missing database settings, a port already in use, a missing property, two beans depending on each other, or two beans of the same type.`,

"What is Spring Boot and what problem does it solve?":
`Spring Boot sits on top of the Spring Framework and removes most of the setup work. Instead of configuring a web server, database connection and JSON handling by hand, you add starters and Boot configures sensible defaults automatically, so you can build and run an application in minutes.`,

"How does @SpringBootApplication work?":
`<code>@SpringBootApplication</code> is three annotations in one: <code>@Configuration</code> (this class can define beans), <code>@EnableAutoConfiguration</code> (let Boot set things up automatically) and <code>@ComponentScan</code> (find my classes). The scan starts from this class's package, so it should sit at the top of your packages.`,

"How does auto-configuration actually work internally?":
`Spring Boot includes a list of auto-configuration classes. At startup it checks each class's conditions: is a certain library present, is a property set, has the user already created this bean? It only applies the ones whose conditions are true, which is how adding a library "just works" and your own beans take priority.`,

"What are starter dependencies?":
`A starter is a single dependency that pulls in a tested set of libraries for one purpose. <code>spring-boot-starter-web</code> brings Spring MVC, JSON support, validation and an embedded Tomcat, all at versions known to work together, so you do not have to pick each one yourself.`,

"How do you handle exceptions globally in a Spring Boot REST API?":
`Write one class marked <code>@RestControllerAdvice</code> with <code>@ExceptionHandler</code> methods for each kind of error. Each handler turns an exception into a clean JSON response with the right status code. Controllers then stay simple, and every error looks the same to the client.`,

"What is Spring Boot Actuator and which endpoints matter in production?":
`Actuator adds ready-made endpoints that let you check your running app. The most useful: <code>health</code> (is it working, used by Kubernetes), <code>metrics</code> and <code>prometheus</code> (numbers for monitoring), and <code>info</code> (version details). Keep sensitive ones such as <code>env</code> and <code>heapdump</code> private.`,

"How does Spring Boot externalised configuration and property precedence work?":
`Settings can come from many places: files inside the jar, files next to it, environment variables, command-line arguments and more. They are ranked, and a higher-ranked source overrides a lower one. Command-line arguments and environment variables sit near the top, so you can change a setting at deploy time without rebuilding.`,

"What is the embedded server and how do you configure or replace it?":
`Spring Boot puts the web server (Tomcat by default) inside your application, so it runs with just <code>java -jar app.jar</code> and no separate server installation. You configure it with settings like <code>server.port</code>, and can swap it for Jetty or Undertow by changing the starter dependency.`,

"How do you handle validation in Spring Boot?":
`Add the validation starter, put rules such as <code>@NotNull</code>, <code>@Size</code> and <code>@Email</code> on your request fields, and add <code>@Valid</code> to the controller parameter. Invalid requests are rejected automatically with a 400 error. You can also write your own validation rules for special cases.`,

"Explain @RestController, @RequestMapping and parameter binding annotations":
`<code>@RestController</code> marks a class that handles web requests and returns data. <code>@RequestMapping</code> (and shortcuts like <code>@GetMapping</code>) maps a URL to a method. Parameter annotations pull data from the request: <code>@PathVariable</code> from the URL path, <code>@RequestParam</code> from the query string, <code>@RequestBody</code> from the JSON body.`,

"How do you write tests in Spring Boot? @SpringBootTest vs slice tests":
`<code>@SpringBootTest</code> starts the whole application, which is realistic but slow. Slice tests start only one layer: <code>@WebMvcTest</code> for controllers, <code>@DataJpaTest</code> for repositories. Plain unit tests with no Spring at all are fastest and should be the majority.`,

"How do you implement caching in Spring Boot?":
`Turn caching on with <code>@EnableCaching</code> and put <code>@Cacheable</code> on a method, and Spring remembers its result for each set of arguments. Use a real cache library such as Caffeine or Redis with a size limit and an expiry time, and remember that calls within the same class skip the cache.`,

"What is @Async and how do you configure it properly?":
`<code>@Async</code> makes a method run on a background thread, so the caller does not wait. Turn it on with <code>@EnableAsync</code>, define your own thread pool rather than relying on the default, and return a <code>CompletableFuture</code> if the caller needs the result. Like other proxy features, it does not work for calls within the same class.`,

"What is the difference between Spring MVC and WebFlux?":
`<b>Spring MVC</b> gives each request its own thread, which waits while calling databases or other services; it is simple and fits most apps. <b>WebFlux</b> is non-blocking: a few threads juggle many requests and never wait, which helps with huge numbers of connections but makes code harder to write. With virtual threads, MVC now covers most cases.`,

"How do you make a Spring Boot application start faster and use less memory?":
`Remove starters and libraries you do not use, turn on lazy initialisation, use Class Data Sharing to reuse startup work, and size memory correctly. For the biggest gains, compile to a native image with GraalVM, which starts almost instantly and uses much less memory.`,

"How would you structure a Spring Boot project?":
`Group code by feature (orders, payments, users) rather than by layer (all controllers together, all services together). A change to "orders" then touches one folder, and you can keep internal classes hidden inside their feature. Keep the main application class at the top of the package tree.`,

"How do you implement pagination and sorting?":
`Accept a <code>Pageable</code> in your controller (filled from <code>?page=0&amp;size=20&amp;sort=name</code>) and pass it to a Spring Data repository, which returns one page of results. A <code>Page</code> also counts all rows, which costs an extra query; use a <code>Slice</code> if you only need to know whether there is a next page.`,

"How do you version and document a Spring Boot API?":
`The most common way to version is in the URL, such as <code>/api/v1/orders</code>, keeping the old version alive while clients move to the new one. For documentation, springdoc-openapi generates an OpenAPI description and a Swagger UI page from your controllers automatically.`,

"What is Spring Boot DevTools and what does it do?":
`DevTools speeds up development. It restarts your app automatically when you change code (faster than a full restart because libraries are not reloaded), refreshes the browser, and turns off caching so you see changes immediately. It is switched off automatically in production.`,

"How do you handle database migrations in Spring Boot?":
`Use a migration tool such as Flyway or Liquibase. You write numbered SQL scripts (V1, V2, ...) and the tool runs any new ones at startup and records which have run, so every environment's database ends up the same. Do not let Hibernate change production tables automatically.`
});
