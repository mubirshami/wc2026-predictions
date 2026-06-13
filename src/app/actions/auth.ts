"use server";

import disposableDomains from "disposable-email-domains";

const disposableSet = new Set(disposableDomains as string[]);

const FAKE_DOMAINS = new Set([
  "test.com", "example.com", "fake.com", "fakeemail.com",
  "invalid.com", "nowhere.com", "nomail.com", "noemail.com",
]);

export async function checkEmail(email: string): Promise<{ disposable: boolean; noMailbox: boolean }> {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return { disposable: false, noMailbox: false };
  const disposable = disposableSet.has(domain) || FAKE_DOMAINS.has(domain);
  return { disposable, noMailbox: false };
}
