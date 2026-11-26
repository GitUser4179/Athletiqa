using MediatR;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using backend.Features.Conversations.SendMessage;
using backend.Infrastructure.Database;
using backend.Features.Social;
using Microsoft.EntityFrameworkCore;

namespace backend.Features.Conversation.Realtime;

public class ConversationHub : Hub
{
	private readonly ISender _sender;
	private readonly AthletiqaDbContext _db;
    public ConversationHub(ISender sender, AthletiqaDbContext db)
    {
		_sender = sender;
		_db = db;
    }
    public async Task JoinConversation(int conversationId)
	{
		await Groups.AddToGroupAsync(Context.ConnectionId, conversationId.ToString());
	}

	public async Task LeaveConversation(int conversationId)
	{
		await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId.ToString());
	}

	public async Task SendMessage(int conversationId, string content)
	{
		var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		var user = await _db.AppUsers
			.Include(u => u.AspNetUser)
			.FirstOrDefaultAsync(u => u.UserId == senderId);

		if (user == null)
		{
			throw new HubException("User not found");
		}

		var senderName = $"{user.AspNetUser.FirstName} {user.AspNetUser.LastName}";

		if (string.IsNullOrEmpty(senderId))
		{
			throw new HubException("Unauthorized");
		}

		// Don't deliver messages between users where either side has blocked the other
		var conversation = await _db.Conversation
			.Where(c => c.ConversationId == conversationId)
			.Select(c => new { c.FirstUserId, c.SecondUserId })
			.FirstOrDefaultAsync();
		if (conversation is null || (conversation.FirstUserId != senderId && conversation.SecondUserId != senderId))
		{
			throw new HubException("Conversation not found");
		}
		var otherUserId = conversation.FirstUserId == senderId ? conversation.SecondUserId : conversation.FirstUserId;
		if (await _db.IsBlockedBetweenAsync(senderId, otherUserId))
		{
			throw new HubException("You can't message this user");
		}

		var result = await _sender.Send(new SendMessageCommand
		{
			ConversationId = conversationId,
			Content = content,
			SenderId = senderId
		});

		if (!result.Success)
		{
			throw new HubException(result.ErrorMessage ?? "Failed to send message");
		}

		await Clients.Group(conversationId.ToString()).SendAsync("ReceiveMessage", new
		{
			conversationId, // the client filters incoming messages by conversation
			messageId = result.MessageId,
			senderId,
			senderName,
			content = result.Content,
			timestamp = DateTime.UtcNow
		});
	}
}
