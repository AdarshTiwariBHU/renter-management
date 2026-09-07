import { redirect } from 'next/navigation';

export default function AdminProfileRedirect() {
  redirect('/settings#profile');
}
