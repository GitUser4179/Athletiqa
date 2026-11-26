using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace backend.Features.Stripe.CreateStripeAccount;

public class CreateStripeAccountHandler : IRequestHandler<Command, CreateStripeAccountResult>
{
    private readonly AthletiqaDbContext _context;
    private readonly IConfiguration _configuration;

    public CreateStripeAccountHandler(AthletiqaDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<CreateStripeAccountResult> Handle(Command request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.userId, cancellationToken);

        if (user == null)
        {
            return new CreateStripeAccountResult
            {
                Success = false,
                ErrorMessage = "User not found"
            };
        }

        var apiKey = _configuration["Stripe:SecretKey"];

        var client = new StripeClient(apiKey); // initialize new StripeClient

        if (string.IsNullOrWhiteSpace(user.StripeAccountId)) // If the user doesn't have a Stripe account, create one
        {

            var accountService = new AccountService(client);

            var account = await accountService.CreateAsync(
                // Options for creating an Stripe Express account
                new AccountCreateOptions
                {
                    Type = "express",
                    Country = "SE",
                    Email = user.Email,
                    Capabilities = new AccountCapabilitiesOptions
                    {
                        Transfers = new AccountCapabilitiesTransfersOptions
                        {
                            Requested = true
                        },
                        CardPayments = new AccountCapabilitiesCardPaymentsOptions
                        {
                            Requested = true
                        }
                    }
                },
                cancellationToken: cancellationToken
            );

            user.StripeAccountId = account.Id;
            await _context.SaveChangesAsync(cancellationToken);
        }

        var accountLinkService = new AccountLinkService(client);

        var onboardLink = await accountLinkService.CreateAsync(
            new AccountLinkCreateOptions
            {
                Account = user.StripeAccountId,
                RefreshUrl = $"{(_configuration["FrontendUrl"] ?? "http://localhost:3000").TrimEnd('/')}/settings",  // no refresh page yet, takes user to settings instead
                ReturnUrl = $"{(_configuration["FrontendUrl"] ?? "http://localhost:3000").TrimEnd('/')}/stripe-success", // returns the user to stripe-success-page when account is created
                Type = "account_onboarding"
            },
            cancellationToken: cancellationToken
        );

        return new CreateStripeAccountResult
        { 
            Success = true,
            AccountId = user.StripeAccountId,
            Url = onboardLink.Url
        };
    }


}
