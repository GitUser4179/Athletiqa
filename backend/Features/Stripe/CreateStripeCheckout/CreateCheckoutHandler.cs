using backend.Features.Stripe.CreateStripeCheckout;
using backend.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Stripe;
using StripeCheckout = Stripe.Checkout;

namespace backend.Features.Stripe.CreatePayment
{
    public class CreateCheckoutHandler : IRequestHandler<CreateCheckoutCommand, CreateCheckoutResponse>
    {
        private readonly AthletiqaDbContext _context;
        private readonly IConfiguration _configuration;

        public CreateCheckoutHandler(AthletiqaDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<CreateCheckoutResponse> Handle(CreateCheckoutCommand command, CancellationToken cancellationToken)
        {
            var campaign = await _context.DonationCampaign
                                         .Include(c => c.Post)
                                            .ThenInclude(p => p.Athlete)
                                                .ThenInclude(a => a.User)
                                                    .ThenInclude(u => u.AspNetUser)
                                        .FirstOrDefaultAsync(c => c.DonationCampaignId == command.campaignId, cancellationToken);


            // if DonationCampaign is null
            if (campaign == null)
            {
                return new CreateCheckoutResponse
                {
                    Success = false,
                    ErrorMessage = "Campaign not found"
                };
            }

            var stripeAccountId = campaign.Post.Athlete.User.AspNetUser.StripeAccountId;

            // if athlete doesn't have a Stripe account
            if (string.IsNullOrEmpty(stripeAccountId))
            {
                return new CreateCheckoutResponse
                {
                    Success = false,
                    ErrorMessage = "Athlete does not have a connected Stripe account"
                };
            }

            string athleteFullName = $"{campaign.Post.Athlete.User.AspNetUser.FirstName} {campaign.Post.Athlete.User.AspNetUser.LastName}";

            var options = new StripeCheckout.SessionCreateOptions
            {
                LineItems = new List<StripeCheckout.SessionLineItemOptions> // Items that the sponsors "purchase", donation in our case
                {
                    new()
                    {
                        PriceData = new StripeCheckout.SessionLineItemPriceDataOptions
                        {
                            Currency = "sek",
                            ProductData = new StripeCheckout.SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"Donation till {athleteFullName}"
                            },

                            UnitAmount = command.amount * 100 // Stripes amount is in ores, * 100 for SEK
                           
                        },
                        Quantity = 1,
                    }
                },
                Mode = "payment",
                SuccessUrl = $"{(_configuration["FrontendUrl"] ?? "http://localhost:3000").TrimEnd('/')}/donate-success",
                CancelUrl = $"{(_configuration["FrontendUrl"] ?? "http://localhost:3000").TrimEnd('/')}/campaign/{command.campaignId}", //takes user back to campaign if canceled
                Metadata = new Dictionary<string, string>
                {
                    {"campaign_id", command.campaignId.ToString()},
                    {"email", command.email.ToString()},
                    {"donorName", command.donorName.ToString()}
                },
                PaymentIntentData = new StripeCheckout.SessionPaymentIntentDataOptions
                {
                    ApplicationFeeAmount = 0, // The amount we want to take from the donation. I set the default to 0 :))

                },
                CustomerEmail = command.email, //Sets the same email in the checkout as the user entered on our website
                
            };

            if (!string.IsNullOrEmpty(command.sponsorId))
            {
                options.Metadata["sponsor_id"] = command.sponsorId; //sets sponsorId if sponsor is donating
            }

            var requestOptions = new RequestOptions
            {
                StripeAccount = stripeAccountId,
                
            };

            var apiKey = _configuration["Stripe:SecretKey"];

            var client = new StripeClient(apiKey); // initialize new StripeClient
            var session = await client.V1.Checkout.Sessions.CreateAsync(options, requestOptions, cancellationToken);

            return new CreateCheckoutResponse
            {
                Success = true,
                Url = session.Url
            };
        }
    }
}
