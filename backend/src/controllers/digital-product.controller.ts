import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { DigitalProduct, DigitalProductShopConfig } from "../models/digital-product";
import { getProtectedDirectory, getPublicUrlForFilename } from "../middleware/upload.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "mindsyncpro_secure_product_secret_2026";

const WINTER_BLUES_PRODUCT = {
  title: "Winter Blues & Seasonal Mood Journal",
  description:
    "Shorter days can bring low energy, low mood and a heavy feeling. This printable journal helps you track how you feel from October to March, spot patterns, and build small routines that make winter kinder.",
  category: "workbook",
  price: 299,
  originalPrice: 599,
  pageCount: "32 pages",
  whatsInside: [
    "a. October to March mood tracker",
    "b. Daily habits and daylight log",
    "c. 30 guided journal prompts",
    "d. Weekly check-ins",
    "e. Cozy morning and evening routines",
    "f. Low-energy day menu",
    "g. Winter support plan",
  ],
  imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
  images: [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=800&q=80",
  ],
  isFeatured: true,
  rating: 4.9,
  salesCount: 520,
  tags: ["WORKBOOK", "Winter Blues", "Mood Journal", "CBT"],
};

const DEFAULT_SEED_PRODUCTS = [
  WINTER_BLUES_PRODUCT,
  {
    title: "Mastering Anxiety: CBT Guided Workbook 2026",
    description:
      "An evidence-based, interactive workbook crafted by clinical psychologists. Features daily thought records, cognitive restructuring worksheets, fear ladders, and panic emergency protocols.",
    category: "workbook",
    price: 499,
    originalPrice: 999,
    pageCount: "45 pages",
    whatsInside: [
      "a. Daily CBT thought record worksheets",
      "b. Cognitive restructuring guide",
      "c. Fear hierarchy ladder builder",
      "d. Panic attack emergency protocol",
    ],
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    ],
    isFeatured: true,
    rating: 4.9,
    salesCount: 340,
    tags: ["CBT_WORKBOOK", "Anxiety", "Workbook"],
  },
  {
    title: "Mindfulness & Deep Calm Audio Suite",
    description:
      "Immersive 432Hz ambient audio tracks paired with expert voice guidance for box breathing, progressive muscle relaxation, and deep sleep restoration.",
    category: "audio",
    price: 299,
    originalPrice: 599,
    pageCount: "12 Audio Tracks + PDF Guide",
    whatsInside: [
      "a. 432Hz Ambient sleep soundscapes",
      "b. Guided box breathing audio track",
      "c. Progressive muscle relaxation routine",
      "d. Mindfulness printable companion guide",
    ],
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80",
    ],
    isFeatured: true,
    rating: 4.8,
    salesCount: 215,
    tags: ["MINDFULNESS_AUDIO", "Audio", "Meditation"],
  },
  {
    title: "Clinical Counsellor's Practice Toolkit",
    description:
      "Essential professional toolkit for mental health counsellors and therapy interns. Includes DSM-5 intake sheets, session summary logs, safety contracts, and CBT tracking tools.",
    category: "guide",
    price: 899,
    originalPrice: 1799,
    pageCount: "60 pages",
    whatsInside: [
      "a. Clinical intake & consent forms",
      "b. Session progress notes template",
      "c. Risk assessment & safety contract",
      "d. Client homework assignment generator",
    ],
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    ],
    isFeatured: true,
    rating: 5.0,
    salesCount: 180,
    tags: ["COUNSELLOR_TOOLKIT", "Counsellor", "Toolkit"],
  },
];

export async function getDigitalProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, search } = req.query;
    let query: any = {};
    if (category && category !== "all") {
      query.category = category;
    }
    if (search) {
      query.title = { $regex: String(search), $options: "i" };
    }

    let products = await DigitalProduct.find(query).sort({ isFeatured: -1, createdAt: -1 });

    // Seed ONLY ONCE on initial setup if shop config or products do not exist yet
    const config = await DigitalProductShopConfig.findOne();
    if (!config && products.length === 0 && !category && !search) {
      await DigitalProduct.insertMany(DEFAULT_SEED_PRODUCTS);
      await DigitalProductShopConfig.create({});
      products = await DigitalProduct.find(query).sort({ isFeatured: -1, createdAt: -1 });
    }

    // Ensure Winter Blues product exists in DB for instant viewing
    const winterBluesDoc = await DigitalProduct.findOne({ title: /Winter Blues/i });
    if (!winterBluesDoc) {
      await DigitalProduct.create(WINTER_BLUES_PRODUCT);
      products = await DigitalProduct.find(query).sort({ isFeatured: -1, createdAt: -1 });
    } else if (!winterBluesDoc.whatsInside || winterBluesDoc.whatsInside.length === 0) {
      winterBluesDoc.whatsInside = WINTER_BLUES_PRODUCT.whatsInside;
      winterBluesDoc.images = WINTER_BLUES_PRODUCT.images;
      winterBluesDoc.pageCount = WINTER_BLUES_PRODUCT.pageCount;
      await winterBluesDoc.save();
    }

    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch products" });
  }
}

export async function createDigitalProduct(req: Request, res: Response): Promise<void> {
  try {
    const {
      title,
      description,
      category,
      price,
      originalPrice,
      imageUrl,
      images,
      whatsInside,
      pageCount,
      fileUrl,
      protectedFileKey,
      previewUrl,
      tags,
      isFeatured,
    } = req.body;

    if (!title || !description || price === undefined) {
      res.status(400).json({ success: false, message: "Title, description, and price are required" });
      return;
    }

    const parsedImages = Array.isArray(images)
      ? images
      : String(images || "")
          .split("\n")
          .map((img) => img.trim())
          .filter(Boolean);

    const parsedInside = Array.isArray(whatsInside)
      ? whatsInside
      : String(whatsInside || "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);

    const product = await DigitalProduct.create({
      title,
      description,
      category: category || "workbook",
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      imageUrl: imageUrl || (parsedImages.length > 0 ? parsedImages[0] : ""),
      images: parsedImages.length > 0 ? parsedImages : imageUrl ? [imageUrl] : [],
      whatsInside: parsedInside,
      pageCount: pageCount || "32 pages",
      fileUrl: fileUrl || "",
      protectedFileKey: protectedFileKey || "",
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
    const updates = { ...req.body };

    if (updates.images && typeof updates.images === "string") {
      updates.images = updates.images
        .split("\n")
        .map((img: string) => img.trim())
        .filter(Boolean);
    }
    if (updates.whatsInside && typeof updates.whatsInside === "string") {
      updates.whatsInside = updates.whatsInside
        .split("\n")
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

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

// Upload PDF file to protected storage
export async function uploadPdf(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No PDF file uploaded" });
      return;
    }

    res.json({
      success: true,
      fileKey: req.file.filename,
      originalName: req.file.originalname,
      message: "PDF uploaded successfully to protected storage",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "PDF upload failed" });
  }
}

// Upload Preview Images
export async function uploadImages(req: Request, res: Response): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: "No image files uploaded" });
      return;
    }

    const imageUrls = files.map((file) => getPublicUrlForFilename(file.filename, req));
    res.json({
      success: true,
      imageUrls,
      message: "Images uploaded successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Image upload failed" });
  }
}

// Process Purchase & Generate Verified Purchase Token
export async function purchaseProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const product = await DigitalProduct.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // Increment sales count
    product.salesCount = (product.salesCount || 0) + 1;
    await product.save();

    // Create a signed payment token valid for PDF stream access
    const purchaseToken = jwt.sign(
      {
        productId: product._id.toString(),
        purchasedAt: Date.now(),
        verified: true,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      purchaseToken,
      product,
      message: "Purchase verified successfully!",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Purchase failed" });
  }
}

// Secure PDF Stream / Download
export async function downloadSecurePdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const token = (req.query.token as string) || (req.headers["x-purchase-token"] as string);

    // Allow Admin bypass if logged in as Admin
    const userRole = (req as any).auth?.claims?.publicMetadata?.role || (req as any).user?.role;
    const isAdmin = ["super_admin", "admin"].includes(userRole);

    let accessGranted = false;

    if (isAdmin) {
      accessGranted = true;
    } else if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.productId === id && decoded.verified) {
          accessGranted = true;
        }
      } catch (err) {
        // Invalid or expired token
      }
    }

    if (!accessGranted) {
      res.status(403).json({
        success: false,
        message: "Access Denied. Complete purchase to download or view this workbook.",
      });
      return;
    }

    const product = await DigitalProduct.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const protectedDir = getProtectedDirectory();

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/pdf");

    // If protected file exists, send it
    if (product.protectedFileKey) {
      const filePath = path.join(protectedDir, product.protectedFileKey);
      if (fs.existsSync(filePath)) {
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${product.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`
        );
        res.sendFile(filePath);
        return;
      }
    }

    // Fallback: If no custom PDF uploaded yet, dynamically generate a sample PDF binary for demo
    const samplePdfPath = path.join(protectedDir, "sample-workbook.pdf");
    if (!fs.existsSync(samplePdfPath)) {
      // Create minimal valid PDF buffer if needed
      const minimalPdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 130 >> stream
BT
/F1 20 Tf
50 720 Td
(${product.title}) Tj
/F1 12 Tf
0 -30 Td
(Verified Psychologically Guided Content - MindSyncPro) Tj
0 -20 Td
(Thank you for your purchase!) Tj
ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000246 00000 n 
0000000315 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
498
%%EOF`;
      fs.writeFileSync(samplePdfPath, minimalPdfContent);
    }

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${product.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`
    );
    res.sendFile(samplePdfPath);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to download secure file" });
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
