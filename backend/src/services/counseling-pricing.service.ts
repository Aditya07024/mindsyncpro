import { User } from "@/models";

export async function getEffectivePricingForUser(userId?: string) {
  const { CounselingPricing } = await import("@/models/counseling-pricing");
  let pricing = await CounselingPricing.findOne();
  if (!pricing) {
    pricing = await CounselingPricing.create({
      schoolStudentFee: 299,
      collegeStudentFee: 499,
      regularPersonFee: 799,
    });
  }

  if (!userId) {
    return {
      fee: pricing.regularPersonFee,
      isOrgCovered: false,
      feeCategory: "regular",
      orgName: undefined,
      seekerUser: null,
    };
  }

  const seekerUser = await User.findById(userId).select("orgId phoneMasked fullName userType studentIdVerificationStatus freeSessionCredits");
  if (!seekerUser) {
    return {
      fee: pricing.regularPersonFee,
      isOrgCovered: false,
      feeCategory: "regular",
      orgName: undefined,
      seekerUser: null,
    };
  }

  let baseFee = pricing.regularPersonFee;
  if (seekerUser.userType === "school_student") {
    baseFee = pricing.schoolStudentFee;
  } else if (seekerUser.userType === "college_student") {
    baseFee = pricing.collegeStudentFee;
  } else {
    baseFee = pricing.regularPersonFee;
  }

  let isOrgCovered = false;
  let orgName: string | undefined = undefined;

  const seekerEmail = (seekerUser.phoneMasked?.includes("@") ? seekerUser.phoneMasked : "").toLowerCase().trim();
  const { Organization } = await import("@/models/organization");
  
  let userOrg = seekerUser.orgId ? await Organization.findById(seekerUser.orgId) : null;
  if (!userOrg && seekerEmail) {
    userOrg = await Organization.findOne({ allowedEmails: seekerEmail, verificationStatus: "verified" });
    if (userOrg && seekerUser) {
      seekerUser.orgId = userOrg._id as any;
      await seekerUser.save();
    }
  }

  if (userOrg && userOrg.verificationStatus === "verified") {
    if (userOrg.coverMemberTherapyFees) {
      isOrgCovered = true;
      baseFee = 0;
      orgName = userOrg.name;
    }
  }

  return {
    fee: baseFee,
    isOrgCovered,
    feeCategory: seekerUser.userType || "regular",
    orgName,
    seekerUser,
  };
}
