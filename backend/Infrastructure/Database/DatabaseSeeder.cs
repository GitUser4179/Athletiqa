using backend.Domain.Entities;
using backend.Domain.Enums;
using backend.Shared.Constants;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Infrastructure.Database;

public static class DatabaseSeeder
{
	public static async Task SeedAsync(WebApplication app)
	{
		using (var scope = app.Services.CreateScope())
		{
			var services = scope.ServiceProvider;
			var db = services.GetRequiredService<AthletiqaDbContext>();
			var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
			var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

			var roles = typeof(Roles)
				.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.DeclaredOnly)
				.Where(f => f.IsLiteral && !f.IsInitOnly)
				.Select(f => (string)f.GetRawConstantValue()!)
				.ToArray();

			foreach (var role in roles)
			{
				if (!await roleManager.RoleExistsAsync(role))
					await roleManager.CreateAsync(new IdentityRole(role));
			}

			// Will read the .env file whilst in a development environment
			try { DotNetEnv.Env.Load(); } catch { }

			// Makes sure the domain User row + the specific profile (Athlete/Sponsor)
			// both exist for the given identity user. Safe to call on either a brand
			// new user or one that's missing its profile from a previous half-seed.
			async Task EnsureProfileAsync(string userId, object? specificProfile)
			{
				// Domain User row (AppUsers) — required because the profile.User nav points to it
				var domainUser = await db.AppUsers.FirstOrDefaultAsync(u => u.UserId == userId);
				if (domainUser is null)
				{
					domainUser = new User
					{
						UserId = userId,
						NotificationSetting = new NotificationSetting { UserId = userId },
						PrivacySetting = new PrivacySetting { UserId = userId }
					};
					db.AppUsers.Add(domainUser);
				}

				if (specificProfile is AthleteProfile athlete)
				{
					var hasAthlete = await db.AthleteProfile.AnyAsync(p => p.UserId == userId);
					if (!hasAthlete)
					{
						athlete.UserId = userId;
						athlete.User = domainUser;
						db.AthleteProfile.Add(athlete);
					}
				}
				else if (specificProfile is SponsorProfile sponsor)
				{
					var hasSponsor = await db.SponsorProfile.AnyAsync(p => p.UserId == userId);
					if (!hasSponsor)
					{
						sponsor.UserId = userId;
						sponsor.User = domainUser;
						db.SponsorProfile.Add(sponsor);
					}
				}

				await db.SaveChangesAsync();
			}

			async Task<ApplicationUser> SeedUserAsync(string email, string firstName, string lastName, string personalId, string role, string stripeAccountId, object? specificProfile = null)
			{
				var existing = await userManager.FindByEmailAsync(email);
				if (existing is not null)
				{
					// User already exists — backfill the profile if it's missing
					await EnsureProfileAsync(existing.Id, specificProfile);
					return existing;
				}

				var identityUser = new ApplicationUser
				{
					UserName = email,
					Email = email,
					EmailConfirmed = true,            // RequireConfirmedEmail = true
					FirstName = firstName,
					LastName = lastName,
					StripeAccountId = stripeAccountId,
					PersonalIdNumber = personalId,
					PhoneNumber = "0700000000"
				};

				var result = await userManager.CreateAsync(identityUser, "Seed123!");
				if (!result.Succeeded)
					throw new Exception(string.Join("; ", result.Errors.Select(e => e.Description)));

				await userManager.AddToRoleAsync(identityUser, role);

				await EnsureProfileAsync(identityUser.Id, specificProfile);
				return identityUser;
			}

			async Task AddPostsToAthlete(string userId, List<(string Title, string Content, string imageUrl)> posts)
			{
				foreach (var postData in posts)
				{
					var exists = await db.Post.AnyAsync(p => p.AthleteId == userId && p.Title == postData.Title);
					if (!exists)
					{
						var post = new Post
						{
							AthleteId = userId,
							CreatedBy = userId,
							Title = postData.Title,
							Content = postData.Content
						};
						if (!string.IsNullOrEmpty(postData.imageUrl))
						{
							post.MediaContents.Add(new MediaContent
							{
								MediaUrl = postData.imageUrl,
								MediaType = MediaType.Image
							});
						}
						db.Post.Add(post);
					}
				}
				await db.SaveChangesAsync();
			}

			// Real, free-to-use sports photos from Pexels (https://www.pexels.com/license/)
			static string Px(int id) => $"https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1200";
			
			var seedPhotos = new Dictionary<string, string[]>
			{
				["Hjälp mig nå mitt mål!"] = [Px(3886235), Px(12358254)],
				["Morgonpass på konstgräset"] = [Px(33257253)],
				["Teknikträning med laget"] = [Px(12358254)],
				["Bilder från helgens match"] = [Px(3886235), Px(33257253), Px(12358254)],
				["Nya fotbollsskor inför säsongen"] = [Px(12358254), Px(3886235)],
				["Stötta min träning!"] = [Px(3764014), Px(3756042), Px(3764011)],
				["Dubbelpass – volleyboll och tennis!"] = [Px(4450464), Px(7613507)],
				["Nytt personbästa i servehastighet!"] = [Px(3818835)],
				["Ny tennisutrustning inför tävlingssäsongen"] = [Px(1432039), Px(7613507), Px(3818835)],
				["Matchens lirare!"] = [Px(33257253)],
				["Extra skottträning"] = [Px(37356517)],
				["Resa till basketlägret i Spanien"] = [Px(2874717), Px(31177167)],
				["Nya koreografin klar!"] = [Px(7207569)],
				["Starkare än någonsin"] = [Px(7186308)],
				["Tävlingsdräkt och träningsläger"] = [Px(7186308), Px(7207569)],
				["Vinst med laget!"] = [Px(12358254)],
				["Regnträning är bästa träningen"] = [Px(3886235)],
				["Isen var perfekt idag"] = [Px(8975011)],
				["Dubbelpass!"] = [Px(13978859), Px(1770650)],
				["Magiskt ridpass"] = [Px(4895011)],
				["Tävlingshelg!"] = [Px(30728846), Px(4894985)],
				["Ny höjd i längdhoppet!"] = [Px(13041311), Px(23371780)],
				["Kvällspass i hallen"] = [Px(2874717)],
				["Blockfest!"] = [Px(6180408)],
				["Match på gång"] = [Px(4450464)],
				["Nytt racketgrepp – ny känsla"] = [Px(3771083)],
				["Snabbaste reflexerna hittills"] = [Px(8796050)],
				["Badmintonpass med fokus på smashar"] = [Px(14605729), Px(8007094)],
			};

			async Task<Post> SeedPostAsync(
				string athleteId,
				string title,
				string content,
				List<(string Url, MediaType Type)> media)
			{
				var existing = await db.Post
					.Include(p => p.MediaContents)
					.FirstOrDefaultAsync(p => p.AthleteId == athleteId && p.Title == title);

				if (existing is not null)
					return existing;

				var post = new Post
				{
					AthleteId = athleteId,
					CreatedBy = athleteId,
					Title = title,
					Content = content,
					CreatedAt = DateTime.UtcNow.AddDays(-1)
				};

				foreach (var item in media)
				{
					post.MediaContents.Add(new MediaContent
					{
						MediaUrl = item.Url,
						MediaType = item.Type
					});
				}

				db.Post.Add(post);
				await db.SaveChangesAsync();
				return post;
			}

			async Task<DonationCampaign> SeedCampaignAsync(
				Post post,
				decimal goalAmount,
				decimal currentAmount,
				DateTime? deadline)
			{
				var existing = await db.DonationCampaign
					.FirstOrDefaultAsync(c => c.PostId == post.PostId);

				if (existing is not null)
					return existing;

				var campaign = new DonationCampaign
				{
					PostId = post.PostId,
					GoalAmount = goalAmount,
					CurrentAmount = currentAmount,
					Deadline = deadline
				};

				db.DonationCampaign.Add(campaign);
				await db.SaveChangesAsync();
				return campaign;
			}

			async Task SeedCommentAsync(Post post, string userId, string content, DateTime createdAt)
			{
				var exists = await db.Comment.AnyAsync(c =>
					c.PostId == post.PostId &&
					c.UserId == userId &&
					c.Content == content);

				if (exists)
					return;

				db.Comment.Add(new Comment
				{
					PostId = post.PostId,
					UserId = userId,
					Content = content,
					CreatedAt = createdAt
				});

				await db.SaveChangesAsync();
			}

			async Task SeedLikeAsync(Post post, string userId)
			{
				var exists = await db.PostLike.AnyAsync(l =>
					l.PostId == post.PostId &&
					l.UserId == userId);

				if (exists)
					return;

				db.PostLike.Add(new PostLike
				{
					PostId = post.PostId,
					UserId = userId,
					CreatedAt = DateTime.UtcNow.AddHours(-2)
				});

				await db.SaveChangesAsync();
			}

			async Task SeedDonationAsync(
				DonationCampaign campaign,
				string sponsorId,
				decimal amount,
				string status,
				string stripeSessionId,
				string donorName)
			{
				var exists = await db.Donation.AnyAsync(d => d.StripeSessionId == stripeSessionId);
				if (exists)
					return;

				db.Donation.Add(new Donation
				{
					CampaignId = campaign.DonationCampaignId,
					SponsorId = sponsorId,
					Amount = amount,
					Status = status,
					StripeSessionId = stripeSessionId,
					DonorName = donorName,
					CreatedAt = DateTime.UtcNow.AddDays(-1)
				});

				if (status == "succeeded")
					campaign.CurrentAmount += amount;

				await db.SaveChangesAsync();
			}

			// Dataseeding multiple profiles  and their respective posts

			// Athlete adison
			var adison = await SeedUserAsync("adison.vetrovs@athletiqa.local", "Adison", "Vetrovs", "200001011234", Roles.Athlete, "acct_1TbmgoASteTMXp3W", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Female,
				Sport = "Tennis",
				Bio = "En atlet med stora mål och en stabil disciplin. Jag kämpar alltid för att förbättras, oavsett om det är på planen eller på sidan. Jag är fokuserad på att utvecklas, jag motiveras av förbättring och gör allt för att ge mitt bästa på varje träning och tävling. "
			});

			// athletes posts 
			await AddPostsToAthlete(adison.Id,
			[
			("Dubbelpass – volleyboll och tennis!", "Idag körde jag ett av de mest intensiva passen på länge. Först stod jag i volleybollhallen och jobbade på block, hoppstyrka och snabba sidoförflyttningar, och det kändes verkligen som att jag hittade ett nytt flyt i spelet. Efter det gick jag direkt vidare till tennisbanan där jag fokuserade på fotarbete och serveprecision. Det var tufft, svettigt och utmanande – men känslan efteråt var helt oslagbar. Älskar dagar där jag verkligen känner att jag utvecklas i båda sporterna samtidigt.", "https://placehold.co/180x180?text=Adison"),

				("Nytt personbästa i servehastighet!", "Idag hände något jag verkligen kämpat för länge – jag slog mitt personbästa i servehastighet! Det kändes som allt jag tränat på äntligen föll på plats: tajmingen, fotarbetet, rotationen och träffen i racket. Det är små detaljer som gör stor skillnad, och att se resultatet svart på vitt gav mig en enorm motivationsboost. Nu vill jag bara fortsätta pressa gränserna och se hur långt jag kan ta det här.", "https://placehold.co/180x180?text=Adison")
			]);


			var gustavo = await SeedUserAsync("gustavo.vaccaro@athletiqa.local", "Gustavo", "Vaccaro", "200001011234", Roles.Athlete, "acct_1TbmxvAgLlRHV6Pc", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Male,
				Sport = "Basket",
				Bio = "En målmedveten atlet som älskar intensiteten i både fotboll och basket. Jag tränar för att bli starkare, snabbare och mer teknisk i varje moment. På planen ger jag alltid allt — oavsett om det handlar om att sätta ett avgörande skott eller kämpa för varje boll. Jag drivs av utveckling, lagkänsla och viljan att nå nya nivåer i båda sporterna."
			});

			await AddPostsToAthlete(gustavo.Id,
			[
			("Matchens lirare!", "Idag blev jag utsedd till matchens lirare, och det känns fortfarande helt overkligt. Jag gick in med målet att ge allt för laget, och det märktes verkligen i spelet – varje passning, varje löpning och varje avslut satt precis som jag ville. Det är en speciell känsla när hårt arbete börjar synas på riktigt. Den här utmärkelsen ger mig bara ännu mer motivation att fortsätta utvecklas och kämpa ännu hårdare..", "https://placehold.co/180x180?text=Gustavo"),

				("Extra skottträning", "Efter dagens basketträning stannade jag kvar i hallen för att nöta skott i nästan en timme. Jag fokuserade på trepoängare, balans i avsluten och att hålla samma rytm även när jag blev trött. Det är något speciellt med att stå ensam i hallen, höra studsarna eka och känna hur tekniken sakta men säkert blir bättre. Små steg varje dag – det är så man bygger något stort.", "https://placehold.co/180x180?text=Gustavo")
			]);

			var mira = await SeedUserAsync("mira.langfeldt@athletiqa.local", "Mira", "Långfeldt", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Female,
				Sport = "Gymnastik",
				Bio = "En atlet som älskar kombinationen av styrka, rytm och uttryck. Jag tränar för att bli starkare, mer kontrollerad och mer kreativ i varje rörelse. Oavsett om jag står på mattan eller dansgolvet försöker jag alltid utvecklas och hitta nya sätt att utmana mig själv. Disciplin och passion driver mig framåt varje dag."
			});
			await AddPostsToAthlete(mira.Id,
			[
			("Nya koreografin klar!", "Efter flera veckors planering, testande och ändringar sitter äntligen hela koreografin. Det är en speciell känsla när alla rörelser, övergångar och uttryck börjar smälta samman till något som känns helt rätt. Nu börjar den roligaste delen – att finslipa detaljerna och verkligen leva in i varje steg. Jag känner mig mer inspirerad än på länge och längtar efter att få visa upp resultatet.", "https://placehold.co/180x180?text=Mira"),

				("Starkare än någonsin", "Dagens gymnastikpass var ett av de tuffaste jag gjort på länge, men också ett av de mest givande. Jag klarade flera moment som jag kämpat med i månader, och det gav mig en enorm självförtroendeboost. Det är något magiskt med att känna kroppen svara på träningen och förstå att allt slit faktiskt leder någonstans. Jag är trött, men så otroligt stolt.", "https://placehold.co/180x180?text=Mira")
			]);

			var timo = await SeedUserAsync("timo.bergqvist@athletiqa.local", "Timo", "Bergqvist", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Male,
				Sport = "Fotboll",
				Bio = "Fotboll är mer än en sport för mig — det är min drivkraft. Jag jobbar hårt för att förbättra min teknik, min spelförståelse och min fysik. Varje träning är ett steg närmare mina mål, och jag ger alltid allt för laget och för min egen utveckling. Jag tror på hårt arbete, fokus och att aldrig sluta kämpa."
			});
			await AddPostsToAthlete(timo.Id,
			[
			("Vinst med laget!", "Vilken match vi gjorde idag! Alla kämpade från första till sista minuten och vi lyckades verkligen hålla ihop spelet som ett lag. Det är en speciell känsla när allt klaffar – passningarna sitter, kommunikationen flyter och energin är på topp. Jag är så stolt över hur vi presterade och ännu mer taggad inför nästa match.", "https://placehold.co/180x180?text=Timo"),

				("Regnträning är bästa träningen", "Idag tränade vi i ösregn, och även om det var kallt och blött så var det en av de roligaste träningarna på länge. Det är något med regn som gör att man släpper alla ursäkter och bara kör. Bollen rullar snabbare, tacklingarna blir tuffare och man känner sig nästan ostoppbar. Älskar den känslan.", "https://placehold.co/180x180?text=Timo")
			]);

			var jaxon = await SeedUserAsync("jaxon.rydelius@athletiqa.local", "Jaxon", "Rydelius", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Male,
				Sport = "Ishockey",
				Bio = "Jag brinner för fart, lagspel och intensitet. Oavsett om det är på isen eller i hallen ger jag allt för att utvecklas som spelare. Jag tränar för att bli snabbare, starkare och smartare i spelet. Lagkänslan betyder allt för mig, och jag älskar att kämpa tillsammans mot nya mål och större utmaningar."
			});
			await AddPostsToAthlete(jaxon.Id,
			[
			("Isen var perfekt idag", "Träningen idag var en av de bästa på länge. Isen var snabb, skridskorna kändes lätta och jag fick till flera riktigt bra skott. Det är sådana pass som påminner mig om varför jag älskar hockey så mycket – känslan av fart, precision och total fokus. Jag gick av isen med ett stort leende.", "https://placehold.co/180x180?text=Jaxon"),

				("Dubbelpass!", "Idag körde jag både hockey och innebandy, och även om kroppen är helt slut så är jag fylld av energi. Det är något speciellt med att växla mellan två sporter som båda kräver snabbhet, teknik och explosivitet. Jag känner verkligen hur de kompletterar varandra och gör mig bättre som atlet. En riktigt bra träningsdag.", "https://placehold.co/180x180?text=Jaxon")
			]);

			var leya = await SeedUserAsync("leya.norstrom@athletiqa.local", "Leya", "Norström", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Female,
				Sport = "Ridsport",
				Bio = "Hästar är min passion och min motivation. Jag tränar för att bygga ett starkt partnerskap med min häst och utvecklas både tekniskt och mentalt. Varje ridpass lär mig något nytt om balans, fokus och tålamod. Jag strävar efter att växa som ryttare och alltid ge mitt bästa — både i träning och på tävling."
			});
			await AddPostsToAthlete(leya.Id,
			[
			("Magiskt ridpass", "Idag hade jag ett av de där passen där allt bara stämmer. Min häst var fokuserad, mjuk i munnen och lyhörd för minsta signal. Vi jobbade mycket med övergångar och samling, och det kändes som vi tog flera steg framåt tillsammans. Det är sådana stunder som gör all träning värd det.", "https://placehold.co/180x180?text=Leya"),

				("Tävlingshelg!", "Nu är det äntligen dags för tävling igen och jag är både nervös och supertaggad. Vi har tränat hårt den senaste tiden och jag känner att vi är redo att visa vad vi kan. Oavsett resultat vill jag bara gå in med lugn, fokus och glädje. Det ska bli så kul att tävla igen.", "https://placehold.co/180x180?text=Leya")
			]);

			var vidar = await SeedUserAsync("vidar.holmkvist@athletiqa.local", "Vidar", "Holmkvist", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Male,
				Sport = "FriIdrott",
				Bio = "Jag älskar explosivitet, snabbhet och att pressa kroppen till max. Friidrotten ger mig fokus och precision, medan basketen ger mig energi och lagkänsla. Jag tränar för att bli starkare, snabbare och mer uthållig, och jag motiveras av att slå mina egna rekord. Varje dag är en chans att ta ett steg framåt."
			});
			await AddPostsToAthlete(vidar.Id,
			[
			("Ny höjd i längdhoppet!", "Idag slog jag ett nytt träningsrekord i längdhopp och känslan var helt otrolig. Jag har jobbat mycket med ansatsen och tajmingen, och det märktes verkligen i hoppet. Det är så motiverande när man ser att allt slit börjar ge resultat. Nu vill jag bara fortsätta pressa gränserna och se hur långt jag kan ta det.", "https://placehold.co/180x180?text=Vidar"),

				("Kvällspass i hallen", "Jag körde ett sent basketpass idag och det var precis vad jag behövde. Hallen var nästan tom, vilket gav mig chansen att fokusera helt på tekniken. Jag sköt hundratals skott och jobbade mycket med rytm och balans. Det är något speciellt med kvällsträning – lugnet, fokuset och känslan av att vara helt inne i spelet.", "https://placehold.co/180x180?text=Vidar")
			]);

			var signe = await SeedUserAsync("signe.vallgren@athletiqa.local", "Signe", "Vallgren", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Female,
				Sport = "Volleyboll",
				Bio = "Volleyboll är min passion och min största utmaning. Jag tränar för att förbättra min teknik, min spelförståelse och min styrka. Jag älskar känslan av ett perfekt block eller en hård smash, och jag ger alltid allt för laget. Disciplin och vilja tar mig närmare mina mål varje dag."
			});
			await AddPostsToAthlete(signe.Id,
			[
			("Blockfest!", "Träningen idag var helt fantastisk. Jag fick till flera riktigt bra block och kände mig stark och stabil vid nätet. Det är en så mäktig känsla när man tajmar hoppet perfekt och stoppar ett hårt anfall. Jag känner verkligen att jag utvecklas just nu och det gör mig ännu mer motiverad inför kommande matcher.", "https://placehold.co/180x180?text=Signe"),

				("Match på gång", "Vi har match snart och jag känner både pirr och pepp. Laget har tränat hårt och vi har verkligen hittat en bra rytm tillsammans. Jag vill gå in med fokus, energi och glädje – och ge allt från första boll. Nu kör vi!", "https://placehold.co/180x180?text=Signe")
			]);

			var neo = await SeedUserAsync("neo.falkheden@athletiqa.local", "Neo", "Falkheden", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Male,
				Sport = "Tennis",
				Bio = "Jag lever för duellerna, fokuset och precisionen på banan. Varje träning är en chans att finslipa tekniken och utveckla mitt spel. Jag strävar efter att bli starkare mentalt, snabbare i fötterna och mer exakt i varje slag. Jag tror på hårt arbete och att aldrig sluta jaga nästa nivå."
			});
			await AddPostsToAthlete(neo.Id,
			[("Nytt racketgrepp – ny känsla", "Idag bytte jag grepp på racketen och det gjorde en enorm skillnad. Plötsligt kändes varje slag mer stabilt och kontrollerat, och jag kunde fokusera mer på tekniken än på att hålla racketen på plats. Det är fascinerande hur stor skillnad rätt verktyg kan göra!", "https://placehold.co/180x180?text=Neo")]);


			var elion = await SeedUserAsync("elion.markev@athletiqa.local", "Elion", "Markev", "200001011234", Roles.Athlete, "", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Male,
				Sport = "Bordtennis",
				Bio = "Jag trivs bäst där tempot är högt och reaktionerna måste sitta direkt. Jag tränar för att förbättra min precision, min snabbhet och min taktik. Varje match är en mental och fysisk utmaning som jag älskar att ta mig an. Jag strävar efter att utvecklas varje dag och alltid spela med fokus och vilja."
			});
			await AddPostsToAthlete(elion.Id,
			[
			("Snabbaste reflexerna hittills", "Träningen idag var riktigt intensiv och jag kände att mina reflexer var snabbare än någonsin. Vi körde många övningar med kort reaktionstid, snabba bollar och oväntade vinklar, och jag lyckades hänga med på ett sätt jag inte gjort tidigare. Det är en grym känsla när kroppen svarar direkt och man nästan hinner tänka efter först efter slaget. Sådana pass gör mig ännu mer taggad på att fortsätta utvecklas.", "https://placehold.co/180x180?text=Elion"),

				("Badmintonpass med fokus på smashar", "Idag ägnade jag nästan hela passet åt att nöta smashar. Jag jobbade mycket med fotarbete, tajming och att verkligen få kraft från hela kroppen, inte bara armen. I början kändes det stelt, men efter ett tag började träffarna sitta bättre och bättre. Det är sjukt kul att känna hur tekniken sakta faller på plats och slagen blir både hårdare och mer precisa.", "https://placehold.co/180x180?text=Elion")
			]);




			// Alice with Athlete Profile
			var alice = await SeedUserAsync("alice.seed@athletiqa.local", "Alice", "Athlete", "200001011234", Roles.Athlete, "acc_1234567890", new AthleteProfile
			{
				User = null!,
				DateOfBirth = new DateTime(2000, 01, 01),
				Gender = backend.Domain.Enums.Gender.Female,
				Sport = "CrossFit",
				Bio = "Siktar på pallen nästa år!",
				DreamGoal = "Tävla i Games"
			});

			// Bob with Sponsor Profile
			var bob = await SeedUserAsync("bob.seed@athletiqa.local", "Bob", "Sponsor", "198505056789", Roles.SponsorUser, "", new SponsorProfile
			{
				User = null!,
				Name = "Bobs Gym & Co",
				OrganisationNumber = "556677-8899",
				SponsorTypeId = backend.Domain.Enums.SponsorCategory.Individual,
				Description = "Vi stöttar lokala talanger."
			});

			var erikCompany = await SeedUserAsync("erikcompany.seed@athletiqa.local", "Erik", "Company", "189001059808", Roles.SponsorCompanyUser, "", new SponsorProfile
			{
				User = null!,
				Name = "Eriks & Co",
				OrganisationNumber = "101010-8899",
				SponsorTypeId = backend.Domain.Enums.SponsorCategory.Company,
				Description = "Vi på Erik Co är väldigt generösa."
			});

			var charlie = await SeedUserAsync(
				"david.seed@athletiqa.local", "David", "Athlete",
				"199005056789", Roles.Athlete, "acct_1TRSppAu7dS5p4LY");

			// Only seed the conversation once
			var alreadySeeded = await db.Conversation
				.AnyAsync(c =>
					(c.FirstUserId == alice.Id && c.SecondUserId == bob.Id) ||
					(c.FirstUserId == bob.Id && c.SecondUserId == alice.Id));

			// Seeds conversations between bob and alice

			if (!alreadySeeded)
			{
				var convo = new Conversation
				{
					FirstUserId = alice.Id,
					SecondUserId = bob.Id,
					Messages = {
							new Message { SenderId = alice.Id, Content = "Hej! Tack för att du vill sponsra.", TimeStamp = DateTime.UtcNow.AddMinutes(-10) },
							new Message { SenderId = bob.Id,   Content = "Absolut, berätta mer om dina mål.", TimeStamp = DateTime.UtcNow.AddMinutes(-8) },
							new Message { SenderId = alice.Id, Content = "Jag siktar på SM nästa år.", TimeStamp = DateTime.UtcNow.AddMinutes(-5) }
						}
				};
				db.Conversation.Add(convo);
				await db.SaveChangesAsync();
			}
			var postExists = await db.Post.AnyAsync(p => p.AthleteId == alice.Id);
			if (!postExists)
			{
				var post = new Post
				{
					AthleteId = alice.Id,
					CreatedBy = alice.Id,
					Title = "Hjälp mig nå mitt mål!",
					Content = "Jag siktar på SM nästa år och behöver din hjälp.",
				};
				db.Post.Add(post);
				await db.SaveChangesAsync();

				db.DonationCampaign.Add(new DonationCampaign
				{
					PostId = post.PostId,
					GoalAmount = 1000,
					CurrentAmount = 0,
					Deadline = DateTime.UtcNow.AddMonths(3),
				});
				await db.SaveChangesAsync();
			}

			var charlieProfile = await db.AthleteProfile.FirstOrDefaultAsync(a => a.UserId == charlie.Id);

			if (charlieProfile == null)
			{
				charlieProfile = new AthleteProfile
				{
					UserId = charlie.Id,
					User = await db.AppUsers.FirstAsync(u => u.UserId == charlie.Id),
					DateOfBirth = new DateTime(1999, 3, 3),
					Gender = backend.Domain.Enums.Gender.Male,
				};
				db.AthleteProfile.Add(charlieProfile);
				await db.SaveChangesAsync();
			}

			var charliePostExists = await db.Post.AnyAsync(p => p.AthleteId == charlie.Id);
			if (!charliePostExists)
			{
				var post = new Post
				{
					AthleteId = charlie.Id,
					CreatedBy = charlie.Id,
					Title = "Stötta min träning!",
					Content = "Jag tränar inför riksmästerskapen och behöver hjälp med utrustning.",
				};
				db.Post.Add(post);
				await db.SaveChangesAsync();

				db.DonationCampaign.Add(new DonationCampaign
				{
					PostId = post.PostId,
					GoalAmount = 500,
					CurrentAmount = 0,
					Deadline = DateTime.UtcNow.AddMonths(2),
				});
				await db.SaveChangesAsync();
			}

			// Upgrade older databases: give the debug seed posts/comments real titles and text.
			// Must run before the SeedPostAsync calls below, which look posts up by title.
			async Task RenameSeedPostAsync(string athleteId, string oldTitle, string newTitle, string newContent)
			{
				var post = await db.Post.FirstOrDefaultAsync(p => p.AthleteId == athleteId && p.Title == oldTitle);
				if (post is null) return;
				post.Title = newTitle;
				post.Content = newContent;
				await db.SaveChangesAsync();
			}
			await RenameSeedPostAsync(alice.Id, "Seed image only", "Morgonpass på konstgräset", "Började dagen med ett tidigt pass på konstgräset: passningar, avslut och extra fokus på vänsterfoten. Det känns som att formen är på väg åt rätt håll inför säsongen!");
			await RenameSeedPostAsync(alice.Id, "Seed video only", "Teknikträning med laget", "Kvällens pass handlade om snabba vändningar och bollmottagning under press. Tränaren filmade allt så att vi kunde gå igenom detaljerna efteråt – supernyttigt!");
			await RenameSeedPostAsync(alice.Id, "Seed mixed media", "Bilder från helgens match", "Vilken helg! Vi vann med 3–1 och jag fick göra ett av målen. Här är några bilder från matchen – tack till alla som kom och hejade!");
			await RenameSeedPostAsync(alice.Id, "Seed completed mixed campaign", "Nya fotbollsskor inför säsongen", "Tack vare er har jag kunnat köpa nya skor och benskydd inför säsongen. Insamlingen är full – tusen tack till alla som stöttade!");
			await RenameSeedPostAsync(adison.Id, "Seed tennis equipment campaign", "Ny tennisutrustning inför tävlingssäsongen", "Mina racketar och skor är slitna efter ett långt år av träning. Med ert stöd kan jag skaffa ny utrustning och fortsätta satsa mot SM.");
			await RenameSeedPostAsync(gustavo.Id, "Seed basketball travel campaign", "Resa till basketlägret i Spanien", "I sommar har jag chansen att åka på ett internationellt basketläger i Spanien. Varje bidrag hjälper mig att täcka resa och boende.");
			await RenameSeedPostAsync(mira.Id, "Seed gymnastics media campaign", "Tävlingsdräkt och träningsläger", "Jag har tagit mig till regionfinalen i gymnastik! Nu samlar jag in till en ny tävlingsdräkt och ett veckolångt träningsläger.");
			await db.Comment.Where(c => c.Content == "Snygg bild, kul att se utvecklingen!").ExecuteUpdateAsync(c => c.SetProperty(x => x.Content, "Snyggt pass, kul att se utvecklingen!"));
			await db.Comment.Where(c => c.Content == "Videon fungerar bra i flödet.").ExecuteUpdateAsync(c => c.SetProperty(x => x.Content, "Grym teknik, ser ut som ett riktigt bra pass!"));
			await db.Comment.Where(c => c.Content == "Bra test för flera medier i samma inlägg.").ExecuteUpdateAsync(c => c.SetProperty(x => x.Content, "Grattis till segern, vilket mål!"));
			await db.Comment.Where(c => c.Content == "Det här borde synas korrekt i modalen.").ExecuteUpdateAsync(c => c.SetProperty(x => x.Content, "Snygga bilder! Lycka till i nästa match."));

			var aliceImagePost = await SeedPostAsync(
				alice.Id,
				"Morgonpass på konstgräset",
				"Började dagen med ett tidigt pass på konstgräset: passningar, avslut och extra fokus på vänsterfoten. Det känns som att formen är på väg åt rätt håll inför säsongen!",
				[]);

			var aliceVideoPost = await SeedPostAsync(
				alice.Id,
				"Teknikträning med laget",
				"Kvällens pass handlade om snabba vändningar och bollmottagning under press. Tränaren filmade allt så att vi kunde gå igenom detaljerna efteråt – supernyttigt!",
				[]);

			var aliceMixedPost = await SeedPostAsync(
				alice.Id,
				"Bilder från helgens match",
				"Vilken helg! Vi vann med 3–1 och jag fick göra ett av målen. Här är några bilder från matchen – tack till alla som kom och hejade!",
				[]);

			var completedCampaignPost = await SeedPostAsync(
				alice.Id,
				"Nya fotbollsskor inför säsongen",
				"Tack vare er har jag kunnat köpa nya skor och benskydd inför säsongen. Insamlingen är full – tusen tack till alla som stöttade!",
				[]);

			var completedCampaign = await SeedCampaignAsync(
				completedCampaignPost,
				goalAmount: 1500,
				currentAmount: 1500,
				deadline: DateTime.UtcNow.AddDays(-7));

			var adisonCampaignPost = await SeedPostAsync(
				adison.Id,
				"Ny tennisutrustning inför tävlingssäsongen",
				"Mina racketar och skor är slitna efter ett långt år av träning. Med ert stöd kan jag skaffa ny utrustning och fortsätta satsa mot SM.",
				[]);

			await SeedCampaignAsync(
				adisonCampaignPost,
				goalAmount: 2500,
				currentAmount: 450,
				deadline: DateTime.UtcNow.AddMonths(2));

			var gustavoCampaignPost = await SeedPostAsync(
				gustavo.Id,
				"Resa till basketlägret i Spanien",
				"I sommar har jag chansen att åka på ett internationellt basketläger i Spanien. Varje bidrag hjälper mig att täcka resa och boende.",
				[]);

			await SeedCampaignAsync(
				gustavoCampaignPost,
				goalAmount: 3200,
				currentAmount: 900,
				deadline: DateTime.UtcNow.AddMonths(3));

			var miraCampaignPost = await SeedPostAsync(
				mira.Id,
				"Tävlingsdräkt och träningsläger",
				"Jag har tagit mig till regionfinalen i gymnastik! Nu samlar jag in till en ny tävlingsdräkt och ett veckolångt träningsläger.",
				[]);

			await SeedCampaignAsync(
				miraCampaignPost,
				goalAmount: 4000,
				currentAmount: 1200,
				deadline: DateTime.UtcNow.AddMonths(4));

			var aliceCampaign = await db.DonationCampaign
				.Include(c => c.Post)
				.Where(c => c.Post.AthleteId == alice.Id)
				.OrderBy(c => c.DonationCampaignId)
				.FirstAsync();

			var charlieCampaign = await db.DonationCampaign
				.Include(c => c.Post)
				.Where(c => c.Post.AthleteId == charlie.Id)
				.OrderBy(c => c.DonationCampaignId)
				.FirstAsync();

			await SeedCommentAsync(aliceImagePost, bob.Id, "Snyggt pass, kul att se utvecklingen!", DateTime.UtcNow.AddHours(-8));
			await SeedCommentAsync(aliceVideoPost, erikCompany.Id, "Grym teknik, ser ut som ett riktigt bra pass!", DateTime.UtcNow.AddHours(-7));
			await SeedCommentAsync(aliceMixedPost, bob.Id, "Grattis till segern, vilket mål!", DateTime.UtcNow.AddHours(-6));
			await SeedCommentAsync(aliceMixedPost, charlie.Id, "Snygga bilder! Lycka till i nästa match.", DateTime.UtcNow.AddHours(-5));

			await SeedLikeAsync(aliceImagePost, bob.Id);
			await SeedLikeAsync(aliceVideoPost, bob.Id);
			await SeedLikeAsync(aliceMixedPost, bob.Id);
			await SeedLikeAsync(aliceMixedPost, erikCompany.Id);
			await SeedLikeAsync(completedCampaignPost, charlie.Id);

			await SeedDonationAsync(aliceCampaign, bob.Id, 100, "succeeded", "seed_bob_donation_001", "Bobs Gym & Co");
			await SeedDonationAsync(charlieCampaign, bob.Id, 150, "succeeded", "seed_bob_donation_002", "Bobs Gym & Co");
			await SeedDonationAsync(completedCampaign, bob.Id, 200, "succeeded", "seed_bob_donation_003", "Bobs Gym & Co");
			await SeedDonationAsync(aliceCampaign, bob.Id, 250, "succeeded", "seed_bob_donation_004", "Bobs Gym & Co");
			await SeedDonationAsync(charlieCampaign, bob.Id, 300, "succeeded", "seed_bob_donation_005", "Bobs Gym & Co");
			await SeedDonationAsync(aliceCampaign, erikCompany.Id, 500, "expired", "seed_erik_donation_expired_001", "Eriks & Co");

			// Seeded posts get real photos. Posts whose media was uploaded by a real user are left untouched.
			static bool IsPlaceholderMedia(string url) =>
				url.Contains("placehold.co") || url.Contains("res.cloudinary.com/demo/");

			foreach (var (title, urls) in seedPhotos)
			{
				var posts = await db.Post
					.Include(p => p.MediaContents)
					.Where(p => p.Title == title)
					.ToListAsync();

				foreach (var post in posts)
				{
					if (post.MediaContents.Any(m => !IsPlaceholderMedia(m.MediaUrl)))
						continue;

					db.MediaContent.RemoveRange(post.MediaContents);
					post.MediaContents.Clear();
					foreach (var url in urls)
					{
						post.MediaContents.Add(new MediaContent { MediaUrl = url, MediaType = MediaType.Image });
					}
				}
			}
			await db.SaveChangesAsync();

		}
	}
}
