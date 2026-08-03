import { notFound } from 'next/navigation';
import { TestSupabaseClient } from './TestSupabaseClient';

/** Page de diagnostic — accessible uniquement en développement local. */
export default function TestSupabasePage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <TestSupabaseClient />;
}
