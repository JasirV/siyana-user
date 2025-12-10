import { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryProducts from "@/components/product/CategoryProducts";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import Footer from "@/components/layout/Footer";
import { CATEGORIES, ALL_PRODUCTS } from "@/lib/constants/Data";
import { Product, ProductCategory } from "@/types";
import { ReactElement } from "react";
import { fetchCategories, fetchProductsByCategory } from "@/lib/firebase/firebaseQueries";

interface CategoryPageProps {
  params: Promise<{
    categoryName: string;
  }>;
  searchParams: {
    sort?: string;
    page?: string;
  };
}

// export async function generateStaticParams() {
//   return CATEGORIES.map((category) => ({
//     categoryName: category.slug,
//   }));
// }

// export async function generateMetadata({
//   params,
// }: CategoryPageProps): Promise<Metadata> {
//   const { categoryName } = await params;

//   const category = CATEGORIES.find((cat) => cat.slug === categoryName);

//   if (!category) {
//     return {
//       title: "Category Not Found - Siyana Gold & Diamonds",
//     };
//   }

//   return {
//     title: `${category.name} Collection - Siyana Gold & Diamonds`,
//     description: category.description,
//     keywords: [
//       `${category.name}`,
//       "gold jewelry",
//       "diamonds",
//       "premium jewelry",
//     ],
//     openGraph: {
//       title: `${category.name} Collection - Siyana Gold & Diamonds`,
//       description: category.description,
//       type: "website",
//     },
//   };
// }

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps): Promise<ReactElement> {
  const { categoryName } = await params;
 
  const decodedName = decodeURIComponent(categoryName);

  const categories = await fetchCategories();

  const category = categories.find(
    (cat) => cat.name.toLowerCase() === decodedName.toLowerCase()
  );

  if (!category) notFound();
   const products = await fetchProductsByCategory(category.id);

  const sort = searchParams?.sort || "name";
  const page = parseInt(searchParams?.page || "1");

  return (
    <div className="min-h-screen bg-gray-50 mx-auto">
      <NavbarWrapper />
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple & Attractive Header */}
        <div className="mb-12 text-center py-12">
          <div className="max-w-4xl mx-auto">
            {/* Elegant decorative element */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-1 bg-linear-to-r from-amber-400 to-amber-600 rounded-full"></div>
            </div>

            {/* Category Name */}
            <h1 className="text-5xl md:text-6xl font-serif font-light text-gray-900 mb-4 tracking-tight">
              {category.name}
            </h1>

            {/* Subtle product count */}
            <div className="text-lg text-gray-600 font-medium">
              {products.length}{" "}
              {products.length === 1 ? "Exquisite Piece" : "Premium Designs"}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <CategoryProducts
          products={products}
          category={category}
          sort={sort}
          currentPage={page}
        />
      </div>
      <Footer />
    </div>
  );
}
