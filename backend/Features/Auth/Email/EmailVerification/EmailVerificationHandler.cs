using backend.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace backend.Features.Auth.Email.EmailVerification;

public class VerificationEmailHandler(UserManager<ApplicationUser> userManager, 
    MailpitEmailSender emailSender, IConfiguration configuration) : IRequestHandler<VerificationEmailCommand, bool>
{
    public async Task<bool> Handle(VerificationEmailCommand request, CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user == null || user.EmailConfirmed) return false;

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);

        var frontendUrl = $"{(configuration["FrontendUrl"] ?? "http://localhost:3000").TrimEnd('/')}/verify-email";
        var encodedToken = Uri.EscapeDataString(token);
        var confirmLink = $"{frontendUrl}?userId={user.Id}&token={encodedToken}";

        await emailSender.SendConfirmationLinkAsync(user, request.Email, confirmLink);
        return true;
    }
}