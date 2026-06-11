export function confirmSignupHtml(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your email — WC 2026 Predictions</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">
    You're almost in! Confirm your email to start predicting World Cup 2026 matches.
  </span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#0a0f1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;background-color:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">🏆</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                FIFA World Cup 2026
              </h1>
              <p style="margin:6px 0 0;color:#6ee7b7;font-size:14px;font-weight:500;">
                Prediction League
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#f9fafb;font-size:20px;font-weight:600;">
                Confirm your email address
              </h2>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Welcome to the World Cup 2026 Prediction League! Click the button below
                to verify your email and start predicting match outcomes.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${confirmationUrl}"
                      style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.1px;">
                      ✅ Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top:1px solid #1f2937;padding-top:28px;">
                    <p style="margin:0 0 16px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">
                      What you can do
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding-bottom:12px;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="font-size:20px;padding-right:12px;vertical-align:top;">⚽</td>
                              <td>
                                <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.5;">
                                  <strong style="color:#f9fafb;">Predict every match</strong><br/>
                                  Pick the winner for all 104 World Cup matches
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="font-size:20px;padding-right:12px;vertical-align:top;">📊</td>
                              <td>
                                <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.5;">
                                  <strong style="color:#f9fafb;">Climb the leaderboard</strong><br/>
                                  Compete with friends, family, and the world
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d1117;padding:20px 40px;border-top:1px solid #1f2937;">
              <p style="margin:0;color:#4b5563;font-size:12px;line-height:1.6;text-align:center;">
                If you didn't create an account, you can safely ignore this email.<br/>
                This link expires in 24 hours.<br/><br/>
                <span style="color:#374151;">© 2026 WC Prediction League</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#374151;font-size:12px;text-align:center;">
          If the button doesn't work, copy this link:<br/>
          <a href="${confirmationUrl}" style="color:#10b981;word-break:break-all;">
            ${confirmationUrl}
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function resetPasswordHtml(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password — WC 2026 Predictions</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">
    Reset your WC 2026 Prediction League password. This link expires in 1 hour.
  </span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#0a0f1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;background-color:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#3730a3 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">🔐</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Password Reset
              </h1>
              <p style="margin:6px 0 0;color:#a5b4fc;font-size:14px;font-weight:500;">
                WC 2026 Prediction League
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#f9fafb;font-size:20px;font-weight:600;">
                Reset your password
              </h2>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
                We received a request to reset your password. Click the button below to
                choose a new one and get back to predicting.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${confirmationUrl}"
                      style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.1px;">
                      🔑 Set New Password
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color:#1c1917;border:1px solid #292524;border-radius:10px;padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size:18px;padding-right:12px;vertical-align:top;">⚠️</td>
                        <td>
                          <p style="margin:0;color:#a8a29e;font-size:13px;line-height:1.6;">
                            <strong style="color:#d6d3d1;">This link expires in 1 hour.</strong><br/>
                            If you didn't request a password reset, you can safely ignore this
                            email. Your password will not change.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d1117;padding:20px 40px;border-top:1px solid #1f2937;">
              <p style="margin:0;color:#4b5563;font-size:12px;line-height:1.6;text-align:center;">
                For security, this link can only be used once.<br/><br/>
                <span style="color:#374151;">© 2026 WC Prediction League</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#374151;font-size:12px;text-align:center;">
          If the button doesn't work, copy this link:<br/>
          <a href="${confirmationUrl}" style="color:#10b981;word-break:break-all;">
            ${confirmationUrl}
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function magicLinkHtml(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your sign-in link — WC 2026 Predictions</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">
    Here's your one-click sign-in link for WC 2026 Prediction League.
  </span>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background-color:#0a0f1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;background-color:#111827;border-radius:16px;border:1px solid #1f2937;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:12px;">⚡</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                Your Sign-In Link
              </h1>
              <p style="margin:6px 0 0;color:#6ee7b7;font-size:14px;font-weight:500;">
                WC 2026 Prediction League
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Click the button below to sign in instantly — no password needed.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <a href="${confirmationUrl}"
                      style="display:inline-block;background-color:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Sign In Now
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:13px;text-align:center;">
                This link expires in 1 hour and can only be used once.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d1117;padding:20px 40px;border-top:1px solid #1f2937;">
              <p style="margin:0;color:#4b5563;font-size:12px;text-align:center;">
                If you didn't request this, you can safely ignore this email.<br/>
                <span style="color:#374151;">© 2026 WC Prediction League</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#374151;font-size:12px;text-align:center;">
          Button not working?
          <a href="${confirmationUrl}" style="color:#10b981;word-break:break-all;">
            ${confirmationUrl}
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
