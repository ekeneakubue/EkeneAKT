import { PrismaClient } from '@prisma/client';
import { categoryStructure } from '../lib/constants';

const prisma = new PrismaClient();

async function migrateCategories() {
  try {
    console.log('Starting category migration...');

    // Get all existing products with their category/subcategory strings
    const products = await prisma.product.findMany({
      where: {
        categoryOld: { not: null },
      },
      select: {
        id: true,
        categoryOld: true,
        subCategoryOld: true,
      },
    });

    console.log(`Found ${products.length} products to migrate`);

    // Create a map to track category and subcategory IDs
    const categoryMap = new Map<string, string>();
    const subCategoryMap = new Map<string, string>();

    // First, create all categories and subcategories from the structure
    for (const cat of categoryStructure) {
      // Create or find category
      let category = await prisma.category.findUnique({
        where: { name: cat.name },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.id,
          },
        });
        console.log(`Created category: ${cat.name}`);
      }

      categoryMap.set(cat.name, category.id);

      // Create subcategories
      for (const subcat of cat.subcategories) {
        const subCategoryKey = `${cat.name}::${subcat.name}`;
        let subCategory = await prisma.subCategory.findFirst({
          where: {
            categoryId: category.id,
            name: subcat.name,
          },
        });

        if (!subCategory) {
          subCategory = await prisma.subCategory.create({
            data: {
              name: subcat.name,
              slug: subcat.id,
              categoryId: category.id,
            },
          });
          console.log(`Created subcategory: ${subcat.name} for ${cat.name}`);
        }

        subCategoryMap.set(subCategoryKey, subCategory.id);
      }
    }

    // Now update products
    for (const product of products) {
      if (!product.categoryOld) continue;

      const categoryId = categoryMap.get(product.categoryOld);
      if (!categoryId) {
        console.warn(`Category not found for product ${product.id}: ${product.categoryOld}`);
        continue;
      }

      // Find or create subcategory
      let subCategoryId: string | undefined;
      if (product.subCategoryOld) {
        const subCategoryKey = `${product.categoryOld}::${product.subCategoryOld}`;
        subCategoryId = subCategoryMap.get(subCategoryKey);

        // If subcategory doesn't exist in structure, create it
        if (!subCategoryId) {
          const subCategory = await prisma.subCategory.findFirst({
            where: {
              categoryId: categoryId,
              name: product.subCategoryOld,
            },
          });

          if (subCategory) {
            subCategoryId = subCategory.id;
            subCategoryMap.set(subCategoryKey, subCategoryId);
          } else {
            // Create a new subcategory if it doesn't exist
            const newSubCategory = await prisma.subCategory.create({
              data: {
                name: product.subCategoryOld,
                categoryId: categoryId,
              },
            });
            subCategoryId = newSubCategory.id;
            subCategoryMap.set(subCategoryKey, subCategoryId);
            console.log(`Created missing subcategory: ${product.subCategoryOld} for ${product.categoryOld}`);
          }
        }
      } else {
        // If no subcategory, create a "General" one
        const generalKey = `${product.categoryOld}::General`;
        subCategoryId = subCategoryMap.get(generalKey);
        if (!subCategoryId) {
          const generalSubCategory = await prisma.subCategory.findFirst({
            where: {
              categoryId: categoryId,
              name: 'General',
            },
          });

          if (generalSubCategory) {
            subCategoryId = generalSubCategory.id;
            subCategoryMap.set(generalKey, subCategoryId);
          } else {
            const newSubCategory = await prisma.subCategory.create({
              data: {
                name: 'General',
                categoryId: categoryId,
              },
            });
            subCategoryId = newSubCategory.id;
            subCategoryMap.set(generalKey, subCategoryId);
          }
        }
      }

      // Update product with new foreign keys
      await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryId: categoryId,
          subCategoryId: subCategoryId,
        },
      });

      console.log(`Updated product ${product.id}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateCategories();

