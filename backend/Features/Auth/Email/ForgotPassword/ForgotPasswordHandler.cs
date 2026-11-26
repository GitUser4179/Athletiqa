using backend.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Text.Encodings.Web;

namespace backend.Features.Auth.Email.ForgotPassword;

public class ForgotPasswordHandler(UserManager<ApplicationUser> userManager, MailpitEmailSender emailSender, IConfiguration configuration) : IRequestHandler<ForgotPasswordCommand, bool>
{
    public async Task<bool> Handle(ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(command.Email);
        if (user == null)
        {
            return false;
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        var frontendUrl = $"{(configuration["FrontendUrl"] ?? "http://localhost:3000").TrimEnd('/')}/reset-password";
        var resetLink = $"{frontendUrl}?token={UrlEncoder.Default.Encode(token)}&email={UrlEncoder.Default.Encode(user.Email)}";

        await emailSender.SendPasswordResetLinkAsync(user, command.Email, resetLink);

        return true;
    }
}