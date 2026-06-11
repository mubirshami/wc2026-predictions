"use server";

import dns from "dns/promises";
import disposableDomains from "disposable-email-domains";

const disposableSet = new Set(disposableDomains as string[]);

const FAKE_DOMAINS = new Set([
  "test.com", "example.com", "fake.com", "fakeemail.com",
  "invalid.com", "nowhere.com", "nomail.com", "noemail.com",
]);

export async function checkEmail(email: string): Promise<{ disposable: boolean; noMailbox: boolean }> {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";

  if (!domain) return { disposable: false, noMailbox: true };

  const disposable = disposableSet.has(domain) || FAKE_DOMAINS.has(domain);

  // Check if domain has MX records (i.e. can actually receive email)
  let noMailbox = false;
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) noMailbox = true;
  } catch {
    noMailbox = true; // domain doesn't exist or has no MX records
  }

  return { disposable, noMailbox };
}
