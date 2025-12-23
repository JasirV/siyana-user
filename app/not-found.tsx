"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import Footer from "@/components/layout/Footer";

const NotFoundPage = () => {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      numbersRef.current,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 1 }
    )
      .fromTo(
        titleRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.4"
      )
      .fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.3"
      )
      .fromTo(
        buttonRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 },
        "-=0.2"
      );

    // Floating animation
    gsap.to(numbersRef.current, {
      y: 12,
      repeat: -1,
      yoyo: true,
      duration: 2,
      ease: "sine.inOut",
    });

    // Parallax (desktop only)
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768 || !containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX / width - 0.5) * 20;
      const y = (e.clientY / height - 0.5) * 20;

      gsap.to(imageRef.current, {
        x,
        y,
        duration: 0.6,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const goHome = () => router.push("/");

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <NavbarWrapper />

      <main
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-4 relative overflow-hidden"
      >
        {/* Subtle background dots */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(19)].map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 bg-[#b1effa] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-3xl text-center">
          {/* 404 */}
          <div ref={numbersRef} className="mb-6">
            <h1 className="text-[120px] md:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#afdde5] to-[#07cdef]">
              404
            </h1>
          </div>

          {/* Title */}
          <h2
            ref={titleRef}
            className="text-3xl md:text-4xl font-bold
             bg-gradient-to-r from-[#afdde5] to-[#07cdef]
             bg-clip-text text-transparent"
          >
            Page Not Found
          </h2>

          {/* Description */}
          <p
            ref={textRef}
            className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto mb-10"
          >
            The page you are looking for doesn’t exist or has been moved. Let’s
            take you back to safety.
          </p>

          {/* Button */}
          <div ref={buttonRef}>
            <button
              onClick={goHome}
              className="px-8 py-4 rounded-full text-white text-lg font-semibold
              bg-gradient-to-r from-[#afdde5] to-[#07cdef]
              hover:shadow-xl hover:shadow-purple-500/30
              transition-all duration-300"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
