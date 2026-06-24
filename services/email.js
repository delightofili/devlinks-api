import resend from "../lib/email";

export async function sendWelcomeEmail(user) {
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: `Welcome to DevLinks, ${user.name}!`,
    html: `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 20px 0;">
          <tr>
            <td align="center">
              <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; background-color: #ffffff; padding: 40px; border-radius: 8px; text-align: left; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                
                <h1 style="color: #4F7CFF; margin-top: 0; font-size: 24px;">Welcome to DevLinks! 🔗</h1>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.5;">Hi ${user.name},</p>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.5;">Thanks for joining DevLinks — the place where developers share the best links, tools, and resources.</p>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.5; font-weight: bold; margin-bottom: 8px;">Here's what you can do:</p>
                <ul style="color: #333333; font-size: 15px; line-height: 1.6; padding-left: 20px; margin-top: 0;">
                  <li>Submit useful links you've discovered</li>
                  <li>Upvote links you find valuable</li>
                  <li>Comment and discuss with other developers</li>
                </ul>
                
                <div style="margin: 30px 0;">
                  <a href="http://localhost:3000" 
                     style="background-color: #4F7CFF; color: #ffffff !important; padding: 12px 28px; 
                            border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">
                    Start Exploring
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #eeeeee; margin-top: 40px;" />
                
                <p style="color: #888888; font-size: 12px; line-height: 1.4; margin-top: 20px;">
                  If you didn't create this account, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>
        </table>
        
        `,
  });

  if (error) {
    console.error("Failed to send welcome email:", error);
  }
  return data;
}
