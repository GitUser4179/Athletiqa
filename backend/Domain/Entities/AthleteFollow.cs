namespace backend.Domain.Entities
{
	// A user (athlete or sponsor) following an athlete
	public class AthleteFollow
	{
		public int AthleteFollowId { get; set; }

		public string FollowerId { get; set; } = null!;
		public User Follower { get; set; } = null!;

		public string AthleteId { get; set; } = null!;
		public AthleteProfile Athlete { get; set; } = null!;

		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	}
}
