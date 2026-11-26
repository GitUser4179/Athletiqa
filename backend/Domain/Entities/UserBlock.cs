namespace backend.Domain.Entities
{
	// Blocker has blocked Blocked. Blocking hides profiles, posts and comments in both directions
	// and stops the two users from messaging each other.
	public class UserBlock
	{
		public int UserBlockId { get; set; }

		public string BlockerId { get; set; } = null!;
		public User Blocker { get; set; } = null!;

		public string BlockedId { get; set; } = null!;
		public User Blocked { get; set; } = null!;

		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	}
}
