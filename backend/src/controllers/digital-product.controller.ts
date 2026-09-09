import { Request, Response } from "express";
import { DigitalProduct, DigitalProductShopConfig } from "../models/digital-product";

const DEFAULT_SEED_PRODUCTS = [
  {
    title: "Mastering Anxiety: CBT Guided Workbook 2026",
    description: "An evidence-based, interactive workbook crafted by clinical psychologists in India. Features daily thought records, cognitive restructuring worksheets, fear ladders, and panic emergency protocols.",
    category: "workbook",
    price: 499,
    originalPrice: 999,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    isFeatured: true,
    rating: 4.9,
    salesCount: 340,
    tags: ["CBT_WORKBOOK", "Anxiety", "Workbook"],
  },
  {
    title: "Mindfulness & Deep Calm Audio Suite",
    description: "Immersive 432Hz ambient audio tracks paired with expert Hindi/English voice guidance for box breathing, progressive muscle relaxation, and deep sleep restoration.",
    category: "audio",
    price: 299,
    originalPrice: 599,
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    isFeatured: true,
    rating: 4.8,
    salesCount: 215,
    tags: ["MINDFULNESS_AUDIO", "Audio", "Meditation"],
  },
  {
    title: "Clinical Counsellor's Practice Toolkit",
    description: "Essential professional toolkit for mental health counsellors and therapy interns. Includes DSM-5 intake sheets, session summary logs, safety contracts, and CBT tracking tools.",
    category: "guide",
    price: 899,
    originalPrice: 1799,
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
    isFeatured: true,
    rating: 5.0,
    salesCount: 180,
    tags: ["COUNSELLOR_TOOLKIT", "Counsellor", "Toolkit"],
  },
  {
    title: "The Emotional Healing & Self-Compassion Journal",
    description: "Daily self-reflection journal designed to help students and working professionals reframe negative self-talk, build resilience, and develop healthy emotional boundaries.",
    category: "journal",
    price: 349,
    originalPrice: 699,
    imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80",
    isFeatured: false,
    rating: 4.9,
    salesCount: 420,
    tags: ["GUIDED_JOURNAL", "Journal", "Self-Care"],
  },
];

export async function getDigitalProducts(req: Request, res: Response): Promise<void> {
  try {
    // One-time auto-migration for old seeded THERAPIST tags/titles in DB
    await DigitalProduct.updateMany(
      { tags: "THERAPIST_TOOLKIT" },
      {
        $set: {
          title: "Clinical Counsellor's Practice Toolkit",
          tags: ["COUNSELLOR_TOOLKIT", "Counsellor", "Toolkit"],
        },
      }
    );
    await DigitalProduct.updateMany(
      { title: /Therapist/i },
      { $set: { title: "Clinical Counsellor's Practice Toolkit" } }
    );

    const { category, search } = req.query;
    let query: any = {};
    if (category && category !== "all") {
      query.category = category;
    }
    if (search) {
      query.title = { $regex: String(search), $options: "i" };
    }

    let products = await DigitalProduct.find(query).sort({ isFeatured: -1, createdAt: -1 });

    // Seed ONLY ONCE on initial setup if shop config does not exist yet
    const config = await DigitalProductShopConfig.findOne();
    if (!config && products.length === 0 && !category && !search) {
      await DigitalProduct.insertMany(DEFAULT_SEED_PRODUCTS);
      await DigitalProductShopConfig.create({});
      products = await DigitalProduct.find(query).sort({ isFeatured: -1, createdAt: -1 });
    }

    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch products" });
  }
}

export async function createDigitalProduct(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, category, price, originalPrice, imageUrl, fileUrl, previewUrl, tags, isFeatured } = req.body;

    if (!title || !description || price === undefined) {
      res.status(400).json({ success: false, message: "Title, description, and price are required" });
      return;
    }

    const product = await DigitalProduct.create({
      title,
      description,
      category: category || "workbook",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      imageUrl: imageUrl || "",
      fileUrl: fileUrl || "",
      previewUrl: previewUrl || "",
      tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      isFeatured: Boolean(isFeatured),
    });

    res.status(201).json({ success: true, product, message: "Digital product created successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create product" });
  }
}

export async function updateDigitalProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await DigitalProduct.findByIdAndUpdate(id, updates, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, product, message: "Digital product updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update product" });
  }
}

export async function deleteDigitalProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await DigitalProduct.findByIdAndDelete(id);
    res.json({ success: true, message: "Digital product deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete product" });
  }
}

export async function getDigitalProductConfig(_req: Request, res: Response): Promise<void> {
  try {
    let config = await DigitalProductShopConfig.findOne();
    if (!config) {
      config = await DigitalProductShopConfig.create({
        badgeText: "Digital E-Commerce Wellness Store",
        sectionTitle: "Digital Product Shop",
        sectionSubtitle:
          "Download psychologist-curated CBT workbooks, guided meditation audio suites, emotion journals, and self-help tools instantly.",
        categories: [
          { id: "all", label: "All Products" },
          { id: "workbook", label: "Workbooks" },
          { id: "audio", label: "Audio Kits" },
          { id: "journal", label: "Journals & Trackers" },
          { id: "guide", label: "Guides" },
        ],
      });
    }
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch shop config" });
  }
}

export async function updateDigitalProductConfig(req: Request, res: Response): Promise<void> {
  try {
    const { badgeText, sectionTitle, sectionSubtitle, categories } = req.body;
    let config = await DigitalProductShopConfig.findOne();
    if (!config) {
      config = new DigitalProductShopConfig();
    }

    if (badgeText !== undefined) config.badgeText = badgeText;
    if (sectionTitle !== undefined) config.sectionTitle = sectionTitle;
    if (sectionSubtitle !== undefined) config.sectionSubtitle = sectionSubtitle;
    if (Array.isArray(categories)) config.categories = categories;

    await config.save();
    res.json({ success: true, config, message: "Shop section configuration updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update shop config" });
  }
}
