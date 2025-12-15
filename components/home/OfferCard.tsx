"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { OfferCardProps } from "@/types";
import { ReactElement } from "react";
import Link from "next/link";
// -

const OfferCard: React.FC<OfferCardProps> = ({
  productName,
  discountPercentage,
  className,
  image,
  route,
}): ReactElement => {
  const safeRoute = route
    ? "/" + route.split("/").map(encodeURIComponent).join("/")
    : "/";
  return (
    <div
      className={`relative h-72 overflow-hidden group cursor-pointer rounded-3xl ${className}`}
    >
      <Image
        src={image}
        alt={discountPercentage}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
      />
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-300 flex flex-col justify-end p-6">
        <p className="text-lg font-semibold text-white mb-2">
          {discountPercentage} Flat Offer
        </p>
        <h3 className="text-3xl font-bold text-yellow-300">{productName}</h3>
        {route && (
          <Link href={safeRoute}>
            <span className="mt-4 inline-block text-sm font-semibold text-white border-b-2 border-white pb-1 hover:border-yellow-300 transition-colors">
              SHOP NOW
            </span>
          </Link>
        )}
      </div>
    </div>
  );
};

interface OfferCardsProps {
  offers: any[]; // Using any[] for now as per original code context, but ideally should be typed
}

const OfferCards: React.FC<OfferCardsProps> = ({ offers }): ReactElement => {
  return (
    <section className="py-8">
      <h2 className="text-3xl font-serif text-center mb-8 text-gray-800">
        Special Offers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8 ">
        {offers?.map((offer, index) => (
          <OfferCard key={index} {...offer} />
        ))}
      </div>
    </section>
  );
};

export default OfferCards;
