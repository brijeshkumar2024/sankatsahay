import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Volunteer from "../models/Volunteer.js";
import SOSAlert from "../models/SOSAlert.js";
import Shelter from "../models/Shelter.js";
import FamilyGroup from "../models/FamilyGroup.js";
import DisasterZone from "../models/DisasterZone.js";

async function seed() {
  await connectDB(process.env.MONGODB_URI);

  await Promise.all([
    User.deleteMany({}),
    Volunteer.deleteMany({}),
    SOSAlert.deleteMany({}),
    Shelter.deleteMany({}),
    FamilyGroup.deleteMany({}),
    DisasterZone.deleteMany({})
  ]);

  const adminHash = await bcrypt.hash("NEXORA2025", 10);
  const demoHash = await bcrypt.hash("demo123", 10);

  const [admin, demoUser, family2, family3, family4] = await User.create([
    {
      name: "Nexora Admin",
      email: "admin@sankatsahay.in",
      password: adminHash,
      role: "admin",
      familyPin: "NEXORA",
      status: "SAFE"
    },
    {
      name: "Demo User",
      email: "demo@user.in",
      password: demoHash,
      role: "user",
      familyPin: "NEXORA",
      status: "SOS ACTIVE"
    },
    {
      name: "Riya",
      email: "riya@family.in",
      password: demoHash,
      role: "user",
      familyPin: "NEXORA",
      status: "MISSING"
    },
    {
      name: "Mohan",
      email: "mohan@family.in",
      password: demoHash,
      role: "user",
      familyPin: "NEXORA",
      status: "SAFE"
    },
    {
      name: "Anita",
      email: "anita@family.in",
      password: demoHash,
      role: "user",
      familyPin: "NEXORA",
      status: "MISSING"
    }
  ]);

  await FamilyGroup.create({
    name: "Demo Family",
    pin: "NEXORA",
    members: [demoUser._id, family2._id, family3._id, family4._id]
  });

  await DisasterZone.create({
    name: "Cuttack Flood Zone",
    severity: "HIGH",
    disasterType: "Flood",
    center: { type: "Point", coordinates: [85.8245, 20.2961] },
    polygon: [
      [85.79, 20.27],
      [85.87, 20.27],
      [85.87, 20.33],
      [85.79, 20.33],
      [85.79, 20.27]
    ],
    radiusKm: 8,
    aiPrediction: {
      foodParcels: 3200,
      waterLiters: 15000,
      medicalKits: 700,
      shelterCapacity: 2200,
      summary: "3,200 food parcels, 15,000L water needed",
      confidence: 0.84,
      sources: ["GDACS", "OpenWeatherMap", "Sensor Fusion"],
      generatedAt: new Date()
    }
  });

  const skills = [
    ["medical", "rescue"],
    ["food", "transport"],
    ["rescue", "tech"],
    ["medical", "food"],
    ["transport", "rescue"],
    ["tech", "food"],
    ["medical", "transport"],
    ["rescue", "food"],
    ["tech", "transport"],
    ["medical", "rescue"],
    ["food", "tech"],
    ["transport", "rescue"]
  ];

  const volunteers = [];
  for (let i = 0; i < 12; i += 1) {
    const user = await User.create({
      name: `Volunteer ${i + 1}`,
      email: `vol${i + 1}@sankatsahay.in`,
      password: demoHash,
      role: "volunteer",
      status: "SAFE"
    });

    volunteers.push({
      userId: user._id,
      skills: skills[i],
      trustScore: 45 + i * 4,
      availability: true,
      status: "available",
      language: i % 2 ? "hi" : "en",
      location: {
        type: "Point",
        coordinates: [85.82 + i * 0.01, 20.29 + i * 0.005]
      }
    });
  }
  await Volunteer.insertMany(volunteers);

  await Shelter.insertMany([
    {
      name: "Cuttack High School Shelter",
      capacity: 500,
      currentOccupancy: 220,
      medicalAvailable: true,
      petFriendly: false,
      accessibility: true,
      location: { type: "Point", coordinates: [85.81, 20.3] }
    },
    {
      name: "Riverside Community Hall",
      capacity: 300,
      currentOccupancy: 150,
      medicalAvailable: false,
      petFriendly: true,
      accessibility: true,
      location: { type: "Point", coordinates: [85.83, 20.31] }
    },
    {
      name: "District Relief Camp",
      capacity: 700,
      currentOccupancy: 480,
      medicalAvailable: true,
      petFriendly: true,
      accessibility: true,
      location: { type: "Point", coordinates: [85.84, 20.28] }
    }
  ]);

  await SOSAlert.insertMany([
    { userId: demoUser._id, mode: "tap", status: "active", location: { type: "Point", coordinates: [85.8245, 20.2961] } },
    { userId: demoUser._id, mode: "voice", status: "responding", location: { type: "Point", coordinates: [85.81, 20.3] } },
    { userId: demoUser._id, mode: "manual", status: "resolved", location: { type: "Point", coordinates: [85.82, 20.29] } },
    { userId: demoUser._id, mode: "auto", status: "active", location: { type: "Point", coordinates: [85.83, 20.31] } },
    { userId: demoUser._id, mode: "tap", status: "responding", location: { type: "Point", coordinates: [85.84, 20.28] } }
  ]);

  // eslint-disable-next-line no-console
  console.log("Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
