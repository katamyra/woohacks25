"use client";
import { usePathname } from 'next/navigation';
import StepsProgress from '@/components/ui/StepsProgress';

export default function StepsProgressWrapper({ steps }) {
  const pathname = usePathname();
  return <StepsProgress steps={steps} currentPath={pathname} />;
}
