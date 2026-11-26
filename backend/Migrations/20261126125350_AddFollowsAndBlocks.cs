using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFollowsAndBlocks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AthleteFollow",
                columns: table => new
                {
                    AthleteFollowId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FollowerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AthleteId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AthleteFollow", x => x.AthleteFollowId);
                    table.ForeignKey(
                        name: "FK_AthleteFollow_AppUsers_FollowerId",
                        column: x => x.FollowerId,
                        principalTable: "AppUsers",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_AthleteFollow_AthleteProfile_AthleteId",
                        column: x => x.AthleteId,
                        principalTable: "AthleteProfile",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "UserBlock",
                columns: table => new
                {
                    UserBlockId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BlockerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BlockedId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBlock", x => x.UserBlockId);
                    table.ForeignKey(
                        name: "FK_UserBlock_AppUsers_BlockedId",
                        column: x => x.BlockedId,
                        principalTable: "AppUsers",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_UserBlock_AppUsers_BlockerId",
                        column: x => x.BlockerId,
                        principalTable: "AppUsers",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AthleteFollow_AthleteId",
                table: "AthleteFollow",
                column: "AthleteId");

            migrationBuilder.CreateIndex(
                name: "IX_AthleteFollow_FollowerId_AthleteId",
                table: "AthleteFollow",
                columns: new[] { "FollowerId", "AthleteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserBlock_BlockedId",
                table: "UserBlock",
                column: "BlockedId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBlock_BlockerId_BlockedId",
                table: "UserBlock",
                columns: new[] { "BlockerId", "BlockedId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AthleteFollow");

            migrationBuilder.DropTable(
                name: "UserBlock");
        }
    }
}
