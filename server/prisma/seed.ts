import { PrismaClient, UserRole, SportType, TournamentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

async function main() {
  console.log("🌱 Seeding CSEPL Database...");

  // 1. Create Super Admin
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@cse.cu.ac.bd" },
    update: {},
    create: {
      studentId: "ADMIN01",
      name: "CSE Dept Administrator",
      email: "admin@cse.cu.ac.bd",
      password: adminPassword,
      role: UserRole.ADMIN,
      isTemporaryPassword: false,
      bio: "Department of Computer Science & Engineering, University of Chittagong.",
    }
  });
  console.log("✅ Admin user ready:", admin.email);

  // 2. Create Batches (18th to 25th)
  const batchData = [
    { batchNumber: 18, name: "18th Batch", session: "2016-17", slug: "batch-18", slogan: "The Veteran Titans" },
    { batchNumber: 19, name: "19th Batch", session: "2017-18", slug: "batch-19", slogan: "The Legacy Pioneers" },
    { batchNumber: 20, name: "20th Batch", session: "2018-19", slug: "batch-20", slogan: "The Invincible Titans" },
    { batchNumber: 21, name: "21st Batch", session: "2019-20", slug: "batch-21", slogan: "The Red Brick Warriors" },
    { batchNumber: 22, name: "22nd Batch", session: "2020-21", slug: "batch-22", slogan: "The Rising Royals" },
    { batchNumber: 23, name: "23rd Batch", session: "2021-22", slug: "batch-23", slogan: "The Challengers" },
    { batchNumber: 24, name: "24th Batch", session: "2022-23", slug: "batch-24", slogan: "The Spark Pioneers" },
    { batchNumber: 25, name: "25th Batch", session: "2023-24", slug: "batch-25", slogan: "The Fresh Gladiators" },
  ];

  const batchesMap = new Map<number, number>();
  for (const b of batchData) {
    const batch = await prisma.batch.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
    batchesMap.set(b.batchNumber, batch.id);
  }
  console.log(`✅ Created ${batchesMap.size} Academic Batches.`);

  // 3. Create Sample Players with Temporary Passwords
  const playersData = [
    { studentId: "19701042", name: "Sanzid Rahman", email: "sanzid@cse.cu.ac.bd", batchNum: 20, cricketRole: "🏏 Top-Order Bat", footballPosition: "⚽ Forward" },
    { studentId: "19701015", name: "Tanvir Ahmed", email: "tanvir@cse.cu.ac.bd", batchNum: 20, cricketRole: "🏏 All-Rounder", footballPosition: "⚽ Midfielder" },
    { studentId: "20701004", name: "Farhan Kabir", email: "farhan@cse.cu.ac.bd", batchNum: 21, cricketRole: "🏏 Fast Bowler", footballPosition: "⚽ Defender" },
    { studentId: "20701028", name: "Rafid Hasan", email: "rafid@cse.cu.ac.bd", batchNum: 21, cricketRole: "🏏 Top-Order Bat", footballPosition: "⚽ Forward" },
    { studentId: "21701033", name: "Nahid Islam", email: "nahid@cse.cu.ac.bd", batchNum: 22, cricketRole: "🏏 Spin Bowler", footballPosition: "⚽ Midfielder" },
    { studentId: "21701050", name: "Shakil Hossain", email: "shakil@cse.cu.ac.bd", batchNum: 22, cricketRole: "🏏 All-Rounder", footballPosition: "⚽ Forward" },
    { studentId: "22701012", name: "Arif Chowdhury", email: "arif@cse.cu.ac.bd", batchNum: 23, cricketRole: "🏏 Wicketkeeper", footballPosition: "⚽ Goalkeeper" },
    { studentId: "23701008", name: "Samiul Haque", email: "samiul@cse.cu.ac.bd", batchNum: 24, cricketRole: "🏏 All-Rounder", footballPosition: "⚽ Midfielder" },
  ];

  const createdUsers: any[] = [];
  for (const p of playersData) {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let rand = "";
    for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    const tempPass = `CSEPL@${rand}`;
    const hashed = await hashPassword(tempPass);
    const user = await prisma.user.upsert({
      where: { studentId: p.studentId },
      update: {
        temporaryPlainPassword: tempPass,
      },
      create: {
        studentId: p.studentId,
        name: p.name,
        email: p.email,
        password: hashed,
        isTemporaryPassword: true,
        temporaryPlainPassword: tempPass,
        batchId: batchesMap.get(p.batchNum),
        cricketRole: p.cricketRole,
        footballPosition: p.footballPosition,
        role: UserRole.USER,
      }
    });
    createdUsers.push(user);
  }
  console.log(`✅ Created ${createdUsers.length} initial Players with Random Temporary Passwords.`);

  // 4. Create Tournaments
  const cricketTourn = await prisma.tournament.upsert({
    where: { slug: "cpl-2026-cricket-t10" },
    update: {},
    create: {
      name: "CSE Premier League 2026",
      slug: "cpl-2026-cricket-t10",
      sport: SportType.CRICKET,
      season: "2026",
      status: TournamentStatus.ONGOING,
      rules: { overs: 10, maxPerBowler: 2, powerplay: 2, pointsWin: 2, pointsTie: 1 },
    }
  });

  const footballTourn = await prisma.tournament.upsert({
    where: { slug: "cse-futsal-champions-cup-2026" },
    update: {},
    create: {
      name: "CSE Futsal Champions Cup 2026",
      slug: "cse-futsal-champions-cup-2026",
      sport: SportType.FOOTBALL,
      season: "2026",
      status: TournamentStatus.ONGOING,
      rules: { halfMinutes: 20, format: "7-a-side", pointsWin: 3, pointsDraw: 1 },
    }
  });
  console.log("✅ Created Tournaments:", cricketTourn.name, "&", footballTourn.name);

  // 5. Delegate Organizers
  if (createdUsers.length >= 4) {
    await prisma.tournamentOrganizer.createMany({
      data: [
        { tournamentId: cricketTourn.id, userId: createdUsers[0].id }, // Sanzid
        { tournamentId: cricketTourn.id, userId: createdUsers[1].id }, // Tanvir
        { tournamentId: footballTourn.id, userId: createdUsers[3].id }, // Rafid
        { tournamentId: footballTourn.id, userId: createdUsers[4].id }, // Nahid
      ],
      skipDuplicates: true,
    });
    console.log("✅ Assigned Organizers for Tournaments.");
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
