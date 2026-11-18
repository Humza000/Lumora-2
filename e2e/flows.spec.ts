import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import Stripe from "stripe";

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
let createdPlanId = "";

/** Posts a Stripe event to the webhook, signed with STRIPE_WEBHOOK_SECRET exactly as Stripe would. */
async function stripeEvent(page: Page, type: string, object: Record<string, unknown>) {
  const payload = JSON.stringify({ id: `evt_${type}_${Date.now()}`, object: "event", type, data: { object } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  const res = await page.request.post("/api/stripe/webhook", { data: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
  expect(res.status()).toBe(200);
}
let createdProjectPath = "";
let createdQuoteUrl = "";

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

    // Step 1: project type (starting prices)
    await expect(page.getByText("From £400")).toBeVisible(); // web app is not capped below e-commerce
    await page.getByText("E-commerce store").click();
    await page.getByText("Business website").click();
    await expect(page.locator("aside").getByText("From £100")).toBeVisible();
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 2: pages & features change with the project type; features never change the price
    await expect(page.getByText("Shopping cart")).toHaveCount(0);
    await page.getByLabel("How many pages?").fill("7");
    await page.getByText("Booking functionality").click();
    await page.getByText("Google Maps").click();
    await page.getByLabel("Anything else you need?").fill("Integration with our catering order system");
    await expect(page.locator("aside").getByText("From £100")).toBeVisible();
    await expect(page.locator("aside").getByText(/may need a custom quote/)).toBeVisible();
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 3: hosting & care (a choice is required)
    await page.getByRole("button", { name: "Continue →" }).click();
    await expect(page.locator("p[role=alert]")).toContainText("hosting");
    await page.getByText("Standard care").click();
    await expect(page.locator("aside").getByText("£10/month")).toBeVisible();
    // Yearly billing is cheaper; switch back to monthly for the rest of the journey
    await page.getByRole("radio", { name: "Yearly", exact: true }).click();
    await expect(page.locator("aside").getByText("£100/year")).toBeVisible();
    await expect(page.locator("aside").getByText("You save £20 a year")).toBeVisible();
    await page.getByRole("radio", { name: "Monthly", exact: true }).click();
    await expect(page.locator("aside").getByText("£10/month")).toBeVisible();
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 4: business
    await page.getByLabel("Business name *").fill(client.business);
    await page.getByLabel(/What do you want the website to achieve/).fill("More online orders and catering enquiries.");
    await page.getByRole("button", { name: "Continue →" }).click();
    // Step 5: review with separate one-time and monthly totals
    await expect(page.getByText(client.business)).toBeVisible();
    await expect(page.getByText("Google Maps, Booking functionality")).toBeVisible();
    await expect(page.getByText("Integration with our catering order system").first()).toBeVisible();
    await expect(page.getByText("One-time development cost")).toBeVisible();
    await expect(page.getByText("Monthly hosting cost")).toBeVisible();
    await expect(page.getByText("This is an indicative estimate. We'll review your requirements").first()).toBeVisible();
    await page.getByRole("button", { name: "Submit quote request" }).click();
    await expect(page).toHaveURL(/\/quote\/thanks/);
    await expect(page.getByRole("heading", { name: /got your request/ })).toBeVisible();
    await expect(page.getByText("From £100")).toBeVisible(); // matches what was shown in the wizard
    await expect(page.getByText("£10/month")).toBeVisible();

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

  test("quote: admin sends → client requests changes → declines → accepts (deposit) → waits for payment → work starts", async ({ page, browser }) => {
    test.skip(!ADMIN.password, "ADMIN_PASSWORD not set");
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin$/);

    // Admin confirms the details and sends the quote
    await page.goto("/admin/quotes");
    await page.getByRole("link", { name: client.name }).first().click();
    await expect(page).toHaveURL(/\/admin\/quotes\/\w+$/);
    await expect(page.getByText(client.business).first()).toBeVisible();
    const quoteUrl = page.url();
    createdQuoteUrl = quoteUrl;
    await expect(page.getByLabel("Project price (£)")).toHaveValue("100.00"); // what the wizard showed
    await expect(page.getByLabel("Hosting & care plan")).toHaveValue("hosting_standard");
    await page.getByLabel("Project price (£)").fill("3000");
    await page.getByLabel("Message to the client").fill("Thanks for the details. Here is your confirmed price.");
    await page.getByRole("button", { name: "Send quote to client" }).click();
    await expect(page.getByText(`${client.email} has been emailed a link`)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Waiting for the client" })).toBeVisible();
    expect(readFileSync(DEV_LOG, "utf8")).toContain("Subject: Your quote from Lumora is ready");

    // Client (own browser session) sees it as their next step, reads it and declines
    const ctx = await browser.newContext();
    const c = await ctx.newPage();
    await login(c, client.email, client.password);
    await expect(c.getByRole("heading", { name: "Your quote is ready" })).toBeVisible();
    await c.getByRole("link", { name: "View your quote" }).click();
    await expect(c).toHaveURL(/\/portal\/quotes\/\w+$/);
    await expect(c.getByText("£3,000.00", { exact: true })).toBeVisible();
    await expect(c.getByText("Hosting (Standard care, £10/month) only starts when your site goes live.")).toBeVisible();
    await expect(c.getByText("Here is your confirmed price.")).toBeVisible();
    await expect(c.getByText("Pay in full: £3,000.00")).toBeVisible();
    await expect(c.getByText("Pay a 50% deposit: £1,500.00")).toBeVisible();
    await expect(c.getByText("Work starts as soon as that invoice is paid.")).toBeVisible();

    // Request changes: the wizard opens with their answers; they edit one and say what they want
    await c.getByRole("link", { name: "Request changes" }).click();
    await expect(c).toHaveURL(/\/quote\?changes=\w+$/);
    await expect(c.getByRole("heading", { name: "Change your quote" })).toBeVisible();
    await c.getByRole("button", { name: "Continue →" }).click();
    await expect(c.getByLabel("How many pages?")).toHaveValue("7");
    await c.getByLabel("How many pages?").fill("9");
    for (let i = 0; i < 3; i++) await c.getByRole("button", { name: "Continue →" }).click();
    await c.getByRole("button", { name: "Send changes for review" }).click();
    await expect(c.locator("p[role=alert]")).toContainText("what you'd like changed"); // a note is required
    await c.getByLabel("What would you like changed?").fill("Two more pages for our catering menus, please.");
    await c.getByRole("button", { name: "Send changes for review" }).click();
    await expect(c).toHaveURL(/\/portal\/quotes\/\w+\?changes=1/);
    await expect(c.getByText(/we've got your changes/)).toBeVisible();
    await expect(c.getByRole("button", { name: "Accept quote" })).toHaveCount(0); // not acceptable while we re-price it

    // Admin sees the note and exactly what changed, re-prices and sends it again
    await page.goto(quoteUrl);
    await expect(page.getByRole("heading", { name: "Client requested changes" })).toBeVisible();
    await expect(page.getByText("Two more pages for our catering menus, please.")).toBeVisible();
    await expect(page.locator("dd", { hasText: /7\s*→\s*9/ })).toBeVisible();
    expect(readFileSync(DEV_LOG, "utf8")).toContain(`Subject: Changes requested by ${client.name}`);
    await page.getByLabel("Project price (£)").fill("3200");
    await page.getByRole("button", { name: "Send updated quote" }).click();
    await expect(page.getByText(`${client.email} has been emailed a link`)).toBeVisible();

    // Client declines the updated quote
    await c.reload();
    await expect(c.getByText("£3,200.00", { exact: true })).toBeVisible();
    await c.getByRole("link", { name: "Decline quote" }).click();
    await c.getByLabel("Reason (optional)").fill("A bit over my budget.");
    await c.getByRole("button", { name: "Yes, decline quote" }).click();
    await expect(c.getByText("You've declined this quote")).toBeVisible();
    await expect(c.getByRole("button", { name: "Accept quote" })).toHaveCount(0);
    await c.goto("/portal/projects");
    await expect(c.getByRole("link", { name: /E2E Bakery/ })).toHaveCount(0); // declining creates nothing

    // Admin sees the reason, lowers the price, asks for a deposit and sends it again
    await page.goto(quoteUrl);
    await expect(page.getByRole("heading", { name: "Declined by the client" })).toBeVisible();
    await expect(page.getByText("A bit over my budget.")).toBeVisible();
    expect(readFileSync(DEV_LOG, "utf8")).toContain(`Subject: Quote declined by ${client.name}`);
    await page.getByLabel("Project price (£)").fill("2500");
    await page.getByRole("button", { name: "Send updated quote" }).click();
    await expect(page.getByText(`${client.email} has been emailed a link`)).toBeVisible();
    // While it's with the client it can't be accepted on their behalf, only withdrawn
    await expect(page.getByRole("button", { name: "Withdraw quote" })).toBeVisible();

    // Client accepts → lands on the new project, with the deposit invoice issued automatically
    await c.goto("/portal/quotes");
    await expect(c.getByText("Awaiting your reply")).toBeVisible();
    await c.getByRole("link", { name: "View & respond" }).click();
    await expect(c.getByText("£2,500.00", { exact: true })).toBeVisible();
    await c.getByLabel(/Pay a 50% deposit: £1,250\.00/).check();
    await c.getByRole("button", { name: "Accept quote" }).click();
    await expect(c).toHaveURL(/\/portal\/projects\/\w+\?accepted=1/);
    await expect(c.getByText(/Quote accepted, thank you!/)).toBeVisible();
    await expect(c.getByText("Discovery & planning")).toBeVisible();
    // The project waits for the website payment before work starts
    await expect(c.getByText("Waiting for payment")).toBeVisible();
    await expect(c.getByRole("link", { name: /View & pay invoice LUM-\d{4}-\d{4} \(£1,250\.00\)/ })).toBeVisible();
    createdProjectPath = new URL(c.url()).pathname;
    const log = readFileSync(DEV_LOG, "utf8");
    expect(log).toMatch(/Subject: Quote accepted: E2E Tester|Subject: Quote accepted: E2E Bakery/);
    expect(log).toMatch(new RegExp(`To: ${client.email.replace(/[.+]/g, "\\$&")}\\s+\\[email:dev\\] Subject: Invoice LUM-`));
    // The accepted quote can't be answered twice
    await c.goBack();
    await c.reload();
    await expect(c.getByRole("button", { name: "Accept quote" })).toHaveCount(0);
    await expect(c.getByRole("link", { name: "View your project" })).toBeVisible();

    // Admin: the quote links to the project and the invoice
    await page.goto(quoteUrl);
    await expect(page.getByRole("heading", { name: "Accepted by the client" })).toBeVisible();
    await expect(page.getByText(/£1,250\.00, sent/)).toBeVisible();
    await expect(page.getByText("A 50% deposit now, balance before launch")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send (updated )?quote/ })).toHaveCount(0);

    // Payment received (here: marked paid by the admin) → the project starts automatically
    await page.goto(new URL(createdProjectPath.replace("/portal/", "/admin/"), page.url()).toString());
    await expect(page.getByText(/Waiting for payment of invoice/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as launched" })).toHaveCount(0); // can't launch unpaid work
    await page.getByRole("link", { name: /LUM-\d{4}-\d{4}/ }).first().click();
    await page.getByRole("button", { name: "Mark as paid" }).click();
    await expect(page.getByRole("button", { name: "Mark unpaid" })).toBeVisible();
    await c.goto(createdProjectPath);
    await expect(c.getByText("Payment received, thank you! Work on your website has started.")).toBeVisible();
    await expect(c.getByText("Waiting for payment")).toHaveCount(0);
    await expect(c.getByText("Planning", { exact: true })).toBeVisible();

    // Admin: the balance (the other 50%) is due before launch
    const adminProjectUrl = new URL(createdProjectPath.replace("/portal/", "/admin/"), page.url()).toString();
    await page.goto(adminProjectUrl);
    await expect(page.getByText(/balance of £1,250\.00 hasn.t been invoiced yet/)).toBeVisible();
    await expect(page.getByText("Send the balance invoice (£1,250.00) before launching.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as launched" })).toHaveCount(0);
    await page.getByRole("button", { name: "Create & send balance invoice" }).click();
    await expect(page.getByText(`Balance invoice sent to ${client.email}.`)).toBeVisible();
    await expect(page.getByText("£1,250.00 of the website price is still unpaid. Launch once it's paid.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create & send balance invoice" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mark as launched" })).toHaveCount(0);
    // The client is emailed, and the balance is paid (here: marked paid by the admin) → launch is possible
    await c.goto("/portal/invoices");
    await expect(c.getByRole("row", { name: /£1,250\.00/ })).toHaveCount(2); // deposit + balance
    await page.getByRole("link", { name: /LUM-\d{4}-\d{4}/ }).first().click();
    await expect(page.getByText("(balance)")).toBeVisible();
    await page.getByRole("button", { name: "Mark as paid" }).click();
    await expect(page.getByRole("button", { name: "Mark unpaid" })).toBeVisible();
    await page.goto(adminProjectUrl);
    await expect(page.getByRole("button", { name: "Mark as launched" })).toBeVisible();
    await ctx.close();
  });

  test("admin runs the project: posts update; invoices; hosting", async ({ page }) => {
    test.skip(!createdProjectPath, "depends on the quote test");
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin$/);
    const projectUrl = new URL(createdProjectPath.replace("/portal/", "/admin/"), page.url()).toString();
    await page.goto(projectUrl);
    await expect(page.getByText("Discovery & planning")).toBeVisible();

    // Progress a milestone and post an update
    await page.getByLabel("Milestone status").first().selectOption("DONE");
    await expect(page.getByText(/Done \d/).first()).toBeVisible();
    await page.getByLabel("Post an update").fill("Kick-off call booked for Monday.");
    await page.getByRole("button", { name: "Post update" }).click();
    await expect(page.getByText("Update posted")).toBeVisible();

    // Create invoice for the project
    await page.getByRole("link", { name: "New", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/invoices\/new/);
    // Pre-filled from what the client picked in the quote wizard
    await expect(page.getByLabel("Client (by email)")).toHaveValue(/.+/);
    await expect(page.locator("dd", { hasText: "Business website" })).toBeVisible();
    await expect(page.locator("dd", { hasText: "Standard care, £10/month" })).toBeVisible();
    await expect(page.getByLabel("Description").first()).toHaveValue("Business website: website design & build");
    await expect(page.getByLabel("Description").nth(1)).toHaveValue(/Standard care: hosting & care \(first month/);
    // Bill a deposit instead
    await page.getByLabel("Remove line").last().click();
    await page.getByLabel("Description").fill("Website deposit (50%)");
    await page.getByLabel("Unit price").fill("1250.00");
    await page.getByLabel("VAT").selectOption("20");
    await expect(page.getByText("£1,500.00").first()).toBeVisible(); // 1250 + 20% VAT
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page).toHaveURL(/\/admin\/invoices\/\w+$/);
    await expect(page.getByText("This is a draft")).toBeVisible();
    await page.getByRole("button", { name: "Send to client" }).click();
    await expect(page.getByText(/Invoice LUM-\d{4}-\d{4} sent/)).toBeVisible();
    await expect(page.getByText(`${client.email} has been emailed`)).toBeVisible();
    // The invoice shows what the client picked
    await expect(page.getByText("Package:")).toBeVisible();
    await expect(page.getByText("Standard care, billed monthly")).toBeVisible();
    expect(readFileSync(DEV_LOG, "utf8")).toMatch(new RegExp(`To: ${client.email.replace(/[.+]/g, "\\$&")}\\s+\\[email:dev\\] Subject: Invoice LUM-`));

    // PDF renders
    const invoiceId = new URL(page.url()).pathname.split("/").pop();
    createdInvoiceId = invoiceId ?? "";
    const pdf = await page.request.get(`/api/invoices/${invoiceId}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");

    // Hosting plan
    // Hosting plan added by hand (not linked to the project), invoiced each period
    await page.goto(projectUrl);
    const addHref = await page.getByRole("link", { name: "Add", exact: true }).getAttribute("href");
    await page.goto(addHref!.replace(/&project=\w+/, ""));
    await page.getByLabel("Plan name").fill("Legacy care");
    await page.getByLabel("Domain").fill(`e2e-${run}.example`);
    await page.getByLabel("Hosting provider").fill("Vercel");
    await page.getByLabel("Next renewal date").fill(new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Add plan" }).click();
    await expect(page).toHaveURL(/\/admin\/hosting\/\w+$/);
    createdPlanId = new URL(page.url()).pathname.split("/").pop() ?? "";
    await expect(page.getByText(/Invoiced each period/)).toBeVisible();
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

    // Logged in on this tab: "Homepage" leaves the portal, and the header link returns without asking again
    await page.getByRole("link", { name: "Homepage" }).click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByRole("link", { name: "My portal" }).first()).toBeVisible();

    // A new tab must log in itself, even though the session cookie is shared…
    const other = await page.context().newPage();
    await other.goto("/portal/invoices");
    await expect(other).toHaveURL(/\/login\?next=%2Fportal%2Finvoices/);
    await expect(other.getByRole("heading", { name: "Log in" })).toBeVisible();
    await other.close();

    // …and the original tab stays signed in
    await page.goto("/portal/invoices");
    await expect(page.getByRole("link", { name: /LUM-/ })).toHaveCount(3); // deposit (on acceptance, paid) + balance (paid) + the admin's invoice
    await page.goto(`/portal/invoices/${createdInvoiceId}`);
    await expect(page.getByText("£1,500.00").first()).toBeVisible();
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
    if (!stripeKey) {
      // No Stripe keys → friendly error rather than a crash
      await page.getByRole("button", { name: /Pay £1,500.00 now/ }).click();
      await expect(page.locator("p[role=alert]")).toContainText(/Online payments aren't available|can't be paid/);
    } else if (stripeKey.startsWith("sk_test_") && process.env.STRIPE_WEBHOOK_SECRET) {
      // Test-mode Stripe: "Pay now" opens Stripe Checkout for the right amount…
      await expect(page).toHaveURL(new RegExp(`/portal/invoices/${createdInvoiceId}$`));
      const invoiceUrl = page.url();
      await page.getByRole("button", { name: /Pay £1,500.00 now/ }).click();
      await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });
      // …and when Stripe reports the payment (a signed webhook, as Stripe would send it), the invoice is paid.
      const invoiceId = createdInvoiceId;
      const payload = JSON.stringify({
        id: `evt_e2e_${run}`,
        object: "event",
        type: "checkout.session.completed",
        data: { object: { id: `cs_test_e2e_${run}`, object: "checkout.session", payment_status: "paid", amount_total: 150000, metadata: { invoiceId } } },
      });
      const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
      const res = await page.request.post("/api/stripe/webhook", { data: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
      expect(res.status()).toBe(200);
      // A forged (unsigned) event is rejected
      const forged = await page.request.post("/api/stripe/webhook", { data: payload, headers: { "stripe-signature": "t=1,v1=bad" } });
      expect(forged.status()).toBe(400);
      await page.goto(invoiceUrl);
      await expect(page.getByText("Paid", { exact: true }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /Pay £1,500.00 now/ })).toHaveCount(0);
      expect(readFileSync(DEV_LOG, "utf8")).toContain(`Subject: Payment received: invoice LUM-`);
    }

    // Hosting: the plan shows in their portal, paid by invoice until they switch to card
    await page.getByRole("link", { name: "Hosting", exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/hosting$/);
    await expect(page.getByText("Paid by invoice")).toBeVisible();
    await expect(page.getByText(/your first card payment is on/)).toBeVisible(); // renewal is 5 days away: no double charge
    await expect(page.getByRole("button", { name: "Set up automatic payments" })).toBeVisible();

    // They can cancel (with a confirmation step) and change their mind
    await page.getByRole("link", { name: "Cancel plan" }).click();
    await expect(page.getByText(/Hosting and care continue until/)).toBeVisible();
    await page.getByRole("button", { name: "Yes, cancel my plan" }).click();
    await expect(page.getByText(/Your plan has been cancelled/)).toBeVisible();
    await expect(page.getByText("Cancelled, ends soon")).toBeVisible();
    expect(readFileSync(DEV_LOG, "utf8")).toMatch(/Subject: Your .+ plan has been cancelled/);
    expect(readFileSync(DEV_LOG, "utf8")).toContain(`Subject: Hosting cancelled: e2e-${run}.example`);
    await page.getByRole("button", { name: "Keep my plan after all" }).click();
    await expect(page.getByText(/your plan will carry on as normal/)).toBeVisible();
    await expect(page.getByText("Paid by invoice")).toBeVisible();

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Automatic card billing, driven by Stripe's (signed) events
      const sub = `sub_e2e_${run}`;
      const meta = { hostingPlanId: createdPlanId };
      await stripeEvent(page, "checkout.session.completed", { id: `cs_e2e_sub_${run}`, object: "checkout.session", mode: "subscription", subscription: sub, customer: `cus_e2e_${run}`, metadata: meta });
      await page.reload();
      await expect(page.getByText("Automatic payments on")).toBeVisible();
      await expect(page.getByRole("button", { name: "Update card & receipts" })).toBeVisible();

      // Each automatic payment becomes a numbered, paid invoice in their portal
      const start = Math.floor(Date.now() / 1000);
      await stripeEvent(page, "invoice.paid", {
        id: `in_e2e_${run}`, object: "invoice", amount_paid: 4900,
        parent: { type: "subscription_details", subscription_details: { subscription: sub, metadata: meta } },
        lines: { object: "list", data: [{ period: { start, end: start + 30 * 86400 } }] },
      });
      await page.goto("/portal/invoices");
      await expect(page.getByRole("row", { name: /£49\.00.*Paid/ })).toBeVisible();

      // Cancelled from Stripe's side (e.g. the billing page): ends at the period end, emails sent
      const periodEnd = start + 30 * 86400;
      await stripeEvent(page, "customer.subscription.updated", {
        id: sub, object: "subscription", status: "active", cancel_at: null, cancel_at_period_end: true, metadata: meta,
        items: { object: "list", data: [{ current_period_end: periodEnd }] },
      });
      await page.goto("/portal/hosting");
      await expect(page.getByText("Cancelled, ends soon")).toBeVisible();

      // When the period ends Stripe deletes the subscription: the plan has ended
      await stripeEvent(page, "customer.subscription.deleted", {
        id: sub, object: "subscription", status: "canceled", cancel_at: periodEnd, cancel_at_period_end: true, metadata: meta,
        items: { object: "list", data: [{ current_period_end: periodEnd }] },
      });
      await page.reload();
      await expect(page.getByText("Ended", { exact: true })).toBeVisible();
    }

    // The seeded demo client's project must not be visible
    await page.goto("/portal/projects");
    await expect(page.getByText("Demo Coffee Co.")).toHaveCount(0);
  });

  test("launch: admin marks the project as launched → client starts hosting by card, monthly or yearly", async ({ page, browser }) => {
    test.skip(!createdProjectPath, "depends on the quote test");
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin$/);
    const projectUrl = new URL(createdProjectPath.replace("/portal/", "/admin/"), page.url()).toString();
    if (createdInvoiceId) {
      // The invoice the admin test billed against the quote must be paid too, or launch is blocked.
      await page.goto(`/admin/invoices/${createdInvoiceId}`);
      const markPaid = page.getByRole("button", { name: "Mark as paid" });
      if (await markPaid.count()) await markPaid.click();
      await expect(page.getByRole("button", { name: "Mark unpaid" })).toBeVisible();
    }
    await page.goto(projectUrl);
    await expect(page.getByText(/starts Standard care, £10\/month/)).toBeVisible(); // from the accepted quote
    const domain = `live-${run}.example`;
    await page.getByLabel("Live domain").fill(domain);
    await page.getByRole("button", { name: "Mark as launched" }).click();
    await expect(page.getByText(`${client.email} has been emailed to start their hosting plan`)).toBeVisible();
    await expect(page.getByText("Completed", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("100%")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as launched" })).toHaveCount(0);
    expect(readFileSync(DEV_LOG, "utf8")).toContain("Subject: Your website is live: start your Standard care plan");
    const planHref = await page.getByRole("link", { name: domain }).getAttribute("href");
    const planId = planHref!.split("/").pop()!;

    // Client: the plan is waiting for its first payment, with a monthly / yearly choice
    const ctx = await browser.newContext();
    const c = await ctx.newPage();
    await login(c, client.email, client.password);
    await expect(c).toHaveURL(/\/portal$/);
    await c.goto("/portal/hosting");
    const card = c.locator(`[data-plan="${domain}"]`);
    await expect(card.getByRole("heading", { name: "Standard care" })).toBeVisible();
    await expect(card.getByText("Ready to start")).toBeVisible();
    await expect(card.getByText("Monthly: £10.00/month")).toBeVisible();
    await expect(card.getByText("Yearly: £100.00/year")).toBeVisible();
    await expect(card.getByText("Saves £20.00 a year")).toBeVisible();
    await expect(card.getByLabel(/Monthly: £10\.00/)).toBeChecked(); // what they were quoted
    await expect(card.getByRole("button", { name: "Pay first payment & save card" })).toBeVisible();

    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Stripe confirms the first payment and saved card (signed events): the plan renews automatically from here
      const sub = `sub_e2e_live_${run}`;
      const meta = { hostingPlanId: planId };
      await stripeEvent(c, "checkout.session.completed", { id: `cs_e2e_live_${run}`, object: "checkout.session", mode: "subscription", subscription: sub, customer: `cus_e2e_${run}`, metadata: meta });
      const start = Math.floor(Date.now() / 1000);
      await stripeEvent(c, "invoice.paid", {
        id: `in_e2e_live_${run}`, object: "invoice", amount_paid: 1000,
        parent: { type: "subscription_details", subscription_details: { subscription: sub, metadata: meta } },
        lines: { object: "list", data: [{ period: { start, end: start + 30 * 86400 } }] },
      });
      await c.reload();
      await expect(card.getByText("Automatic payments on")).toBeVisible();
      await expect(card.getByText("£10.00 is taken automatically every month")).toBeVisible();
      await expect(card.getByRole("button", { name: "Update card & receipts" })).toBeVisible();
      await expect(card.getByRole("link", { name: "Cancel plan" })).toBeVisible();
      await c.goto("/portal/invoices");
      await expect(c.getByRole("row", { name: /£10\.00.*Paid/ })).toBeVisible();
    }
    await ctx.close();
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
  test("admin full deletes: invoice, project, hosting plan, and a paid quote with everything linked; gone from the portal", async ({ page, browser }) => {
    test.skip(!createdProjectPath || !createdPlanId, "depends on the earlier tests");
    page.on("dialog", (d) => d.accept()); // the "are you sure?" confirms
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin$/);
    const projectUrl = new URL(createdProjectPath.replace("/portal/", "/admin/"), page.url()).toString();

    // A sent invoice
    await page.goto(projectUrl);
    const projectTitle = (await page.getByRole("heading", { level: 1 }).textContent())!.trim();
    await page.getByRole("link", { name: "New", exact: true }).click();
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.getByRole("button", { name: "Send to client" }).click();
    const sent = await page.getByText(/Invoice LUM-\d{4}-\d{4} sent/).textContent();
    const sentNumber = sent!.match(/LUM-\d{4}-\d{4}/)![0];
    await page.getByRole("button", { name: "Delete invoice" }).click();
    await expect(page).toHaveURL(/\/admin\/invoices\?deleted=1$/);
    await expect(page.getByText("Invoice deleted.")).toBeVisible();
    await expect(page.getByText(sentNumber)).toHaveCount(0);

    // A project made by hand
    const extra = `Extra project ${run}`;
    await page.goto("/admin/projects/new");
    await page.getByLabel("Title").fill(extra);
    await page.getByLabel("Client", { exact: true }).selectOption({ label: client.name });
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page).toHaveURL(/\/admin\/projects\/\w+$/);
    await page.getByRole("button", { name: "Delete project" }).click();
    await expect(page).toHaveURL(/\/admin\/projects\?deleted=1$/);
    await expect(page.getByText(extra)).toHaveCount(0);

    // The hand-added hosting plan, with its (paid) invoices
    await page.goto(`/admin/hosting/${createdPlanId}`);
    await page.getByRole("button", { name: "Delete plan" }).click();
    await expect(page).toHaveURL(/\/admin\/hosting\?deleted=1$/);
    await expect(page.getByText("Hosting plan deleted.")).toBeVisible();
    await expect(page.getByRole("link", { name: `e2e-${run}.example` })).toHaveCount(0);

    // The accepted quote, although its deposit is paid: project, invoices and launch hosting plan go too
    await page.goto(createdQuoteUrl);
    await page.getByRole("button", { name: "Delete quote" }).click();
    await expect(page).toHaveURL(/\/admin\/quotes\?deleted=1$/);
    await page.goto(projectUrl);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.goto("/admin/hosting");
    await expect(page.getByRole("link", { name: `live-${run}.example` })).toHaveCount(0);

    // The client sees none of it any more
    const ctx = await browser.newContext();
    const c = await ctx.newPage();
    await login(c, client.email, client.password);
    await expect(c).toHaveURL(/\/portal$/);
    await c.goto("/portal/projects");
    await expect(c.getByText(projectTitle)).toHaveCount(0);
    await expect(c.getByText(extra)).toHaveCount(0);
    await c.goto("/portal/invoices");
    await expect(c.getByText(/LUM-\d{4}-\d{4}/)).toHaveCount(0);
    await c.goto("/portal/hosting");
    await expect(c.getByText(`e2e-${run}.example`)).toHaveCount(0);
    await c.goto(createdProjectPath);
    await expect(c.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await ctx.close();
  });
});
