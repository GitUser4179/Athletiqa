using backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using MailKit.Net.Smtp;
using MimeKit;

namespace backend.Features.Auth.Email
{
	public class MailpitEmailSender(IConfiguration config, ILogger<MailpitEmailSender> logger) : IEmailSender<ApplicationUser>
	{
        // Themes from global.css in frontend
		readonly string colorPrimary = "#0E3B6A";
        readonly string colorBg = "#FAF9F6";
        readonly string colorSurface = "#ffffff";
        readonly string colorGray700 = "#252422";
        readonly string colorGray500 = "#909090";
        readonly string colorGray300 = "#D4D4D4";

        public async Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
		{
            string htmlBody = $@"
<div style='background-color: {colorBg}; padding: 40px 20px; text-align: center;'>
    <div style='max-width: 500px; margin: 0 auto; background-color: {colorSurface}; padding: 30px; border: 1px solid {colorGray300}; text-align: left;'>
        
        <h2 style='color: {colorPrimary}; font-size: 24px; font-weight: bold; margin-top: 0; margin-bottom: 16px;'>
            Återställ ditt lösenord
        </h2>
        
        <p style='color: {colorGray700}; font-size: 16px; line-height: 24px; margin-bottom: 24px;'>
            Hej! Vi tog emot en begäran om att återställa lösenordet för ditt konto hos oss på <strong>Athletiqa</strong>. Klicka på knappen nedan för att välja ett nytt lösenord.
        </p>
        
        <div style='text-align: center; margin-top: 24px; margin-bottom: 24px;'>
            <a href='{resetLink}' style='background-color: {colorPrimary}; color: {colorSurface}; padding: 12px 32px; font-size: 15px; font-weight: bold; text-decoration: none; display: inline-block;'>
                Välj nytt lösenord
            </a>
        </div>
        
        <div style='margin-top: 24px; margin-bottom: 24px; border-top: 1px solid {colorGray300};'></div>
        
        <p style='color: {colorGray500}; font-size: 12px; line-height: 18px; margin-bottom: 0;'>
            Om du inte begärde denna återställning kan du helt bortse från detta mejl. Länken är giltig under en begränsad tid (15 minuter).
        </p>
    </div>
</div>";
            await SendEmailAsync(email, "Återställ ditt lösenord - Athletiqa", htmlBody);
		}

		public async Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
		{
            string htmlBody = $@"
<div style='background-color: {colorBg}; padding: 40px 20px; text-align: center; font-family: ""Karla"", sans-serif;'>
    <div style='max-width: 500px; margin: 0 auto; background-color: {colorSurface}; padding: 30px; border: 1px solid {colorGray300}; text-align: left;'>
        
        <h2 style='color: {colorPrimary}; font-size: 24px; font-weight: bold; margin-top: 0; margin-bottom: 16px;'>
            Bekräfta din e-postadress
        </h2>
        
        <p style='color: {colorGray700}; font-size: 16px; line-height: 24px; margin-bottom: 24px;'>
            Hej! Roligt att du vill gå med i laget! Innan du kan börja använda ditt konto på <strong>Athletiqa</strong> behöver vi verifiera att det här är din e-postadress. Klicka på knappen nedan för att slutföra din registrering.
        </p>
        
        <div style='text-align: center; margin-top: 24px; margin-bottom: 24px;'>
            <a href='{confirmationLink}' style='background-color: {colorPrimary}; color: {colorSurface}; padding: 12px 32px; font-size: 15px; font-weight: bold; text-decoration: none; display: inline-block;'>
                Bekräfta e-post
            </a>
        </div>
        
        <div style='margin-top: 24px; margin-bottom: 24px; border-top: 1px solid {colorGray300};'></div>
        
        <p style='color: {colorGray500}; font-size: 12px; line-height: 18px; margin-bottom: 0;'>
            Om du inte skapade ett konto på Athletiqa kan du helt bortse från detta mejl. Inga inställningar ändras förrän du klickar på länken.
        </p>
    </div>
</div>";
            await SendEmailAsync(email, "Bekräfta din e-postadress - Athletiqa", htmlBody);
        }

		public async Task SendDonationReceiptAsync(string email, decimal amount)
		{
            string htmlBody = $@"
<div style='background-color: {colorBg}; padding: 40px 20px; text-align: center;'>
    <div style='max-width: 500px; margin: 0 auto; background-color: {colorSurface}; padding: 30px; border: 1px solid {colorGray300}; text-align: left;'>
        
        <h2 style='color: {colorPrimary}; font-size: 24px; font-weight: bold; margin-top: 0; margin-bottom: 16px;'>
            Tack för din donation!
        </h2>
        
        <p style='color: {colorGray700}; font-size: 16px; line-height: 24px; margin-bottom: 16px;'>
            Hej! Din donation till nästa generations idrottsstjärnor har tagits emot och registrerats på plattformen.
        </p>

        <div style='background-color: {colorBg}; padding: 20px; border: 1px solid {colorGray300}; margin-bottom: 24px;'>
            <table style='width: 100%; border-collapse: collapse; font-size: 15px; color: {colorGray700};'>
                <tr>
                    <td style='font-weight: bold; padding-bottom: 8px;'>Beskrivning:</td>
                    <td style='text-align: right; padding-bottom: 8px;'>Sponsring via Athletiqa</td>
                </tr>
                <tr style='border-top: 1px solid {colorGray300};'>
                    <td style='font-weight: bold; padding-top: 8px; font-size: 18px; color: {colorPrimary};'>Belopp:</td>
                    <td style='text-align: right; padding-top: 8px; font-weight: bold; font-size: 18px; color: {colorPrimary};'>{amount} SEK</td>
                </tr>
            </table>
        </div>

        <p style='color: {colorGray700}; font-size: 15px; line-height: 22px; margin-bottom: 24px;'>
            Ditt bidrag gör det möjligt för unga atleter att fortsätta träna, tävla och hålla sina drömmar vid liv. Tack för att du är en del av laget!
        </p>
        
        <div style='margin-top: 24px; margin-bottom: 24px; border-top: 1px solid {colorGray300};'></div>
        
        <p style='color: {colorGray500}; font-size: 12px; line-height: 18px; margin-bottom: 0;'>
            Detta underlag fungerar som din digitala bekräftelse på transaktionen. Om du har några frågor gällande betalningen, vänligen kontakta vår support.
        </p>
    </div>
</div>";
            await SendEmailAsync(email, "Tack för att du donerat! - Athletiqa", htmlBody);
        }

        public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
        {
            // Unused but left to keep compiler from crashing.
            return Task.CompletedTask;
        }

        /// <summary>
        /// Asynchronously sends an email message with the specified subject and HTML content to the specified
        /// recipient.
        /// </summary>
        /// <remarks>The email is sent using SMTP settings configured in the application's configuration
        /// under the 'EmailSettings' section. The method does not perform validation on the recipient's email address
        /// format.</remarks>
        /// <param name="toEmail">The email address of the recipient. Cannot be null or empty.</param>
        /// <param name="subject">The subject line of the email message. Cannot be null.</param>
        /// <param name="htmlMessage">The HTML content to include in the body of the email message. Cannot be null.</param>
        /// <returns>A task that represents the asynchronous send operation.</returns>
        private async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
		{
			// EmailSettings__Mode=Log: don't send anything, just write the email (and its links) to the log.
			// Used for free showcase hosting where no mail server runs.
			if (string.Equals(config["EmailSettings:Mode"], "Log", StringComparison.OrdinalIgnoreCase))
			{
				var links = System.Text.RegularExpressions.Regex.Matches(htmlMessage, "href='([^']+)'")
					.Select(m => m.Groups[1].Value);
				logger.LogInformation("Email (not sent, log mode) to {To}: {Subject}. Links: {Links}",
					toEmail, subject, string.Join(" ", links));
				return;
			}

			var host = config["EmailSettings:Host"] ?? "localhost";
			var port = int.Parse(config["EmailSettings:Port"] ?? "1025");
			var senderEmail = config["EmailSettings:SenderEmail"] ?? "noreply@athletiqa.com";
			var senderName = config["EmailSettings:SenderName"] ?? "Athletiqa Auth";

			// Constructing the Mime message
			var email = new MimeMessage();
			email.From.Add(new MailboxAddress(senderName, senderEmail));
			email.To.Add(new MailboxAddress("", toEmail));
			email.Subject = subject;

			var builder = new BodyBuilder { HtmlBody = htmlMessage };
			email.Body = builder.ToMessageBody();

			// Mailkit to send the email
			using var client = new SmtpClient();

			try
			{
				await client.ConnectAsync(host, port, false); // 'false' because it runs without ssl locally in Docker
				await client.SendAsync(email);
			}
			finally
			{
				await client.DisconnectAsync(true);
			}
		}
	}
}