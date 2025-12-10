import { ReactElement } from "react";
import HomeClient from "@/components/home/HomeClient";
import { fetchCarouselItems, fetchCategories, fetchOffers } from "@/lib/firebase/firebaseQueries";

export default async function Home(): Promise<ReactElement> {
  // Fetch all data in parallel on the server
  const [carouselData, categories, offers] = await Promise.all([
    fetchCarouselItems(),
    fetchCategories(),
    fetchOffers(),
  ]);
  console.log(carouselData,'datacou')

  return (
    <HomeClient
      carouselData={carouselData}
      categories={categories}
      offers={offers}
    />
  );
}
