'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SavedPage() {
  const router = useRouter();
  useEffect(() => {
    toast('Your saved projects live in the Dashboard');
    router.replace('/dashboard');
  }, [router]);
  return null;
}
