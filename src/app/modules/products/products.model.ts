import { CallbackError, Schema, model } from 'mongoose';
import { IProducts, ProductModel, ProductStatus, WarrantyOption } from './products.interface';
import { vimeoRegex, youtubeRegex } from './products.utils';
import slugify from 'slugify';
import crypto from 'crypto';


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
const productSchema = new Schema<IProducts, ProductModel>(
  {
    title: { type: String, required: true,index: true },
    sku: { type: String, required: true,index: true },
    viewCount: { type: Number, default: 0, index: true },
    purchaseCount: { type: Number, default: 0, index: true },
    slug: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
      },
    isFeatured: { type: Boolean, default: false, index: true },
    collections: { type: Schema.Types.ObjectId, ref: 'Collection', default: null,index: true },
    category: { type: String,index: true }, 
    basicInfo: {
      description: { type: String },
      shortDescription: { type: String },
      brand: { type: String },
    },
    pricing: {
      defaultPrice: { type: Number, required: true,index: true },
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
      warranty: { type: String, enum: Object.values(WarrantyOption) }, 
      termAndConditions: { type: String },
      compliance: { type: String },
    },
    statusInfo: {
      status: { type: String, enum: Object.values(ProductStatus), required: true ,index: true}, 
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
  }],
  videoLink: {
      type: String,
      validate: {
        validator: function (value: string) {
          return value === "" || youtubeRegex.test(value) || vimeoRegex.test(value);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid YouTube or Vimeo link!`,
      },
    },
  },
  {
    timestamps: true, 
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
          delete ret.__v;
          delete ret._id;
          return ret;
        }
      }
  }
);


// SEO Helper Functions
const generateMetaDescription = (description: string): string => {
    if (!description) return '';
    return description.length > SLUG_CONFIG.DEFAULT_SEO.META_DESCRIPTION_LENGTH
      ? `${description.substring(0, SLUG_CONFIG.DEFAULT_SEO.META_DESCRIPTION_LENGTH - 3)}...`
      : description;
  };
  
  const generateProductUrl = (slug: string): string => {
    return `/products/${slug}`;
  };
  
productSchema.pre('validate', async function(next) {
    // Only generate slug if title was modified or slug doesn't exist
    if ((!this.isModified('title') && this.slug) || !this.title) {
      return next();
    }
  
    try {
      // Generate base slug
      let baseSlug = slugify(this.title, {
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
        const existing = await (this.constructor as ProductModel).findOne({ slug: candidateSlug })
          .select('_id')
          .lean();
  
        if (!existing) {
          isUnique = true;
          break;
        }
  
        // Different strategies based on attempt count
        switch (attempts) {
          case 0:
            candidateSlug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
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
          pageTitle: `${this.title} | ${this.basicInfo?.brand || 'Our Store'}`,
          metaDescription: generateMetaDescription(this.basicInfo?.description || '')
        };
      } else {
        this.seo.productUrl = this.seo.productUrl || generateProductUrl(this.slug);
        this.seo.pageTitle = this.seo.pageTitle || `${this.title} | ${this.basicInfo?.brand || 'Our Store'}`;
        this.seo.metaDescription = this.seo.metaDescription || generateMetaDescription(this.basicInfo?.description || '');
      }
  
      next();
    } catch (error) {
      next(error as CallbackError);
    }
  });
  
  // Static Methods
  productSchema.statics.findBySlug = function(slug: string) {
    return this.findOne({ slug })
      .populate('collections', 'name slug')
      .lean();
  };
  
  productSchema.statics.findBySlugWithSeo = function(slug: string) {
    return this.findOne({ slug })
      .select('title slug basicInfo.description seo images statusInfo collections')
      .lean();
  };
  
  productSchema.statics.generateSlug = async function(title: string, existingId?: string) {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      replacement: SLUG_CONFIG.DEFAULT_SEO.URL_SEPARATOR
    }).substring(0, SLUG_CONFIG.MAX_LENGTH);
  
    let candidateSlug = baseSlug;
    let attempts = 0;
  
    while (attempts < SLUG_CONFIG.MAX_RETRIES) {
      const query: any = { slug: candidateSlug };
      if (existingId) query._id = { $ne: existingId };
  
      const existing = await this.findOne(query).select('_id').lean();
      if (!existing) return candidateSlug;
  
      candidateSlug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
      attempts++;
    }
  
    return `${baseSlug}-${Date.now().toString(36)}`;
  };
  
  // Virtuals
  productSchema.virtual('canonicalUrl').get(function() {
    return `${process.env.BASE_URL}${this.seo?.productUrl ?? ''}`;
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
export const Products = model<IProducts, ProductModel>(
  'Product',
  productSchema
);


