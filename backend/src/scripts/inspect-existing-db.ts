import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User, Organization, Subscription, TherapistBooking } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function inspectAll() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const allUsers = await User.find({ deletedAt: null }).select("_id fullName role phoneMasked email createdAt therapistProfile").sort({ createdAt: 1 }).lean();
  const allOrgs = await Organization.find({ deletedAt: null }).select("_id name verificationStatus createdAt").sort({ createdAt: 1 }).lean();

  console.log("=== ALL USERS IN DB (sorted by creation date) ===");
  allUsers.forEach((u, i) => {
    console.log(`${i+1}. ID: ${u._id} | Role: ${u.role} | Name: ${u.fullName} | Phone: ${u.phoneMasked} | Created: ${u.createdAt}`);
  });

  console.log("\n=== ALL ORGS IN DB ===");
  allOrgs.forEach((o, i) => {
    console.log(`${i+1}. ID: ${o._id} | Name: ${o.name} | Status: ${o.verificationStatus} | Created: ${o.createdAt}`);
  });

  await mongoose.disconnect();
}

inspectAll().catch(console.error);
