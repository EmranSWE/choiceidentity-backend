"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Products = void 0;
const mongoose_1 = require("mongoose");
const products_interface_1 = require("./products.interface");
const products_utils_1 = require("./products.utils");
const slugify_1 = __importDefault(require("slugify"));
const crypto_1 = __importDefault(require("crypto"));
// Configuration constants
const SLUG_CONFIG = {
    MAX_RETRIES: 5,
    MAX_LENGTH: 80,
    RESERVED_SLUGS: ['admin', 'api', 'products', 'categories'],
    DEFAULT_SEO: {
        META_DESCRIPTION_LENGTH: 160,
        URL_SEPARATOR: '-'
    }
};
const productSchema = new mongoose_1.Schema({
    title: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    viewCount: { type: Number, default: 0, index: true },
    purchaseCount: { type: Number, default: 0, index: true },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    isFeatured: { type: Boolean, default: false, index: true },
    collections: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Collection', default: null, index: true },
    category: { type: String, index: true },
    basicInfo: {
        description: { type: String },
        shortDescription: { type: String },
        brand: { type: String },
    },
    pricing: {
        defaultPrice: { type: Number, required: true, index: true },
        cost: { type: Number, required: true },
        salePrice: { type: Number, required: true },
        profit: { type: Number },
        margin: { type: String },
    },
    seo: {
        pageTitle: { type: String },
        productUrl: { type: String, required: true },
        metaDescription: { type: String },
    },
    productDetails: {
        weight: { type: String },
        type: { type: String },
        vendor: { type: String },
        warranty: { type: String, enum: Object.values(products_interface_1.WarrantyOption) },
        termAndConditions: { type: String },
        compliance: { type: String },
    },
    statusInfo: {
        status: { type: String, enum: Object.values(products_interface_1.ProductStatus), required: true, index: true },
        date: { type: Date },
        couponCode: { type: String },
    },
    additionalInfo: {
        tags: { type: [String] },
        customFields: [
            {
                name: { type: String },
                value: { type: String },
            },
        ],
    },
    inventory: {
        curStock: { type: Number, required: true },
        productVariants: [
            {
                size: { type: String },
                color: { type: String },
                price: { type: Number },
                stock: { type: Number },
            },
        ],
    },
    images: [
        {
            url: { type: String, required: true },
            alt: { type: String },
            title: { type: String },
            caption: { type: String },
            isFeatured: { type: Boolean, default: false },
        }
    ],
    videoLink: {
        type: String,
        validate: {
            validator: function (value) {
                return value === "" || products_utils_1.youtubeRegex.test(value) || products_utils_1.vimeoRegex.test(value);
            },
            message: (props) => `${props.value} is not a valid YouTube or Vimeo link!`,
        },
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.__v;
            delete ret._id;
            return ret;
        }
    }
});
// SEO Helper Functions
const generateMetaDescription = (description) => {
    if (!description)
        return '';
    return description.length > SLUG_CONFIG.DEFAULT_SEO.META_DESCRIPTION_LENGTH
        ? `${description.substring(0, SLUG_CONFIG.DEFAULT_SEO.META_DESCRIPTION_LENGTH - 3)}...`
        : description;
};
const generateProductUrl = (slug) => {
    return `/products/${slug}`;
};
productSchema.pre('validate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        // Only generate slug if title was modified or slug doesn't exist
        if ((!this.isModified('title') && this.slug) || !this.title) {
            return next();
        }
        try {
            // Generate base slug
            let baseSlug = (0, slugify_1.default)(this.title, {
                lower: true,
                strict: true,
                remove: /[*+~.()'"!:@]/g,
                replacement: SLUG_CONFIG.DEFAULT_SEO.URL_SEPARATOR
            }).substring(0, SLUG_CONFIG.MAX_LENGTH);
            // Handle reserved slugs
            if (SLUG_CONFIG.RESERVED_SLUGS.includes(baseSlug)) {
                baseSlug = `${baseSlug}-product`;
            }
            // Generate unique slug with retries
            let candidateSlug = baseSlug;
            let attempts = 0;
            let isUnique = false;
            while (!isUnique && attempts < SLUG_CONFIG.MAX_RETRIES) {
                const existing = yield this.constructor.findOne({ slug: candidateSlug })
                    .select('_id')
                    .lean();
                if (!existing) {
                    isUnique = true;
                    break;
                }
                // Different strategies based on attempt count
                switch (attempts) {
                    case 0:
                        candidateSlug = `${baseSlug}-${crypto_1.default.randomBytes(2).toString('hex')}`;
                        break;
                    case 1:
                        candidateSlug = `${baseSlug}-${new Date().getFullYear()}`;
                        break;
                    case 2:
                        candidateSlug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
                        break;
                    default:
                        candidateSlug = `${baseSlug}-${Date.now().toString(36)}`;
                }
                attempts++;
            }
            this.slug = candidateSlug;
            // Auto-generate SEO fields if they don't exist
            if (!this.seo) {
                this.seo = {
                    productUrl: generateProductUrl(this.slug),
                    pageTitle: `${this.title} | ${((_a = this.basicInfo) === null || _a === void 0 ? void 0 : _a.brand) || 'Our Store'}`,
                    metaDescription: generateMetaDescription(((_b = this.basicInfo) === null || _b === void 0 ? void 0 : _b.description) || '')
                };
            }
            else {
                this.seo.productUrl = this.seo.productUrl || generateProductUrl(this.slug);
                this.seo.pageTitle = this.seo.pageTitle || `${this.title} | ${((_c = this.basicInfo) === null || _c === void 0 ? void 0 : _c.brand) || 'Our Store'}`;
                this.seo.metaDescription = this.seo.metaDescription || generateMetaDescription(((_d = this.basicInfo) === null || _d === void 0 ? void 0 : _d.description) || '');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// Static Methods
productSchema.statics.findBySlug = function (slug) {
    return this.findOne({ slug })
        .populate('collections', 'name slug')
        .lean();
};
productSchema.statics.findBySlugWithSeo = function (slug) {
    return this.findOne({ slug })
        .select('title slug basicInfo.description seo images statusInfo collections')
        .lean();
};
productSchema.statics.generateSlug = function (title, existingId) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseSlug = (0, slugify_1.default)(title, {
            lower: true,
            strict: true,
            replacement: SLUG_CONFIG.DEFAULT_SEO.URL_SEPARATOR
        }).substring(0, SLUG_CONFIG.MAX_LENGTH);
        let candidateSlug = baseSlug;
        let attempts = 0;
        while (attempts < SLUG_CONFIG.MAX_RETRIES) {
            const query = { slug: candidateSlug };
            if (existingId)
                query._id = { $ne: existingId };
            const existing = yield this.findOne(query).select('_id').lean();
            if (!existing)
                return candidateSlug;
            candidateSlug = `${baseSlug}-${crypto_1.default.randomBytes(2).toString('hex')}`;
            attempts++;
        }
        return `${baseSlug}-${Date.now().toString(36)}`;
    });
};
// Virtuals
productSchema.virtual('canonicalUrl').get(function () {
    var _a, _b;
    return `${process.env.BASE_URL}${(_b = (_a = this.seo) === null || _a === void 0 ? void 0 : _a.productUrl) !== null && _b !== void 0 ? _b : ''}`;
});
// Indexes
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ status: 1, category: 1, 'pricing.salePrice': 1 });
productSchema.index({
    status: 1,
    isFeatured: 1,
    collections: 1
});
productSchema.index({ 'seo.productUrl': 1 }, { unique: true });
productSchema.index({ title: 1 }, { collation: { locale: 'en', strength: 2 } });
productSchema.index({
    category: 1,
    'productDetails.type': 1
});
productSchema.index({
    'pricing.defaultPrice': 1,
    'pricing.salePrice': 1
});
// For inventory management
productSchema.index({
    'inventory.curStock': 1,
    status: 1
});
// Export the Model
exports.Products = (0, mongoose_1.model)('Product', productSchema);
