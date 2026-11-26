using Carter;
using MediatR;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace backend.Features.Posts.GetPostById;

public class GetPostByIdEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/api/posts/{postId}", async (int postId, ClaimsPrincipal user, ISender mediator) =>
        {
            var result = await mediator.Send(new GetPostByIdQuery(postId, user.FindFirstValue(ClaimTypes.NameIdentifier)));
            return result is null ? Results.NotFound() : Results.Ok(result);
        });
    }
}