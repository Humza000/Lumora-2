import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Full journeys against a seeded dev DB:
//   npm run db:seed && npm run dev > .e2e-dev.log 2>&1   (or let Playwright start it)
//   npm run test:e2e
// Without RESEND_API_KEY, emails are printed to the dev server log; we read the
// verification link from there (path configurable with E2E_DEV_LOG).

const DEV_LOG = process.env.E2E_DEV_LOG ?? ".e2e-dev.log";
const ADMIN = { email: process.env.ADMIN_EMAIL ?? "admin@lumoradesign.uk", password: process.env.ADMIN_PASSWORD ?? "" };
const run = Date.now();
const client = { name: "E2E Tester", email: `e2e+${run}@example.com`, password: "E2eTestPass123", business: `E2E Bakery ${run}` };
let createdInvoiceId = "";
let createdProjectPath = "";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

/** Poll the dev log for the latest email to `email` and return its link to `path`. */
async function emailLink(email: string, path: "verify-email" | "reset-password") {
  const pattern = new RegExp(`(http://\\S+/${path}\\?token=[^\\s"]+)`);
  for (let i = 0; i < 20; i++) {
    const log = readFileSync(DEV_LOG, "utf8");
    const idx = log.lastIndexOf(`To: ${email}`);
    if (idx !== -1) {
      const m = log.slice(idx).match(pattern);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No ${path} email for ${email} in ${DEV_LOG}`);
}
let verifyLink = "";

test.describe.serial("Lumora end-to-end", () => {
  test("public site renders portfolio", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("convert");
    await expect(page.getByRole("link", { name: /Northline Plumbing & Heating/ }).first()).toBeAttached();
    await page.goto("/portfolio");
    await expect(page.getByRole("link", { name: /Miso House/ }).first()).toBeAttached();
    await expect(page.getByText("Peak Performance Gym")).toHaveCount(0); // retired entry hidden
    await page.goto("/portfolio/maison-co");
    await expect(page.getByRole("heading", { level: 1, name: "Maison & Co Interiors" })).toBeVisible();
    for (const h of ["Who it's for", "The challenge", "What we did", "Key features", "What we delivered"]) {
      await expect(page.getByRole("heading", { name: h })).toBeAttached();
    }
    // No fabricated results/testimonial sections unless entered in admin
    await expect(page.getByText("Results", { exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: /Next project/ }).click();
    await expect(page).toHaveURL(/\/portfolio\/miso-house$/);
  });

  test("quote requires an account: signup → verify → wizard → submit", async ({ page }) => {
    await page.goto("/quote");
    await expect(page).toHaveURL(/\/signup\?next=%2Fquote/);

    await page.getByLabel("Your name").fill(client.name);
    await page.getByLabel("Email").fill(client.email);
    await page.getByLabel("Password").fill(client.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/check-email/);

    // Unverified users can't use the wizard
    await page.goto("/quote");
    await expect(page).toHaveURL(/\/check-email/);

    verifyLink = await emailLink(client.email, "verify-email");
    expect(verifyLink).toContain("next=%2Fquote"); // sends them back to where they started
    await page.goto(verifyLink);
    await expect(page).toHaveURL(/\/quote$/);

    // Step 1: project type
    await page.getByText("Business website").click();
    await expect(page.getByText(/£\d/).first()).toBeVisible();
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 2: pages & features
    await page.getByLabel("How many pages?").fill("7");
    await page.getByText("Online booking / appointments").click();
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 3: design
    await page.getByText("Fully bespoke design").click();
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 4: timeline & budget (budget required)
    await page.getByRole("button", { name: "Continue →" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("budget");
    await page.getByText("£2,500 – £5,000").click();
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 5: business
    await page.getByLabel("Business name *").fill(client.business);
    await page.getByLabel(/What do you want the website to achieve/).fill("More online orders and catering enquiries.");
    await page.getByRole("button", { name: "Continue →" }).click();
    // Review + submit
    await expect(page.getByText(client.business)).toBeVisible();
    await page.getByRole("button", { name: "Submit quote request" }).click();
    await expect(page).toHaveURL(/\/quote\/thanks/);
    await expect(page.getByRole("heading", { name: /got your request/ })).toBeVisible();

    // Clicking the verification link again is harmless, not an "invalid link" error
    await page.goto(verifyLink);
    await expect(page).toHaveURL(/\/quote$/);

    // Client can't reach admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.getByRole("heading", { name: "We're reviewing your quote" })).toBeVisible();
  });

  test("forgot password → reset link → logged in; used links fail safely", async ({ page }) => {
    // Logged out, an already-used verification link points to login rather than an error
    await page.goto(verifyLink);
    await expect(page).toHaveURL(/\/login\?verified=1/);
    await expect(page.getByText("Your email is verified")).toBeVisible();

    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await page.getByLabel("Email").fill(client.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/If an account exists/)).toBeVisible();

    const resetLink = await emailLink(client.email, "reset-password");
    await page.goto(resetLink);
    await page.getByLabel("New password").fill("short");
    await page.getByLabel("Confirm password").fill("short");
    await page.getByRole("button", { name: /Save password/ }).click();
    await expect(page.getByText("Use at least 10 characters")).toBeVisible();

    client.password = "E2eResetPass456";
    await page.getByLabel("New password").fill(client.password);
    await page.getByLabel("Confirm password").fill(client.password);
    await page.getByRole("button", { name: /Save password/ }).click();
    await expect(page).toHaveURL(/\/portal$/);

    // Reset links are single use
    await page.goto(resetLink);
    await expect(page.getByRole("heading", { name: "Link expired" })).toBeVisible();
  });

  test("admin accepts quote → project; posts update; invoices; hosting", async ({ page }) => {
    test.skip(!ADMIN.password, "ADMIN_PASSWORD not set");
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin$/);

    // Quote review → accept
    await page.goto("/admin/quotes");
    await page.getByRole("link", { name: client.name }).first().click();
    await expect(page.getByText(client.business).first()).toBeVisible();
    await page.getByRole("button", { name: "Accept & create project" }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/\w+/);
    await expect(page.getByText("Discovery & planning")).toBeVisible();
    const projectUrl = page.url();
    createdProjectPath = new URL(projectUrl).pathname.replace("/admin/", "/portal/");

    // Progress a milestone and post an update
    await page.getByLabel("Milestone status").first().selectOption("DONE");
    await expect(page.getByText(/Done \d/).first()).toBeVisible();
    await page.getByLabel("Post an update").fill("Kick-off call booked for Monday.");
    await page.getByRole("button", { name: "Post update" }).click();
    await expect(page.getByText("Update posted")).toBeVisible();

    // Create invoice for the project
    await page.getByRole("link", { name: "New", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/invoices\/new/);
    await page.getByLabel("Description").fill("Website deposit (50%)");
    await page.getByLabel("Unit price").fill("1250.00");
    await page.getByLabel("VAT").selectOption("20");
    await expect(page.getByText("£1,500.00").first()).toBeVisible(); // 1250 + 20% VAT
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page).toHaveURL(/\/admin\/invoices\/\w+$/);
    await expect(page.getByText("This is a draft")).toBeVisible();
    await page.getByRole("button", { name: "Send to client" }).click();
    await expect(page.getByText(/Invoice LUM-\d{4}-\d{4} sent/)).toBeVisible();

    // PDF renders
    const invoiceId = new URL(page.url()).pathname.split("/").pop();
    createdInvoiceId = invoiceId ?? "";
    const pdf = await page.request.get(`/api/invoices/${invoiceId}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");

    // Hosting plan
    await page.goto(projectUrl);
    await page.getByRole("link", { name: "Add", exact: true }).click();
    await page.getByLabel("Domain").fill(`e2e-${run}.example`);
    await page.getByLabel("Hosting provider").fill("Vercel");
    await page.getByLabel("Next renewal date").fill(new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Add plan" }).click();
    await expect(page).toHaveURL(/\/admin\/hosting\/\w+$/);
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: `e2e-${run}.example` })).toBeVisible(); // in renewals widget
  });

  test("client sees timeline, update and invoice; cannot see other clients' data", async ({ page }) => {
    test.skip(!ADMIN.password, "depends on admin test");
    await login(page, client.email, client.password);
    await expect(page).toHaveURL(/\/portal$/);
    await page.getByRole("link", { name: /E2E Bakery/ }).first().click();
    await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
    await expect(page.getByText("Kick-off call booked for Monday.")).toBeVisible();
    await expect(page.getByText("20%")).toBeVisible(); // 1 of 5 milestones done

    // Logged in on this tab: the header link goes to the portal instead of asking again
    await page.goto("/");
    await expect(page.getByRole("link", { name: "My portal" }).first()).toBeVisible();

    // A new tab must log in itself, even though the session cookie is shared…
    const other = await page.context().newPage();
    await other.goto("/portal/invoices");
    await expect(other).toHaveURL(/\/login\?next=%2Fportal%2Finvoices/);
    await expect(other.getByRole("heading", { name: "Log in" })).toBeVisible();
    await other.close();

    // …and the original tab stays signed in
    await page.goto("/portal/invoices");
    await page.getByRole("link", { name: /LUM-/ }).first().click();
    await expect(page.getByText("£1,500.00").first()).toBeVisible();
    // No Stripe keys locally → friendly error rather than a crash
    await page.getByRole("button", { name: /Pay £1,500.00 now/ }).click();
    await expect(page.locator("p[role=alert]")).toContainText(/Online payments aren't available|can't be paid/);

    // The seeded demo client's project must not be visible
    await page.goto("/portal/projects");
    await expect(page.getByText("Demo Coffee Co.")).toHaveCount(0);
  });

  test("another client cannot open the e2e client's invoice or project", async ({ page }) => {
    test.skip(!createdInvoiceId, "depends on admin test");
    await login(page, "demo.client@example.com", "DemoClient123");
    await expect(page).toHaveURL(/\/portal$/);
    expect((await page.request.get(`/api/invoices/${createdInvoiceId}/pdf`)).status()).toBe(404);
    await page.goto(`/portal/invoices/${createdInvoiceId}`);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.goto(createdProjectPath);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.goto("/admin/clients");
    await expect(page).toHaveURL(/\/portal$/);
  });
});
