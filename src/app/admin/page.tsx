'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/default');
  }, [router]);

  return null;
} 