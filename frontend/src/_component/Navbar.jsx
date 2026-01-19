'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];

const Navbar = () => {
  return (
    <nav className="w-full border-b bg-[#0D2B5B]">
     <div className="container mx-auto flex h-16 items-center justify-between px-0 my-0">


        {/* Logo */}
        <Link href="/" className="flex items-start  ">
          <Image
            src="/image/celogo.png"
            alt="CountryEdu Logo"
            width={300}
            height={60}
            priority
            className="object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className="text-sm font-bold text-white hover:text-[#386bed] transition"
            >
              {item.name}
            </Link>
          ))}

          <Button
            asChild
            className="bg-[#386bed] text-white hover:bg-[#0f0d1d] font-bold"
          >
            <Link href="/signup">Signup</Link>
          </Button>
        </div>


        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#0D2B5B]"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-64 bg-white">
              <div className="flex flex-col gap-6 mt-8">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className="text-base font-semibold text-[#0D2B5B] hover:text-[#F9A826]"
                  >
                    {item.name}
                  </Link>
                ))}

                <Button
                  asChild
                  className="bg-[#386bed] text-[#0D2B5B] hover:bg-[#e39a1f] font-semibold"
                >
                  <Link href="/signup">Signup</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
