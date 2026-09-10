import { Request, Response } from "express";
import { Partner, PartnerSectionConfig } from "../models/partner";
import { getPublicUrlForFilename } from "../middleware/upload.middleware";

const DEFAULT_SEED_PARTNERS = [
  {
    name: "Indian Mental Health Foundation",
    category: "NGO",
    logoText: "IMHF",
    description: "Nationwide non-profit working towards grassroots mental health awareness, suicide prevention, and free counseling aid.",
    impactMetric: "50,000+ Lives Impacted",
    location: "New Delhi, India",
    color: "from-rose-500 to-red-600",
    verified: true,
    websiteUrl: "https://www.mymindtherapyfriend.com",
    fullBio: "The Indian Mental Health Foundation partners with mymindtherapyfriend to extend free psychological counseling and digital CBT toolkits to rural schools and underprivileged communities across India.",
  },
  {
    name: "MindCare Enterprise Collective",
    category: "Organization",
    logoText: "MEC",
    description: "Corporate wellness ecosystem delivering confidential mental health resources and ESG compliance reports for companies.",
    impactMetric: "120+ Partner Tech Firms",
    location: "Bengaluru, India",
    color: "from-blue-600 to-indigo-700",
    verified: true,
    websiteUrl: "https://www.mymindtherapyfriend.com",
    fullBio: "MindCare Enterprise Collective collaborates to integrate automated anonymous employee wellness analytics and 24/7 crisis support into corporate health insurance policies.",
  },
  {
    name: "Youth & College Psychology Club",
    category: "Clubs",
    logoText: "YPC",
    description: "Student-led campus wellness club organizing mental health workshops, peer support groups, and stress management seminars.",
    impactMetric: "45+ University Chapters",
    location: "Mumbai, India",
    color: "from-amber-500 to-orange-600",
    verified: true,
    websiteUrl: "https://www.mymindtherapyfriend.com",
    fullBio: "Empowering university students across India with peer support networks, exam anxiety workshops, and direct access to verified counsellors through mymindtherapyfriend.",
  },
  {
    name: "Mann Shanti Community Network",
    category: "Community",
    logoText: "MSCN",
    description: "Active community of peer supporters, mental health advocates, and individuals sharing healing journeys safely.",
    impactMetric: "25,000+ Daily Active Members",
    location: "Pan-India Network",
    color: "from-teal-500 to-emerald-600",
    verified: true,
    websiteUrl: "https://www.mymindtherapyfriend.com",
    fullBio: "A safe, moderated 24/7 peer community offering daily encouragement, mindful reflection circles, and expert guidance for overall emotional well-being.",
  },
  {
    name: "Global Healing Alliance",
    category: "Partners",
    logoText: "GHA",
    description: "International network of certified psychological researchers, CBT specialists, and digital therapy innovators.",
    impactMetric: "Global Research Ecosystem",
    location: "International",
    color: "from-purple-600 to-violet-700",
    verified: true,
    websiteUrl: "https://www.mymindtherapyfriend.com",
    fullBio: "Global Healing Alliance brings international CBT benchmarks, evidence-based therapy models, and research backing to mymindtherapyfriend's Manas AI engine.",
  },
];

export async function getPartners(req: Request, res: Response): Promise<void> {
  try {
    const { category, search } = req.query;
    let query: any = {};
    if (category && category !== "all") {
      query.category = category;
    }
    if (search) {
      query.name = { $regex: String(search), $options: "i" };
    }

    let partners = await Partner.find(query).sort({ createdAt: -1 });

    // Seed ONLY ONCE on initial setup if partner section config does not exist yet
    const config = await PartnerSectionConfig.findOne();
    if (!config && partners.length === 0 && !category && !search) {
      await Partner.insertMany(DEFAULT_SEED_PARTNERS);
      await PartnerSectionConfig.create({});
      partners = await Partner.find(query).sort({ createdAt: -1 });
    }

    res.json({ success: true, partners });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch partners" });
  }
}

export async function createPartner(req: Request, res: Response): Promise<void> {
  try {
    const { name, category, logoText, logoUrl, description, impactMetric, location, color, verified, websiteUrl, fullBio } = req.body;

    if (!name || !category || !description || !fullBio) {
      res.status(400).json({ success: false, message: "Name, category, description, and fullBio are required" });
      return;
    }

    const partner = await Partner.create({
      name,
      category,
      logoText: logoText || name.substring(0, 4).toUpperCase(),
      logoUrl: logoUrl || "",
      description,
      impactMetric: impactMetric || "Active Partner",
      location: location || "India",
      color: color || "from-teal-500 to-emerald-600",
      verified: verified !== undefined ? Boolean(verified) : true,
      websiteUrl: websiteUrl || "https://www.mymindtherapyfriend.com",
      fullBio,
    });

    res.status(201).json({ success: true, partner, message: "Partner added successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create partner" });
  }
}

export async function updatePartner(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const partner = await Partner.findByIdAndUpdate(id, updates, { new: true });
    if (!partner) {
      res.status(404).json({ success: false, message: "Partner not found" });
      return;
    }

    res.json({ success: true, partner, message: "Partner updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update partner" });
  }
}

export async function deletePartner(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await Partner.findByIdAndDelete(id);
    res.json({ success: true, message: "Partner removed successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete partner" });
  }
}

export async function getPartnerConfig(_req: Request, res: Response): Promise<void> {
  try {
    let config = await PartnerSectionConfig.findOne();
    if (!config) {
      config = await PartnerSectionConfig.create({
        badgeText: "Our Ecosystem & Collaboration Network",
        sectionTitle: "We Are Part Of",
        sectionSubtitle:
          "Proudly collaborating with leading Organizations, NGOs, Student Clubs, Peer Communities, and Global Health Partners to democratize mental wellness in India.",
        categories: [
          { id: "all", label: "All Network" },
          { id: "Organization", label: "Organization" },
          { id: "NGO", label: "NGO" },
          { id: "Clubs", label: "Clubs" },
          { id: "Community", label: "Community" },
          { id: "Partners", label: "Partners" },
        ],
      });
    }
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch partner config" });
  }
}

export async function updatePartnerConfig(req: Request, res: Response): Promise<void> {
  try {
    const { badgeText, sectionTitle, sectionSubtitle, categories } = req.body;
    let config = await PartnerSectionConfig.findOne();
    if (!config) {
      config = new PartnerSectionConfig();
    }

    if (badgeText !== undefined) config.badgeText = badgeText;
    if (sectionTitle !== undefined) config.sectionTitle = sectionTitle;
    if (sectionSubtitle !== undefined) config.sectionSubtitle = sectionSubtitle;
    if (Array.isArray(categories)) config.categories = categories;

    await config.save();
    res.json({ success: true, config, message: "Partner section configuration updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update partner config" });
  }
}

/**
 * POST /api/partners/upload-logo
 * Upload partner organization logo image (Admin)
 */
export async function uploadPartnerLogo(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: "No logo image file uploaded" });
      return;
    }

    const logoUrl = getPublicUrlForFilename(file.filename, req);

    res.json({
      success: true,
      logoUrl,
      filename: file.filename,
      message: "Logo uploaded successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to upload logo" });
  }
}
