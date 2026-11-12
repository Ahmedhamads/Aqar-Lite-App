
import "dotenv/config";

import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Prisma,
  PrismaClient,
} from "../src/generated/prisma/client";

const databaseUrl = process.env["DATABASE_URL"];
const defaultPassword = process.env["SEED_DEFAULT_PASSWORD"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (!defaultPassword || defaultPassword.length < 12) {
  throw new Error(
    "SEED_DEFAULT_PASSWORD must contain at least 12 characters"
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

type SeedCompany = {
  id: string;
  name: string;
  projectName: string;
  users: {
    id: string;
    name: string;
    email: string;
    role: "MANAGER" | "ACCOUNTANT" | "SALES";
  }[];
  units: {
    id: string;
    unitNumber: string;
    type: string;
    area: string;
    rooms: number;
    price: string;
  }[];
  clients: {
    id: string;
    name: string;
    phone: string;
    notes: string;
    salesRepIndex: number;
  }[];
};

async function seedCompany(
  company: SeedCompany,
  passwordHash: string
): Promise<void> {
  await prisma.company.upsert({
    where: {
      id: company.id,
    },
    create: {
      id: company.id,
      name: company.name,
    },
    update: {},
  });

  // Seed company users.
  for (const user of company.users) {
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      create: {
        id: user.id,
        companyId: company.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        isActive: true,
      },
      update: {},
    });
  }

  // Seed company units.
  for (const unit of company.units) {
    await prisma.unit.upsert({
      where: {
        companyId_projectName_unitNumber: {
          companyId: company.id,
          projectName: company.projectName,
          unitNumber: unit.unitNumber,
        },
      },
      create: {
        id: unit.id,
        companyId: company.id,
        projectName: company.projectName,
        unitNumber: unit.unitNumber,
        type: unit.type,
        area: new Prisma.Decimal(unit.area),
        rooms: unit.rooms,
        price: new Prisma.Decimal(unit.price),
        status: "AVAILABLE",
      },
      update: {},
    });
  }

  // Seed company clients.
  for (const client of company.clients) {
    const salesRep = company.users[client.salesRepIndex];

    if (!salesRep || salesRep.role !== "SALES") {
      throw new Error(
        `Invalid sales representative for client ${client.name}`
      );
    }

    await prisma.client.upsert({
      where: {
        id: client.id,
      },
      create: {
        id: client.id,
        companyId: company.id,
        salesRepId: salesRep.id,
        name: client.name,
        phone: client.phone,
        notes: client.notes,
      },
      update: {},
    });
  }

  console.log(`Seeded company: ${company.name}`);
}

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
  });

  const companies: SeedCompany[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Green Estate",
      projectName: "Green Valley",

      users: [
        {
          id: "11111111-1111-4111-8111-111111111112",
          name: "Green Manager",
          email: "manager@green-estate.test",
          role: "MANAGER",
        },
        {
          id: "11111111-1111-4111-8111-111111111113",
          name: "Green Accountant",
          email: "accountant@green-estate.test",
          role: "ACCOUNTANT",
        },
        {
          id: "11111111-1111-4111-8111-111111111114",
          name: "Green Sales One",
          email: "sales1@green-estate.test",
          role: "SALES",
        },
        {
          id: "11111111-1111-4111-8111-111111111115",
          name: "Green Sales Two",
          email: "sales2@green-estate.test",
          role: "SALES",
        },
      ],

      units: [
        {
          id: "11111111-1111-4111-8111-111111111201",
          unitNumber: "A-101",
          type: "Apartment",
          area: "120.00",
          rooms: 3,
          price: "1500000.00",
        },
        {
          id: "11111111-1111-4111-8111-111111111202",
          unitNumber: "A-102",
          type: "Apartment",
          area: "145.50",
          rooms: 3,
          price: "1850000.00",
        },
        {
          id: "11111111-1111-4111-8111-111111111203",
          unitNumber: "V-101",
          type: "Villa",
          area: "220.00",
          rooms: 4,
          price: "3200000.00",
        },
      ],

      clients: [
        {
          id: "11111111-1111-4111-8111-111111111301",
          name: "Ahmed Hassan",
          phone: "01010000001",
          notes: "Interested in a three-bedroom apartment.",
          salesRepIndex: 2,
        },
        {
          id: "11111111-1111-4111-8111-111111111302",
          name: "Mohamed Ali",
          phone: "01010000002",
          notes: "Looking for a family apartment.",
          salesRepIndex: 3,
        },
      ],
    },

    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Horizon Properties",
      projectName: "Horizon Residence",

      users: [
        {
          id: "22222222-2222-4222-8222-222222222223",
          name: "Horizon Manager",
          email: "manager@horizon-estate.test",
          role: "MANAGER",
        },
        {
          id: "22222222-2222-4222-8222-222222222224",
          name: "Horizon Accountant",
          email: "accountant@horizon-estate.test",
          role: "ACCOUNTANT",
        },
        {
          id: "22222222-2222-4222-8222-222222222225",
          name: "Horizon Sales One",
          email: "sales1@horizon-estate.test",
          role: "SALES",
        },
        {
          id: "22222222-2222-4222-8222-222222222226",
          name: "Horizon Sales Two",
          email: "sales2@horizon-estate.test",
          role: "SALES",
        },
      ],

      units: [
        {
          id: "22222222-2222-4222-8222-222222222301",
          unitNumber: "B-101",
          type: "Apartment",
          area: "110.00",
          rooms: 2,
          price: "1300000.00",
        },
        {
          id: "22222222-2222-4222-8222-222222222302",
          unitNumber: "B-102",
          type: "Apartment",
          area: "160.00",
          rooms: 4,
          price: "2100000.00",
        },
        {
          id: "22222222-2222-4222-8222-222222222303",
          unitNumber: "V-201",
          type: "Villa",
          area: "250.00",
          rooms: 5,
          price: "3900000.00",
        },
      ],

      clients: [
        {
          id: "22222222-2222-4222-8222-222222222401",
          name: "Omar Mahmoud",
          phone: "01020000001",
          notes: "Interested in a two-bedroom apartment.",
          salesRepIndex: 2,
        },
        {
          id: "22222222-2222-4222-8222-222222222402",
          name: "Mostafa Samir",
          phone: "01020000002",
          notes: "Interested in a villa.",
          salesRepIndex: 3,
        },
      ],
    },
  ];

  for (const company of companies) {
    await seedCompany(company, passwordHash);
  }

  console.log("==================================");
  console.log("Aqar Lite seed completed!");
  console.log("Companies: 2");
  console.log("Users: 8");
  console.log("Units: 6");
  console.log("Clients: 4");
  console.log("==================================");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
