using backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Domain.Enums;
using backend.Shared.Helpers;

namespace backend.Infrastructure.Database
{
	public class AthletiqaDbContext : IdentityDbContext<ApplicationUser>
	{
		public AthletiqaDbContext(DbContextOptions<AthletiqaDbContext> options) : base(options) { }

		public DbSet<User> AppUsers => Set<User>();
		public DbSet<Guardian> Guardian => Set<Guardian>();
		public DbSet<AthleteProfile> AthleteProfile => Set<AthleteProfile>();
		public DbSet<SponsorProfile> SponsorProfile => Set<SponsorProfile>();
		public DbSet<NotificationSetting> NotificationSetting => Set<NotificationSetting>();
		public DbSet<PrivacySetting> PrivacySetting => Set<PrivacySetting>();
		public DbSet<Post> Post => Set<Post>();
		public DbSet<MediaContent> MediaContent => Set<MediaContent>();
		public DbSet<DonationCampaign> DonationCampaign => Set<DonationCampaign>();
		public DbSet<Donation> Donation => Set<Donation>();
		public DbSet<Message> Message => Set<Message>();
		public DbSet<Conversation> Conversation { get; set; }
		public DbSet<Comment> Comment { get; set; }
		public DbSet<PostLike> PostLike => Set<PostLike>();
		public DbSet<Notification> Notification { get; set; }
        public DbSet<Sport> Sport => Set<Sport>();
        public DbSet<AthleteSport> AthleteSport => Set<AthleteSport>();
		public DbSet<AthleteFollow> AthleteFollow => Set<AthleteFollow>();
		public DbSet<UserBlock> UserBlock => Set<UserBlock>();


		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);
			// Apply all configurations from the current assembly
			modelBuilder.ApplyConfigurationsFromAssembly(typeof(AthletiqaDbContext).Assembly);

			modelBuilder.Entity<User>()
				.HasOne(u => u.AspNetUser)
				.WithOne(a => a.User)
				.HasForeignKey<User>(u => u.UserId)
				.HasPrincipalKey<ApplicationUser>(a => a.Id);

			modelBuilder.Entity<AthleteProfile>()
				.HasKey(a => a.UserId);

			modelBuilder.Entity<AthleteProfile>()
				.Property(a => a.PublicProfileId)
				.UseIdentityColumn();

			modelBuilder.Entity<AthleteProfile>()
				.HasIndex(a => a.PublicProfileId)
				.IsUnique();

			modelBuilder.Entity<AthleteProfile>()
				.HasOne(a => a.User)
				.WithOne(u => u.AthleteProfile)
				.HasForeignKey<AthleteProfile>(a => a.UserId);

			modelBuilder.Entity<AthleteProfile>()
				.HasOne(a => a.Guardian)
				.WithMany(g => g.Athletes)
				.HasForeignKey(a => a.GuardianId)
				.OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Sport>()
				.HasIndex(s => s.Name)
				.IsUnique();

            modelBuilder.Entity<AthleteSport>()
                .HasKey(x => new { x.AthleteId, x.SportId });

            modelBuilder.Entity<AthleteSport>()
                .HasOne(x => x.Athlete)
                .WithMany(a => a.Sports)
                .HasForeignKey(x => x.AthleteId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AthleteSport>()
                .HasOne(x => x.Sport)
                .WithMany(s => s.AthleteSports)
                .HasForeignKey(x => x.SportId)
                .OnDelete(DeleteBehavior.Cascade);

			// Initializes a bunch of sports in the database based on the SportType enums
            modelBuilder.Entity<Sport>().HasData(
				Enum.GetValues<SportType>()
					.Select(sport => new Sport
					{
						SportId = (int)sport,
						Name = sport.GetDisplayName()
					})
			);

            modelBuilder.Entity<SponsorProfile>()
				.HasKey(s => s.UserId);

			modelBuilder.Entity<SponsorProfile>()
				.Property(s => s.PublicProfileId)
				.UseIdentityColumn();

			modelBuilder.Entity<SponsorProfile>()
				.HasIndex(s => s.PublicProfileId)
				.IsUnique();

			modelBuilder.Entity<SponsorProfile>()
				.HasOne(s => s.User)
				.WithOne(u => u.SponsorProfile)
				.HasForeignKey<SponsorProfile>(s => s.UserId);

			modelBuilder.Entity<NotificationSetting>()
				.HasKey(n => n.UserId);

			modelBuilder.Entity<NotificationSetting>()
				.HasOne(n => n.User)
				.WithOne(u => u.NotificationSetting)
				.HasForeignKey<NotificationSetting>(n => n.UserId);

			modelBuilder.Entity<PrivacySetting>()
				.HasKey(p => p.UserId);

			modelBuilder.Entity<PrivacySetting>()
				.HasOne(p => p.User)
				.WithOne(u => u.PrivacySetting)
				.HasForeignKey<PrivacySetting>(p => p.UserId);

			modelBuilder.Entity<Post>()
				.HasOne(p => p.Athlete)
				.WithMany(u => u.Post)
				.HasForeignKey(p => p.AthleteId)
				.OnDelete(DeleteBehavior.NoAction);

			modelBuilder.Entity<Post>()
				.HasOne(a => a.Creator)
				.WithMany(u => u.Post)
				.HasForeignKey(a => a.CreatedBy)
				.OnDelete(DeleteBehavior.NoAction);

			// Conversation → Users
			modelBuilder.Entity<Conversation>()
				.HasOne(c => c.FirstUser)
				.WithMany(u => u.FirstUserConversations)
				.HasForeignKey(c => c.FirstUserId)
				.OnDelete(DeleteBehavior.NoAction);

			modelBuilder.Entity<Conversation>()
				.HasOne(c => c.SecondUser)
				.WithMany(u => u.SecondUserConversations)
				.HasForeignKey(c => c.SecondUserId)
				.OnDelete(DeleteBehavior.NoAction);

			// Message → Conversation
			modelBuilder.Entity<Message>()
				.HasOne(m => m.Conversation)
				.WithMany(c => c.Messages)
				.HasForeignKey(m => m.ConversationId)
				.OnDelete(DeleteBehavior.Cascade);

			// Message → Sender
			modelBuilder.Entity<Message>()
				.HasOne(m => m.Sender)
				.WithMany(u => u.SentMessage)
				.HasForeignKey(m => m.SenderId)
				.OnDelete(DeleteBehavior.NoAction);

			modelBuilder.Entity<DonationCampaign>()
					.Property(d => d.GoalAmount)
					.HasPrecision(10, 2);

			modelBuilder.Entity<DonationCampaign>()
				.Property(d => d.CurrentAmount)
				.HasPrecision(10, 2);

			modelBuilder.Entity<Donation>()
				.Property(d => d.Amount)
				.HasPrecision(10, 2);

			modelBuilder.Entity<Donation>()
				.HasOne(d => d.Sponsor)
				.WithMany(s => s.Donations)
				.HasForeignKey(d => d.SponsorId)
				.OnDelete(DeleteBehavior.NoAction);

			modelBuilder.Entity<Donation>()
				.HasOne(d => d.Campaign)
				.WithMany(c => c.Donations)
				.HasForeignKey(d => d.CampaignId)
				.OnDelete(DeleteBehavior.NoAction);

			modelBuilder.Entity<DonationCampaign>()
				.HasOne(d => d.Post)
				.WithOne(p => p.DonationCampaign)
				.HasForeignKey<DonationCampaign>(d => d.PostId)
				.OnDelete(DeleteBehavior.NoAction);

			// PostLike -> Post
			modelBuilder.Entity<PostLike>()
				.HasOne(pl => pl.Post)
				.WithMany(p => p.Likes)
				.HasForeignKey(pl => pl.PostId)
				.OnDelete(DeleteBehavior.Cascade);

			// PostLike -> User
			modelBuilder.Entity<PostLike>()
				.HasOne(pl => pl.User)
				.WithMany()
				.HasForeignKey(pl => pl.UserId);

			// Ensure a user can like a post only once
			modelBuilder.Entity<PostLike>()
				.HasIndex(pl => new { pl.PostId, pl.UserId })
				.IsUnique();

			// Notification -> User
			modelBuilder.Entity<Notification>(entity =>
			{
				// Primary key
				entity.HasKey(n => n.Id);
				// Relationship
				entity.HasOne(n => n.User)
					  .WithMany(u => u.Notifications)
					  .HasForeignKey(n => n.UserId)
					  .OnDelete(DeleteBehavior.Cascade);
			});

			// AthleteFollow: follower (any user) -> athlete. NoAction to avoid multiple cascade paths;
			// rows are removed explicitly on block / account deletion.
			modelBuilder.Entity<AthleteFollow>(entity =>
			{
				entity.HasOne(f => f.Follower)
					.WithMany()
					.HasForeignKey(f => f.FollowerId)
					.OnDelete(DeleteBehavior.NoAction);

				entity.HasOne(f => f.Athlete)
					.WithMany()
					.HasForeignKey(f => f.AthleteId)
					.OnDelete(DeleteBehavior.NoAction);

				entity.HasIndex(f => new { f.FollowerId, f.AthleteId }).IsUnique();
			});

			// UserBlock: blocker -> blocked user
			modelBuilder.Entity<UserBlock>(entity =>
			{
				entity.HasOne(b => b.Blocker)
					.WithMany()
					.HasForeignKey(b => b.BlockerId)
					.OnDelete(DeleteBehavior.NoAction);

				entity.HasOne(b => b.Blocked)
					.WithMany()
					.HasForeignKey(b => b.BlockedId)
					.OnDelete(DeleteBehavior.NoAction);

				entity.HasIndex(b => new { b.BlockerId, b.BlockedId }).IsUnique();
			});
		}


	}
}
