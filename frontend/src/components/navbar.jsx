"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        !event.target.closest(".mobile-menu-container") &&
        !event.target.closest(".menu-button")
      ) {
        setIsMenuOpen(false);
      }

      if (
        isProfileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen, isProfileDropdownOpen]);

  // Check if we're on an auth page
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password");

  if (isAuthPage) return null;

  return (
    <>
      <header className="w-full fixed top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
        <nav className="max-w-[1920px] mx-auto px-6 lg:px-12 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">
                Comdex
              </span>
            </Link>

            {/* Centered Navigation - Desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1 gap-8">
              <div className="flex items-center justify-center gap-8">
                <Link
                  href="/"
                  className={`${
                    pathname === "/"
                      ? "text-primary-600 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors hover:text-primary-600 dark:hover:text-white`}
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className={`${
                    pathname.startsWith("/dashboard")
                      ? "text-primary-600 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors hover:text-primary-600 dark:hover:text-white`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/contact"
                  className={`${
                    pathname === "/contact"
                      ? "text-primary-600 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors hover:text-primary-600 dark:hover:text-white`}
                >
                  Contact Us
                </Link>
                <Link
                  href="/learn-more"
                  className={`${
                    pathname === "/learn-more"
                      ? "text-primary-600 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors hover:text-primary-600 dark:hover:text-white`}
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden menu-button flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  type="button"
                  className="flex items-center justify-center w-10 h-10 rounded-full focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 hover:ring-2"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg
                      className="absolute w-12 h-12 text-gray-400 -left-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <Link
                      href="/profile"
                      className={`${
                        pathname === "/profile"
                          ? "bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      } block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/insurance"
                      className={`${
                        pathname === "/insurance"
                          ? "bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      } block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      Insurance
                    </Link>
                    <Link
                      href="/manage-index"
                      className={`${
                        pathname === "/manage-index"
                          ? "bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      } block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      Manage Index
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        // Add logout functionality here
                        router.push("/login");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden mobile-menu-container mt-4 py-3 px-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className={`${
                    pathname === "/"
                      ? "text-primary-600 dark:text-white bg-gray-100 dark:bg-gray-700"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors py-2 px-4 rounded-md hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`}
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className={`${
                    pathname.startsWith("/dashboard")
                      ? "text-primary-600 dark:text-white bg-gray-100 dark:bg-gray-700"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors py-2 px-4 rounded-md hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/contact"
                  className={`${
                    pathname === "/contact"
                      ? "text-primary-600 dark:text-white bg-gray-100 dark:bg-gray-700"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors py-2 px-4 rounded-md hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`}
                >
                  Contact Us
                </Link>
                <Link
                  href="/learn-more"
                  className={`${
                    pathname === "/learn-more"
                      ? "text-primary-600 dark:text-white bg-gray-100 dark:bg-gray-700"
                      : "text-gray-700 dark:text-gray-300"
                  } text-lg font-medium transition-colors py-2 px-4 rounded-md hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`}
                >
                  Learn More
                </Link>

                {/* Mobile Menu Profile Links */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <Link
                    href="/profile"
                    className={`${
                      pathname === "/profile"
                        ? "text-primary-600 dark:text-white bg-gray-100 dark:bg-gray-700"
                        : "text-gray-700 dark:text-gray-300"
                    } text-lg font-medium transition-colors py-2 px-4 rounded-md hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/insurance"
                    className={`${
                      pathname === "/insurance"
                        ? "text-primary-600 dark:text-white bg-gray-100 dark:bg-gray-700"
                        : "text-gray-700 dark:text-gray-300"
                    } text-lg font-medium transition-colors py-2 px-4 rounded-md hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`}
                  >
                    Insurance
                  </Link>
                  <Link
                    href="/manage-index"
                    className={`${
                      pathname === "/manage-index"
                        ? "text-primary-600 dark:text-white bg-gray-100 dark:bg-gray-700"
                        : "text-gray-700 dark:text-gray-300"
                    } text-lg font-medium transition-colors py-2 px-4 rounded-md hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white`}
                  >
                    Manage Index
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
      <div className="h-[88px]" />
    </>
  );
}
