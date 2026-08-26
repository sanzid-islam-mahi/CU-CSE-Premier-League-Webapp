import { PrismaClient, UserRole, SportType, TournamentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

function generateRandomPassword(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let rand = "";
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CSEPL@${rand}`;
}

async function main() {
  console.log("🌱 Cleaning and Seeding CSEPL Database...");

  // 1. Create Super Admin
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@cse.cu.ac.bd" },
    update: {
      password: adminPassword,
      role: UserRole.ADMIN,
      isTemporaryPassword: false,
    },
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

  // Clean old users (except admin) and batches to ensure fresh pattern
  await prisma.tournamentOrganizer.deleteMany({});
  await prisma.matchScorer.deleteMany({});
  await prisma.matchSquad.deleteMany({});
  await prisma.cricketBall.deleteMany({});
  await prisma.cricketBattingScorecard.deleteMany({});
  await prisma.cricketBowlingScorecard.deleteMany({});
  await prisma.cricketInnings.deleteMany({});
  await prisma.footballMatchEvent.deleteMany({});
  await prisma.footballMatchDetail.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: { not: "admin@cse.cu.ac.bd" }
    }
  });
  await prisma.batch.deleteMany({});

  // 2. Create the 6 Requested Batches
  const batchData = [
    { batchNumber: 21, name: "Anabil 21", session: "2020-2021", slug: "batch-21", slogan: "The Incessant Wave" },
    { batchNumber: 22, name: "Dwimik 22", session: "2021-2022", slug: "batch-22", slogan: "The Binary Force" },
    { batchNumber: 23, name: "Adhrubo 23", session: "2022-2023", slug: "batch-23", slogan: "The Steadfast Titans" },
    { batchNumber: 24, name: "24th Batch", session: "2023-2024", slug: "batch-24", slogan: "The Spark Pioneers" },
    { batchNumber: 25, name: "25th Batch", session: "2024-2025", slug: "batch-25", slogan: "The Fresh Gladiators" },
    { batchNumber: 26, name: "26th Batch", session: "2025-2026", slug: "batch-26", slogan: "The Rising Stars" },
  ];

  const batchesMap = new Map<number, number>();
  for (const b of batchData) {
    const batch = await prisma.batch.create({
      data: b,
    });
    batchesMap.set(b.batchNumber, batch.id);
  }
  console.log(`✅ Created ${batchesMap.size} Batches (Anabil 21 to 26th Batch).`);

  // 3. 20 Players per Batch Names Roster
  const batchRosters: Record<number, string[]> = {
    21: [
      "Sanzid Rahman", "Tanvir Ahmed", "Shakil Hossain", "Mahmudul Hasan", "Farhan Kabir",
      "Asif Mahmud", "Naimur Rahman", "Rifat Hosen", "Shahriar Nafis", "Jubayer Ahmed",
      "Towhidul Islam", "Sadek Ali", "Ahsan Habib", "Mehedi Hasan", "Zubair Hossain",
      "Fahim Faysal", "Imtiaz Ahmed", "Sourav Das", "Pranto Barua", "Amit Roy"
    ],
    22: [
      "Rafid Hasan", "Nahid Islam", "Arif Chowdhury", "Salman Farsi", "Hasan Al Banna",
      "Raihan Uddin", "Mustakim Billah", "Tamzidul Haque", "Abir Hasan", "Shafiul Alam",
      "Zihadul Islam", "Mahir Daiyan", "Joy Dey", "Niloy Barua", "Shuvo Paul",
      "Tariqul Islam", "Emran Nazir", "Kazi Maruf", "Saiful Karim", "Al Amin"
    ],
    23: [
      "Samiul Haque", "Rakibul Islam", "Sajid Karim", "Abdullah Al Mamun", "Tahmidur Rahman",
      "Emon Sikder", "Joynal Abedin", "Nazmul Huda", "Sayeed Anwar", "Kamrul Hasan",
      "Palash Kanti", "Debashish Biswas", "Pritom Roy", "Shanto Das", "Ashraful Islam",
      "Iftekhar Alam", "Muntasir Billah", "Rashedul Karim", "Zahid Hasan", "Monirul Islam"
    ],
    24: [
      "Shahadat Hossain", "Mahbubur Rahman", "Fardeen Khan", "Sazzad Hossain", "Arman Malik",
      "Sadman Sakib", "Alif Chowdhury", "Wasim Akram", "Shawon Paul", "Subrata Ghosh",
      "Anik Barua", "Tausif Ahmed", "Habibur Rahman", "Nafees Imtiaz", "Rony Mia",
      "Jahidul Islam", "Shakhawat Hossain", "Biplob Kumar", "Shanto Karmakar", "Faisal Ahmed"
    ],
    25: [
      "Faridur Reza", "Siam Ahmed", "Miraz Hossain", "Ridwanul Haque", "Nayeem Siddique",
      "Mushfiqur Rahim", "Shakib Al Hasan", "Liton Das", "Mehidy Hasan", "Taskin Ahmed",
      "Shoriful Islam", "Mustafizur Rahman", "Afif Hossain", "Towhid Hridoy", "Tanzid Hasan",
      "Shamim Hossain", "Rishad Hossain", "Tanzim Hasan", "Hasan Mahmud", "Nasum Ahmed"
    ],
    26: [
      "Abrar Fahim", "Fahad Bin Sayed", "Rayhan Kabir", "Mahfuzur Rahman", "Labib Hasan",
      "Ahnaf Tahmid", "Shohanur Rahman", "Dipankar Roy", "Arpan Barua", "Shuvro Dey",
      "Tarek Aziz", "Jubair Al Mahmud", "Shahriar Shuvo", "Imran Nazir", "Rakib Hasan",
      "Alvee Rahman", "Tanmoy Saha", "Nirjhor Chakrabarty", "Shifat Ahmed", "Kazi Abdullah"
    ]
  };

  const createdPlayers: any[] = [];

  for (const [batchNumStr, names] of Object.entries(batchRosters)) {
    const batchNum = parseInt(batchNumStr);
    const batchId = batchesMap.get(batchNum)!;

    for (let i = 0; i < names.length; i++) {
      const rollSuffix = String(i + 1).padStart(3, "0");
      const studentId = `${batchNum}701${rollSuffix}`; // e.g. 21701001..21701020, 22701001..22701020
      const name = names[i];
      const email = `${studentId}@cse.cu.ac.bd`;
      const tempPass = generateRandomPassword();
      const hashedPassword = await hashPassword(tempPass);

      const user = await prisma.user.create({
        data: {
          studentId,
          name,
          email,
          password: hashedPassword,
          isTemporaryPassword: true,
          temporaryPlainPassword: tempPass,
          batchId,
          role: UserRole.USER,
        }
      });
      createdPlayers.push(user);
    }
  }

  console.log(`✅ Created ${createdPlayers.length} total players (20 per batch with random temporary passwords).`);

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
  if (createdPlayers.length >= 6) {
    await prisma.tournamentOrganizer.createMany({
      data: [
        { tournamentId: cricketTourn.id, userId: createdPlayers[0].id },  // Sanzid (Anabil 21)
        { tournamentId: cricketTourn.id, userId: createdPlayers[1].id },  // Tanvir (Anabil 21)
        { tournamentId: footballTourn.id, userId: createdPlayers[20].id }, // Rafid (Dwimik 22)
        { tournamentId: footballTourn.id, userId: createdPlayers[21].id }, // Nahid (Dwimik 22)
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
