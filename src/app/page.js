'use client';
import DemoSection from "@/components/DemoSection";
import PageHeaders from "@/components/PageHeaders";
import UploadForm from "@/components/UploadForm";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <>
      <PageHeaders
        h1Text={'Add epic captions to your videos'}
        h2Text={'Just upload your video and we will do the rest'}
      />
      <div className="text-center">
        {isSignedIn ? (
          <UploadForm />
        ) : (
          <Link
            href="/sign-in"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 py-2 px-6 rounded-full inline-flex gap-2 border-2 border-purple-700/50 font-semibold transition-all"
          >
            Get Started
          </Link>
        )}
      </div>
      <DemoSection />
    </>
  )
}
