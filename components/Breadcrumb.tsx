'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string; // If not provided, it's the current page
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
}

export default function Breadcrumb({ items, showBackButton = true }: BreadcrumbProps) {
  const router = useRouter();

  return (
    <div className="mb-3 md:mb-4">
      {showBackButton && (
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-2 text-sm md:text-base flex items-center gap-1"
        >
          ← Back
        </button>
      )}

      <nav className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600 overflow-x-auto">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {index > 0 && <span className="text-gray-400">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium whitespace-nowrap">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
